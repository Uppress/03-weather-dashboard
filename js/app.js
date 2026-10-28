import { getForecast, searchCity } from "./api.js";
import { getWeatherDescription } from "./weatherCodes.js";
import {
  clearForecast,
  renderCityOptions,
  renderFavorites,
  renderForecastSkeleton,
  renderWeather,
  setError,
  setStatus,
} from "./ui.js";

const FAVORITES_KEY = "atmos-favorites";
const LAST_CITY_KEY = "atmos-last-city";
const favoriteCities = new Map(readFavorites().map((city) => [city.id, city]));
const favoriteWeather = new Map();
let currentWeather;
let activeRequest;
let requestSequence = 0;
let temperatureUnit = readTemperatureUnit();

async function loadCity(cityName, chooseFirst = false) {
  const request = beginRequest();
  beginLoading();

  let cities;
  try {
    cities = await searchCity(cityName, request.controller.signal);
  } catch (error) {
    if (isStale(request)) return;
    finishLoading();
    showError(error);
    return;
  }

  if (isStale(request)) return;
  if (cities.length === 0) {
    finishLoading();
    setError(`We couldn't find "${cityName.trim()}". Try another city name.`);
    return;
  }

  if (cities.length > 1 && !chooseFirst) {
    finishLoading();
    renderCityOptions(cities, selectCity);
    setStatus("Choose a location from the list.");
    return;
  }

  await loadForecast(cities[0], request);
}

function selectCity(city) {
  const request = beginRequest();
  beginLoading();
  loadForecast(city, request);
}

async function loadForecast(city, request) {
  let forecast;
  try {
    forecast = await getForecast(
      city.latitude,
      city.longitude,
      request.controller.signal,
    );
  } catch (error) {
    if (isStale(request)) return;
    finishLoading();
    showError(error);
    return;
  }

  if (isStale(request)) return;
  try {
    currentWeather = normalizeWeather(city, forecast);
    if (favoriteCities.has(currentWeather.id)) {
      favoriteWeather.set(currentWeather.id, currentWeather);
    }
    renderWeather(currentWeather, temperatureUnit);
    renderFavoriteList();
    persistLastCity(currentWeather);
    finishLoading();
    document.querySelector("#city-search").value = "";
  } catch (error) {
    finishLoading();
    showError(error);
  }
}

function normalizeWeather(city, forecast) {
  const current = forecast.current;
  const daily = forecast.daily;
  if (!current || !daily?.time?.length) {
    throw new Error("Open-Meteo did not return a complete forecast. Please try again.");
  }

  const currentDescription = getWeatherDescription(current.weather_code);
  return {
    id: `${city.latitude},${city.longitude}`,
    city: city.name,
    country: city.country,
    countryCode: city.countryCode ?? "",
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: forecast.timezone || city.timezone,
    temperature: current.temperature_2m,
    condition: currentDescription.label,
    icon: currentDescription.emoji,
    wind: Math.round(current.wind_speed_10m),
    humidity: current.relative_humidity_2m,
    forecast: daily.time.map((date, index) => {
      const description = getWeatherDescription(daily.weather_code[index]);
      return {
        day: getWeekday(date),
        icon: description.emoji,
        high: daily.temperature_2m_max[index],
        low: daily.temperature_2m_min[index],
      };
    }),
  };
}

function getWeekday(date) {
  const parsedDate = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(parsedDate);
}

function beginRequest() {
  activeRequest?.controller.abort();
  const request = {
    controller: new AbortController(),
    sequence: ++requestSequence,
  };
  activeRequest = request;
  return request;
}

function isStale(request) {
  return request.controller.signal.aborted || request.sequence !== requestSequence;
}

function beginLoading() {
  setError();
  renderCityOptions([], selectCity);
  setStatus("Loading forecast…", true);
  renderForecastSkeleton();
}

function finishLoading() {
  setStatus();
  if (currentWeather) {
    renderWeather(currentWeather, temperatureUnit);
  } else {
    clearForecast();
  }
}

function showError(error) {
  setError(getErrorMessage(error));
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Something went wrong while loading the forecast. Please try again.";
}

function renderFavoriteList() {
  const favorites = [...favoriteCities.values()].map(
    (city) => favoriteWeather.get(city.id) ?? city,
  );
  renderFavorites(
    favorites,
    currentWeather?.id,
    loadFavorite,
    temperatureUnit,
  );
}

async function loadFavorite(cityId) {
  const city = favoriteCities.get(cityId);
  if (!city) {
    setError("That favourite is no longer available.");
    return;
  }
  await loadCityAtCoordinates(city, city);
}

async function loadCityAtCoordinates(city, displayCity = city) {
  const request = beginRequest();
  beginLoading();
  await loadForecast(
    {
      id: city.id,
      name: displayCity.name,
      country: displayCity.country,
      countryCode: displayCity.countryCode ?? "",
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: displayCity.timezone ?? "UTC",
    },
    request,
  );
}

function readFavorites() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
  } catch (error) {
    console.warn("Could not read saved favourites.", error);
    return [];
  }

  if (!Array.isArray(stored)) return [];
  return stored
    .filter(
      (city) =>
        city &&
        typeof city.name === "string" &&
        typeof city.country === "string" &&
        Number.isFinite(city.latitude) &&
        Number.isFinite(city.longitude),
    )
    .map((city) => ({
      id: `${city.latitude},${city.longitude}`,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    }));
}

function persistFavorites() {
  const stored = [...favoriteCities.values()].map((city) => ({
    name: city.name,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
  }));
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn("Could not save favourites.", error);
    setError("Your browser could not save favourites. Check its storage settings.");
  }
}

function persistLastCity(weather) {
  const lastCity = {
    name: weather.city,
    country: weather.country,
    countryCode: weather.countryCode,
    latitude: weather.latitude,
    longitude: weather.longitude,
    timezone: weather.timezone,
  };
  try {
    localStorage.setItem(LAST_CITY_KEY, JSON.stringify(lastCity));
  } catch (error) {
    console.warn("Could not save the last viewed city.", error);
  }
}

function readLastCity() {
  try {
    const city = JSON.parse(localStorage.getItem(LAST_CITY_KEY) ?? "null");
    if (
      city &&
      typeof city.name === "string" &&
      typeof city.country === "string" &&
      Number.isFinite(city.latitude) &&
      Number.isFinite(city.longitude)
    ) {
      return city;
    }
  } catch (error) {
    console.warn("Could not read the last viewed city.", error);
  }
  return null;
}

function readTemperatureUnit() {
  try {
    return localStorage.getItem("atmos-temperature-unit") === "C" ? "C" : "F";
  } catch (error) {
    console.warn("Could not read the saved temperature unit.", error);
    return "F";
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    });
  });
}

function getLocationError(error) {
  if (error?.code === 1) {
    return "Location permission was denied. Allow location access in your browser settings, or search for a city instead.";
  }
  if (error?.code === 2) {
    return "Your location couldn't be determined. Check that location services are available, or search for a city.";
  }
  if (error?.code === 3) {
    return "Finding your location took too long. Please try again or search for a city.";
  }
  return "Your location is unavailable. Check your browser permissions and try again.";
}

async function loadMyLocation() {
  const request = beginRequest();
  beginLoading();

  if (!navigator.geolocation) {
    finishLoading();
    setError("Geolocation isn't supported by this browser. Search for a city instead.");
    return;
  }

  let position;
  try {
    position = await getCurrentPosition();
  } catch (error) {
    if (isStale(request)) return;
    finishLoading();
    setError(getLocationError(error));
    return;
  }

  if (isStale(request)) return;
  const city = {
    id: `${position.coords.latitude},${position.coords.longitude}`,
    name: "My location",
    country: "Current location",
    countryCode: "",
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timezone: "UTC",
  };
  await loadForecast(city, request);
}

async function initialize() {
  const initialSequence = requestSequence;
  renderFavoriteList();
  const lastCity = readLastCity();
  if (lastCity) {
    try {
      await loadCityAtCoordinates(lastCity, lastCity);
    } catch (error) {
      showError(error);
    }
    return;
  }

  try {
    if (navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (requestSequence !== initialSequence) return;
      if (permission.state === "granted" && navigator.geolocation) {
        try {
          await loadMyLocation();
        } catch (error) {
          showError(error);
        }
        return;
      }
    }
  } catch (error) {
    console.warn("Could not check the saved location permission.", error);
  }
  if (requestSequence === initialSequence) {
    try {
      await loadCity("New York", true);
    } catch (error) {
      showError(error);
    }
  }
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const cityName = new FormData(event.currentTarget).get("city");
  if (typeof cityName === "string" && cityName.trim()) {
    loadCity(cityName.trim());
  }
});

document.querySelector("#favorite-toggle").addEventListener("click", () => {
  if (!currentWeather) return;

  const id = currentWeather.id;
  if (favoriteCities.has(id)) {
    favoriteCities.delete(id);
    favoriteWeather.delete(id);
  } else {
    const favorite = {
      id,
      name: currentWeather.city,
      country: currentWeather.country,
      latitude: currentWeather.latitude,
      longitude: currentWeather.longitude,
      countryCode: currentWeather.countryCode,
      timezone: currentWeather.timezone,
    };
    favoriteCities.set(id, favorite);
    favoriteWeather.set(id, currentWeather);
  }
  persistFavorites();
  renderFavoriteList();
});

document.querySelector("#location-button").addEventListener("click", () => {
  loadMyLocation();
});

document.querySelector("#unit-toggle").addEventListener("click", () => {
  temperatureUnit = temperatureUnit === "F" ? "C" : "F";
  try {
    localStorage.setItem("atmos-temperature-unit", temperatureUnit);
  } catch (error) {
    console.warn("Could not save the temperature unit.", error);
  }

  if (currentWeather) {
    renderWeather(currentWeather, temperatureUnit);
    renderFavoriteList();
  } else {
    document.querySelector("#unit-toggle").textContent = `°${temperatureUnit}`;
  }
});

initialize();
