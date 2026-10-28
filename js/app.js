import { getForecast, searchCity } from "./api.js";
import { getWeatherDescription } from "./weatherCodes.js";
import {
  renderCityOptions,
  renderFavorites,
  renderWeather,
  setError,
  setStatus,
} from "./ui.js";

const favoriteCities = new Map();
let currentWeather;
let activeRequest;
let temperatureUnit = readTemperatureUnit();

async function loadCity(cityName, chooseFirst = false) {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;

  setError();
  setStatus("Loading…");
  renderCityOptions([], selectCity);

  let cities;
  try {
    cities = await searchCity(cityName, request.signal);
  } catch (error) {
    if (request.signal.aborted) return;
    setStatus();
    setError(getErrorMessage(error));
    return;
  }

  if (request.signal.aborted) return;
  if (cities.length === 0) {
    setStatus();
    setError(`We couldn't find "${cityName.trim()}". Try another city name.`);
    return;
  }

  if (cities.length > 1 && !chooseFirst) {
    renderCityOptions(cities, selectCity);
    setStatus("Choose a location from the list.");
    return;
  }

  try {
    await loadForecast(cities[0], request);
  } catch (error) {
    if (request.signal.aborted) return;
    setStatus();
    setError(getErrorMessage(error));
  }
}

function selectCity(city) {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  renderCityOptions([], selectCity);
  setError();
  setStatus("Loading…");
  loadForecast(city, request);
}

async function loadForecast(city, request) {
  let forecast;
  try {
    forecast = await getForecast(city.latitude, city.longitude, request.signal);
  } catch (error) {
    if (request.signal.aborted) return;
    setStatus();
    setError(getErrorMessage(error));
    return;
  }

  if (request.signal.aborted) return;
  try {
    currentWeather = normalizeWeather(city, forecast);
    renderWeather(currentWeather, temperatureUnit);
    renderFavoriteList();
    setStatus();
    document.querySelector("#city-search").value = "";
  } catch (error) {
    setStatus();
    setError(getErrorMessage(error));
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
    id: city.id,
    city: city.name,
    country: city.country,
    countryCode: city.countryCode,
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

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Something went wrong while loading the forecast. Please try again.";
}

function renderFavoriteList() {
  renderFavorites(
    [...favoriteCities.values()],
    currentWeather?.id,
    loadFavorite,
    temperatureUnit,
  );
}

function loadFavorite(cityId) {
  const weather = favoriteCities.get(cityId);
  if (!weather) {
    setError("That favourite is no longer available.");
    return;
  }

  activeRequest?.abort();
  currentWeather = weather;
  setError();
  setStatus();
  renderWeather(currentWeather, temperatureUnit);
  renderFavoriteList();
}

function readTemperatureUnit() {
  try {
    return localStorage.getItem("atmos-temperature-unit") === "C" ? "C" : "F";
  } catch (error) {
    console.warn("Could not read the saved temperature unit.", error);
    return "F";
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

  if (favoriteCities.has(currentWeather.id)) {
    favoriteCities.delete(currentWeather.id);
  } else {
    favoriteCities.set(currentWeather.id, currentWeather);
  }
  renderFavoriteList();
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

loadCity("New York", true);
