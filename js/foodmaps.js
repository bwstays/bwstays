document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#food-places');
  if (!section) return;

  const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  const centerloca = { lat, lng };

  const customIcon = {
    url: 'https://www.bwstays.com/assets/img/logo/pin.png',
    size: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 20)
  };

  var map1 = new google.maps.Map(document.getElementById('foodmap'), {
    zoom: 11,
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    center: centerloca,
    icon: customIcon,
    mapId: 'f03033acde18bc0d'
  });

  var infowindow = new google.maps.InfoWindow();
  const foodPlacesContainer = document.getElementById('food-list');

  // Fetch the site data file
  fetch('https://www.bwstays.com/data/sitedata.js')
    .then(response => response.text())
    .then(text => {
      // Convert the JS file into usable JSON
      const siteData = eval(text); // ⚠ Uses eval because file is JS, not pure JSON
      const foodPlaces = siteData.filter(item => item.type && item.type.toLowerCase().includes('restaurant'));

      foodPlaces.forEach(place => {
        const [lat, lng] = place.latlong.split(',').map(Number);
        let marker = new google.maps.Marker({
          map: map1,
          position: { lat, lng },
          title: place.name,
          icon: customIcon
        });

        let ratingStars = getStarHTML(parseFloat(place.rating));
        let placeHTML = `
          <div class="mb-4 text-right">
            <h6 class="text-white">${place.name}</h6>
            <p class="text-white-50 small mb-1">
              <i class="fas fa-map-marker-alt text-primary mr-2"></i>
              ${place.description || 'No description'}
            </p>
            <p class="text-white-50 small mb-1">
              <i class="fas fa-star text-primary mr-2"></i>
              ${ratingStars}
            </p>
          </div>
        `;
        foodPlacesContainer.insertAdjacentHTML('beforeend', placeHTML);

        google.maps.event.addListener(marker, 'click', () => {
          infowindow.setContent(place.name);
          infowindow.open(map1, marker);
        });
      });
    })
    .catch(err => console.error('Error loading sitedata.js:', err));
});


function getStarHTML(rating) {
  if (!rating) return '';
  let fullStars = Math.floor(rating);
  let halfStar = rating % 1 >= 0.5 ? 1 : 0;
  let emptyStars = 5 - fullStars - halfStar;
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}