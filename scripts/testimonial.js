
// Tally form initialization and debugging
document.addEventListener('DOMContentLoaded', function() {
    console.log('Testimonial.js loaded - checking for Tally form');
    
    // Check if Tally script is loaded
    if (typeof window.Tally !== 'undefined') {
        console.log('Tally script is loaded');
        
        // Initialize Tally forms
        window.Tally.loadEmbeds();
        console.log('Tally embeds initialized');
    } else {
        console.log('Tally script not found, waiting for it to load...');
        
        // Wait for Tally script to load
        const checkTally = setInterval(() => {
            if (typeof window.Tally !== 'undefined') {
                console.log('Tally script loaded, initializing embeds');
                window.Tally.loadEmbeds();
                clearInterval(checkTally);
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkTally);
            console.error('Tally script failed to load within 10 seconds');
        }, 10000);
    }
    
    // Check if iframe exists
    const tallyIframe = document.querySelector('iframe[data-tally-src]');
    if (tallyIframe) {
        console.log('Tally iframe found:', tallyIframe);
        console.log('Tally iframe src:', tallyIframe.getAttribute('data-tally-src'));
    } else {
        console.error('Tally iframe not found');
    }
    
    // Additional check for Tally form after 2 seconds
    setTimeout(() => {
        const tallyForm = document.querySelector('iframe[src*="tally.so"]');
        if (tallyForm) {
            console.log('Tally form successfully loaded and rendered');
        } else {
            console.warn('Tally form may not have loaded properly');
        }
    }, 2000);
});

// ajax

document.addEventListener('DOMContentLoaded', function () {
    const myForm = document.getElementById('myForm');
    if (myForm) {
        myForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
    
            // https://formsubmit.co/ajax/bwstays@gmail.com
            fetch('https://formsubmit.co/ajax/arunsinghdhami2000@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    }
});