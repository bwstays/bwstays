

var bwlocations = [

    ['<h6><a target="_blank" href="https://www.dtpcwayanad.com/destination/pookode-lake-wayanad" title="Pookode Lake">Pookode Lake</a></h6><a target="_blank" href="https://www.dtpcwayanad.com/destination/pookode-lake-wayanad" title="Pookode Lake"><img alt="Black and White Stays Wayanad" alt="Black and White Stays Wayanad"  src="https://www.dtpcwayanad.com/uploads/picture_gallery/gallery_images/pookode-lake-wayanad-3-20230429174142824511.webp" width="300" ></a>', 11.542470, 76.027224, 2, "assets/img/logo/bw.png"],


];

//var iconURLPrefix = 'https://www.dtpcwayanad.com/images/';
var map = new google.maps.Map(document.getElementById('map'), {
  zoom: 10,
  // disable the default User Interface
  disableDefaultUI: true,
  // add back fullscreen, streetview, zoom
  zoomControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  center: new google.maps.LatLng( 11.542470, 76.027224),
  //	mapTypeId: google.maps.MapTypeId.ROADMAP,
  mapId: 'f03033acde18bc0d'
});
var infowindow = new google.maps.InfoWindow();
var marker, i;
for (i = 0; i < bwlocations.length; i++) {
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(bwlocations[i][1], bwlocations[i][2]),
    icon: bwlocations[i][4],
    map: map
  });
  google.maps.event.addListener(marker, 'click', (function (marker, i) {
    return function () {
      infowindow.setContent(bwlocations[i][0]);
      infowindow.open(map, marker);
    }
  })(marker, i));
}