
let currentMonthOffset = 0;

document.addEventListener('DOMContentLoaded', function () {
    // Generate calendar in JavaScript
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

                // Get selected villa
                const villa1 = document.getElementById('villa1').checked;
                const villa2 = document.getElementById('villa2').checked;

                // Get additional information
                const specialRequests = document.querySelector('textarea[placeholder="Your Address"]').value;
                const arrivalTime = document.querySelector('select').value;

                // Clear previous error messages
                hideErrorMessage();

                // Validate required fields
                if (!fullName || !email || !phone || !checkInDate || !checkOutDate || !termsCheck) {
                    showErrorMessage('Please fill in all required fields and accept the terms and conditions', 'error');
                    return;
                }

                // Validate dates to prevent negative day bookings
                const checkInDateObj = new Date(checkInDate);
                const checkOutDateObj = new Date(checkOutDate);
                const timeDiff = checkOutDateObj.getTime() - checkInDateObj.getTime();
                const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                if (nights <= 0 || checkOutDateObj <= checkInDateObj) {
                    showErrorMessage('Invalid dates: Check-out date must be at least one day after check-in date.', 'error');
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

                // Get counter values
                const adultsInput1 = document.querySelectorAll('.counter-inputvilla1')[0].value;
                const childrenInput1 = document.querySelectorAll('.counter-inputvilla')[0].value;
                const adultsInput2 = document.querySelectorAll('.counter-input')[0].value;
                const childrenInput2 = document.querySelectorAll('.counter-input')[1].value;

                // Create booking data object
                let myArray = [];
                let dateArray = [];
                let villaArray1 = [];
                let villaArray2 = [];
                let obj = new Object();

                obj.total = '';

                if(villa1) {
                   // let villaObj2 = new Object();
					villaArray1.push("villa1");
					villaArray1.push(adultsInput1);
					villaArray1.push(childrenInput1);
                   // villaArray1.push(villaObj2);
                }

                if(villa2) {
                    //let villaObj2 = new Object();
                    villaArray2.push("villa2");
                    villaArray2.push(adultsInput2);
                    villaArray2.push(childrenInput2);
                    //villaArray2.push(villaObj2);
                }

                obj.unitPrice = 5000; // Fixed price per night
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

                // Log the data
//                console.log('Booking Data:', myArray);
                invokeRefBooking(myArray);
                const jsonString = JSON.stringify(myArray);
                showErrorMessage('Booking completed successfully!', 'success');
        // Send AJAX request
        $.ajax({
            type: "POST",
            url: "https://formsubmit.co/ajax/bwstays@gmail.com",
            data:  jsonString,
			 dataType: 'json',
	    accepts: 'application/json',
	    success: function(response) {
                // Handle successful response
              //  console.log('Success:', response);
                // Update UI, e.g., display a message
                $('#result').html('<p>Form submitted successfully!</p>'+jsonString);
            },
            error: function(xhr, status, error) {
                // Handle error
               // console.error('Error:', error);
                // Display error message
                $('#result').html('<p>Error submitting form.</p>'+jsonString);
            }
        });


            });
        });




        $(document).ready(function () {

            $("#checkavail").click(function () {

                // Clear previous error messages
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



            });



        });

        $(function () {
            var closed =
                [
                    [
                        "2025-8-4", ""
                    ],
                    [
                        "2025-8-5", "2025-8-5"
                    ],
                    [
                        "2025-8-6", "2025-8-6"
                    ],
                    [
                        "2025-8-10", "2025-8-10"
                    ]

                ];
            var closedDays = [];
            var bookedDays = [];
            
            // Define booking array if not already defined
            var booking = booking || [];

             var todayDate = (function(){
			      var d = new Date();
			      var day = d.getDate();
			      day =  day > 9 ? day : '0' + day ;
			      var month = (d.getMonth() + 1);
			      month = month > 9 ? month : '0' + month;
			      var _value =  d.getFullYear() + '-' + month + '-' + day;
			      return _value;
			    })();


            for (i = 0; i < booking.length; i++) {

                if (booking[i].length == 2) {
                    bookedDays.push(booking[i][0]);


                }

            }

            for (i = 0; i < closed.length; i++) {

                if (closed[i].length == 2) {
                    closedDays.push(closed[i][0]);

                }
            }



            $("#date-range-calendar").datepicker({
                showOn: "button",
                buttonImageOnly: true,
                buttonText: "Select date",
                dateFormat: "yy-m-dd",
                minDate: "today",
                numberOfMonths: 2,
                onSelect: function (selected) {
                    var sDate = selected;
                    var bDate;

                    // Clear previous error messages
                    hideErrorMessage();
                    
                    var formattedDate = $.datepicker.formatDate('D, M d, yy', new Date(sDate));

                    
                    if (!$("#checkInDate").val()) {
                        $("#checkInDate").val(formattedDate);
                    }
                    
                    else if (!$("#checkOutDate").val()) {
                        var checkInStr = $("#checkInDate").val();
                        var checkIn = new Date(checkInStr);
                        var checkOut = new Date(sDate);
                        
                        
                        var timeDiff = checkOut.getTime() - checkIn.getTime();
                        var nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        
                        
                        if(nights <= 0 || checkOut <= checkIn) {
                            
                            $("#checkInDate").val("");
                            $("#checkOutDate").val("");
                            $("#nights-count").text("0");
                            showErrorMessage("Check-out date must be at least one day after check-in date. Please select your dates again.", 'error');
                            return false;
                        }
                        
                        
                        if(nights < 1) {
                            $("#checkInDate").val("");
                            $("#checkOutDate").val("");
                            $("#nights-count").text("0");
                            showErrorMessage("Minimum stay is 1 night. Please select valid dates.", 'error');
                            return false;
                        }
                        
                        $("#checkOutDate").val(formattedDate);
                        $("#nights-count").text(nights);
                    }
                    
                    else {
                        $("#checkInDate").val(formattedDate);
                        $("#checkOutDate").val("");
                        $("#nights-count").text("0");
                    }

                    
                    for (i = 0; i < booking.length; i++) {
                        bDate = booking[i][0];
                        if (booking[i].length == 2 && (Date.parse(sDate) == Date.parse(bDate))) {
                            $("#villa1").prop("checked", true).prop("disabled", true);
                            $("#villa2").prop("checked", true).prop("disabled", true);
                            break;
                        }
                        else if (booking[i].length == 1 && (Date.parse(sDate) == Date.parse(bDate))) {
                            $("#villa1").prop("checked", true).prop("disabled", true);
                            break;
                        }
                        else {
                            $("#villa1").prop("checked", false).prop("disabled", false);
                            $("#villa2").prop("checked", false).prop("disabled", false);
                            break;
                        }
                    }
                },
                beforeShowDay: function (date) {
                    var day = date.getDate();
                    day = day > 9 ? day : '0' + day;
                    var month = (date.getMonth() + 1);
                    month = month > 9 ? month : '0' + month;
                    var dateAsString = date.getFullYear().toString() + '-' + month + '-' + day;
                    return ($.inArray(dateAsString, closedDays) > -1 ? [false, 'blocked'] :
                        ($.inArray(dateAsString, bookedDays) > -1 ? [false, 'reserved'] : [true, '']));
                }
            }).datepicker("setDate", new Date());
        });


        // Counter functionality
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

        function getNextThreeDays(todayDate)
        {

	       if( (Date.parse(booking[0][0]) == Date.parse(todayDate)))
	       {

			    for (i = 0; i < booking.length; i++) {

			        

                 }
		    }
		}

// Error message management functions
function createErrorMessageContainers() {
    // Create error message container if it doesn't exist
    const dateRangeContainer = document.querySelector('.date-range-container');
    if (dateRangeContainer && !document.getElementById('date-error-message')) {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'date-error-message';
        errorContainer.className = 'error-message-container';
        errorContainer.style.display = 'none';
        
        // Insert after the title but before the content
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
    
    // Clear existing content
    errorContainer.innerHTML = '';
    
    // Create message element
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
    
    // Add close button
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
    
    // Show the container
    errorContainer.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideErrorMessage();
        }, 5000);
    }
    
    // Scroll to error message
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
        const monthCalendar = createMonthCalendar(monthDate, true); // Both calendars get navigation
        calendarContainer.appendChild(monthCalendar);
    }
}

function setupCalendarNavigation() {
    // Navigation will be added to the first month's header in createMonthCalendar function
    // This function is kept for compatibility but navigation is now handled in month headers
}


function createMonthCalendar(date, isFirstMonth = false) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    
    const monthCalendar = document.createElement('div');
    monthCalendar.className = 'month-calendar';
    
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    
    // Create navigation structure matching the image design
    const headerNav = document.createElement('div');
    headerNav.className = 'month-header-nav';
    
    // Previous button (left arrow)
    const prevButton = document.createElement('button');
    prevButton.className = 'month-nav-btn prev-btn';
    prevButton.innerHTML = '&laquo;';
    prevButton.setAttribute('aria-label', 'Previous month');
    prevButton.addEventListener('click', function() {
        currentMonthOffset = Math.max(currentMonthOffset - 1, 0);
        generateCalendars();
    });
    
    // Month title (centered)
    const monthTitle = document.createElement('span');
    monthTitle.className = 'month-title';
    monthTitle.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    // Next button (right arrow)
    const nextButton = document.createElement('button');
    nextButton.className = 'month-nav-btn next-btn';
    nextButton.innerHTML = '&raquo;';
    nextButton.setAttribute('aria-label', 'Next month');
    nextButton.addEventListener('click', function() {
        currentMonthOffset++;
        generateCalendars();
    });
    
    // Assemble header with proper layout
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
            const clickedDate = new Date(e.target.dataset.date);
            const formattedDate = formatDate(clickedDate);
            
            // Clear previous error messages
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


