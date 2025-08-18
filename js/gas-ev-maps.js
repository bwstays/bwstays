document.addEventListener('DOMContentLoaded', () => {

  const section = document.querySelector('#fuel-places');
  if (!section) return;


 const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  const centerloca = { lat, lng };

  const customIconPump = {
    url: 'https://www.bwstays.com/assets/img/logo/pin.png',
    size: new google.maps.Size(30, 30),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 30)
  };

  const customIconEv = {
    url: 'https://www.bwstays.com/assets/img/icons/ev.png',
    size: new google.maps.Size(10, 10),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 30)
  };


  const mainLocationIcon = {
    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    size: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 40)
  };

  var map1 = new google.maps.Map(document.getElementById('fuel'), {
    zoom: 11,
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    center: centerloca ,
     mapId: "fuelmapdata"
    });



  new google.maps.Marker({
    position: centerloca,
    map: map1,
    icon: mainLocationIcon,
    title: "Kalpetta Center",
    zIndex: google.maps.Marker.MAX_ZINDEX + 10
  });

  var infowindow = new google.maps.InfoWindow();
  const service = new google.maps.places.PlacesService(map1);

  const request = {
    location: centerloca,
    radius: 40000, // Search within a 40km radius
   // types: ['electric_charging_station','gas_station']
    types: "electric_charging_station",
  };
/* const cityCircle = new google.maps.Circle({
        strokeColor: "#FF0000", // Red outline
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000", // Red fill
        fillOpacity: 0.35,
        center: centerloca, // Same center as the map for this example
        radius: 40000 // 50 kilometers in meters
      });
  cityCircle.setMap(map1);
  */

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {

	/*const filteredResults = results.filter(place =>
	  place.rating >= 4.0 && place.user_ratings_total && place.user_ratings_total >= 10 // Example: min 10 reviews
	);*/

	// Sort the filtered results by rating in descending order
    //const topResults =filteredResults.sort((a, b) => b.rating - a.rating).slice(0, 5);


		 for (let i = 0; i < results.length; i++)
			{
				//alert("rating:"+results[i].rating );
 				let detailsRequest = {
				  placeId: results[i].place_id,
 		 		  fields: ['name','vicinity', 'types','geometry.location','geometry']

				};
				service.getDetails(detailsRequest, function (place, status) {
				  if (status === google.maps.places.PlacesServiceStatus.OK && place) {
					    if (place.geometry && place.geometry.location)
						{
						const latitude = place.geometry.location.lat();
						const longitude = place.geometry.location.lng();
				  }
			      }
        		});
			}
      //topResults.forEach((result) => {
      for (let i = 0; i < results.length; i++)
      {
		   //alert(results[i].types)
		  let marker = new google.maps.Marker({
			  map: map1,
			  icon:customIconEv,
			  position: results[i].geometry.location,
			  title: results[i].name
			});
			google.maps.event.addListener(marker, 'click', () => {
			  infowindow.setContent( {content: `<strong>${results[i].name || "" }</strong><br>}`, });
			  infowindow.open(map1, marker);

			});
	   };
     // });
    }
  });

 /*  new google.maps.DirectionsService().route({
        origin: new google.maps.LatLng( 11.605943, 76.083429), // origin is bw stay
        destination: new google.maps.LatLng(centerloca.lat, centerloca.lng), // destination location driving from bw stay
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
          if (status === "OK") {
			  var directionsRenderer = new google.maps.DirectionsRenderer();
					directionsRenderer.setMap(map1);
					directionsRenderer.setDirections(response);

					//	const distanceInMeters = response.routes[0].legs[0].distance.value;
					//	const distanceText = response.routes[0].legs[0].distance.text;
 					directionsRenderer.setOptions({
					  draggable: true, // Allows users to drag and modify the route path
					  suppressMarkers: true, // Hides the default A/B markers
					  polylineOptions: {
						strokeColor: '#4285F4', // Changes the route line color to red
						strokeWeight: 5, // Sets the route line thickness
						strokeOpacity: 0.6
					  }
					});
  				   // directionsRenderer.setPanel(document.getElementById('directions-panel'));
         }
    });
    */
});
