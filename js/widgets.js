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
    const amountInput = document.getElementById('amount');
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const convertedAmountElement = document.getElementById('result');
    const convertButton = document.getElementById('convertBtn');

    if (!amountInput || !fromCurrencySelect || !convertedAmountElement || !convertButton) {
        return;
    }
    
    const currencyOptions = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'CHF', name: 'Swiss Franc' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'SGD', name: 'Singapore Dollar' },
        { code: 'CNY', name: 'Chinese Yuan' },
        { code: 'AED', name: 'UAE Dirham' }
    ];
    
    populateCurrencyOptions(fromCurrencySelect, currencyOptions);
    setupEventListeners(amountInput, fromCurrencySelect, convertedAmountElement, convertButton);
    convertCurrency(amountInput, fromCurrencySelect, convertedAmountElement);
}

function populateCurrencyOptions(selectElement, currencyOptions) {
    selectElement.innerHTML = '';
    
    currencyOptions.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.code} - ${currency.name}`;
        selectElement.appendChild(option);
    });
}

function setupEventListeners(amountInput, fromCurrencySelect, convertedAmountElement, convertButton) {
    amountInput.addEventListener('input', () => convertCurrency(amountInput, fromCurrencySelect, convertedAmountElement));
    fromCurrencySelect.addEventListener('change', () => convertCurrency(amountInput, fromCurrencySelect, convertedAmountElement));
    convertButton.addEventListener('click', () => convertCurrency(amountInput, fromCurrencySelect, convertedAmountElement));
}

async function convertCurrency(amountInput, fromCurrencySelect, convertedAmountElement) {
    const amount = parseFloat(amountInput.value) || 0;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = 'INR';
    
    if (amount <= 0) {
        convertedAmountElement.textContent = '--';
        return;
    }
    
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        
        if (!response.ok) {
            throw new Error(`Currency API error: ${response.status}`);
        }
        
        const data = await response.json();
        const rate = data.rates[toCurrency];
        
        if (rate) {
            const convertedAmount = (amount * rate).toFixed(2);
            convertedAmountElement.textContent = `${convertedAmount} INR`;
        } else {
            convertedAmountElement.textContent = 'Conversion rate not available';
        }
    } catch (error) {
        console.error('Error converting currency:', error);
        convertedAmountElement.textContent = 'Error fetching rates';
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