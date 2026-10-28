export function renderWeather(weather) {
  document.querySelector("#current-city").textContent = weather.city;
  document.querySelector("#current-country").textContent = weather.country;
  document.querySelector("#current-temperature").textContent = weather.temperature;
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#current-wind").textContent = `${weather.wind} mph`;
  document.querySelector("#current-humidity").textContent = `${weather.humidity}%`;
  document.querySelector("#current-time").textContent = getLocalTime(weather.timezone);
  document.querySelector("#current-date").textContent = getLocalDate(weather.timezone);
  document.querySelector("#footer-location").textContent =
    `${weather.city.toLocaleUpperCase()} · ${weather.countryCode}`;

  const favoriteButton = document.querySelector("#favorite-toggle");
  favoriteButton.setAttribute(
    "aria-label",
    `Add ${weather.city} to favourites`,
  );
  renderForecast(weather.forecast);
}

export function renderForecast(forecast) {
  const grid = document.querySelector("#forecast-grid");
  const cards = forecast.map((day) => {
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <span class="forecast-day"></span>
      <span class="forecast-icon" aria-hidden="true"></span>
      <span class="forecast-temperatures">
        <span class="forecast-high"></span>
        <span class="forecast-low"></span>
      </span>
    `;
    card.querySelector(".forecast-day").textContent = day.day;
    card.querySelector(".forecast-icon").textContent = day.icon;
    card.querySelector(".forecast-high").textContent = `${day.high}°`;
    card.querySelector(".forecast-low").textContent = `${day.low}°`;
    return card;
  });
  grid.replaceChildren(...cards);
}

export function renderFavorites(favorites, activeCityId, onSelect) {
  const list = document.querySelector("#favorite-list");
  const buttons = favorites.map((city) => {
    const button = document.createElement("button");
    button.className = "favorite-city";
    button.type = "button";
    button.setAttribute("aria-current", String(city.id === activeCityId));
    button.setAttribute("aria-label", `${city.city}, ${city.temperature} degrees`);
    button.innerHTML = `
      <span class="favorite-city-icon" aria-hidden="true"></span>
      <span class="favorite-city-info">
        <span class="favorite-city-name"></span>
        <span class="favorite-city-condition"></span>
      </span>
      <span class="favorite-city-temperature"></span>
    `;
    button.querySelector(".favorite-city-icon").textContent = city.icon;
    button.querySelector(".favorite-city-name").textContent = city.city;
    button.querySelector(".favorite-city-condition").textContent = city.condition;
    button.querySelector(".favorite-city-temperature").innerHTML =
      `${city.temperature}<span>°</span>`;
    button.addEventListener("click", () => onSelect(city.id));
    return button;
  });

  if (buttons.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-favorites";
    emptyState.textContent = "No favourites yet. Add a city from its forecast.";
    buttons.push(emptyState);
  }

  list.replaceChildren(...buttons);
  document.querySelector("#favorite-count").textContent = String(favorites.length)
    .padStart(2, "0");

  const favoriteButton = document.querySelector("#favorite-toggle");
  const isFavorite = favorites.some((city) => city.id === activeCityId);
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  document.querySelector("#favorite-label").textContent = isFavorite
    ? "In favourites"
    : "Add to favourites";
  favoriteButton.setAttribute(
    "aria-label",
    `${isFavorite ? "Remove" : "Add"} ${document.querySelector("#current-city").textContent} ${isFavorite ? "from" : "to"} favourites`,
  );
}

export function setStatus(message = "") {
  document.querySelector("#weather-status").textContent = message;
}

export function setError(message = "") {
  const error = document.querySelector("#weather-error");
  error.textContent = message;
  error.hidden = !message;
}

function getLocalTime(timezone) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date());
}

function getLocalDate(timezone) {
  const date = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: timezone,
  }).format(date);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
  return `${weekday.toLocaleUpperCase()}, ${monthDay.toLocaleUpperCase()}`;
}
