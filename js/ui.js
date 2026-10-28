function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function convertTemperature(fahrenheit, unit) {
  return unit === "C"
    ? Math.round(((fahrenheit - 32) * 5) / 9)
    : Math.round(fahrenheit);
}

function formatTemperature(fahrenheit, unit) {
  return `${convertTemperature(fahrenheit, unit)}°`;
}

export function renderWeather(weather, unit) {
  document.querySelector("#current-city").textContent = weather.city;
  document.querySelector("#current-country").textContent = weather.country;
  document.querySelector("#current-temperature").textContent = String(
    convertTemperature(weather.temperature, unit),
  );
  document.querySelector(".temperature-line .unit").textContent = unit;
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#current-wind").textContent = `${weather.wind} mph`;
  document.querySelector("#current-humidity").textContent = `${weather.humidity}%`;
  document.querySelector("#current-time").textContent = getLocalTime(weather.timezone);
  document.querySelector("#current-date").textContent = getLocalDate(weather.timezone);
  document.querySelector("#footer-location").textContent = [
    weather.city.toLocaleUpperCase(),
    weather.countryCode,
  ]
    .filter(Boolean)
    .join(" · ");
  document.querySelector("#unit-toggle").textContent = `°${unit}`;
  document.querySelector("#unit-toggle").setAttribute(
    "aria-label",
    `Switch to ${unit === "F" ? "Celsius" : "Fahrenheit"}`,
  );

  renderForecast(weather.forecast, unit);
}

export function renderForecast(forecast, unit) {
  const grid = document.querySelector("#forecast-grid");
  const cards = forecast.map((day) => {
    const card = createElement("article", "forecast-card");
    card.append(
      createElement("span", "forecast-day", day.day),
      createElement("span", "forecast-icon", day.icon),
    );
    card.lastElementChild.setAttribute("aria-hidden", "true");

    const temperatures = createElement("span", "forecast-temperatures");
    temperatures.append(
      createElement("span", "forecast-high", formatTemperature(day.high, unit)),
      createElement("span", "forecast-low", formatTemperature(day.low, unit)),
    );
    card.append(temperatures);
    return card;
  });
  grid.replaceChildren(...cards);
}

export function renderForecastSkeleton() {
  const grid = document.querySelector("#forecast-grid");
  const cards = Array.from({ length: 7 }, () => {
    const card = createElement("article", "forecast-card forecast-card-skeleton");
    card.setAttribute("aria-hidden", "true");
    card.append(
      createElement("span", "skeleton-block skeleton-day"),
      createElement("span", "skeleton-block skeleton-icon"),
      createElement("span", "skeleton-block skeleton-temperatures"),
    );
    return card;
  });
  grid.replaceChildren(...cards);
}

export function clearForecast() {
  const grid = document.querySelector("#forecast-grid");
  grid.replaceChildren(
    createElement("p", "forecast-empty", "A forecast will appear here when a city is selected."),
  );
}

export function renderCityOptions(cities, onSelect) {
  const options = document.querySelector("#city-options");
  const searchInput = document.querySelector("#city-search");
  const buttons = cities.map((city) => {
    const button = createElement("button", "city-option");
    button.type = "button";
    button.setAttribute("role", "option");
    const place = [city.name, city.region, city.country].filter(Boolean).join(", ");
    button.textContent = place;
    button.addEventListener("click", () => onSelect(city));
    return button;
  });
  options.replaceChildren(...buttons);
  options.hidden = buttons.length === 0;
  searchInput.setAttribute("aria-expanded", String(buttons.length > 0));
}

export function renderFavorites(favorites, activeCityId, onSelect, unit) {
  const list = document.querySelector("#favorite-list");
  const buttons = favorites.map((city) => {
    const name = city.city ?? city.name;
    const button = createElement("button", "favorite-city");
    button.type = "button";
    button.setAttribute("aria-current", String(city.id === activeCityId));
    button.setAttribute(
      "aria-label",
      `${name}, ${Number.isFinite(city.temperature) ? formatTemperature(city.temperature, unit) : "load forecast"}`,
    );

    const icon = createElement("span", "favorite-city-icon", city.icon ?? "📍");
    icon.setAttribute("aria-hidden", "true");
    const info = createElement("span", "favorite-city-info");
    info.append(
      createElement("span", "favorite-city-name", name),
      createElement("span", "favorite-city-condition", city.condition ?? city.country),
    );
    button.append(
      icon,
      info,
      createElement(
        "span",
        "favorite-city-temperature",
        Number.isFinite(city.temperature) ? formatTemperature(city.temperature, unit) : "—",
      ),
    );
    button.addEventListener("click", () => onSelect(city.id));
    return button;
  });

  if (buttons.length === 0) {
    buttons.push(
      createElement(
        "p",
        "empty-favorites",
        "No favourites yet. Add a city from its forecast.",
      ),
    );
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

export function setStatus(message = "", isLoading = false) {
  const status = document.querySelector("#weather-status");
  status.classList.toggle("is-loading", isLoading);
  if (!isLoading) {
    status.textContent = message;
    return;
  }

  const label = createElement("span", "loading-label", message);
  label.setAttribute("aria-hidden", "true");
  const skeleton = createElement("span", "loading-skeleton");
  skeleton.setAttribute("aria-hidden", "true");
  skeleton.append(
    createElement("span", "skeleton-block"),
    createElement("span", "skeleton-block"),
    createElement("span", "skeleton-block"),
  );
  status.replaceChildren(createElement("span", "sr-only", message), label, skeleton);
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
