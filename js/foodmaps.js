
var iconURLPrefix = 'https://www.bwstays.com/';

var bwlocations = [[11.542841751488135, 76.02595022698385]];
//var centerloca =new google.maps.LatLng('11.542841751488135', '76.02595022698385');
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
var marker, i;


const service = new google.maps.places.PlacesService(map1);
  const request = {
    location: centerloca,
    radius: 4000, // Search within a 4km radius
    types: ['restaurant'],
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
			for (let i = 0; i < results.length; i++) {
			  new google.maps.Marker({
				map: map1,
				position: results[i].geometry.location,
				title: results[i].name,
			});
      }
    }
  });


