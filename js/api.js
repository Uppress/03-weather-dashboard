const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Could not connect to Open-Meteo. Check your internet connection and try again. ${error instanceof Error ? error.message : ""}`.trim(),
    );
  }

  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed (${response.status} ${response.statusText}). Please try again.`,
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `Open-Meteo returned an invalid response. ${error instanceof Error ? error.message : ""}`.trim(),
    );
  }
}

export async function searchCity(name) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
  try {
    const data = await fetchJson(url);
    return (data.results ?? []).map((city) => ({
      id: `${city.latitude},${city.longitude}`,
      name: city.name,
      country: city.country ?? "",
      countryCode: city.country_code ?? "",
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone ?? "UTC",
    }));
  } catch (error) {
    throw new Error(
      `City search failed. ${error instanceof Error ? error.message : "Please try again."}`,
    );
  }
}

export async function getForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    forecast_days: "7",
  });
  return fetchJson(`${FORECAST_URL}?${params}`);
}
