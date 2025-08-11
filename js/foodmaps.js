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
    zoom: 10,
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
    title: "Food and Dine in Wayanad Location"
  });

  var infowindow = new google.maps.InfoWindow();
  const service = new google.maps.places.PlacesService(map1);

  const request = {
    location: centerloca,
    radius: 5000, // Search within a 4km radius
    types: ['restaurant','hotel'],
    min_rating: 3.5
  };

  const foodPlacesContainer = document.getElementById('food-list');

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {

	const filteredResults = results.filter(place =>
	  place.rating >= 4.0 && place.user_ratings_total && place.user_ratings_total >= 10 // Example: min 50 reviews
	);

// Sort the filtered results by rating in descending order
    const topResults =filteredResults.sort((a, b) => b.rating - a.rating).slice(0, 5);

      /*const topResults = results
        .filter(r => r.rating >= 4.0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5); // Limit to the top 5 results
        */
		alert(topResults.length );

		 for (let i = 0; i < topResults.length; i++)
			{
				alert(results[i].rating );
 				let detailsRequest = {
				  placeId: results[i].place_id,
				  fields: ['name', 'rating', 'vicinity', 'types', 'user_ratings_total']
				};

				service.getDetails(detailsRequest, function (place, status) {
				  if (status === google.maps.places.PlacesServiceStatus.OK && place) {
					let ratingStars = getStarHTML(place.rating);
					let cuisineType = guessCuisineFromTypes(place.types);

					let placeHTML = `
					  <div class="mb-4 text-right">
						<h6 class="text-white">${place.name}</h6>
						<p class="text-white-50 small mb-1">
						  <i class="fas fa-map-marker-alt text-primary mr-2"></i>
						  ${place.vicinity || 'Unknown location'}
						</p>
						<p class="text-white-50 small mb-1">
						  <i class="fas fa-utensils text-primary mr-2"></i>
						  ${cuisineType} <br> ${ratingStars}
						</p>
					  </div>
					`;
					foodPlacesContainer.insertAdjacentHTML('beforeend', placeHTML);
				  }
        		});

			}
      //topResults.forEach((result) => {
      for (let i = 0; i < results.length; i++)
      {
		  let marker = new google.maps.Marker({
			  map: map1,
			  position: results[i].geometry.location,
			  title: results[i].name
			});

			google.maps.event.addListener(marker, 'click', () => {
			  infowindow.setContent(results[i].name);
			  infowindow.open(map1, marker);
			});
	   };
     // });
    }
  });
});

function getStarHTML(rating) {
  if (!rating) return '';
  let fullStars = Math.floor(rating);
  let halfStar = rating % 1 >= 0.5 ? 1 : 0;
  let emptyStars = 5 - fullStars - halfStar;
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
 // return '★'.repeat(fullStars) + (halfStar ? '&2BE8' : '') + '☆'.repeat(emptyStars);
}

function guessCuisineFromTypes(types) {
  if (!types) return 'Multi-Cuisine';
  if (types.includes('cafe')) return 'Cafe';
  if (types.includes('restaurant')) return 'Restaurant';
  if (types.includes('bakery')) return 'Bakery';
  if (types.includes('bar')) return 'Bar';
  return 'Multi-Cuisine';
}
