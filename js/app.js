import {
  getFavoriteWeather,
  getInitialFavorites,
  getWeatherForCity,
} from "./api.js";
import {
  renderFavorites,
  renderWeather,
  setError,
  setStatus,
} from "./ui.js";

const favoriteIds = new Set(getInitialFavorites());
let currentWeather;

async function loadCity(cityName) {
  setError();
  setStatus("Finding your forecast...");

  try {
    currentWeather = await getWeatherForCity(cityName);
    renderWeather(currentWeather);
    renderFavoriteList();
    setStatus("");
    document.querySelector("#city-search").value = "";
  } catch (error) {
    setStatus("");
    setError(error instanceof Error ? error.message : "Unable to load this forecast.");
  }
}

function renderFavoriteList() {
  const favorites = [...favoriteIds]
    .map((id) => getFavoriteWeather(id))
    .filter((weather) => weather !== null);
  renderFavorites(favorites, currentWeather?.id, loadFavorite);
}

async function loadFavorite(cityId) {
  const weather = getFavoriteWeather(cityId);
  if (!weather) {
    setError("That favourite is no longer available.");
    return;
  }

  currentWeather = weather;
  setError();
  setStatus("");
  renderWeather(currentWeather);
  renderFavoriteList();
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const cityName = new FormData(event.currentTarget).get("city");
  if (typeof cityName === "string" && cityName.trim()) {
    loadCity(cityName);
  }
});

document.querySelector("#favorite-toggle").addEventListener("click", () => {
  if (!currentWeather) return;

  if (favoriteIds.has(currentWeather.id)) {
    favoriteIds.delete(currentWeather.id);
  } else {
    favoriteIds.add(currentWeather.id);
  }
  renderFavoriteList();
});

loadCity("New York");
