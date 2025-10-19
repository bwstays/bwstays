function initWeatherWidget() {
    updateDate();
    fetchWeatherData();
    
    setInterval(fetchWeatherData, 30 * 60 * 1000);
}

function updateDate() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthElement = document.querySelector('.month');
    const dayElement = document.querySelector('.day');
    
    if (monthElement && dayElement) {
        monthElement.textContent = months[now.getMonth()];
        dayElement.textContent = now.getDate();
    }
}

async function fetchWeatherData() {
    try {
        const pageId = getCurrentPageId ? getCurrentPageId() : null;
        
        if (pageId && typeof siteData !== 'undefined') {
            let locationData = null;
            
            for (const category in siteData) {
                const item = siteData[category].find(loc => loc.id === pageId);
                if (item) {
                    locationData = item;
                    break;
                }
            }
            
            if (locationData && locationData.latlong) {
                const [lat, lon] = locationData.latlong.split(',').map(coord => parseFloat(coord.trim()));
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                
                if (!response.ok) {
                    throw new Error(`Weather API error: ${response.status}`);
                }
                
                const data = await response.json();
                updateWeatherDisplay(data, locationData.name);
                return;
            }
        }
        
        const lat = 11.6182;
        const lon = 76.1722;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        updateWeatherDisplay(data, 'Kalpetta');
    } catch (error) {
        console.error('Error fetching weather data:', error);
        updateWeatherDisplay(null, 'Kalpetta');
    }
}

function updateWeatherDisplay(weatherData, cityName) {
    const temperatureElement = document.querySelector('.temperature');
    const conditionElement = document.querySelector('.condition');
    const locationElement = document.querySelector('.location-wth');
    
    if (weatherData && weatherData.current_weather) {
        const temp = weatherData.current_weather.temperature;
        if (temperatureElement) {
            temperatureElement.innerHTML = `${Math.round(temp)}<span class="temp-unit">°</span>`;
        }
        
        const weatherCode = weatherData.current_weather.weathercode;
        const condition = getWeatherDescription(weatherCode);
        if (conditionElement) {
            conditionElement.textContent = condition;
        }
        
        if (locationElement) {
            locationElement.textContent = `${cityName}, Wayanad`;
        }
    } else {
        if (temperatureElement) {
            temperatureElement.innerHTML = `25<span class="temp-unit">°</span>`;
        }
        if (conditionElement) {
            conditionElement.textContent = 'Partly Cloudy';
        }
        if (locationElement) {
            locationElement.textContent = `${cityName || 'Kalpetta'}, Wayanad`;
        }
    }
}

function getWeatherDescription(weatherCode) {
    const weatherDescriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    
    return weatherDescriptions[weatherCode] || 'Unknown';
}

function initCurrencyConverter() {
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const convertedAmountElement = document.getElementById('result');
    const fromCurrencyCodeElement = document.getElementById('fromCurrencyCode');

    if (!fromCurrencySelect || !convertedAmountElement) {
        return;
    }
    
    // Update the currency code display when selection changes
    function updateCurrencyCodeDisplay() {
        if (fromCurrencyCodeElement) {
            fromCurrencyCodeElement.textContent = fromCurrencySelect.value;
        }
        // Update the currency icon
        updateCurrencyIcon(fromCurrencySelect.value);
        // Also update the conversion immediately when currency changes
        convertCurrency(fromCurrencySelect, convertedAmountElement);
    }
    
    // Function to update currency icon based on selection
    function updateCurrencyIcon(currency) {
        const currencyIcon = document.querySelector('.currency-icon text');
        if (currencyIcon) {
            const currencySymbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'CHF': 'CHF',
                'CAD': 'C$',
                'AUD': 'A$',
                'SGD': 'S$',
                'CNY': '¥',
                'AED': 'د.إ'
            };
            currencyIcon.textContent = currencySymbols[currency] || '$';
        }
    }
    
    // Add event listener for currency selection changes
    fromCurrencySelect.addEventListener('change', updateCurrencyCodeDisplay);
    
    // Also need to populate the select options directly since we're not using populateCurrencyOptions anymore
    const currencyOptions = [
        { code: 'USD', name: 'USD - US Dollar' },
        { code: 'EUR', name: 'EUR - Euro' },
        { code: 'GBP', name: 'GBP - British Pound' },
        { code: 'JPY', name: 'JPY - Japanese Yen' },
        { code: 'CHF', name: 'CHF - Swiss Franc' },
        { code: 'CAD', name: 'CAD - Canadian Dollar' },
        { code: 'AUD', name: 'AUD - Australian Dollar' },
        { code: 'SGD', name: 'SGD - Singapore Dollar' },
        { code: 'CNY', name: 'CNY - Chinese Yuan' },
        { code: 'AED', name: 'AED - UAE Dirham' }
    ];
    
    // Clear and repopulate the select
    fromCurrencySelect.innerHTML = '';
    currencyOptions.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = currency.name;
        fromCurrencySelect.appendChild(option);
    });
    
    updateCurrencyCodeDisplay(); // Initialize the display
}

function populateCurrencyOptions(selectElement, currencyOptions) {
    selectElement.innerHTML = '';
    
    currencyOptions.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = currency.name;
        selectElement.appendChild(option);
    });
}


async function convertCurrency(fromCurrencySelect, convertedAmountElement) {
    const fromCurrency = fromCurrencySelect.value;
    
    // Use static rates as primary method to avoid CSP issues
    // Updated with approximate rates as of 2025
    const staticRates = {
        'USD': 83.0,   // US Dollar to INR
        'EUR': 89.0,   // Euro to INR
        'GBP': 105.0,  // British Pound to INR
        'JPY': 0.55,   // Japanese Yen to INR
        'CHF': 92.0,   // Swiss Franc to INR
        'CAD': 61.0,   // Canadian Dollar to INR
        'AUD': 55.0,   // Australian Dollar to INR
        'SGD': 62.0,   // Singapore Dollar to INR
        'CNY': 11.5,   // Chinese Yuan to INR
        'AED': 22.5    // UAE Dirham to INR
    };
    
    const rate = staticRates[fromCurrency];
    if (rate) {
        // Show the 1:1 conversion rate
        convertedAmountElement.textContent = rate.toFixed(2);
        return;
    } else {
        convertedAmountElement.textContent = '--';
    }
}

function initWidgets() {
    initWeatherWidget();
    initCurrencyConverter();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
} else {
    initWidgets();
}