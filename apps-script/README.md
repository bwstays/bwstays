# Booking requests into Google Calendar (free)

The booking form emails every request to bwstays@gmail.com. This optional Google Apps Script also
writes each request into a separate Google Calendar, so it appears next to your other bookings and
on the website as **Requested** (amber, hatched). A request never blocks dates by itself.

## One-time setup (about 10 minutes, in the Google account that owns the calendar)

1. Open https://script.google.com and create a **New project**. Name it `BWStays booking requests`.
2. Replace the contents of `Code.gs` with `apps-script/booking-requests.gs` from this repository.
3. At the top, review `CONFIG`:
   - `NOTIFY_EMAIL`: where to be notified (default bwstays@gmail.com).
   - `MAIN_CALENDAR_ID` (optional): the id of your confirmed-bookings calendar (Calendar settings,
     "Integrate calendar", "Calendar ID"). Requests that overlap it are titled `CLASH - ...`.
4. In the editor, choose the function `setup` and press **Run**. Approve the permissions
   (Calendar and Mail). It creates the calendar **BWStays Booking Requests**.
5. **Deploy > New deployment > type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the **Web app URL** (ends with `/exec`).
6. Put that URL into `js/booking.js` as `BW_REQUEST_ENDPOINT` (or send it to the developer), then run
   `node scripts/minify-assets.mjs && node scripts/version-assets.mjs` and commit.
7. Show requests on the site calendar:
   - In Google Calendar open the settings of **BWStays Booking Requests**, section
     **Integrate calendar**, and copy the **Secret address in iCal format**.
   - In GitHub, repository settings > Secrets and variables > Actions, edit `BW_ICAL_URLS` and add a
     new line: `pending|<that secret address>` (keep your existing lines).

## Day to day

- A request arrives as an email **and** an all-day event `REQUEST - <name> (<villas>, <n> nights)`.
- **Approve:** open the event, change its calendar to your main bookings calendar. It becomes a booked
  date on the website within the next refresh.
- **Decline:** delete the event. The amber "Requested" mark disappears at the next refresh.
- Guest name, phone and email stay inside your calendar. The website only receives dates.

## Safety limits built into the script

- Required fields and date checks (future dates, check-out after check-in, at most 30 nights, within one year).
- At most 3 requests per email address per hour; identical requests within 6 hours are ignored.
- Anything else gets `{"ok": false}` and nothing is written.

To stop the feature, remove `BW_REQUEST_ENDPOINT` from `js/booking.js` (the email keeps working) or
delete the web app deployment.
