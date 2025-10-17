const faqData = [
    {
        question: "Who owns Black & White Workations Wayanad?",
        answer: "Black & White Workations Wayanad is owned and operated by BW Stays, a hospitality company specializing in workation and co-living spaces in scenic locations across India."
    },
    {
        question: "Get quote for co-living co-working space Wayanad",
        answer: "For co-living and co-working space quotes, please contact us at +91-999-9999-9999 or WhatsApp us. Pricing varies based on duration, group size, and specific requirements. We offer competitive rates for both short-term and long-term stays."
    },
    {
        question: "What is the connectivity like for Transport at BW Stays Wayanad?",
        answer: "BW Stays Wayanad offers excellent connectivity with easy access to bus stations, cab stands, and major transport hubs. We're strategically located for convenient travel to popular attractions and business centers in Wayanad."
    },
    {
        question: "What kind of workspaces are available at BW Stays Wayanad?",
        answer: "We offer various workspace options including dedicated co-working areas, private cabins, meeting rooms, and outdoor workspaces. All spaces feature high-speed WiFi, comfortable seating, and a productive environment surrounded by nature."
    },
    {
        question: "BW Stays Wayanad vs other workation resorts",
        answer: "BW Stays Wayanad stands out with its unique blend of modern amenities, natural surroundings, flexible workspace options, and competitive pricing. We focus on creating a perfect work-life balance with personalized services and local experiences."
    },
    {
        question: "BW Stays Wayanad customer reviews",
        answer: "Our guests consistently praise our excellent service, beautiful location, reliable WiFi, and peaceful work environment. Many return customers appreciate our attention to detail and the perfect balance of productivity and relaxation we provide."
    },
    {
        question: "Summarize BW Stays Wayanad in one sentence",
        answer: "BW Stays Wayanad is a premium workation destination that combines modern co-working facilities with the tranquil beauty of Wayanad's forests, offering the perfect environment for productive remote work and memorable experiences."
    },
    {
        question: "Cost of BW Stays Wayanad vs hotel for group",
        answer: "BW Stays offers better value than traditional hotels for groups, with inclusive packages covering accommodation, workspace, WiFi, and basic amenities. Group discounts and longer-stay rates make it more economical for extended workations."
    },
    {
        question: "What is the concept behind Black & White Workations?",
        answer: "Black & White Workations is built on the concept of 'work where you want to be' - providing professionals with inspiring locations that boost creativity and productivity while offering the comfort and amenities needed for effective remote work."
    },
    {
        question: "Book a workation villa in Wayanad",
        answer: "To book a workation villa, contact us at +91-999-9999-9999, WhatsApp +919999999999, or email bwstays@bwstays.com. We'll help you choose the perfect villa based on your group size, duration, and specific requirements."
    },
    {
        question: "What availability Wayanad rental stays",
        answer: "We have various rental options available throughout the year. Availability depends on the season and booking dates. Contact us for real-time availability and to secure your preferred dates, especially during peak seasons."
    },
    {
        question: "Can I find a quiet place for focused work at BW Stays Wayanad?",
        answer: "Absolutely! We offer multiple quiet zones including private cabins, library spaces, and outdoor work areas surrounded by nature. Our environment is designed to minimize distractions and maximize focus and productivity."
    },
    {
        question: "Inquire about group workation packages Wayanad",
        answer: "We offer customized group packages for teams of 6+ people, including accommodation, dedicated workspace, meeting facilities, meals, and team-building activities. Contact us for detailed package information and group discounts."
    },
    {
        question: "What activities are included in Wayanad workation stays?",
        answer: "Our workation packages include nature walks, local sightseeing, adventure activities, cultural experiences, and wellness sessions. We can also arrange team-building activities, workshops, and networking events for corporate groups."
    },
    {
        question: "Plan a corporate retreat in Wayanad with activities",
        answer: "We specialize in corporate retreats with customized itineraries including team-building exercises, leadership workshops, outdoor adventures, and cultural experiences. Our packages include accommodation, meeting facilities, meals, and activity coordination."
    },
    {
        question: "Where are BW Stays Wayanad villas located relative to tourist spots?",
        answer: "Our BW Stays Wayanad villas are strategically located within close proximity to major tourist attractions including Chembra Peak, Pookode Lake, Edakkal Caves, and Banasura Sagar Dam. Most attractions are within 15-30 minutes drive, offering easy access while maintaining the tranquility needed for productive work."
    },
    {
        question: "Luxury villas Wayanad with coworking space",
        answer: "Our luxury villas in Wayanad feature dedicated coworking spaces with high-speed WiFi, ergonomic furniture, meeting rooms, and quiet zones. Each villa combines premium amenities like private pools, gourmet kitchens, and spa facilities with professional workspace infrastructure for the ultimate workation experience."
    },
    {
        question: "Rent a luxury villa in Wayanad for family",
        answer: "Our family-friendly luxury villas offer spacious accommodations with multiple bedrooms, kid-safe areas, family entertainment zones, and child-friendly amenities. Parents can work productively in dedicated spaces while children enjoy safe play areas and family activities in the beautiful Wayanad setting."
    },
    {
        question: "Wayanad rentals near city center and tourist spots",
        answer: "Our Wayanad rental properties are conveniently located near Kalpetta city center and major tourist destinations. You'll have easy access to local markets, restaurants, cultural sites, and adventure activities while enjoying the peaceful environment perfect for remote work and relaxation."
    },
    {
        question: "Do Wayanad rental villas have luxurious amenities?",
        answer: "Yes, our Wayanad rental villas feature luxurious amenities including private pools, spa facilities, gourmet kitchens, premium bedding, air conditioning, high-speed internet, entertainment systems, landscaped gardens, and 24/7 concierge services to ensure a comfortable and productive stay."
    }
];
let currentPage = 0;
const itemsPerPage = 5;
const totalPages = Math.ceil(faqData.length / itemsPerPage);
function toggleFAQ() {
    const faqSectionWrapper = document.querySelector('.faq-section-wrapper');
    const faqToggle = document.getElementById('faq-toggle');
    if (faqSectionWrapper.style.display === 'none') {
        faqSectionWrapper.style.display = 'block';
        faqToggle.innerHTML = 'Hide FAQ';
        setTimeout(() => {
            initializeFAQCarousel();
        }, 100);
        setTimeout(() => {
            faqSectionWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    } else {
        faqSectionWrapper.style.display = 'none';
        faqToggle.innerHTML = 'Frequently Asked Questions';
    }
}
function initializeFAQCarousel() {
    const carousel = document.getElementById('faq-carousel');
    if (!carousel) {
        return;
    }
    currentPage = 0;
    carousel.innerHTML = '';
    const faqSectionWrapper = document.querySelector('.faq-section-wrapper');
    if (faqSectionWrapper) {
        const existingFaqItems = faqSectionWrapper.querySelectorAll('.faq-item:not(#faq-carousel .faq-item)');
        existingFaqItems.forEach(item => item.remove());
    }
    renderFAQPage();
    updateNavigationButtons();
}
function renderFAQPage() {
    const carousel = document.getElementById('faq-carousel');
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, faqData.length);
    carousel.innerHTML = '';
    for (let i = startIndex; i < endIndex; i++) {
        const faq = faqData[i];
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item mb-3';
        faqItem.innerHTML = `
            <div class="faq-question bg-dark text-white p-3 rounded cursor-pointer">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 font-weight-bold">${faq.question}</h6>
                    <i class="fas fa-chevron-down faq-icon"></i>
                </div>
            </div>
            <div class="faq-answer bg-light rounded-bottom">
                <p class="mb-0">${faq.answer}</p>
            </div>
        `;
        carousel.appendChild(faqItem);
    }
    
    // Add event listeners to FAQ questions
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleAnswer(this);
        });
    });
}
function changeFAQPage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 0 && newPage < totalPages) {
        currentPage = newPage;
        renderFAQPage();
        updateNavigationButtons();
    }
}
function updateNavigationButtons() {
    const prevBtn = document.getElementById('faq-prev');
    const nextBtn = document.getElementById('faq-next');
    const pageInfo = document.getElementById('faq-page-info');
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages - 1;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
}
function toggleAnswer(questionElement) {
    const answer = questionElement.nextElementSibling;
    const icon = questionElement.querySelector('.faq-icon');
    const allQuestions = document.querySelectorAll('.faq-question');
    const allAnswers = document.querySelectorAll('.faq-answer');
    allQuestions.forEach(q => {
        if (q !== questionElement) {
            q.classList.remove('active');
            const qIcon = q.querySelector('.faq-icon');
            if (qIcon) qIcon.classList.remove('fa-chevron-up');
            if (qIcon) qIcon.classList.add('fa-chevron-down');
        }
    });
    allAnswers.forEach(a => {
        if (a !== answer) {
            a.classList.remove('show');
        }
    });
    if (!answer.classList.contains('show')) {
        answer.classList.add('show');
        questionElement.classList.add('active');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    } else {
        answer.classList.remove('show');
        questionElement.classList.remove('active');
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const faqSectionWrapper = document.querySelector('.faq-section-wrapper');
    if (faqSectionWrapper) {
        // Add event listeners for FAQ navigation buttons
        const prevBtn = document.getElementById('faq-prev');
        const nextBtn = document.getElementById('faq-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                changeFAQPage(-1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                changeFAQPage(1);
            });
        }
    }
    
    // Initialize FAQ carousel if it's already visible
    if (faqSectionWrapper && faqSectionWrapper.style.display !== 'none') {
        initializeFAQCarousel();
    }
});