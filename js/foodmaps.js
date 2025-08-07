
var map1 = new google.maps.Map(document.getElementById('foodmap'), {
  zoom: 10,
  // disable the default User Interface
  disableDefaultUI: true,
  // add back fullscreen, streetview, zoom
  zoomControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  center: centerloca,
  //	mapTypeId: google.maps.MapTypeId.ROADMAP,
  mapId: 'f03033acde18bc0d'
});
var infowindow = new google.maps.InfoWindow();
const service = new google.maps.places.PlacesService(map1);
  const request = {
    location: centerloca,
    radius: 4000, // Search within a 4km radius
    types: ['restaurant','mess','hotel'],
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {

			for (let i = 0; i < results.length; i++)
			{
				 var place=results[i];
				 alert(place);
				  new google.maps.Marker({
					map: map1,
					position: results[i].geometry.location,
					title: results[i].name,
				});


					var request = {
					placeId: results[i].placeId,
					fields: ['rating', 'reviews', 'user_ratings_total']
					};
					var service = new google.maps.places.PlacesService(map1);

					service.getDetails(request, function(place, status)
					{
						if (status === google.maps.places.PlacesServiceStatus.OK  && place) {
						var reviews =place.reviews;
						console.log("--------"+place.rating + ' ' + place.user_ratings_total);
						// Process and display the reviews on your web page as desired
						}
					});


      		}
    }
  });





