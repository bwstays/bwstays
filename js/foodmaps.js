
var map1 = new google.maps.Map(document.getElementById('foodmap'), {
  zoom: 15,
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
    radius: 3000, // Search within a 3km radius
    types: ['restaurant','mess','hotel'],
  };
    service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {

			for (let i = 0; i < results.length; i++)
			{
 				  new google.maps.Marker({
					map: map1,
					position: results[i].geometry.location,
					title: results[i].name,
					});
 					var request = {
					placeId: results[i].place_id,
					fields: ['rating', 'reviews', 'user_ratings_total']
					};
  					//var service = new google.maps.places.PlacesService(map1);
					service.getDetails(request, function(place, status)
					{

						if (status === google.maps.places.PlacesServiceStatus.OK  && place) {
							var reviews =place.reviews;
 							//console.log("--------"+place.rating + ' ' + place.user_ratings_total);
							if(place.rating>4.0)
							{

							// Process and display the reviews on your web page as desired

							}
						}
					});
      		}
    }
  });