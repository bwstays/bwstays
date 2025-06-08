    "use strict"; // Start of use strict

    (function ($) {



const lat = 11.605943; // Example latitude
const lon = 76.083429; // Example longitude
//const locationDisplay = document.getElementById('location');
const temperatureDisplay = document.getElementById('temperature');

const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m`;

fetch(apiUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    // locationDisplay.textContent = `Latitude: ${lat}, Longitude: ${lon}`;
    // Assuming you want the current temperature, use the first element of the hourly data
    const currentTemperature = data.hourly.temperature_2m[0];
    temperatureDisplay.innerHTML = `${currentTemperature}<sup>o</sup>C`;
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
    temperatureDisplay.textContent = 'Error fetching data';
  });
  
  })(jQuery); // End of use strict
