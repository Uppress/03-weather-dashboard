import { getForecast, searchCity } from "./api.js";
import { getWeatherDescription } from "./weatherCodes.js";
import {
  renderFavorites,
  renderWeather,
  setError,
  setStatus,
} from "./ui.js";

const favoriteCities = new Map();
let currentWeather;

async function loadCity(cityName) {
  setError();
  setStatus("Loading…");

  let cities;
  try {
    cities = await searchCity(cityName);
  } catch (error) {
    setStatus();
    setError(getErrorMessage(error));
    return;
  }

  if (cities.length === 0) {
    setStatus();
    setError(`We couldn't find "${cityName.trim()}". Try another city name.`);
    return;
  }

  const city = cities[0];
  let forecast;
  try {
    forecast = await getForecast(city.latitude, city.longitude);
  } catch (error) {
    setStatus();
    setError(getErrorMessage(error));
    return;
  }

  try {
    currentWeather = normalizeWeather(city, forecast);
    renderWeather(currentWeather);
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
    temperature: Math.round(current.temperature_2m),
    condition: currentDescription.label,
    icon: currentDescription.emoji,
    wind: Math.round(current.wind_speed_10m),
    humidity: current.relative_humidity_2m,
    forecast: daily.time.map((date, index) => {
      const description = getWeatherDescription(daily.weather_code[index]);
      return {
        day: index === 0 ? "Today" : getWeekday(date),
        icon: description.emoji,
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
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
  );
}

function loadFavorite(cityId) {
  const weather = favoriteCities.get(cityId);
  if (!weather) {
    setError("That favourite is no longer available.");
    return;
  }

  currentWeather = weather;
  setError();
  setStatus();
  renderWeather(currentWeather);
  renderFavoriteList();
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

loadCity("New York");
