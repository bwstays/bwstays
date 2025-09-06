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
	"phoneNumber":"9741496273"
}
};
s.onload = function() {
	CreateWhatsappChatWidget(options);
};
var x = document.getElementsByTagName('script')[0];
x.parentNode.insertBefore(s, x);
/* whatsapp end */


