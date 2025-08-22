 /*    const section = document.querySelector('#food-places');
   const centerAttr = section.getAttribute('data-center');
    const [lat, lng] = centerAttr.split(',').map(Number);
   const centerloca = { lat, lng };
   */

var lat=11.4967237;
var lng=76.1051083;

    const map1 = L.map('foodmap').setView([lat, lng], 10);
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map1);
    // Overpass API query to find restaurants within 1km radius
    const query = `
      [out:json];
      (

         node["amenity"="restaurant"](around:5000,lat, lng );
        way["amenity"="restaurant"](around:5000,lat, lng);
        relation["amenity"="restaurant"](around:5000,lat, lng);
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

					const latd = el.lat || el.center?.lat;
						const lond = el.lon || el.center?.lon;
						const name = el.tags.name || "Unnamed";
						const type = el.tags.amenity || "Unknown";
 						const foodPlacesContainer = document.getElementById('food-list');

						const marker =  L.marker([latd, lond])
						.addTo(map1)
						.bindPopup(el.tags.name || "Unnamed Restaurant").openPopup();

						let placeHTML = `
						<div class="mb-4 text-right">
						<h6 class="text-white">${name}</h6>
								<a href="https://www.google.com/maps?saddr=11.592, 76.117&daddr=${latd},${lond}" alt="location map" target="_blank" rel="noopener noreferrer nofollow" > <p class="text-white-50 small mb-1">
								  <i class="fas fa-map-marker-alt text-primary mr-2">

								  </i>
								  ${type}
								</p>
						</a>

						</div>
						`;

	   foodPlacesContainer.insertAdjacentHTML('beforeend', placeHTML);

 		marker.on('click', () => {
		map1.setView([lat, lng], 10);
		L.popup()
		.setLatLng([lat, lon])
		.setContent("Welcome to location")
		.openOn(map1);
		});

      });
    })
    .catch(err => console.error("Overpass API error:", err));

