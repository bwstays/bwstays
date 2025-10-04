	          function generateCaptcha() {
	              const num1 = Math.floor(Math.random() * 10) + 1;
	              const num2 = Math.floor(Math.random() * 10) + 1;
	              document.getElementById('captcha-num1').textContent = num1;
	              document.getElementById('captcha-num2').textContent = num2;
	              document.getElementById('captcha-answer').value = '';
	              clearCaptchaError();
	          }
	          function showCaptchaError(message) {
	              const errorElement = document.getElementById('captcha-error');
	              if (errorElement) {
	                  errorElement.textContent = message;
	                  errorElement.style.display = 'block';
	              }
	          }
	          function clearCaptchaError() {
	              const errorElement = document.getElementById('captcha-error');
	              if (errorElement) {
	                  errorElement.style.display = 'none';
	                  errorElement.textContent = '';
	              }
	          }
	          function validateCaptcha() {
	              const num1 = parseInt(document.getElementById('captcha-num1').textContent);
	              const num2 = parseInt(document.getElementById('captcha-num2').textContent);
	              const userAnswer = parseInt(document.getElementById('captcha-answer').value);
	              const correctAnswer = num1 + num2;
	              return userAnswer === correctAnswer;
	          }
const testCardData = {
    test: [
        {
            custname: "Jacob S",
            rating: "4.5",
            comment: "Loved the peaceful location and the scenic views. Rooms were clean, staff friendly, and the morning mist was magical. Highly recommended for couples and families."
        },
        {
            custname: "Albert",
            rating: "3.7",
            comment: "Great value for money. The location is close to key attractions and the staff helped us plan our day trips. Parking and WiFi were reliable."
        },
        {
            custname: "Priya Nair",
            rating: "3.7",
            comment: "Great value for money. The location is close to key attractions and the staff helped us plan our day trips. Parking and WiFi were reliable."
        }
    ]
};
   function renderTestimonial( ) {
		const testCardsContainer = document.getElementById('reviews-grid');
		const cardHTMLArray = [];
		const testim = testCardData.test;
 		for (let i = 0; i < testim.length; i++) {
			const review = testim[i];
			var html=createReviewCard(review);
			cardHTMLArray.push(html);
		}
	    testCardsContainer.innerHTML = cardHTMLArray.join('');
   }
  function createReviewCard(review) {
      const custname = review.custname || '#';
      const rating = review.rating || '#';
      const comment = review.comment || '#';
     return `
                            <div class="review-card">
                                <div class="reviewer-info">
                                    <div class="reviewer-details">
                                        <div class="name">${custname} (${rating} ) <i class="fas fa-star my-star-icon" id="top-star"></i> </div>
                                        <div class="rating-row">
                                            <span class="stars" aria-label="5 out of 5 stars">
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p class="review-text">${comment}</p>
                            </div>
     `;
 }
document.addEventListener('DOMContentLoaded', renderTestimonial);
      document.addEventListener("DOMContentLoaded", function () {
        const imgWrapper = document.querySelector(
          ".col-lg-6 > div:first-child > div:first-child"
        );
        const leftArrow = document.querySelector(".image-nav-left");
        const rightArrow = document.querySelector(".image-nav-right");
        let currentImageIndex = 0;
        const imageCount = 2; 
        function updateImage(direction) {
          if (direction === "next") {
            currentImageIndex = (currentImageIndex + 1) % imageCount;
          } else {
            currentImageIndex =
              (currentImageIndex - 1 + imageCount) % imageCount;
          }
          imgWrapper.style.transform = `translateX(-${
            currentImageIndex * 100
          }%)`;
        }
		if (leftArrow !== undefined && leftArrow  && rightArrow !== undefined && rightArrow)
		{
					leftArrow.addEventListener("click", function () {
					  updateImage("prev");
					});
					rightArrow.addEventListener("click", function () {
					  updateImage("next");
					});
					leftArrow.addEventListener("mouseenter", function () {
					  this.style.backgroundColor = "rgba(0,0,0,0.8)";
					  this.style.transform = "translateY(-50%) scale(1.1)";
					});
					leftArrow.addEventListener("mouseleave", function () {
					  this.style.backgroundColor = "rgba(0,0,0,0.6)";
					  this.style.transform = "translateY(-50%) scale(1)";
					});
					rightArrow.addEventListener("mouseenter", function () {
					  this.style.backgroundColor = "rgba(0,0,0,0.8)";
					  this.style.transform = "translateY(-50%) scale(1.1)";
					});
					rightArrow.addEventListener("mouseleave", function () {
					  this.style.backgroundColor = "rgba(0,0,0,0.6)";
					  this.style.transform = "translateY(-50%) scale(1)";
					});
			}
      });
	          document.addEventListener('DOMContentLoaded', function() {
	              generateCaptcha();
	              document.getElementById('refresh-captcha').addEventListener('click', function() {
	                  generateCaptcha();
	              });
	              const bookingForm = document.getElementById('myForm');
	              const contactForm = document.getElementById('contact-form');
	              if (bookingForm) {
	                  bookingForm.addEventListener('submit', function(e) {
	                      if (!validateCaptcha()) {
	                          e.preventDefault();
	                          showCaptchaError('Please enter the correct answer for the security verification.');
	                          document.getElementById('captcha-answer').focus();
	                          return false;
	                      }
	                  });
	              }
	              if (contactForm) {
	                  contactForm.addEventListener('submit', function(e) {
	                      if (!validateCaptcha()) {
	                          e.preventDefault();
	                          showCaptchaError('Please enter the correct answer for the security verification.');
	                          document.getElementById('captcha-answer').focus();
	                          return false;
	                      }
	                  });
	              }
	              const captchaInput = document.getElementById('captcha-answer');
	              if (captchaInput) {
	                  captchaInput.addEventListener('input', function() {
	                      clearCaptchaError();
	                  });
	              }
        });
