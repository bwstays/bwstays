function toggleFAQ() {
       const faqContainer = document.getElementById('faq-container');
       const faqToggle = document.getElementById('faq-toggle');
       
       if (faqContainer.style.display === 'none' || faqContainer.style.display === '') {
           faqContainer.style.display = 'block';
           faqToggle.innerHTML = 'Hide FAQ';
           // Smooth scroll to FAQ section
           setTimeout(() => {
               faqContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }, 100);
       } else {
           faqContainer.style.display = 'none';
           faqToggle.innerHTML = 'Frequently Asked Questions';
       }
   }
   
   function toggleAnswer(questionElement) {
       const answer = questionElement.nextElementSibling;
       const icon = questionElement.querySelector('.faq-icon');
       
       // Close all other open answers
       const allQuestions = document.querySelectorAll('.faq-question');
       const allAnswers = document.querySelectorAll('.faq-answer');
       
       allQuestions.forEach(q => {
           if (q !== questionElement) {
               q.classList.remove('active');
           }
       });
       
       allAnswers.forEach(a => {
           if (a !== answer) {
               a.classList.remove('active');
           }
       });
       
       // Toggle current answer
       questionElement.classList.toggle('active');
       answer.classList.toggle('active');
   }