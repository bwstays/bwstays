var iconURLPrefix = 'https://www.bwstays.com/';
var bwlocations = [['<h6><a target="_blank" href="https://www.bwstays.com" title="Black and White Stays">Black and White Stays</a></h6><a target="_blank" href="https://www.bwstays.com" title="Black and White Stays"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"  src="https://www.bwstays.com/assets/img/logo/pin-drop.png" width="300" ></a>', 11.592, 76.1172, 2, iconURLPrefix+"assets/img/logo/bw.png"]];
 // Where you want to render the map.
var element = document.getElementById('map');
// Create Leaflet map on map element.
var map = L.map(element,{ zoomControl: false });
let customIcon = {
    iconUrl:"https://www.bwstays.com/assets/img/logo/pin.webp",
    iconSize:[40,40]
}
let myIcon = L.icon(customIcon);
//let myIcon = L.divIcon();
let iconOptions = {
    title:"BW Stays",
    //draggable:true,
    icon:myIcon
}
// Add OSM tile layer to the Leaflet map.
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
for (i = 0; i < bwlocations.length; i++) {
// Target's GPS coordinates.
var target = L.latLng(bwlocations[i][1], bwlocations[i][2]);
// Set map's center to target with zoom 14.
map.setView(target, 14);
// Place a marker on the same location.
L.marker(target,iconOptions).addTo(map);
}