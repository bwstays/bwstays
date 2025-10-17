document.addEventListener('DOMContentLoaded', () => {

  const section = document.querySelector('#gasfuel-places');
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
 url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
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
      const { Map } =   google.maps.importLibrary("maps");

  const map1 = new google.maps.Map(document.getElementById('gasfuel'), {
    zoom: 11,
         styles: [ { elementType: "geometry", stylers: [{ color: "#242f3e" }] }],

    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    center: centerloca ,
     mapId: "gasfuelmapdata"
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
    radius: 20000, // Search within a 40km radius
     //types: ['electric_vehicle_charging_station','electric_charging_station' ],
          types: [ 'gas_station'],


  };
 const cityCircle = new google.maps.Circle({
        strokeColor: "#FF0000", // Red outline
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000", // Red fill
        fillOpacity: 0.35,
        center: centerloca, // Same center as the map for this example
        radius: 20000
      });
 // cityCircle.setMap(map1);


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
				 if (status === google.maps.places.PlacesServiceStatus.OK && place)
				  {
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
//			  infowindow.setContent( {content: `<strong>${results[i].name || "" }</strong><br>}`, });
			  infowindow.setContent(  results[i].name  );
			  infowindow.open(map1, marker);

			});
	   };
     // });
    }
  });
});
