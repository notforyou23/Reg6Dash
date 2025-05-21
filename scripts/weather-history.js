
import { CONFIG } from './config.js';

class HistoryDashboard {
    constructor() {
      this.charts = {};
      this.currentRange = '1h';
      this.currentCycle = '5min';
      this.loadingIndicator = document.querySelector('.loading-indicator');
      this.init();
    }
  
    showLoading() {
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'block';
      }
    }
  
    hideLoading() {
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
    }
  
    async init() {
      this.setupTimeControls();
      await this.fetchAndDisplayData('1h', '5min');
    }
  
    setupTimeControls() {
      const buttons = document.querySelectorAll('.time-button');
      buttons.forEach(button => {
        button.addEventListener('click', async () => {
          // Prevent multiple clicks while loading
          if (this.loadingIndicator.style.display === 'block') {
            return;
          }
  
          // Remove active class from all buttons
          buttons.forEach(b => b.classList.remove('active'));
          // Add active class to clicked button
          button.classList.add('active');
          
          const range = button.dataset.range;
          const cycle = button.dataset.cycle;
          await this.fetchAndDisplayData(range, cycle);
        });
      });
    }
  
    async fetchAndDisplayData(range, cycle) {
      try {
        this.showLoading();
        this.destroyExistingCharts(); // Destroy charts before fetching new data
        
        const { startDate, endDate } = this.calculateDateRange(range);
        const data = await this.fetchHistoryData(startDate, endDate, cycle);
        
        if (data) {
          this.processAndDrawCharts(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Failed to load data: ${error.message}`;
        document.querySelector('.weather-grid').prepend(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 5000);
      } finally {
        this.hideLoading();
      }
    }
  
    calculateDateRange(range) {
      const end = new Date();
      const start = new Date();
      
      switch(range) {
        case '1h':
          start.setHours(end.getHours() - 1);
          break;
        case '24h':
          start.setDate(end.getDate() - 1);
          break;
        case '7d':
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          start.setDate(end.getDate() - 30);
          break;
        case '90d':
          start.setDate(end.getDate() - 90);
          break;
        case '365d':
          start.setDate(end.getDate() - 365);
          break;
      }
      
      return {
        startDate: this.formatDate(start),
        endDate: this.formatDate(end)
      };
    }
  
    destroyExistingCharts() {
      // Properly destroy each chart
      if (this.charts.windChart) {
        this.charts.windChart.destroy();
        this.charts.windChart = null;
      }
      if (this.charts.tempHumChart) {
        this.charts.tempHumChart.destroy();
        this.charts.tempHumChart = null;
      }
      if (this.charts.pressureChart) {
        this.charts.pressureChart.destroy();
        this.charts.pressureChart = null;
      }
    }
  
    // Formats a Date object into "YYYY-MM-DD HH:mm:ss"
    formatDate(date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    }
  
    async fetchHistoryData(startDate, endDate, cycleType) {
      const url = new URL("https://api.ecowitt.net/api/v3/device/history");
      url.searchParams.append("application_key", CONFIG.APPLICATION_KEY);
      url.searchParams.append("api_key", CONFIG.API_KEY);
      url.searchParams.append("mac", CONFIG.MAC);
      url.searchParams.append("start_date", startDate);
      url.searchParams.append("end_date", endDate);
      url.searchParams.append("cycle_type", cycleType);
      url.searchParams.append("call_back", "wind,outdoor.temperature,outdoor.humidity,pressure.relative,pressure.absolute");
  
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const json = await response.json();
      // Ensure the API returned a successful response code
      if (json.code !== 0) {
        throw new Error(`API error: ${json.message || "Unknown error"}`);
      }
      // Return the data object directly without converting to array
      return json.data;
    }
  
    processAndDrawCharts(records) {
      const isMobile = window.innerWidth < 768;
      const commonOptions = {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
              mode: isMobile ? 'nearest' : 'index',
              intersect: isMobile,
              axis: 'x'
          },
          plugins: {
              legend: {
                  position: isMobile ? 'bottom' : 'top',
                  labels: {
                      color: '#ffffff',
                      padding: isMobile ? 15 : 30,
                      usePointStyle: true,
                      pointStyle: 'circle',
                      boxWidth: isMobile ? 8 : 12,
                      boxHeight: isMobile ? 8 : 12,
                      font: {
                          size: isMobile ? 12 : 24,
                          weight: 'bold'
                      }
                  }
              },
              title: {
                  display: true,
                  color: '#ffffff',
                  font: {
                      size: isMobile ? 16 : 32,
                      weight: 'bold'
                  },
                  padding: {
                      top: isMobile ? 10 : 30,
                      bottom: isMobile ? 10 : 50
                  }
              },
              tooltip: {
                  enabled: true,
                  mode: isMobile ? 'nearest' : 'index',
                  intersect: isMobile,
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  titleColor: '#ffffff',
                  bodyColor: '#ffffff',
                  padding: isMobile ? 10 : 25,
                  cornerRadius: 10,
                  titleFont: {
                      size: isMobile ? 14 : 24,
                      weight: 'bold'
                  },
                  bodyFont: {
                      size: isMobile ? 12 : 22,
                      weight: '600'
                  },
                  displayColors: !isMobile,
                  callbacks: {
                      title: function(tooltipItems) {
                          if (isMobile) {
                              // Shorter time format for mobile
                              const date = new Date(tooltipItems[0].label);
                              return date.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                              });
                          }
                          return tooltipItems[0].label;
                      },
                      label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                              label += ': ';
                          }
                          if (context.parsed.y !== null) {
                              label += context.parsed.y.toFixed(1);
                          }
                          return label;
                      }
                  }
              }
          },
          scales: {
              x: {
                  ticks: {
                      color: '#ffffff',
                      maxRotation: isMobile ? 0 : 45,
                      minRotation: isMobile ? 0 : 45,
                      font: {
                          size: isMobile ? 10 : 20,
                          weight: 'bold'
                      },
                      padding: isMobile ? 5 : 20,
                      maxTicksLimit: isMobile ? 6 : undefined,
                      callback: function(value, index, values) {
                          if (isMobile) {
                              // Show fewer labels on mobile
                              const date = new Date(this.getLabelForValue(value));
                              return date.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  hour12: true
                              });
                          }
                          return this.getLabelForValue(value);
                      }
                  },
                  grid: {
                      display: !isMobile,
                      color: 'rgba(255, 255, 255, 0.2)'
                  },
                  border: {
                      color: 'rgba(255, 255, 255, 0.6)',
                      width: isMobile ? 2 : 3
                  }
              },
              y: {
                  ticks: {
                      color: '#ffffff',
                      font: {
                          size: isMobile ? 10 : 20,
                          weight: 'bold'
                      },
                      padding: isMobile ? 5 : 20,
                      maxTicksLimit: isMobile ? 5 : undefined,
                      callback: function(value) {
                          return value.toFixed(1);
                      }
                  },
                  grid: {
                      display: !isMobile,
                      color: 'rgba(255, 255, 255, 0.2)'
                  },
                  border: {
                      color: 'rgba(255, 255, 255, 0.6)',
                      width: isMobile ? 2 : 3
                  }
              }
          }
      };
  
      // Extract timestamps (they're the same for all metrics)
      const timestamps = Object.keys(records.outdoor.temperature.list);
      const labels = timestamps.map(ts => {
          const date = new Date(ts * 1000);
          return date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
          });
      });
  
      // Extract data series
      const temperatureData = timestamps.map(ts => records.outdoor.temperature.list[ts]);
      const humidityData = timestamps.map(ts => records.outdoor.humidity.list[ts]);
      const windSpeedData = timestamps.map(ts => records.wind.wind_speed.list[ts]);
      const windGustData = timestamps.map(ts => records.wind.wind_gust.list[ts]);
      const relPressureData = timestamps.map(ts => records.pressure.relative.list[ts]);
      const absPressureData = timestamps.map(ts => records.pressure.absolute.list[ts]);
  
      // Draw Wind Chart
      const windCtx = document.getElementById("windChart").getContext("2d");
      this.charts.windChart = new Chart(windCtx, {
          type: "line",
          data: {
              labels: labels,
              datasets: [
                  {
                      label: "Wind Speed",
                      data: windSpeedData,
                      borderColor: "#3498db",
                      backgroundColor: "rgba(52, 152, 219, 0.3)",
                      borderWidth: 3
                  },
                  {
                      label: "Wind Gust",
                      data: windGustData,
                      borderColor: "#2ecc71",
                      backgroundColor: "rgba(46, 204, 113, 0.3)",
                      borderWidth: 3
                  }
              ]
          },
          options: {
              ...commonOptions,
              plugins: {
                  ...commonOptions.plugins,
                  title: {
                      display: true,
                      text: "Wind Speed & Gusts",
                      font: {
                          size: 16,
                          weight: 'bold'
                      },
                      padding: 20
                  }
              },
              scales: {
                  x: {
                      grid: {
                          display: false
                      },
                      ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          font: {
                              size: 20,
                              weight: 'bold'
                          }
                      }
                  },
                  y: {
                      beginAtZero: true,
                      title: {
                          display: true,
                          text: "Miles per Hour (mph)",
                          padding: 25,
                          color: '#ffffff',
                          font: {
                              size: 24,  // Increased from 18
                              weight: 'bold'
                          }
                      },
                      ticks: {
                          font: {
                              size: 20,
                              weight: 'bold'
                          }
                      }
                  }
              }
          }
      });
  
      // Draw Temperature & Humidity Chart
      const tempHumCtx = document.getElementById("tempHumChart").getContext("2d");
      this.charts.tempHumChart = new Chart(tempHumCtx, {
          type: "line",
          data: {
              labels: labels,
              datasets: [
                  {
                      label: "Temperature",
                      data: temperatureData,
                      borderColor: "#e74c3c",
                      backgroundColor: "rgba(231, 76, 60, 0.3)",
                      borderWidth: 3
                  },
                  {
                      label: "Humidity",
                      data: humidityData,
                      borderColor: "#9b59b6",
                      backgroundColor: "rgba(155, 89, 182, 0.3)",
                      borderWidth: 3
                  }
              ]
          },
          options: {
              ...commonOptions,
              plugins: {
                  ...commonOptions.plugins,
                  title: {
                      display: true,
                      text: "Temperature & Humidity",
                      font: {
                          size: 16,
                          weight: 'bold'
                      },
                      padding: 20
                  }
              },
              scales: {
                  ...commonOptions.scales,
                  "y-temp": {
                      type: "linear",
                      position: "left",
                      title: {
                          display: true,
                          text: "Temperature (°F)",
                          color: '#ffffff',
                          font: {
                              size: 24,  // Increased from 18
                              weight: 'bold'
                          },
                          padding: {
                              top: 25,
                              bottom: 25
                          }
                      },
                      ticks: {
                          color: '#ffffff',
                          font: {
                              size: 20,
                              weight: 'bold'
                          },
                          padding: 20
                      }
                  },
                  "y-hum": {
                      type: "linear",
                      position: "right",
                      title: {
                          display: true,
                          text: "Humidity (%)",
                          color: '#ffffff',
                          font: {
                              size: 24,  // Increased from 18
                              weight: 'bold'
                          },
                          padding: {
                              top: 25,
                              bottom: 25
                          }
                      },
                      ticks: {
                          color: '#ffffff',
                          font: {
                              size: 20,
                              weight: 'bold'
                          },
                          padding: 20
                      }
                  }
              }
          }
      });
  
      // Draw Pressure Chart
      const pressureCtx = document.getElementById("pressureChart").getContext("2d");
      this.charts.pressureChart = new Chart(pressureCtx, {
          type: "line",
          data: {
              labels: labels,
              datasets: [
                  {
                      label: "Relative Pressure",
                      data: relPressureData,
                      borderColor: "#f39c12",
                      backgroundColor: "rgba(243, 156, 18, 0.3)",
                      borderWidth: 3
                  },
                  {
                      label: "Absolute Pressure",
                      data: absPressureData,
                      borderColor: "#e67e22",
                      backgroundColor: "rgba(230, 126, 34, 0.3)",
                      borderWidth: 3
                  }
              ]
          },
          options: {
              ...commonOptions,
              plugins: {
                  ...commonOptions.plugins,
                  title: {
                      display: true,
                      text: "Barometric Pressure",
                      font: {
                          size: 16,
                          weight: 'bold'
                      },
                      padding: 20
                  }
              },
              scales: {
                  x: {
                      grid: {
                          display: false
                      },
                      ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          font: {
                              size: 16,
                              weight: '600'
                          }
                      }
                  },
                  y: {
                      title: {
                          display: true,
                          text: "Pressure (inHg)",
                          color: '#ffffff',
                          font: {
                              size: 18,
                              weight: '600'
                          },
                          padding: 20
                      },
                      ticks: {
                          font: {
                              size: 16,
                              weight: '600'
                          }
                      }
                  }
              }
          }
      });
    }
  }
  
  window.addEventListener("DOMContentLoaded", () => {
    new HistoryDashboard();
  }); 
