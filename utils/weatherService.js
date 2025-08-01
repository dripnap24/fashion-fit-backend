const axios = require('axios');
require('dotenv').config();

const getWeatherCondition = async (city) => {
  try {
    const apiKey = process.env.OPENWEATHER_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const res = await axios.get(url);
    const main = res.data.weather[0].main.toLowerCase();

    if (main.includes('rain')) return 'rainy';
    if (main.includes('clear')) return 'sunny';
    if (main.includes('cloud')) return 'cloudy';
    if (res.data.main.temp <= 16) return 'cold';

    return 'sunny'; // fallback
  } catch (err) {
    console.error('Weather API Error:', err.message);
    return 'sunny'; // fallback
  }
};

module.exports = getWeatherCondition;
