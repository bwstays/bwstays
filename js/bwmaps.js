
var iconURLPrefix = 'https://www.bwstays.com/';

var bwlocations = [['<h6><a target="_blank" href="https://www.bwstays.com" title="Black and White Stays">Black and White Stays</a></h6><a target="_blank" href="https://www.bwstays.com" title="Black and White Stays"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"  src="https://www.bwstays.com/assets/img/logo/pin-drop.png" width="300" ></a>', 11.542841751488135, 76.02595022698385, 2, iconURLPrefix+"assets/img/logo/bw.png"]];

//  const { Map } = await google.maps.importLibrary("maps");

//  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");




var map = new google.maps.Map(document.getElementById('map'), {
  zoom: 10,
  // disable the default User Interface
  disableDefaultUI: true,
  // add back fullscreen, streetview, zoom
  zoomControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  center: new google.maps.LatLng( 11.542841751488135, 76.02595022698385),
  //	mapTypeId: google.maps.MapTypeId.ROADMAP,
  mapId: 'f03033acde18bc0d'
});
var infowindow = new google.maps.InfoWindow();
var marker, i;

/*
https://jsfiddle.net/gh/get/library/pure/googlemaps/js-samples/tree/master/dist/samples/advanced-markers-html/jsfiddle
 // Marker with a custom PinElement.
  const pinScaled = new PinElement({
    scale: 1.5,
  });

// Basic marker with title.
  const markerViewWithText = new AdvancedMarkerElement({
    map,
    position: { lat: bwlocations[i][1], lng: bwlocations[i][2] },
    content: pinScaled.element,
  });
  */





for (i = 0; i < bwlocations.length; i++) {
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(bwlocations[i][1], bwlocations[i][2]),
    icon:  {url: bwlocations[i][4],scaledSize: new google.maps.Size(20, 20), origin: new google.maps.Point(0,0),anchor: new google.maps.Point(0, 0) },
    map: map
  });
  google.maps.event.addListener(marker, 'click', (function (marker, i) {
    return function () {
      infowindow.setContent(bwlocations[i][0]);
      infowindow.open(map, marker);
    }
  })(marker, i));
}



function initPano() {
  var panoramas = [];
  panoDivs = document.getElementsByClassName('pano');
  $(".pano").each(function(idx, el) {
   // console.log("idx=" + idx + " lat:" + parseFloat($(this).data("lat")) + " lng:" + parseFloat($(this).data("lng")) + " heading:" + parseFloat($(this).data("heading")));
    var panorama = new google.maps.StreetViewPanorama(
      el, {
        position: {
          lat: parseFloat($(this).data("lat")),
          lng: parseFloat($(this).data("lng"))
        },
        pov: {
          heading: parseFloat($(this).data("heading")),
          pitch: 0
        },
        visible: true
      });
    panoramas.push(panorama);
  });

}
google.maps.event.addDomListener(window, "load", initPano);