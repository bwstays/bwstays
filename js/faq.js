const faqData = [
    {
        question: "Who owns Black & White Workations Wayanad?",
        answer: "Black & White Workations Wayanad is owned and operated by BW Stays, a hospitality company specializing in workation and co-living spaces in scenic locations across India."
    },
    {
        question: "Get quote for co-living co-working space Wayanad",
        answer: "For co-living and co-working space quotes, please contact us at +91-999-999-9999 or WhatsApp us. Pricing varies based on duration, group size, and specific requirements. We offer competitive rates for both short-term and long-term stays."
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
        answer: "To book a workation villa, contact us at +91-999-999-9999, WhatsApp +919999999999, or email bwstays@bwstays.com. We'll help you choose the perfect villa based on your group size, duration, and specific requirements."
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

// ---------------------------------------------------------------- FAQ accordion
// One accessible accordion: each question is a real <button> (keyboard and
// screen-reader friendly) with aria-expanded / aria-controls, a single answer
// open at a time, and a search box that filters the list. No pagination.
var faqSearchValue = '';

function faqEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function toggleFAQ() {
    var wrapper = document.querySelector('.faq-section-wrapper');
    var container = document.getElementById('faq-container');
    var toggle = document.getElementById('faq-toggle');
    if (!wrapper || !toggle) {
        return;
    }
    var closed = wrapper.style.display === 'none' || wrapper.style.display === '';
    if (closed) {
        wrapper.style.display = 'block';
        if (container) {
            container.style.display = 'block';
        }
        toggle.textContent = 'Hide FAQ';
        toggle.setAttribute('aria-expanded', 'true');
        buildFAQ();
        setTimeout(function () {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        wrapper.style.display = 'none';
        toggle.textContent = 'Frequently Asked Questions';
        toggle.setAttribute('aria-expanded', 'false');
    }
}

function buildFAQ() {
    var list = document.getElementById('faq-carousel');
    if (!list) {
        return;
    }
    var nav = document.querySelector('.faq-carousel-nav');
    if (nav) {
        nav.style.display = 'none'; // pagination is replaced by search
    }
    if (!document.getElementById('faq-search')) {
        var box = document.createElement('div');
        box.className = 'faq-search-box';
        box.innerHTML = '<label for="faq-search" class="sr-only">Search the frequently asked questions</label>' +
            '<input type="search" id="faq-search" class="form-control faq-search" autocomplete="off" ' +
            'placeholder="Search questions, e.g. workation, family, price">' +
            '<p id="faq-count" class="faq-count" role="status" aria-live="polite"></p>';
        list.parentNode.insertBefore(box, list);
        document.getElementById('faq-search').addEventListener('input', function (e) {
            faqSearchValue = e.target.value;
            renderFAQList();
        });
        list.addEventListener('click', function (e) {
            var button = e.target.closest ? e.target.closest('.faq-question') : null;
            if (button) {
                toggleAnswer(button);
            }
        });
    }
    renderFAQList();
}

function renderFAQList() {
    var list = document.getElementById('faq-carousel');
    var count = document.getElementById('faq-count');
    if (!list) {
        return;
    }
    var words = faqSearchValue.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    var html = '';
    faqData.forEach(function (faq, i) {
        var text = (faq.question + ' ' + faq.answer).toLowerCase();
        if (!words.every(function (w) { return text.indexOf(w) > -1; })) {
            return;
        }
        shown++;
        html += '<div class="faq-item mb-3">' +
            '<h3 class="h6 mb-0"><button type="button" class="faq-question bg-dark text-white p-3 rounded" ' +
            'id="faq-q-' + i + '" aria-expanded="false" aria-controls="faq-a-' + i + '">' +
            '<span class="faq-question-text font-weight-bold">' + faqEscape(faq.question) + '</span>' +
            '<i class="fas fa-chevron-down faq-icon" aria-hidden="true"></i></button></h3>' +
            '<div class="faq-answer bg-light rounded-bottom" id="faq-a-' + i + '" role="region" aria-labelledby="faq-q-' + i + '">' +
            '<p class="mb-0">' + faqEscape(faq.answer) + '</p></div></div>';
    });
    list.innerHTML = html || '<p class="faq-empty text-center">No questions match your search. Try another word, or use the contact form below.</p>';
    if (count) {
        count.textContent = words.length ? shown + ' of ' + faqData.length + ' questions' : faqData.length + ' questions';
    }
}

function toggleAnswer(button) {
    var open = button.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('#faq-carousel .faq-question').forEach(function (q) {
        q.setAttribute('aria-expanded', 'false');
        q.classList.remove('active');
        var icon = q.querySelector('.faq-icon');
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    });
    document.querySelectorAll('#faq-carousel .faq-answer').forEach(function (a) {
        a.classList.remove('show');
    });
    if (!open) {
        button.setAttribute('aria-expanded', 'true');
        button.classList.add('active');
        var icon = button.querySelector('.faq-icon');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
        var answer = document.getElementById(button.getAttribute('aria-controls'));
        if (answer) {
            answer.classList.add('show');
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var wrapper = document.querySelector('.faq-section-wrapper');
    if (wrapper) {
        wrapper.style.display = 'none';
    }
    var toggle = document.getElementById('faq-toggle');
    if (toggle) {
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'faq-container');
    }
    // open directly from a #faq link
    if (location.hash === '#faq' || location.hash === '#faq-heading') {
        toggleFAQ();
    }
});
