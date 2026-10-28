# Atmos Weather Dashboard

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules. It shows current conditions and a seven-day forecast, with city search, favourites, location lookup, and a Celsius/Fahrenheit toggle.

## Features

- Search for a city and choose among matching locations.
- View the current temperature, weather condition, wind, humidity, local time, and seven-day forecast.
- Add and remove favourite cities. Favourite locations and the last viewed city are saved in `localStorage`.
- Load the local forecast with the browser's location permission.
- Switch between Celsius and Fahrenheit; the preference is remembered.
- Cancel an older in-flight request when a new city is selected.
- View loading skeletons and clear search, network, and geolocation messages.
- Responsive layout with reduced-motion support.

## API

Weather data comes from [Open-Meteo](https://open-meteo.com/), which does not require an API key:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

The forecast request uses the automatic local timezone and includes current temperature, humidity, weather code, wind speed, and daily weather codes and high/low temperatures.

## Run locally

Open `index.html` in a browser or serve the project directory with a local web server. A secure context (such as `localhost` or HTTPS) is required for browser geolocation. Internet access is required for live weather data.

## Screenshots

_Add screenshots of the desktop dashboard, mobile layout, and city selection here._

<!-- Example: ![Desktop dashboard](screenshots/dashboard.png) -->

## What I learned

- How to combine Open-Meteo geocoding and forecast requests with `async`/`await`.
- How to format dates and times with `Intl.DateTimeFormat` and convert temperatures in the browser.
- How to use `AbortController` to avoid stale search results.
- Why API-provided values should be inserted as text rather than parsed as HTML.
- How to work with geolocation permissions and persist user preferences in `localStorage`.
