
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
		alert(review);

		var html=createReviewCard(review);

		cardHTMLArray.push(html);
		}

	    testCardsContainer.innerHTML = cardHTMLArray.join('');


   }


  function createReviewCard(review) {
     //const imageUrl = review.image || iconURLPrefix+'assets/img/villa1/demo-image-02.webp';
     //const knowmoreUrl = review.knowmore || '#';

     return `
                            <div class="review-card">
                                <div class="reviewer-info">
                                    <div class="reviewer-details">
                                        <div class="name">Jacob S (4.5)? </div>
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
                                <p class="review-text">Loved the peaceful location and the scenic views. Rooms were clean, staff friendly, and the morning mist was magical. Highly recommended for couples and families.</p>
                            </div>

                            <div class="review-card">
                                <div class="reviewer-info">
                                    <div class="reviewer-details">
                                        <div class="name">Albert  (3.7)?</div>
                                        <div class="rating-row">
                                            <span class="stars" aria-label="4 out of 5 stars">
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="far fa-star my-star-icon"></i>
                                            </span>

                                        </div>
                                    </div>
                                </div>
                                <p class="review-text">Great value for money. The location is close to key attractions and the staff helped us plan our day trips. Parking and Wi-Fi were reliable.</p>
                            </div>

                            <div class="review-card">
                                <div class="reviewer-info">
                                    <div class="reviewer-details">
                                        <div class="name">Priya Nair (3.7)?</div>
                                        <div class="rating-row">
                                            <span class="stars" aria-label="4 out of 5 stars">
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="fas fa-star my-star-icon"></i>
                                                <i class="far fa-star my-star-icon"></i>
                                            </span>

                                        </div>
                                    </div>
                                </div>
                                <p class="review-text">Great value for money. The location is close to key attractions and the staff helped us plan our day trips. Parking and Wi-Fi were reliable.</p>
                            </div>

     `;
 }

document.addEventListener('DOMContentLoaded', renderTestimonial);
