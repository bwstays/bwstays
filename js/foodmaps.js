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
    anchor: new google.maps.Point(20, 40)
  };

  const mainLocationIcon = {
    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    size: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 40)
  };

  var map1 = new google.maps.Map(document.getElementById('foodmap'), {
    zoom: 13,
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    center: centerloca ,
     mapId: "foodmapdata"
    });



  new google.maps.Marker({
    position: centerloca,
    map: map1,
    icon: mainLocationIcon,
    title: "Food and Dine At This Location",
    zIndex: google.maps.Marker.MAX_ZINDEX + 10
  });

  var infowindow = new google.maps.InfoWindow();
  const service = new google.maps.places.PlacesService(map1);

  const request = {
    location: centerloca,
    radius: 4000, // Search within a 4km radius
    types: ['restaurant','hotel'],
    min_rating: 3.5
  };

  const foodPlacesContainer = document.getElementById('food-list');





		 for (let i = 0; i < topResults.length; i++)
			{
				//alert("rating:"+results[i].rating );
 				let detailsRequest = {
				  placeId: results[i].place_id,
				  //fields: ['name', 'rating', 'vicinity', 'types', 'user_ratings_total']
		 		  fields: ['name', 'rating', 'vicinity', 'types', 'user_ratings_total','geometry.location','geometry']

				};
				service.getDetails(detailsRequest, function (place, status) {
				  if (status === google.maps.places.PlacesServiceStatus.OK && place) {
					    if (place.geometry && place.geometry.location)
						{
						const latitude = place.geometry.location.lat();
						const longitude = place.geometry.location.lng();
						const lat = place.lat;
								const lon = place.lon;
						const name = place.tags.name || "Unnamed";
								const type = place.tags.amenity || "Unknown";

					        let placeHTML = `
									  <div class="mb-4 text-right">
										<h6 class="text-white">${name}</h6>
																		<a href="https://www.google.com/maps?daddr=11.641044660114158,76.08687012883617&saddr=${lat},${lon}" alt="location map" target="_blank" rel="noopener noreferrer nofollow" > <p class="text-white-50 small mb-1">
																		  <i class="fas fa-map-marker-alt text-primary mr-2">

																		  </i>
																		  ${type}
																		</p>
												</a>

									  </div>
					`;

					foodPlacesContainer.insertAdjacentHTML('beforeend', placeHTML);
				  }
			      }
        		});
			}







});

