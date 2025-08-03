
        document.addEventListener('DOMContentLoaded', function () {
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

                // Validate required fields
                if (!fullName || !email || !phone || !checkInDate || !checkOutDate || !termsCheck) {
                    alert('Please fill in all required fields and accept the terms and conditions');
                    return;
                }

                if (!villa1 && !villa2) {
                    alert('Please select at least one villa');
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
                alert('Booking completed successfully!');
        // Send AJAX request
        $.ajax({
            type: "POST",
            url: "https://formsubmit.co/ajax/bwstays@gmail.com",
            data:  jsonString,
			 dataType: 'json',
	    accepts: 'application/json',
	    success: function(response) {
                // Handle successful response
                console.log('Success:', response);
                // Update UI, e.g., display a message
                $('#result').html('<p>Form submitted successfully!</p>'+jsonString);
            },
            error: function(xhr, status, error) {
                // Handle error
                console.error('Error:', error);
                // Display error message
                $('#result').html('<p>Error submitting form.</p>'+jsonString);
            }
        });


            });
        });




        $(document).ready(function () {

            $("#checkavail").click(function () {
                // Code to execute when the button is clicked


                var checkin  = $("#checkInDate").val(); //2013-09-5
				var checkout    = $("#checkOutDate").val(); //2013-09-10

                if ($("#checkInDate").val().trim() === "" )
                {
						   alert("Please provide checkin  date ");
						   return;
			    }

                if ( $("#checkOutDate").val().trim() === ""    )
                {
						   alert("Please provide  checkout date ");
						   return;
			    }

 				if (new Date(checkout)<new Date(checkin) ){
						   alert("Check out date  should be same or greater than the  check in date ");
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

             var todayDate = (function(){
			      var d = new Date();
			      var day = d.getDate();
			      day =  day > 9 ? day : '0' + day ;
			      var month = (d.getMonth() + 1);
			      month = month > 9 ? month : '0' + month;
			      var _value =  day + '/' + month  + '/' + d.getFullYear();
			      return _value;
			    })();
			    /*
			    var tday=datepicker({
			      format: 'dd/mm/yyyy',
			      value: todayDate
                 });
                 */


            for (i = 0; i < booking.length; i++) {

                if (booking[i].length == 2) {
                    bookedDays.push(booking[i][0]);
                    // $("#villa1").prop("checked", true);
                    // $("#villa2").prop("checked", true);

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

                    // Format the selected date for display
                    var formattedDate = $.datepicker.formatDate('D, M d, yy', new Date(sDate));

                    // If no check-in date is set, set it
                    if (!$("#checkInDate").val()) {
                        $("#checkInDate").val(formattedDate);
                    }
                    // If check-in is set but check-out isn't, set check-out
                    else if (!$("#checkOutDate").val()) {
                        $("#checkOutDate").val(formattedDate);

                        // Calculate nights
                        var checkIn = new Date($("#checkInDate").val());
                        var checkOut = new Date(sDate);
                        var nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                        if(nights<=0)
                        {
							  $("#checkOutDate").focus();
						}
                        $("#nights-count").text(nights);
                    }
                    // If both dates are set, reset and start new selection
                    else {
                        $("#checkInDate").val(formattedDate);
                        $("#checkOutDate").val("");
                        $("#nights-count").text("0");
                    }

                    // Check villa availability
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
                    var dateAsString = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
                    return ($.inArray(dateAsString, closedDays) > -1 ? [false, 'blocked'] :
                        ($.inArray(dateAsString, bookedDays) > -1 ? [false, 'reserved'] : [true, '']));
                }
            }).datepicker("setDate", new Date(todayDate));
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

			/*
				// Step navigation
				const steps = document.querySelectorAll('.step');

				steps.forEach((step, index) => {
					if (!step.classList.contains('active')) {
						step.addEventListener('click', function () {
							// Here you would normally navigate to the corresponding step
							// For demo purposes, we'll just toggle the active class
							document.querySelector('.step.active').classList.remove('active');
							// step.classList.remove('bg-dark', 'text-white-50');
							// step.classList.add('active', 'bg-primary', 'text-white');
						});

			}
				});
            */
        });

        function getNextThreeDays(todayDate)
        {

	       if( (Date.parse(booking[0][0]) == Date.parse(todayDate)))
	       {

			    for (i = 0; i < booking.length; i++) {

			        //if (booking[i].length == 2)

                 }
		    }
		}

        function addWaterMark(doc) {
            var totalPages = doc.internal.getNumberOfPages();

            var WATERMARK_WIDTH = 75;
            var WATERMARK_HEIGHT = 75;
            for (i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                //doc.addImage(imgData, 'avif', 40, 40, WATERMARK_WIDTH, WATERMARK_HEIGHT);
                doc.setTextColor(150);
                doc.text(50, doc.internal.pageSize.height - 30, 'Watermark');
            }

            return doc;
        }


