    (function ($) {




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





/* email obfuscate */
  const emailtag = document.querySelector('.email-hidden.text-white');
   let observer = new IntersectionObserver((entries) => {
     entries.map((entry) => {
       if (entry.isIntersecting) {
         let script = document.createElement('script');
         script.onload = function () {
           emaildecode(entry.target)
         };
         script.src = 'https://www.bwstays.com/js/decode-email.js';
         document.head.appendChild(script);
       }
     });
   }).observe(emailtag);


/* email obfuscate */


/* whatsapp start */
var url = 'https://wati-integration-prod-service.clare.ai/v2/watiWidget.js?65929';
var s = document.createElement('script');
s.type = 'text/javascript';
s.async = true;
s.src = url;
var options = {
"enabled":true,
"chatButtonSetting":{
	"backgroundColor":"#64a19d",
   // "ctaText":"Chat with us",
	"borderRadius":"3",
	"marginLeft": "10",
	"marginRight": "5",


	"marginBottom": "10",



	"ctaIconWATI":false,
	"position":"left"
},
"brandSetting":{
	"brandName":"Wati",
	"brandSubTitle":"undefined",
	"brandImg":"https://www.wati.io/wp-content/uploads/2023/04/Wati-logo.svg",
	"welcomeText":"Hi there!\nHow can I help you?",
	"messageText":"Hello, %0A I have a question about {{page_link}}",
	"backgroundColor":"#64a19d",
	"ctaText":"Chat with bw Team",
	"borderRadius":"25",
	"autoShow":false,
	"phoneNumber":"99999 99999"
}
};
s.onload = function() {
	CreateWhatsappChatWidget(options);
};
var x = document.getElementsByTagName('script')[0];
x.parentNode.insertBefore(s, x);
/* whatsapp end */

/* bw location map*/
var iconURLPrefix = 'https://www.bwstays.com/';
var bwlocations = [['<h6><a id="bwlocation" target="_blank" href="https://www.bwstays.com" title="Black and White Stays">Black and White Stays</a></h6><a target="_blank" href="https://www.bwstays.com" title="Black and White Stays"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"  src="https://www.bwstays.com/assets/img/logo/pin-drop.png" width="300" ></a>', 11.6057872, 76.0833109, 2, iconURLPrefix+"assets/img/logo/bw.png","Black and White Stays"]];
 // Where you want to render the map.
var element = document.getElementById('map');
// Create Leaflet map on map element.
var map = L.map(element,{ zoomControl: false });
let customIcon = {
    iconUrl:"https://www.bwstays.com/assets/img/logo/pin.webp",
    iconSize:[40,40]
}
let myIcon = L.icon(customIcon);
//let myIcon = L.divIcon();
let iconOptions = {
    title:"BW Stays",
    //draggable:true,
    icon:myIcon
}
// Add OSM tile layer to the Leaflet map.
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
//for (i = 0; i < bwlocations.length; i++) {
// Target's GPS coordinates.
var target = L.latLng(bwlocations[0][1], bwlocations[0][2]);
map.fitBounds([[11.6057872, 76.0833109], [11.610,76.090]]);
// Set map's center to target with zoom 14.
map.setView(target, 14);
// Place a marker on the same location.
L.marker(target,iconOptions).addTo(map).bindPopup( bwlocations[0][5]);
//}
/*location map end*/

