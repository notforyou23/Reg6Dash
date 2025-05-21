import { fetchRealtimeData } from '../models/weather.js';

let lastPressure = null;

function directionFromDegrees(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function pressureTrend(current) {
  if (lastPressure === null) return '→';
  if (current > lastPressure + 0.02) return '↑';
  if (current < lastPressure - 0.02) return '↓';
  return '→';
}


async function updateWeather() {
  try {
    const result = await fetchRealtimeData();
    const data = result.data;


    const temp = data.outdoor?.temperature?.value;
    const feelsLike = data.outdoor?.feels_like?.value;
    const dewPoint = data.outdoor?.dew_point?.value;
    const humidity = data.outdoor?.humidity?.value;
    const pressure = data.pressure?.relative?.value;
    const windSpeed = data.wind?.wind_speed?.value;
    const windDir = data.wind?.wind_direction?.value;
    const windGust = data.wind?.wind_gust?.value;
    const rainRate = data.rainfall?.rain_rate?.value;
    const rainDaily = data.rainfall?.daily?.value;
    const lightningDist = data.lightning?.distance?.value;
    const lightningCount = data.lightning?.count?.value;
    const indoorTemp = data.indoor?.temperature?.value;
    const indoorHumidity = data.indoor?.humidity?.value;
    const co2 = data.indoor_co2?.co2?.value;
    const solar = data.solar_and_uvi?.solar?.value;
    const uv = data.solar_and_uvi?.uvi?.value;


    if (temp !== undefined) {
      document.getElementById('temp').textContent = `${parseFloat(temp).toFixed(1)}°F`;
    }

    if (feelsLike !== undefined) {
      document.getElementById('feels-like').textContent = `Feels like ${parseFloat(feelsLike).toFixed(1)}°F`;
    }

    if (dewPoint !== undefined) {
      document.getElementById('dew-point').textContent = `${parseFloat(dewPoint).toFixed(1)}°F`;
    }

    if (humidity !== undefined) {
      document.getElementById('humidity').textContent = `${parseFloat(humidity).toFixed(0)}%`;
    }
    if (pressure !== undefined) {

      const pressureNum = parseFloat(pressure);
      document.getElementById('pressure').textContent = `${pressureNum.toFixed(2)} inHg`;
      document.getElementById('pressure-trend').textContent = pressureTrend(pressureNum);
      lastPressure = pressureNum;
    }
    if (windSpeed !== undefined) {
      document.getElementById('wind-speed').textContent = `${parseFloat(windSpeed).toFixed(1)} mph`;
    }
    if (windDir !== undefined) {
      document.getElementById('wind-dir').textContent = directionFromDegrees(windDir);
    }
    if (windGust !== undefined) {
      document.getElementById('wind-gust').textContent = `Gust: ${parseFloat(windGust).toFixed(1)} mph`;
    }
    if (rainRate !== undefined) {
      document.getElementById('rain-rate').textContent = `${parseFloat(rainRate).toFixed(2)} in/hr`;
    }
    if (rainDaily !== undefined) {
      document.getElementById('rain-daily').textContent = `Today: ${parseFloat(rainDaily).toFixed(2)} in`;
    }
    if (lightningDist !== undefined) {
      document.getElementById('lightning-distance').textContent = `${parseFloat(lightningDist).toFixed(0)} mi`;
    }
    if (lightningCount !== undefined) {
      document.getElementById('lightning-count').textContent = `Count: ${parseInt(lightningCount, 10)}`;
    }
    if (indoorTemp !== undefined) {
      document.getElementById('indoor-temp').textContent = `${parseFloat(indoorTemp).toFixed(1)}°F`;
    }
    if (indoorHumidity !== undefined) {
      document.getElementById('indoor-humidity').textContent = `${parseFloat(indoorHumidity).toFixed(0)}%`;
    }
    if (co2 !== undefined) {
      document.getElementById('co2').textContent = `${parseInt(co2, 10)} ppm`;
    }
    if (solar !== undefined) {
      document.getElementById('solar').textContent = `${parseFloat(solar).toFixed(0)} W/m²`;
    }
    if (uv !== undefined) {
      document.getElementById('uv').textContent = `UV: ${parseFloat(uv).toFixed(1)}`;
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
