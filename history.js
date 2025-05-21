import { CONFIG } from './scripts/config.js';

class HistoryPage {
  constructor() {
    this.tempChart = null;
    this.windChart = null;
    this.pressureChart = null;
    this.range = '24h';
    this.init();
  }

  init() {
    const selector = document.getElementById('range-selector');
    selector.addEventListener('change', () => {
      this.range = selector.value;
      this.loadData();
    });
    this.loadData();
  }

  formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  rangeParams() {
    const end = new Date();
    const start = new Date();
    let cycle = '5min';

    switch (this.range) {
      case '1h':
        start.setHours(end.getHours() - 1);
        break;
      case '24h':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        cycle = '30min';
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        cycle = '240min';
        break;
    }
    return { startDate: this.formatDate(start), endDate: this.formatDate(end), cycle };
  }

  async fetchHistory(startDate, endDate, cycle) {
    const url = new URL('https://api.ecowitt.net/api/v3/device/history');
    url.searchParams.append('application_key', CONFIG.APPLICATION_KEY);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('mac', CONFIG.MAC);
    url.searchParams.append('start_date', startDate);
    url.searchParams.append('end_date', endDate);
    url.searchParams.append('cycle_type', cycle);
    url.searchParams.append('call_back', 'wind,outdoor.temperature,outdoor.humidity,pressure.relative');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const json = await response.json();
    if (json.code !== 0) {
      throw new Error(json.message || 'API error');
    }
    return json.data;
  }

  drawCharts(data) {
    const timestamps = Object.keys(data.outdoor.temperature.list);
    const labels = timestamps.map(ts => {
      const d = new Date(ts * 1000);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    });

    const temps = timestamps.map(t => data.outdoor.temperature.list[t]);
    const hums = timestamps.map(t => data.outdoor.humidity.list[t]);
    const windSpeeds = timestamps.map(t => data.wind.wind_speed.list[t]);
    const windGusts = timestamps.map(t => data.wind.wind_gust.list[t]);
    const pressure = timestamps.map(t => data.pressure.relative.list[t]);

    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const windCtx = document.getElementById('windChart').getContext('2d');
    const pressureCtx = document.getElementById('pressureChart').getContext('2d');

    if (this.tempChart) this.tempChart.destroy();
    if (this.windChart) this.windChart.destroy();
    if (this.pressureChart) this.pressureChart.destroy();

    this.tempChart = new Chart(tempCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Temperature', data: temps, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.3)', borderWidth: 2 },
          { label: 'Humidity', data: hums, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.3)', borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0f2fe' } } }, scales: { x: { ticks: { color: '#e0f2fe' } }, y: { ticks: { color: '#e0f2fe' } } } }
    });

    this.windChart = new Chart(windCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Wind Speed', data: windSpeeds, borderColor: '#7e22ce', backgroundColor: 'rgba(126,34,206,0.3)', borderWidth: 2 },
          { label: 'Wind Gust', data: windGusts, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.3)', borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0f2fe' } } }, scales: { x: { ticks: { color: '#e0f2fe' } }, y: { ticks: { color: '#e0f2fe' } } } }
    });

    this.pressureChart = new Chart(pressureCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Pressure', data: pressure, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.3)', borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0f2fe' } } }, scales: { x: { ticks: { color: '#e0f2fe' } }, y: { ticks: { color: '#e0f2fe' } } } }
    });
  }

  async loadData() {
    try {
      const { startDate, endDate, cycle } = this.rangeParams();
      const data = await this.fetchHistory(startDate, endDate, cycle);
      this.drawCharts(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new HistoryPage());
