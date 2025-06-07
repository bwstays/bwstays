/*!
    * Start Bootstrap - Grayscale v6.0.3 (https://startbootstrap.com/theme/grayscale)
    * Copyright 2013-2020 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-grayscale/blob/master/LICENSE)
    */
    (function ($) {



const lat = 11.605943; // Example latitude
const lon = 76.083429; // Example longitude
//const locationDisplay = document.getElementById('location');
const temperatureDisplay = document.getElementById('temperature');

const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m`;

fetch(apiUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    // locationDisplay.textContent = `Latitude: ${lat}, Longitude: ${lon}`;
    // Assuming you want the current temperature, use the first element of the hourly data
    const currentTemperature = data.hourly.temperature_2m[0];
    temperatureDisplay.textContent = `${currentTemperature}°C`;
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
    temperatureDisplay.textContent = 'Error fetching data';
  });



    "use strict"; // Start of use strict

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (
            location.pathname.replace(/^\//, "") ==
                this.pathname.replace(/^\//, "") &&
            location.hostname == this.hostname
        ) {
            var target = $(this.hash);
            target = target.length
                ? target
                : $("[name=" + this.hash.slice(1) + "]");
            if (target.length) {
                $("html, body").animate(
                    {
                        scrollTop: target.offset().top - 70,
                    },
                    1000,
                    "easeInOutExpo"
                );
                return false;
            }
        }
    });

    // Closes responsive menu when a scroll trigger link is clicked
    $(".js-scroll-trigger").click(function () {
        $(".navbar-collapse").collapse("hide");
    });

    // Activate scrollspy to add active class to navbar items on scroll
    $("body").scrollspy({
        target: "#mainNav",
        offset: 100,
    });

    // Collapse Navbar
    var navbarCollapse = function () {
        if ($("#mainNav").offset().top > 100) {
            $("#mainNav").addClass("navbar-shrink");
        } else {
            $("#mainNav").removeClass("navbar-shrink");
        }
    };
    // Collapse now if page is not at top
    navbarCollapse();
    // Collapse the navbar when page is scrolled
    $(window).scroll(navbarCollapse);
})(jQuery); // End of use strict


 let mybutton = document.getElementById("btn-back-to-top");


 window.onscroll = function() {
     if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
         mybutton.style.display = "block";

         setTimeout(() => {
             mybutton.classList.add('show');
         }, 10);
     } else {
         mybutton.classList.remove('show');

         setTimeout(() => {
             mybutton.style.display = "none";
         }, 300);
     }
 };


 mybutton.addEventListener("click", function() {
     window.scrollTo({
         top: 0,
         behavior: 'smooth'
     });
 });