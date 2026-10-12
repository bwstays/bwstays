// Weather and currency widgets shown in the page header.
//
// Weather: Open-Meteo (free, no key). High/low come from the API's daily
// forecast; when the API cannot be reached the widget shows "--" rather than
// invented numbers.
// Currency: the dated snapshot in data/exchange-rates.json (ECB rates, refreshed
// by scripts/update-rates.mjs) is shown first, then replaced by the live
// Frankfurter rate when that call succeeds.
var BW_SITE = 'https://www.bwstays.com/';
var BW_DEFAULT_PLACE = { name: 'Kalpetta', lat: 11.6182, lon: 76.1722 };

function initWeatherWidget() {
    updateDate();
    fetchWeatherData();
    setInterval(fetchWeatherData, 30 * 60 * 1000);
}

function updateDate() {
    var now = new Date();
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var monthElement = document.querySelector('.month');
    var dayElement = document.querySelector('.day');
    if (monthElement && dayElement) {
        monthElement.textContent = months[now.getMonth()];
        dayElement.textContent = now.getDate();
    }
}

function bwWeatherPlace() {
    try {
        var pageId = typeof getCurrentPageId === 'function' ? Number(getCurrentPageId()) : NaN;
        if (Number.isFinite(pageId) && typeof siteData !== 'undefined') {
            for (var category in siteData) {
                var item = siteData[category].find(function (loc) { return Number(loc.id) === pageId; });
                if (item && item.latlong) {
                    var parts = item.latlong.split(',').map(function (c) { return parseFloat(c.trim()); });
                    if (Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
                        return { name: String(item.name).trim(), lat: parts[0], lon: parts[1] };
                    }
                }
            }
        }
    } catch (e) { /* fall through to the default */ }
    return BW_DEFAULT_PLACE;
}

async function fetchWeatherData() {
    var place = bwWeatherPlace();
    try {
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.lat + '&longitude=' + place.lon +
            '&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';
        var response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather API error: ' + response.status);
        }
        updateWeatherDisplay(await response.json(), place.name);
    } catch (error) {
        updateWeatherDisplay(null, place.name);
    }
}

function updateWeatherDisplay(weatherData, cityName) {
    var temperatureElement = document.querySelector('.weather-temp');
    var conditionElement = document.querySelector('.weather-condition');
    var locationElement = document.querySelector('.weather-location');
    var highLowElement = document.querySelector('.weather-high-low');

    if (locationElement) {
        locationElement.textContent = cityName || 'Wayanad';
        locationElement.title = cityName || 'Wayanad';
    }
    if (weatherData && weatherData.current_weather) {
        var current = weatherData.current_weather;
        if (temperatureElement) {
            temperatureElement.innerHTML = Math.round(current.temperature) + '<span class="temp-unit">°</span>';
        }
        if (conditionElement) {
            var description = getWeatherDescription(current.weathercode);
            conditionElement.textContent = description;
            conditionElement.title = description;
        }
        if (highLowElement) {
            var daily = weatherData.daily || {};
            var high = daily.temperature_2m_max && daily.temperature_2m_max[0];
            var low = daily.temperature_2m_min && daily.temperature_2m_min[0];
            highLowElement.textContent = (high != null && low != null)
                ? 'H:' + Math.round(high) + '° L:' + Math.round(low) + '°'
                : 'H:--° L:--°';
        }
    } else {
        if (temperatureElement) {
            temperatureElement.innerHTML = '--<span class="temp-unit">°</span>';
        }
        if (conditionElement) {
            conditionElement.textContent = 'Weather unavailable';
        }
        if (highLowElement) {
            highLowElement.textContent = 'H:--° L:--°';
        }
    }
}

function getWeatherDescription(weatherCode) {
    var weatherDescriptions = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall', 77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };
    return weatherDescriptions[weatherCode] || 'Unknown';
}

var BW_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'CNY', 'AED'];
var BW_CURRENCY_SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF', CAD: 'C$',
    AUD: 'A$', SGD: 'S$', CNY: '¥', AED: 'د.إ'
};
var bwRateSnapshot = null;

function initCurrencyConverter() {
    var fromCurrencySelect = document.getElementById('fromCurrency');
    var convertedAmountElement = document.getElementById('result');
    var fromCurrencyCodeElement = document.getElementById('fromCurrencyCode');
    if (!fromCurrencySelect || !convertedAmountElement) {
        return;
    }

    function updateCurrencyIcon(currency) {
        var currencyIcon = document.querySelector('.currency-icon text');
        if (currencyIcon) {
            currencyIcon.textContent = BW_CURRENCY_SYMBOLS[currency] || '$';
        }
    }
    function refresh() {
        if (fromCurrencyCodeElement) {
            fromCurrencyCodeElement.textContent = fromCurrencySelect.value;
        }
        updateCurrencyIcon(fromCurrencySelect.value);
        convertCurrency(fromCurrencySelect, convertedAmountElement);
    }

    var chosen = fromCurrencySelect.value || 'USD';
    fromCurrencySelect.innerHTML = '';
    BW_CURRENCIES.forEach(function (code) {
        var option = document.createElement('option');
        option.value = code;
        option.textContent = code;
        fromCurrencySelect.appendChild(option);
    });
    fromCurrencySelect.value = BW_CURRENCIES.indexOf(chosen) > -1 ? chosen : 'USD';
    fromCurrencySelect.addEventListener('change', refresh);
    refresh();
}

async function bwLoadRateSnapshot() {
    if (bwRateSnapshot) {
        return bwRateSnapshot;
    }
    try {
        var response = await fetch(BW_SITE + 'data/exchange-rates.json');
        if (response.ok) {
            bwRateSnapshot = await response.json();
        }
    } catch (e) { /* the live call below may still work */ }
    return bwRateSnapshot;
}

function bwSetRate(element, value, note) {
    element.textContent = value == null ? '--' : Number(value).toFixed(2);
    element.title = note || '';
}

async function convertCurrency(fromCurrencySelect, convertedAmountElement) {
    var from = fromCurrencySelect.value;
    var snapshot = await bwLoadRateSnapshot();
    if (snapshot && snapshot.rates && snapshot.rates[from]) {
        bwSetRate(convertedAmountElement, snapshot.rates[from], 'ECB rate as of ' + snapshot.date);
    } else {
        bwSetRate(convertedAmountElement, null, 'Rate unavailable');
    }
    // AED is not an ECB currency: it is pegged to USD at 3.6725
    var base = from === 'AED' ? 'USD' : from;
    try {
        var response = await fetch('https://api.frankfurter.dev/v1/latest?base=' + base + '&symbols=INR');
        if (!response.ok) {
            return;
        }
        var data = await response.json();
        var live = data.rates && data.rates.INR;
        if (live) {
            // ignore the answer if the user switched currency while the request was in flight
            if (fromCurrencySelect.value === from) {
                bwSetRate(convertedAmountElement, from === 'AED' ? live / 3.6725 : live, 'ECB rate as of ' + data.date);
            }
        }
    } catch (error) {
        /* keep the dated snapshot */
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
