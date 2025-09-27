document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.Tally !== 'undefined') {
        window.Tally.loadEmbeds();
    } else {
        const checkTally = setInterval(() => {
            if (typeof window.Tally !== 'undefined') {
                window.Tally.loadEmbeds();
                clearInterval(checkTally);
            }
        }, 100);
        setTimeout(() => {
            clearInterval(checkTally);
        }, 10000);
    }
    const tallyIframe = document.querySelector('iframe[data-tally-src]');
    if (tallyIframe) {
    } else {
    }
    setTimeout(() => {
        const tallyForm = document.querySelector('iframe[src*="tally.so"]');
        if (tallyForm) {
        } else {
        }
    }, 2000);
});
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
            })
            .catch(error => {
            });
        });
    }
});