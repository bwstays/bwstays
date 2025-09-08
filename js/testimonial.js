
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
                                        <div class="name">${custname} (${rating} )? </div>
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
      // Image carousel functionality for the static left column
      document.addEventListener("DOMContentLoaded", function () {
        const imgWrapper = document.querySelector(
          ".col-lg-6 > div:first-child > div:first-child"
        );
        const leftArrow = document.querySelector("div.image-nav-arrow.image-nav-left image-nav-arrow image-nav-left");
        const rightArrow = document.querySelector("div.image-nav-arrow.image-nav-right image-nav-arrow image-nav-right");
        let currentImageIndex = 0;
        const imageCount = 2; // Number of images in the carousel

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

        leftArrow.addEventListener("click", function () {
          updateImage("prev");
        });

        rightArrow.addEventListener("click", function () {
          updateImage("next");
        });

        // Add hover effects for arrows
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
      });
