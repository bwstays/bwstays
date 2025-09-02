

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
