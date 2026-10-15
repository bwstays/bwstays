let currentMonthOffset = 0;
// ---------------------------------------------------------------- availability
// Booked days come from data/bookingdata.js (window.booking), closed days from
// data/closeddata.js (window.closed). Each entry is [from, to]; an empty "to"
// means a single day. Only days from today to one year ahead can be booked:
// earlier days are greyed out and later days are not offered.
function bwPad(n) {
    return String(n).length > 1 ? String(n) : '0' + n;
}
function bwIso(d) {
    return d.getFullYear() + '-' + bwPad(d.getMonth() + 1) + '-' + bwPad(d.getDate());
}
function bwNormalize(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return m ? m[1] + '-' + bwPad(m[2]) + '-' + bwPad(m[3]) : null;
}
function bwExpand(ranges) {
    const out = {};
    (ranges || []).forEach(function (range) {
        const start = bwNormalize(range[0]);
        const end = bwNormalize(range[1]) || start;
        if (!start) {
            return;
        }
        const d = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');
        for (let guard = 0; d <= last && guard < 400; guard++) {
            out[bwIso(d)] = true;
            d.setDate(d.getDate() + 1);
        }
    });
    return out;
}
function bwToday() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function bwMaxDate() {
    const d = bwToday();
    d.setFullYear(d.getFullYear() + 1);
    return d;
}
// 'past' | 'beyond' | 'reserved' | 'blocked' | '' for a Date
function bwDayState(date) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (day < bwToday()) {
        return 'past';
    }
    if (day > bwMaxDate()) {
        return 'beyond';
    }
    const iso = bwIso(day);
    if (bwExpand(window.closed)[iso]) {
        return 'blocked';
    }
    if (bwExpand(window.booking)[iso]) {
        return 'reserved';
    }
    return '';
}
// Returns '' when the stay is bookable, otherwise a message for the visitor.
// Used for clicks, for typed or pasted values and again on submit.
function bwStayProblem(checkInValue, checkOutValue) {
    const checkIn = new Date(checkInValue);
    const checkOut = new Date(checkOutValue);
    if (isNaN(checkIn) || isNaN(checkOut)) {
        return 'Please choose your check-in and check-out dates from the calendar.';
    }
    if (checkIn < bwToday()) {
        return 'Check-in cannot be in the past.';
    }
    if (checkOut > bwMaxDate() || checkIn > bwMaxDate()) {
        return 'Bookings can be made up to one year ahead.';
    }
    if (checkOut <= checkIn) {
        return 'Check-out date must be at least one day after check-in date.';
    }
    const closed = bwExpand(window.closed);
    const booked = bwExpand(window.booking);
    for (const d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const iso = bwIso(d);
        if (closed[iso] || booked[iso]) {
            return 'Some of the nights you chose are not available. Please pick other dates.';
        }
    }
    return '';
}
function bwMaxOffset() {
    // two months are shown; the last one shown may be the month that holds the maximum date
    const now = bwToday();
    const max = bwMaxDate();
    return Math.max(0, (max.getFullYear() * 12 + max.getMonth()) - (now.getFullYear() * 12 + now.getMonth()) - 1);
}
document.addEventListener('DOMContentLoaded', function () {
    generateCalendars();
    setupDateSelection();
    createErrorMessageContainers();
    const bookingForm = document.querySelector('.guest-information form');
            bookingForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const fullName = document.querySelector('input[placeholder="Enter your full name"]').value;
                const email = document.querySelector('input[placeholder="Enter your email"]').value;
                const phone = document.querySelector('input[placeholder="Enter your phone number"]').value;
                const checkInDate = document.getElementById('checkInDate').value;
                const checkOutDate = document.getElementById('checkOutDate').value;
                const termsCheck = document.getElementById('termsCheck').checked;
                const villa1 = document.getElementById('villa1').checked;
                const villa2 = document.getElementById('villa2').checked;
                const specialRequests = document.querySelector('textarea[placeholder="Your Address"]').value;
                const arrivalTime = document.querySelector('select').value;
                hideErrorMessage();
                if (!fullName || !email || !phone || !checkInDate || !checkOutDate || !termsCheck) {
                    showErrorMessage('Please fill in all required fields and accept the terms and conditions', 'error');
                    return;
                }
                const checkInDateObj = new Date(checkInDate);
                const checkOutDateObj = new Date(checkOutDate);
                const timeDiff = checkOutDateObj.getTime() - checkInDateObj.getTime();
                const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                if (nights <= 0 || checkOutDateObj <= checkInDateObj) {
                    showErrorMessage('Invalid dates: Check-out date must be at least one day after check-in date.', 'error');
                    return;
                }
                const stayProblem = bwStayProblem(checkInDate, checkOutDate);
                if (stayProblem) {
                    showErrorMessage(stayProblem, 'error');
                    return;
                }
                if (nights < 1) {
                    showErrorMessage('Minimum stay is 1 night. Please select valid dates.', 'error');
                    return;
                }
                if (!villa1 && !villa2) {
                    showErrorMessage('Please select at least one villa', 'error');
                    return;
                }
                const adultsInput1 = document.querySelectorAll('.counter-inputvilla1')[0].value;
                const childrenInput1 = document.querySelectorAll('.counter-inputvilla')[0].value;
                const adultsInput2 = document.querySelectorAll('.counter-input')[0].value;
                const childrenInput2 = document.querySelectorAll('.counter-input')[1].value;
                let myArray = [];
                let dateArray = [];
                let villaArray1 = [];
                let villaArray2 = [];
                let obj = new Object();
                obj.total = '';
                if(villa1) {
					villaArray1.push("villa1");
					villaArray1.push(adultsInput1);
					villaArray1.push(childrenInput1);
                }
                if(villa2) {
                    villaArray2.push("villa2");
                    villaArray2.push(adultsInput2);
                    villaArray2.push(childrenInput2);
                }
                obj.unitPrice = 5000; 
                obj.contactName = fullName;
                obj.contactEmail = email;
                obj.contactPersonMobNo = phone;
                obj.arrivalTime = arrivalTime;
                obj.requirementSpec = specialRequests;
                dateArray.push(`${checkInDate}`);
                dateArray.push(`${checkOutDate}`);
                myArray.push(obj);
                myArray.push(dateArray);
                myArray.push(villaArray1);
                myArray.push(villaArray2);
                // The form sends a booking REQUEST by email. The dates are held only after the host confirms
                // (and adds them to the booking calendar), so the message must say that, and must only
                // claim success when the request was really delivered.
                const guests = (arr) => (arr.length ? `${arr[1]} adults, ${arr[2]} children` : 'not selected');
                const payload = {
                    _subject: `Booking request: ${fullName}, ${checkInDate} to ${checkOutDate}`,
                    _template: 'table',
                    _captcha: 'false',
                    name: fullName,
                    email: email,
                    phone: phone,
                    check_in: checkInDate,
                    check_out: checkOutDate,
                    nights: String(nights),
                    villa_1_ground_floor: villa1 ? guests(villaArray1) : 'not selected',
                    villa_2_first_floor: villa2 ? guests(villaArray2) : 'not selected',
                    arrival_time: arrivalTime,
                    address_or_requests: specialRequests,
                    status: 'REQUEST - dates are not blocked until you confirm and add them to the booking calendar',
                };
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                }
                $.ajax({
                    type: 'POST',
                    url: 'https://formsubmit.co/ajax/bwstays@gmail.com',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    dataType: 'json',
                    accepts: 'application/json',
                    success: function (response) {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                        }
                        if (response && (response.success === 'false' || response.success === false)) {
                            showErrorMessage('We could not send your request just now. Please try again, or email us at bwstays@gmail.com.', 'error');
                            return;
                        }
                        showErrorMessage('Thank you! Your booking request has been sent. We will confirm availability by email shortly; your dates are held only once we confirm.', 'success');
                        try {
                            invokeRefBooking(myArray);
                        } catch (e) { /* the request is sent; the PDF summary is optional */ }
                    },
                    error: function () {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                        }
                        showErrorMessage('We could not send your request just now. Please check your connection and try again, or email us at bwstays@gmail.com.', 'error');
                    }
                });
            });
        });
        $(document).ready(function () {
            $("#checkavail").click(function () {
                hideErrorMessage();
                var checkin  = $("#checkInDate").val(); 
				var checkout    = $("#checkOutDate").val(); 
                if ($("#checkInDate").val().trim() === "" )
                {
						   showErrorMessage("Please provide checkin date", 'error');
						   return;
			    }
                if ( $("#checkOutDate").val().trim() === ""    )
                {
						   showErrorMessage("Please provide checkout date", 'error');
						   return;
			    }
 				if (new Date(checkout)<new Date(checkin) ){
						   showErrorMessage("Check out date should be same or greater than the check in date", 'error');
						   return;
			    }
                var availProblem = bwStayProblem(checkin, checkout);
                if (availProblem) {
                    showErrorMessage(availProblem, 'error');
                    return;
                }
            });
        });
        document.addEventListener('DOMContentLoaded', function () {
            const counterContainers = document.querySelectorAll('.counter-container');
            counterContainers.forEach(container => {
                const minusBtn = container.querySelector('.minus');
                const plusBtn = container.querySelector('.plus');
                const input = container.querySelector('input[type="text"]');
                minusBtn.addEventListener('click', function () {
                    let value = parseInt(input.value);
                    if (value > 0) {
                        input.value = value - 1;
                    }
                });
                plusBtn.addEventListener('click', function () {
                    let value = parseInt(input.value);
                    input.value = value + 1;
                });
            });
        });
function createErrorMessageContainers() {
    const dateRangeContainer = document.querySelector('.date-range-container');
    if (dateRangeContainer && !document.getElementById('date-error-message')) {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'date-error-message';
        errorContainer.className = 'error-message-container';
        errorContainer.style.display = 'none';
        const title = dateRangeContainer.querySelector('h5');
        if (title && title.nextElementSibling) {
            dateRangeContainer.insertBefore(errorContainer, title.nextElementSibling);
        } else {
            dateRangeContainer.insertBefore(errorContainer, dateRangeContainer.firstChild);
        }
    }
}
function showErrorMessage(message, type = 'error') {
    const errorContainer = document.getElementById('date-error-message');
    if (!errorContainer) return;
    errorContainer.innerHTML = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert ${type === 'error' ? 'alert-danger' : 'alert-success'} text-center mb-3`;
    messageDiv.style.cssText = `
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 5px;
        font-size: 14px;
        font-weight: 500;
        border: 1px solid;
        ${type === 'error' ? 
            'background-color: #f8d7da; color: #721c24; border-color: #f5c6cb;' : 
            'background-color: #d4edda; color: #155724; border-color: #c3e6cb;'
        }
    `;
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close';
    closeBtn.style.cssText = `
        float: right;
        background: none;
        border: none;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        opacity: 0.7;
    `;
    closeBtn.onclick = function() {
        hideErrorMessage();
    };
    messageDiv.textContent = message;
    messageDiv.appendChild(closeBtn);
    errorContainer.appendChild(messageDiv);
    errorContainer.style.display = 'block';
    if (type === 'success') {
        setTimeout(() => {
            hideErrorMessage();
        }, 5000);
    }
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function hideErrorMessage() {
    const errorContainer = document.getElementById('date-error-message');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
}
function generateCalendars() {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    calendarContainer.innerHTML = '';
    const currentDate = new Date();
    for (let i = 0; i < 2; i++) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + currentMonthOffset + i, 1);
        const monthCalendar = createMonthCalendar(monthDate, true); 
        calendarContainer.appendChild(monthCalendar);
    }
}
function setupCalendarNavigation() {
}
function createMonthCalendar(date, isFirstMonth = false) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthCalendar = document.createElement('div');
    monthCalendar.className = 'month-calendar';
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    const headerNav = document.createElement('div');
    headerNav.className = 'month-header-nav';
    const prevButton = document.createElement('button');
    prevButton.className = 'month-nav-btn prev-btn';
    prevButton.innerHTML = '&laquo;';
    prevButton.setAttribute('aria-label', 'Previous month');
    prevButton.disabled = currentMonthOffset <= 0;
    prevButton.addEventListener('click', function() {
        currentMonthOffset = Math.max(currentMonthOffset - 1, 0);
        generateCalendars();
    });
    const monthTitle = document.createElement('span');
    monthTitle.className = 'month-title';
    monthTitle.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    const nextButton = document.createElement('button');
    nextButton.className = 'month-nav-btn next-btn';
    nextButton.innerHTML = '&raquo;';
    nextButton.setAttribute('aria-label', 'Next month');
    nextButton.disabled = currentMonthOffset >= bwMaxOffset();
    nextButton.addEventListener('click', function() {
        currentMonthOffset = Math.min(currentMonthOffset + 1, bwMaxOffset());
        generateCalendars();
    });
    headerNav.appendChild(prevButton);
    headerNav.appendChild(monthTitle);
    headerNav.appendChild(nextButton);
    monthHeader.appendChild(headerNav);
    monthCalendar.appendChild(monthHeader);
    const weekdays = document.createElement('div');
    weekdays.className = 'weekdays';
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    daysOfWeek.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = day;
        weekdays.appendChild(dayElement);
    });
    monthCalendar.appendChild(weekdays);
    const daysContainer = document.createElement('div');
    daysContainer.className = 'days';
    daysContainer.id = `${monthNames[date.getMonth()].toLowerCase()}-days`;
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day';
        daysContainer.appendChild(emptyDay);
    }
    for (let i = 1; i <= totalDays; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = i;
        dayElement.dataset.date = `${date.getFullYear()}-${date.getMonth() + 1}-${i}`;
        const cellDate = new Date(date.getFullYear(), date.getMonth(), i);
        const state = bwDayState(cellDate);
        if (state) {
            dayElement.classList.add('unavailable', state);
            dayElement.setAttribute('aria-disabled', 'true');
            dayElement.title = state === 'reserved' ? 'Booked' : state === 'blocked' ? 'Closed' : state === 'past' ? 'Past date' : 'More than a year ahead';
        } else if (bwIso(cellDate) === bwIso(bwToday())) {
            dayElement.classList.add('today');
        }
        daysContainer.appendChild(dayElement);
    }
    monthCalendar.appendChild(daysContainer);
    return monthCalendar;
}
function setupDateSelection() {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    let checkInDate = null;
    let checkOutDate = null;
    calendarContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('day') && e.target.textContent) {
            if (e.target.classList.contains('unavailable')) {
                return;
            }
            const clickedDate = new Date(e.target.dataset.date);
            const formattedDate = formatDate(clickedDate);
            hideErrorMessage();
            if (!checkInDate) {
                checkInDate = clickedDate;
                document.getElementById('checkInDate').value = formattedDate;
                e.target.classList.add('selected');
            }
            else if (!checkOutDate) {
                if (clickedDate <= checkInDate) {
                    showErrorMessage('Check-out date must be after check-in date', 'error');
                    return;
                }
                const rangeProblem = bwStayProblem(checkInDate, clickedDate);
                if (rangeProblem) {
                    showErrorMessage(rangeProblem, 'error');
                    return;
                }
                checkOutDate = clickedDate;
                document.getElementById('checkOutDate').value = formattedDate;
                e.target.classList.add('selected');
                const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                document.getElementById('nights-count').textContent = nights;
                highlightDateRange(checkInDate, checkOutDate);
            }
            else {
                const selectedDays = document.querySelectorAll('.day.selected, .day.in-range');
                selectedDays.forEach(day => {
                    day.classList.remove('selected', 'in-range');
                });
                checkInDate = clickedDate;
                checkOutDate = null;
                document.getElementById('checkInDate').value = formattedDate;
                document.getElementById('checkOutDate').value = '';
                document.getElementById('nights-count').textContent = '0';
                e.target.classList.add('selected');
            }
        }
    });
}
function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
function highlightDateRange(startDate, endDate) {
    const days = document.querySelectorAll('.day');
    const daysInRange = [];
    days.forEach(day => {
        if (day.dataset.date) {
            const dayDate = new Date(day.dataset.date);
            if (dayDate >= startDate && dayDate <= endDate) {
                daysInRange.push({
                    element: day,
                    date: dayDate
                });
            }
        }
    });
    daysInRange.sort((a, b) => a.date - b.date);
    daysInRange.forEach((day, index) => {
        day.element.classList.remove('in-range', 'in-range-odd', 'in-range-even', 'range-start', 'range-end');
        day.element.classList.add('in-range');
        if (index === 0) {
            day.element.classList.add('selected', 'range-start');
        } else if (index === daysInRange.length - 1) {
            day.element.classList.add('selected', 'range-end');
        }
    });
}
        function addWaterMark(doc) {
            var totalPages = doc.internal.getNumberOfPages();
            var WATERMARK_WIDTH = 75;
            var WATERMARK_HEIGHT = 75;
            for (i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setTextColor(150);
                doc.text(50, doc.internal.pageSize.height - 30, 'Watermark');
            }
            return doc;
        }

// Highlight the step (Check Availability / Select Villas / Guest Information) that is in view
document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.reservation-steps .step-link');
    if (!links.length || !('IntersectionObserver' in window)) {
        return;
    }
    const setActive = function (id) {
        links.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
    };
    setActive('checkavailability');
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ['checkavailability', 'selectvilla', 'guestinformation'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            observer.observe(el);
        }
    });
});
