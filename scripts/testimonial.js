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
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        let messageContainer = document.getElementById('contact-form-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'contact-form-message';
            // Insert before the form's parent div to avoid altering form layout
            contactForm.parentNode.insertBefore(messageContainer, contactForm);
        }

        function showMessage(message, type = 'error') {
            messageContainer.innerHTML = '';
            const messageDiv = document.createElement('div');
            messageDiv.className = `alert ${type === 'error' ? 'alert-danger' : 'alert-success'} text-center mb-3`;
            messageDiv.style.cssText = `
                padding: 10px 15px;
                margin: 10px 0;
                border-radius: 5px;
                font-size: 14px;
                font-weight: 500;
                border: 1px solid;
                ${type === 'error' ? 
                    'background-color: #f8d7da; color: #721c24; border-color: #f5c6cb;' : 
                    'background-color: #d4edda; color: #155724; border-color: #c3e6cb;'
                }
            `;
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'close';
            closeBtn.style.cssText = `
                float: right;
                background: none;
                border: none;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
                opacity: 0.7;
            `;
            closeBtn.onclick = function() {
                hideMessage();
            };
            messageDiv.textContent = message;
            messageDiv.appendChild(closeBtn);
            messageContainer.appendChild(messageDiv);
            messageContainer.style.display = 'block';
            if (type === 'success') {
                setTimeout(() => {
                    hideMessage();
                }, 5000);
            }
            messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function hideMessage() {
            if (messageContainer) {
                messageContainer.style.display = 'none';
                messageContainer.innerHTML = '';
            }
        }

        contactForm.setAttribute('action', 'https://formsubmit.co/bwstays@gmail.com');
        contactForm.setAttribute('method', 'POST');

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            hideMessage();

            const num1 = parseInt(document.getElementById('captcha-num1').innerText);
            const num2 = parseInt(document.getElementById('captcha-num2').innerText);
            const userAnswer = parseInt(document.getElementById('captcha-answer').value);
            const captchaError = document.getElementById('captcha-error');

            if (userAnswer !== (num1 + num2)) {
                captchaError.innerText = 'Incorrect captcha answer.';
                captchaError.style.display = 'block';
                return;
            } else {
                captchaError.style.display = 'none';
            }

            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            fetch('https://formsubmit.co/ajax/bwstays@gmail.com', {
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
                if (data.success) {
                    showMessage('Form submitted successfully!', 'success');
                    contactForm.reset();
                    generateCaptcha();
                } else {
                    showMessage('Form submission failed. Please try again.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred. Please try again.', 'error');
            });
        });

        const refreshCaptcha = document.getElementById('refresh-captcha');
        if (refreshCaptcha) {
            refreshCaptcha.addEventListener('click', generateCaptcha);
        }

        function generateCaptcha() {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            document.getElementById('captcha-num1').innerText = num1;
            document.getElementById('captcha-num2').innerText = num2;
            document.getElementById('captcha-answer').value = '';
        }

        generateCaptcha();
    }
});