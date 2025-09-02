document.addEventListener('DOMContentLoaded', function() {
    
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 0
        );
    }

    
    function revealElements() {
        const reveals = document.querySelectorAll('.reveal');
        
        reveals.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('active');
            }
        });
    }

    
    revealElements();

    
    window.addEventListener('scroll', revealElements);
});