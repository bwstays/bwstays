/**
 * BWStays booking requests -> Google Calendar (free, runs in your Google account).
 *
 * The booking form on https://www.bwstays.com/bwstays-booking.html still emails every request.
 * When BW_REQUEST_ENDPOINT in js/booking.js points at this web app, the same request is also
 * written as an all-day event in a separate "BWStays Booking Requests" calendar, so you see it
 * next to your other bookings and it can show on the site as "Requested".
 *
 * A request never blocks dates by itself. You approve it by moving the event to your main
 * bookings calendar (open the event, change its calendar). Delete it to decline.
 *
 * Setup: see apps-script/README.md.
 */
var CONFIG = {
  REQUESTS_CALENDAR_NAME: 'BWStays Booking Requests', // created on first use
  MAIN_CALENDAR_ID: '',        // optional: id of the calendar with confirmed bookings, used to flag clashes
  NOTIFY_EMAIL: 'bwstays@gmail.com',
  MAX_NIGHTS: 30,
  WINDOW_DAYS: 365,            // same window as the site: today to one year ahead
  MAX_PER_EMAIL_PER_HOUR: 3,
  TIMEZONE: 'Asia/Kolkata'
};

function doGet() {
  return json_({ ok: true, service: 'bwstays-booking-requests' });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    var data = JSON.parse(raw);
    var req = validate_(data);
    if (req.error) {
      return json_({ ok: false, error: req.error });
    }

    var cache = CacheService.getScriptCache();
    var rlKey = 'rl:' + req.email.toLowerCase();
    var count = Number(cache.get(rlKey) || 0);
    if (count >= CONFIG.MAX_PER_EMAIL_PER_HOUR) {
      return json_({ ok: false, error: 'too many requests' });
    }
    cache.put(rlKey, String(count + 1), 3600);

    var dupKey = 'dup:' + Utilities.base64Encode(Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5, req.email.toLowerCase() + '|' + req.checkIn + '|' + req.checkOut));
    if (cache.get(dupKey)) {
      return json_({ ok: true, duplicate: true });
    }
    cache.put(dupKey, '1', 6 * 3600);

    var cal = requestsCalendar_();
    var clash = clashWithMain_(req.checkInDate, req.checkOutDate);
    var title = (clash ? 'CLASH - ' : 'REQUEST - ') + req.name + ' (' + req.villas + ', ' + req.nights + ' night' + (req.nights > 1 ? 's' : '') + ')';
    var description = [
      'Booking request from bwstays.com',
      clash ? 'WARNING: these dates overlap an event in the main bookings calendar.' : '',
      '',
      'Guest: ' + req.name,
      'Email: ' + req.email,
      'Phone: ' + req.phone,
      'Check-in: ' + req.checkIn + '   Check-out: ' + req.checkOut + '   Nights: ' + req.nights,
      'Villas: ' + req.villas,
      'Arrival time: ' + req.arrival,
      'Address / requests: ' + req.notes,
      '',
      'Received: ' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm'),
      '',
      'To approve: open this event and move it to your main bookings calendar. To decline: delete it.'
    ].join('\n');

    // all-day events end on the day AFTER the last night's end, so the check-out date is the exclusive end
    cal.createAllDayEvent(title, req.checkInDate, req.checkOutDate, { description: description });

    if (CONFIG.NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: CONFIG.NOTIFY_EMAIL,
        subject: 'Booking request: ' + req.name + ', ' + req.checkIn + ' to ' + req.checkOut + (clash ? ' (CLASH)' : ''),
        body: description
      });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'bad request' });
  }
}

/** Run this once from the editor: it asks for the permissions and creates the requests calendar. */
function setup() {
  var cal = requestsCalendar_();
  Logger.log('Requests calendar ready: ' + cal.getName() + ' (' + cal.getId() + ')');
  Logger.log('Now open Google Calendar > Settings for this calendar > Integrate calendar, and copy the "Secret address in iCal format".');
}

// ---------------------------------------------------------------- helpers
function requestsCalendar_() {
  var found = CalendarApp.getCalendarsByName(CONFIG.REQUESTS_CALENDAR_NAME);
  return found.length ? found[0] : CalendarApp.createCalendar(CONFIG.REQUESTS_CALENDAR_NAME);
}

function clashWithMain_(from, to) {
  if (!CONFIG.MAIN_CALENDAR_ID) return false;
  var main = CalendarApp.getCalendarById(CONFIG.MAIN_CALENDAR_ID);
  return main ? main.getEvents(from, to).length > 0 : false;
}

function clean_(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, max);
}

function parseDay_(value) {
  var m = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) || d.getMonth() !== Number(m[2]) - 1 ? null : d;
}

function validate_(data) {
  var name = clean_(data.name, 80);
  var email = clean_(data.email, 120);
  var phone = clean_(data.phone, 30);
  if (name.length < 2) return { error: 'name' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'email' };
  if (phone.replace(/\D/g, '').length < 7) return { error: 'phone' };

  var inDate = parseDay_(data.check_in);
  var outDate = parseDay_(data.check_out);
  if (!inDate || !outDate) return { error: 'dates' };
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var last = new Date(today.getTime());
  last.setDate(last.getDate() + CONFIG.WINDOW_DAYS);
  if (inDate < today || outDate > last || outDate <= inDate) return { error: 'dates' };
  var nights = Math.round((outDate.getTime() - inDate.getTime()) / 86400000);
  if (nights < 1 || nights > CONFIG.MAX_NIGHTS) return { error: 'nights' };

  var v1 = clean_(data.villa_1_ground_floor, 60);
  var v2 = clean_(data.villa_2_first_floor, 60);
  var villas = [];
  if (v1 && v1 !== 'not selected') villas.push('Villa 1: ' + v1);
  if (v2 && v2 !== 'not selected') villas.push('Villa 2: ' + v2);
  if (!villas.length) return { error: 'villa' };

  function fmt(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  return {
    name: name, email: email, phone: phone,
    checkInDate: inDate, checkOutDate: outDate,
    checkIn: fmt(inDate), checkOut: fmt(outDate), nights: nights,
    villas: villas.join(' + '),
    arrival: clean_(data.arrival_time, 60),
    notes: clean_(data.address_or_requests, 400)
  };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
