import { fetchRealtimeData } from '../models/weather.js';

async function updateWeather() {
  try {
    const result = await fetchRealtimeData();
    const data = result.data;
    const temp = data.outdoor?.temperature?.value;
    const humidity = data.outdoor?.humidity?.value;
    const pressure = data.pressure?.relative?.value;

    if (temp !== undefined) {
      document.getElementById('temp').textContent = `${parseFloat(temp).toFixed(1)}°F`;
    }
    if (humidity !== undefined) {
      document.getElementById('humidity').textContent = `${parseFloat(humidity).toFixed(0)}%`;
    }
    if (pressure !== undefined) {
      document.getElementById('pressure').textContent = `${parseFloat(pressure).toFixed(2)} inHg`;
    }

    const now = new Date();
    document.getElementById('update-time').textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    console.error('Failed to fetch weather data', err);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateWeather();
  setInterval(updateWeather, 60000);
});
