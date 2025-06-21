# Reg6Dash

## Overview

Reg6Dash is a web dashboard that aggregates real-time data from an Ecowitt weather station and a HUUM sauna controller. It provides a concise summary on the main page, a detailed weather breakdown, and historical charts. The code is entirely client-side JavaScript with HTML and CSS for layout and styling.

## Project Layout

- `index.html` – Main dashboard displaying the current outdoor conditions, wind, atmosphere readings, a sauna control card, and navigation links.
- `weather.html` – Expanded view of all sensor readings, including humidity, pressure, dew point, rainfall, wind details, lightning metrics, indoor measurements, and solar/UV data.
- `history.html` – Historical graphs rendered with Chart.js showing temperature, humidity, wind, and pressure over various ranges.
- `components/` – Contains `weather-dashboard.js`, the primary class managing dashboard updates, animations, and sauna interactions.
- `models/` – Data access modules:
  - `weather.js` fetches real-time metrics from the Ecowitt API.
  - `sauna.js` interfaces with the HUUM sauna API for status checks and start/stop commands.
- `scripts/` – Initialization modules and configuration:
  - `app.js` instantiates the dashboard on page load.
  - `weather-details.js` populates the weather detail page.
  - `config.js` houses API keys and sauna credentials.
- `styles.css` – Tailwind-inspired custom styling for all pages, including responsive layout and animated effects.
- `setup.sh` – Convenience script to install optional Python or Node dependencies and prepare hooks.

## Data Flow

1. **Initialization**
   - `index.html` loads `scripts/app.js`, which creates a new `WeatherDashboard` instance.
   - `WeatherDashboard` sets up time displays, theme selection, and the sauna toggle, then calls `updateDashboard()`.

2. **Fetching Weather Data**
   - `updateDashboard()` invokes `fetchRealtimeData` from `models/weather.js`.
   - `fetchRealtimeData` constructs a query to the Ecowitt `/device/real_time` endpoint with credentials from `config.js` and returns parsed JSON.
   - On success, `updateUI()` updates each card with the latest temperature, humidity, wind, pressure, solar, and UV data. It also logs pressure values to compute a trend symbol.

3. **Sauna Control**
   - `WeatherDashboard` uses `fetchSaunaData` to poll the HUUM controller and determine current status, heating progress, or error states.
   - Clicking the “Turn Sauna On/Off” button triggers `toggleSauna`, which sends an authenticated POST request to the controller API.
   - UI classes reflect the sauna state: heating, offline, locked, or emergency stop.

4. **Animations and Themes**
   - Temperature, pressure, and wind cards create dynamic DOM elements for sun/cloud effects, atmospheric particles, and swirling wind lines.
   - A pressure history array drives the trend arrow to show rising or falling conditions.
   - The dashboard theme adjusts hourly for day/night colors.

5. **Weather Details Page**
   - `weather-details.js` fetches the same real-time data and fills individual cards with values: dew point, rainfall, lightning distance, indoor CO₂, etc.
   - The last update time displays the most recent successful fetch.

6. **Historical Charts**
   - `history.js` offers dropdown ranges (1h, 24h, 7d, 30d). It assembles start and end timestamps and queries Ecowitt’s `/device/history` API.
   - Data points are plotted using Chart.js in three charts: temperature/humidity, wind speed/gust, and pressure.

## Running Locally

1. Execute `./setup.sh` to install optional tooling if `requirements.txt` or `package.json` exist.
2. Open `index.html` in a browser. The site uses `particles.js` and Chart.js from CDN, so internet access is required initially.
3. Adjust API keys in `scripts/config.js` before deploying publicly.

## Notes

- No build process is required; all scripts are ES modules directly referenced from the HTML.
- Prettier warnings appear because the repository does not include a configuration file. Formatting is optional.
- Tests and linting are not configured, so `pytest`, `flake8`, and `eslint` will report missing commands or configs.

