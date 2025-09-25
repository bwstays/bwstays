// Generate random captcha numbers
        function generateCaptcha() {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            document.getElementById('captcha-num1').textContent = num1;
            document.getElementById('captcha-num2').textContent = num2;
            document.getElementById('captcha-answer').value = '';
            // Clear any existing error message
            clearCaptchaError();
        }

        // Show captcha error message
        function showCaptchaError(message) {
            const errorElement = document.getElementById('captcha-error');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }

        // Clear captcha error message
        function clearCaptchaError() {
            const errorElement = document.getElementById('captcha-error');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }
        }

        // Validate captcha answer
        function validateCaptcha() {
            const num1 = parseInt(document.getElementById('captcha-num1').textContent);
            const num2 = parseInt(document.getElementById('captcha-num2').textContent);
            const userAnswer = parseInt(document.getElementById('captcha-answer').value);
            const correctAnswer = num1 + num2;
            
            return userAnswer === correctAnswer;
        }

        // Initialize captcha on page load
        document.addEventListener('DOMContentLoaded', function() {
            generateCaptcha();
            
            // Refresh captcha button
            document.getElementById('refresh-captcha').addEventListener('click', function() {
                generateCaptcha();
            });
            
            // Form submission validation for both booking and contact forms
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

            // Clear error message when user starts typing in captcha answer
            const captchaInput = document.getElementById('captcha-answer');
            if (captchaInput) {
                captchaInput.addEventListener('input', function() {
                    clearCaptchaError();
                });
            }
        });