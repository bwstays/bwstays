const aboutCardData = {
    cards: [
        {
            title: "nestle with nature",
            icon: "fas fa-mountain",
            description: "Experience the serene beauty of Wayanad's landscapes and misty mountains at your doorstep.",
            image: "assets/img/tirunelli.png"
        },
        {
            title: "hustle in hisspeed",
            icon: "fas fa-home",
            description: "Luxurious amenities and thoughtfully designed spaces for your perfect stay.",
            image: "assets/img/wayanad_mist.jpg"
        },
        {
            title: "bustle in budget",
            icon: "fas fa-star",
            description: "Create unforgettable memories with our curated experiences and activities.",
            image: "assets/img/tea_wayanad.webp"
        }
    ]
};

function populateAboutCards() {
    const cardContainer = document.querySelector('#about .row.justify-content-center');
    if (!cardContainer) return;


    cardContainer.innerHTML = '';

    // Populate cards
    aboutCardData.cards.forEach(card => {
        const cardHTML = `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="about-card h-100" style="background: linear-gradient(45deg, #1a1a1a, #2a2a2a); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
                    <div class="card-image" style="height: 200px; overflow: hidden;">
                        <img alt="" src="${card.image}" alt="${card.title}" class="img-fluid w-100 h-100" style="object-fit: cover;" />
                        <div class="overlay" style="background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);"></div>
                    </div>
                    <div class="card-content p-4 flex-grow-1 d-flex flex-column">
                        <div class="icon-wrapper mb-4" style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                            <i class="${card.icon} fa-2x text-primary"></i>
                        </div>
                        <h3 class="text-white mb-3">${card.title}</h3>
                        <p class="text-white-50 mb-0">${card.description}</p>
                        <div class="mt-auto pt-4 text-center">
                            <a href="#" class="btn btn-primary js-scroll-trigger px-4 py-2">Know More</a>
                        </div>
                    </div>
                </div>
            </div>
            `;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Fix the event listener at the bottom
document.addEventListener('DOMContentLoaded', populateAboutCards);