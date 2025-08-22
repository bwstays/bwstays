document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#food-places');
  if (!section) return;

  const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  const centerloca = { lat, lng };

  const customIcon = {
    url: 'https://www.bwstays.com/assets/img/logo/pin.png'
  };

  const mainLocationIcon = {
    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
  };

// Initialize map
var container = L.DomUtil.get('map');

 if(container != null){
        container._leaflet_id = null;
      }

    const map = L.map('foodmap').setView([centerloca.lat, centerloca.lng], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Overpass API query to find restaurants within 1km radius
    const query = `
      [out:json];
      (

         node["amenity"="restaurant"](around:5000,centerloca.lat, centerloca.lng] );
        way["amenity"="restaurant"](around:5000,centerloca.lat, centerloca.lng]);
        relation["amenity"="restaurant"](around:5000,centerloca.lat, centerloca.lng]);
      );
      out center;
    `;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    })
    .then(response => response.json())
    .then(data => {
     					 data.elements.forEach(el => {


						const lat = el.lat || el.center?.lat;
						const lon = el.lon || el.center?.lon;
						const name = el.tags.name || "Unnamed";
						const type = el.tags.amenity || "Unknown";



						const foodPlacesContainer = document.getElementById('food-list');

						const marker =  L.marker([lat, lon])
						.addTo(map)
						.bindPopup(el.tags.name || "Unnamed Restaurant").openPopup();

						let placeHTML = `
						<div class="mb-4 text-right">
						<h6 class="text-white">${name}</h6>
								<a href="https://www.google.com/maps?saddr=${centerloca.lat},${centerloca.lng}&daddr=${lat},${lon}" alt="location map" target="_blank" rel="noopener noreferrer nofollow" > <p class="text-white-50 small mb-1">	 <i class="fas fa-map-marker-alt text-primary mr-2">	 </i> ${type}</p> </a></div>`;
	   foodPlacesContainer.insertAdjacentHTML('beforeend', placeHTML);


		// Add click event to marker
		marker.on('click', () => {
		map.setView([centerloca.lat, centerloca.lng], 10);
		L.popup()
		.setLatLng([lat, lon])
		.setContent("Welcome to location")
		.openOn(map);
		});



      });
    }).catch(err => console.error("Overpass API error:", err));

});

