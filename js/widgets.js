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
    const temperatureElement = document.querySelector('.weather-temp');
    const conditionElement = document.querySelector('.weather-condition');
    const locationElement = document.querySelector('.weather-location');
    const highLowElement = document.querySelector('.weather-high-low');
    
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
            locationElement.textContent = cityName || 'New Delhi';
        }
        
        if (highLowElement) {
            const high = Math.round(temp + 2);
            const low = Math.round(temp - 9);
            highLowElement.textContent = `H:${high}° L:${low}°`;
        }
    } else {
        if (temperatureElement) {
            temperatureElement.innerHTML = `29<span class="temp-unit">°</span>`;
        }
        if (conditionElement) {
            conditionElement.textContent = 'Sunny';
        }
        if (locationElement) {
            locationElement.textContent = cityName || 'New Delhi';
        }
        if (highLowElement) {
            highLowElement.textContent = 'H:31° L:20°';
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
    
    function updateCurrencyCodeDisplay() {
        if (fromCurrencyCodeElement) {
            fromCurrencyCodeElement.textContent = fromCurrencySelect.value;
        }
        updateCurrencyIcon(fromCurrencySelect.value);
        convertCurrency(fromCurrencySelect, convertedAmountElement);
    }
    

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
    

    fromCurrencySelect.addEventListener('change', updateCurrencyCodeDisplay);
    
    
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
    
    fromCurrencySelect.innerHTML = '';
    currencyOptions.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = currency.name;
        fromCurrencySelect.appendChild(option);
    });
    
    updateCurrencyCodeDisplay(); 
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
    const toCurrency = 'INR'; 
    const amount = 1; 

    try {
        const response = await fetch(`https://api.frankfurter.dev/v1/latest?amount=${amount}&base=${fromCurrency}&symbols=${toCurrency}`);
        
        if (!response.ok) {
            throw new Error(`Currency API error: ${response.status}`);
        }
        
        const data = await response.json();
        const rate = data.rates[toCurrency];
        
        if (rate) {
            convertedAmountElement.textContent = rate.toFixed(2);
        } else {
            convertedAmountElement.textContent = '--';
        }
    } catch (error) {
       const staticRates = {
            'USD': 88.0,
            'EUR': 105.0,
            'GBP': 118.0,
            'JPY': 0.585,
            'CHF': 111.0,
            'CAD': 63.3,
            'AUD': 57.0,
            'SGD': 68.6,
            'CNY': 12.34,
            'AED': 23.9
        };

        
        const rate = staticRates[fromCurrency];
        if (rate) {
            convertedAmountElement.textContent = rate.toFixed(2);
        } else {
            convertedAmountElement.textContent = '--';
        }
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