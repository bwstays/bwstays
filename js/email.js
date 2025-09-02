

  const emailtag = document.querySelector('.email-hidden');
   let observer = new IntersectionObserver((entries) => {
     entries.map((entry) => {
       if (entry.isIntersecting) {
         let script = document.createElement('script');
         script.onload = function () {
           emaildecode(entry.target)
         };
         script.src = 'decode-email.js';
         document.head.appendChild(script);
       }
     });
   }).observe(emailtag);
