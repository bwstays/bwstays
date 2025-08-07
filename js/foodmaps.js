
var iconURLPrefix = 'https://www.bwstays.com/';

var bwlocations = [[11.542841751488135, 76.02595022698385]];

var map1 = new google.maps.Map(document.getElementById('foodmap'), {
  zoom: 10,
  // disable the default User Interface
  disableDefaultUI: true,
  // add back fullscreen, streetview, zoom
  zoomControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  center: new google.maps.LatLng('11.542841751488135', '76.02595022698385'),
  //	mapTypeId: google.maps.MapTypeId.ROADMAP,
  mapId: 'f03033acde18bc0d'
});
var infowindow = new google.maps.InfoWindow();
var marker, i;
performNearbySearch(map1,new google.maps.LatLng('11.542841751488135', '76.02595022698385'))
for (i = 0; i < bwlocations.length; i++) {
  marker = new google.maps.Marker({
    position: new google.maps.LatLng('11.542841751488135', '76.02595022698385'),
    icon: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
    map: map1
  });
  google.maps.event.addListener(marker, 'click', (function (marker, i) {
    return function () {
    //  infowindow.setContent(bwlocations[i][0]);
      infowindow.open(map, marker);
    }
  })(marker, i));
}

function performNearbySearch(map1, center) {
  const service = new google.maps.places.PlacesService(map);
  const request = {
    location: center,
    radius: 5000, // Search within a 5km radius
    types: ['restaurant'],
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      for (let i = 0; i < results.length; i++) {
        createMarker(results[i], map1);
      }
    }
  });
}

function createMarker(place, map1) {
  new google.maps.Marker({
    map: map1,
    position: place.geometry.location,
    title: place.name,
  });
}
