const CITY_DATA = [
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    temperature: 72,
    condition: "Partly cloudy",
    icon: "🌤️",
    wind: 8,
    humidity: 54,
    forecast: [
      { day: "Today", icon: "🌤️", high: 72, low: 59 },
      { day: "Tue", icon: "☀️", high: 75, low: 61 },
      { day: "Wed", icon: "🌤️", high: 70, low: 57 },
      { day: "Thu", icon: "🌧️", high: 64, low: 53 },
      { day: "Fri", icon: "🌦️", high: 67, low: 54 },
      { day: "Sat", icon: "☀️", high: 73, low: 58 },
      { day: "Sun", icon: "🌤️", high: 71, low: 56 },
    ],
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London",
    temperature: 59,
    condition: "Light showers",
    icon: "🌦️",
    wind: 11,
    humidity: 71,
    forecast: [
      { day: "Today", icon: "🌦️", high: 59, low: 51 },
      { day: "Tue", icon: "☁️", high: 61, low: 50 },
      { day: "Wed", icon: "🌧️", high: 57, low: 48 },
      { day: "Thu", icon: "🌤️", high: 63, low: 49 },
      { day: "Fri", icon: "☀️", high: 65, low: 51 },
      { day: "Sat", icon: "🌦️", high: 60, low: 50 },
      { day: "Sun", icon: "☁️", high: 58, low: 47 },
    ],
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    temperature: 68,
    condition: "Clear skies",
    icon: "☀️",
    wind: 5,
    humidity: 48,
    forecast: [
      { day: "Today", icon: "☀️", high: 68, low: 57 },
      { day: "Tue", icon: "☀️", high: 70, low: 58 },
      { day: "Wed", icon: "🌤️", high: 67, low: 55 },
      { day: "Thu", icon: "🌤️", high: 69, low: 56 },
      { day: "Fri", icon: "🌧️", high: 62, low: 54 },
      { day: "Sat", icon: "🌦️", high: 64, low: 53 },
      { day: "Sun", icon: "☀️", high: 71, low: 57 },
    ],
  },
  {
    id: "san-francisco",
    city: "San Francisco",
    country: "United States",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    temperature: 64,
    condition: "Soft sunshine",
    icon: "🌤️",
    wind: 12,
    humidity: 62,
    forecast: [
      { day: "Today", icon: "🌤️", high: 64, low: 54 },
      { day: "Tue", icon: "☀️", high: 66, low: 55 },
      { day: "Wed", icon: "🌤️", high: 63, low: 53 },
      { day: "Thu", icon: "☁️", high: 61, low: 52 },
      { day: "Fri", icon: "🌤️", high: 65, low: 54 },
      { day: "Sat", icon: "☀️", high: 68, low: 55 },
      { day: "Sun", icon: "🌤️", high: 67, low: 54 },
    ],
  },
  {
    id: "sydney",
    city: "Sydney",
    country: "Australia",
    countryCode: "AU",
    timezone: "Australia/Sydney",
    temperature: 77,
    condition: "Mostly sunny",
    icon: "🌤️",
    wind: 9,
    humidity: 51,
    forecast: [
      { day: "Today", icon: "🌤️", high: 77, low: 64 },
      { day: "Tue", icon: "☀️", high: 80, low: 65 },
      { day: "Wed", icon: "☀️", high: 82, low: 66 },
      { day: "Thu", icon: "🌤️", high: 78, low: 63 },
      { day: "Fri", icon: "🌦️", high: 73, low: 61 },
      { day: "Sat", icon: "🌤️", high: 75, low: 62 },
      { day: "Sun", icon: "☀️", high: 81, low: 65 },
    ],
  },
];

export async function getWeatherForCity(cityName) {
  const normalizedName = cityName.trim().toLocaleLowerCase();
  const city = CITY_DATA.find(
    (item) => item.city.toLocaleLowerCase() === normalizedName,
  );

  if (!city) {
    throw new Error(
      `No placeholder forecast found for "${cityName.trim()}". Try New York, London, Tokyo, San Francisco, or Sydney.`,
    );
  }

  return { ...city, forecast: city.forecast.map((day) => ({ ...day })) };
}

export function getInitialFavorites() {
  return ["new-york", "london", "tokyo"];
}

export function getFavoriteWeather(cityId) {
  const city = CITY_DATA.find((item) => item.id === cityId);
  return city ? { ...city, forecast: city.forecast.map((day) => ({ ...day })) } : null;
}
