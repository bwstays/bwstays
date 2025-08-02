document.addEventListener("DOMContentLoaded", function () {``
(function() {
    const showPromo = true;

    if (!showPromo) return;

    const navbar = document.querySelector('nav#mainNav.navbar');
    if (!navbar) return;


    const style = document.createElement('style');
    style.innerHTML = `
      .promo-banner {
        width: 100%;
        background: #000;
        color: #fff;
        text-align: center;
        padding: 6px 0;
        font-size: 1rem;
        letter-spacing: 0.5px;
        position: relative;
        z-index: 1000;
      }
      .promo-title {
        font-weight: 600;
      }
      .promo-separator {
        margin: 0 10px;
      }
      .promo-link {
        color: #fff;
        text-decoration: underline;
        font-weight: 500;
        margin-left: 16px;
      }
    `;
    document.head.appendChild(style);


    const promoBannerHTML = `<!-- Professional Promo Banner -->
      <div class="promo-banner" id="promo-banner" style="position:fixed; top:0; left:0; width:100%; background:#000; z-index:2001; padding:8px 0; display:flex; align-items:center; justify-content:center; font-family:'Nunito', sans-serif;">
        <div class="container d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <span class="promo-title" style="color:#fff; font-weight:600; font-size:14px; margin-right:15px;">Premium Villa Experience</span>
            <span class="promo-separator" style="color:#64a19d; margin-right:15px;">|</span>
            <span class="promo-desc" style="color:#fff; font-size:13px;">Where luxury meets the mystical beauty of Wayanad's rolling hills</span>
          </div>
          <div class="d-flex align-items-center">
            <a href="#booking" class="js-scroll-trigger promo-link" style="color:#64a19d; text-decoration:none; font-weight:600; font-size:13px; margin-right:20px; transition:color 0.3s ease;">Reserve Your Escape</a>
            <button id="close-promo" style="background:none; border:none; color:#fff; font-size:16px; cursor:pointer; padding:0; width:20px; height:20px; display:flex; align-items:center; justify-content:center; transition:color 0.3s ease;" title="Close banner">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>`;


    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = promoBannerHTML;
    const promoBanner = tempDiv.firstElementChild;

    navbar.parentNode.insertBefore(promoBanner, navbar);

    const promoHeight = promoBanner.offsetHeight;
    navbar.style.top = promoHeight + 'px';


    const closeBtn = promoBanner.querySelector('#close-promo');
    closeBtn.addEventListener('click', () => {
      promoBanner.style.display = 'none';
      navbar.style.top = '0';
    });
  })();
});