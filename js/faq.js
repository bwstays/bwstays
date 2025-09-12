/**
 * FAQ Generator and Accordion Functionality
 * Reusable JavaScript for FAQ sections across multiple pages
 * Dynamically generates FAQ content and handles interactions
 */

(function() {
    'use strict';

    // FAQ Data - can be customized for different pages
    const faqData = {
        title: "Frequently Asked Questions",
        subtitle: "Find answers to common questions about Black & White Stays Wayanad",
        questions: [
            {
                id: "faq1",
                question: "What types of accommodations do you offer in Wayanad?",
                answer: "We offer three distinct accommodation experiences: 'Nestle with Nature' for serene mountain views, 'Hustle in Hispeed' with luxurious amenities for business travelers, and 'Bustle in Budget' for affordable group workations. All our properties are centrally located in Kalpetta with easy access to Wayanad's top attractions."
            },
            {
                id: "faq2",
                question: "What tourist attractions are nearby?",
                answer: "Our location provides easy access to Wayanad's diverse attractions including tea plantations, waterfalls like Thusharagiri and Meenmutty, wildlife sanctuaries, romantic spots like Pookode Lake, cultural sites like Edakkal Caves, adventure activities like trekking and cycling, local markets for spice shopping, and pilgrimage sites."
            },
            {
                id: "faq3",
                question: "Do you provide workation facilities?",
                answer: "Yes! We specialize in workations with our 'Colive, Cowork & Coplay' concept. Our properties offer high-speed internet, dedicated workspaces, and a peaceful environment perfect for remote work. The scenic Western Ghats setting provides the ideal backdrop for increased productivity and motivation."
            },
            {
                id: "faq4",
                question: "What is the best time to visit Wayanad?",
                answer: "Wayanad is beautiful year-round, but the best time is October to May when the weather is pleasant for sightseeing. The monsoon season (June-September) offers lush greenery and spectacular waterfalls, perfect for nature lovers. Our misty mountain location provides a cool climate throughout the year."
            },
            {
                id: "faq5",
                question: "How do I make a reservation?",
                answer: "You can make a reservation by clicking the 'Reservation' button on our website, contacting us through the contact form, or reaching out via WhatsApp. We'll help you choose the perfect accommodation based on your needs - whether it's a family vacation, romantic getaway, or business workation."
            },
            {
                id: "faq6",
                question: "What amenities are included in your stays?",
                answer: "Our accommodations include modern amenities such as high-speed WiFi, comfortable furnishing, kitchen facilities, scenic views of tea estates and mountains, proximity to local attractions, and 24/7 support. Specific amenities vary by property type - contact us for detailed information about your chosen accommodation."
            },
            {
                id: "faq7",
                question: "Are you suitable for families with children?",
                answer: "Absolutely! We welcome families and provide a safe, comfortable environment for children. Wayanad offers numerous family-friendly attractions including museums, wildlife sanctuaries, farm visits, and cultural sites. Our central location makes it easy to access child-friendly activities and restaurants."
            },
            {
                id: "faq8",
                question: "What outdoor activities can I enjoy in Wayanad?",
                answer: "Wayanad offers diverse outdoor activities including trekking to Chembra Peak, cycling through tea estates, bamboo rafting, wildlife safaris, waterfall visits, plantation tours, zip-lining, and exploring tribal villages. Our location provides easy access to all these adventure activities and sporting venues."
            }
        ]
    };

    // Generate FAQ HTML
    function generateFAQHTML(data) {
        const faqHTML = `
            <section class="faq-section bg-light" id="faq">
                <div class="container py-5">
                    <div class="col-lg-8 mx-auto text-center mb-5">
                        <h2 class="text-black mb-4">${data.title}</h2>
                        <div class="border-bottom border-primary text-center mb-4" id="contact-divider"></div>
                        <p class="text-black-50">${data.subtitle}</p>
                    </div>

                    <div class="row justify-content-center">
                        <div class="col-lg-10">
                            <div class="faq-accordion">
                                ${data.questions.map(item => `
                                    <div class="faq-item">
                                        <div class="faq-question">
                                            <h5 class="mb-0">
                                                <button class="faq-btn" type="button" data-target="#${item.id}" aria-expanded="false" aria-controls="${item.id}">
                                                    ${item.question}
                                                    <i class="fas fa-plus faq-icon"></i>
                                                </button>
                                            </h5>
                                        </div>
                                        <div id="${item.id}" class="faq-answer">
                                            <div class="faq-body">
                                                <p>${item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        return faqHTML;
    }

    // Initialize FAQ functionality
    function initFAQInteractions() {
        const faqButtons = document.querySelectorAll('.faq-btn');
        
        if (faqButtons.length === 0) {
            return; // No FAQ elements found
        }

        faqButtons.forEach(function(button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('data-target');
                const targetElement = document.querySelector(targetId);
                const icon = this.querySelector('.faq-icon');
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                
                if (!targetElement) {
                    console.warn('FAQ target element not found:', targetId);
                    return;
                }

                // Close all other FAQ items
                faqButtons.forEach(function(otherButton) {
                    if (otherButton !== button) {
                        const otherTargetId = otherButton.getAttribute('data-target');
                        const otherTargetElement = document.querySelector(otherTargetId);
                        const otherIcon = otherButton.querySelector('.faq-icon');
                        
                        if (otherTargetElement) {
                            otherTargetElement.classList.remove('show');
                            otherButton.setAttribute('aria-expanded', 'false');
                            otherButton.classList.remove('active');
                            
                            if (otherIcon) {
                                otherIcon.className = 'fas fa-plus faq-icon';
                            }
                        }
                    }
                });

                // Toggle current FAQ item
                if (isExpanded) {
                    // Close current item
                    targetElement.classList.remove('show');
                    this.setAttribute('aria-expanded', 'false');
                    this.classList.remove('active');
                    
                    if (icon) {
                        icon.className = 'fas fa-plus faq-icon';
                    }
                } else {
                    // Open current item
                    targetElement.classList.add('show');
                    this.setAttribute('aria-expanded', 'true');
                    this.classList.add('active');
                    
                    if (icon) {
                        icon.className = 'fas fa-minus faq-icon';
                    }
                }
            });
        });
    }

    // Create and inject FAQ section
    function createFAQSection(targetSelector = '#faq-container', customData = null) {
        const data = customData || faqData;
        const targetElement = document.querySelector(targetSelector);
        
        if (targetElement) {
            targetElement.innerHTML = generateFAQHTML(data);
            initFAQInteractions();
        } else {
            console.warn('FAQ target container not found:', targetSelector);
        }
    }

    // Auto-inject FAQ if container exists
    function autoInjectFAQ() {
        // Try to find FAQ container or inject before footer
        let targetElement = document.querySelector('#faq-container');
        
        if (!targetElement) {
            // Look for footer and inject before it
            const footer = document.querySelector('footer, .footer');
            if (footer) {
                const faqContainer = document.createElement('div');
                faqContainer.id = 'faq-container';
                footer.parentNode.insertBefore(faqContainer, footer);
                targetElement = faqContainer;
            }
        }
        
        if (targetElement) {
            targetElement.innerHTML = generateFAQHTML(faqData);
            initFAQInteractions();
        }
    }

    // Initialize when DOM is ready
    function init() {
        autoInjectFAQ();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions globally
    window.createFAQSection = createFAQSection;
    window.initFAQInteractions = initFAQInteractions;
    window.faqData = faqData;

})();

/**
 * Usage Instructions:
 * 
 * 1. Automatic injection:
 *    - Just include this script and it will auto-inject FAQ before footer
 *    - Or create a div with id="faq-container" where you want FAQ to appear
 * 
 * 2. Manual injection:
 *    - Call createFAQSection('#your-target-selector') 
 *    - Or createFAQSection('#target', customFAQData)
 * 
 * 3. Custom FAQ data:
 *    - Modify the faqData object or pass custom data to createFAQSection
 * 
 * Required CSS classes (should be in details-page.css):
 * .faq-section, .faq-item, .faq-btn, .faq-icon, .faq-answer, .faq-body, .show, .active
 */