/**
 * Combined Widgets Script
 * Includes both Weather Widget and Currency Converter Widget
 */

// ==================== WEATHER WIDGET ====================

// Configuration
const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with actual OpenWeatherMap API key
const CITY_NAME = 'Kalpetta';
const COUNTRY_CODE = 'IN';

// DOM Elements for Weather
const monthElement = document.querySelector('.month');
const dayElement = document.querySelector('.day');
const temperatureElement = document.querySelector('.temperature');
const conditionElement = document.querySelector('.condition');
const locationElement = document.querySelector('.location-wth');

// Initialize the weather widget
function initWeatherWidget() {
    updateDate();
    fetchWeatherData();
    
    // Update weather every 30 minutes
    setInterval(fetchWeatherData, 30 * 60 * 1000);
}

// Update the date display
function updateDate() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthElement.textContent = months[now.getMonth()];
    dayElement.textContent = now.getDate();
}

// Fetch weather data from OpenWeatherMap API
async function fetchWeatherData() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY_NAME},${COUNTRY_CODE}&appid=${WEATHER_API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        // Fallback to default values if API fails
        updateWeatherDisplay(null);
    }
}

// Update the weather display with fetched data
function updateWeatherDisplay(weatherData) {
    if (weatherData) {
        // Update temperature
        temperatureElement.innerHTML = `${Math.round(weatherData.main.temp)}<span class="temp-unit">°</span>`;
        
        // Update condition
        const condition = weatherData.weather[0].main;
        conditionElement.textContent = condition;
        
        // Update location
        locationElement.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
    } else {
        // Fallback values
        temperatureElement.innerHTML = `25<span class="temp-unit">°</span>`;
        conditionElement.textContent = 'Partly Cloudy';
        locationElement.textContent = 'Kalpetta, Wayanad';
    }
}

// ==================== CURRENCY CONVERTER WIDGET ====================

// DOM Elements for Currency Converter
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const convertedAmountElement = document.getElementById('result');
const convertButton = document.getElementById('convertBtn');

// Currency options (top dropdown)
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

// Initialize the currency converter
function initCurrencyConverter() {
    populateCurrencyOptions();
    setupEventListeners();
    convertCurrency(); // Initial conversion
}

// Populate the currency dropdown with options
function populateCurrencyOptions() {
    // Clear existing options
    fromCurrencySelect.innerHTML = '';
    
    // Add currency options
    currencyOptions.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.code} - ${currency.name}`;
        fromCurrencySelect.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    amountInput.addEventListener('input', convertCurrency);
    fromCurrencySelect.addEventListener('change', convertCurrency);
    convertButton.addEventListener('click', convertCurrency);
}

// Convert currency using ExchangeRate-API
async function convertCurrency() {
    const amount = parseFloat(amountInput.value) || 0;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = 'INR'; // Fixed to INR
    
    if (amount <= 0) {
        convertedAmountElement.textContent = '--';
        return;
    }
    
    try {
        // Using exchangerate-api.com (free tier allows 1500 requests/month)
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

// ==================== INITIALIZATION ====================

// Initialize both widgets when DOM is loaded
function initWidgets() {
    initWeatherWidget();
    initCurrencyConverter();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
} else {
    initWidgets();
}