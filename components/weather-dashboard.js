import { SAUNA_CONFIG } from '../scripts/config.js';
import { fetchRealtimeData } from '../models/weather.js';
import { toggleSauna, fetchSaunaData } from '../models/sauna.js';

class WeatherDashboard {
    constructor() {
        this.updateInterval = 60000; // Update every minute
        this.retryDelay = 5000; // 5 seconds delay before retry
        this.maxRetries = 3;
        this.lastPressure = null;
        this.dailyWindHigh = 0; // Track daily high wind speed
        this.lastDayReset = new Date().setHours(0,0,0,0); // Track when we last reset daily stats
        this.pressureHistory = [];
        this.pressureHistoryMaxLength = 12; // Track last hour (5-minute intervals)
        this.init();
    }

    async init() {
        this.initTimeDisplays();
        this.initSaunaControl();
        this.applyDynamicTheme();
        await this.updateDashboard();
        setInterval(() => this.updateDashboard(), this.updateInterval);
        setInterval(() => this.applyDynamicTheme(), 60 * 60 * 1000); // update theme hourly
    }


    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        document.querySelector('.dashboard').prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    getPressureTrend() {
        if (this.pressureHistory.length < 2) return { symbol: "→", class: "steady" };
        
        const latest = this.pressureHistory[this.pressureHistory.length - 1];
        const oldest = this.pressureHistory[0];
        const change = latest - oldest;
        const changePerHour = change * (12 / this.pressureHistory.length);

        if (changePerHour >= 0.06) return { symbol: "↑↑", class: "rising-fast" };
        if (changePerHour >= 0.02) return { symbol: "↑", class: "rising" };
        if (changePerHour <= -0.06) return { symbol: "↓↓", class: "falling-fast" };
        if (changePerHour <= -0.02) return { symbol: "↓", class: "falling" };
        return { symbol: "→", class: "steady" };
    }

    updateUI(data) {
        if (!data || data.code !== 0) {
            console.error('Invalid data received');
            this.showError('Invalid data received from weather station');
            return;
        }

        const weatherData = data.data;
        
        const temp = weatherData.outdoor?.temperature?.value;
        const feelsLike = weatherData.outdoor?.feels_like?.value;
        const humidity = weatherData.outdoor?.humidity?.value;
        
        const outdoorCombined = document.querySelector('#outdoor-combined');
        
        if (temp !== undefined && temp !== null) {
            outdoorCombined.querySelector('.temp-value').textContent = `${parseFloat(temp).toFixed(1)}°F`;
            this.addTemperatureAnimation('#outdoor-combined', parseFloat(temp));
        }
        if (feelsLike !== undefined && feelsLike !== null) {
            outdoorCombined.querySelector('.feels-like').textContent =
                `Feels like ${parseFloat(feelsLike).toFixed(1)}°F`;
        }
        if (humidity !== undefined && humidity !== null) {
            outdoorCombined.querySelector('.humidity-value').textContent = `${parseFloat(humidity).toFixed(0)}%`;
        }
        
        const windSpeed = weatherData.wind?.wind_speed?.value;
        const windGust = weatherData.wind?.wind_gust?.value;
        const windDir = weatherData.wind?.wind_direction?.value;
        
        const windCard = document.querySelector('#wind-combined');
        
        if (windSpeed !== undefined && windSpeed !== null) {
            windCard.querySelector('.wind-speed-value').textContent = `${parseFloat(windSpeed).toFixed(1)} mph`;
            this.createWindAnimation(windCard, parseFloat(windSpeed), windDir);
        }

        if (windGust !== undefined && windGust !== null) {
            windCard.querySelector('.gust').textContent = `Gust: ${parseFloat(windGust).toFixed(1)} mph`;
        }
        
        if (windDir !== undefined) {
            const directionValue = windCard.querySelector('.wind-direction-value');
            directionValue.textContent = this.getWindDirection(windDir);
        }

        const pressure = weatherData.pressure?.relative?.value;
        const solar = weatherData.solar_and_uvi?.solar?.value || '--';
        const uv = weatherData.solar_and_uvi?.uvi?.value || '--';


        const atmosphericCard = document.querySelector('#atmospheric-combined');
        const uvCard = document.querySelector('#uv-card');


        
        const atmosphericCard = document.querySelector('#atmospheric-combined');
        

        if (atmosphericCard) {
            let trend = { symbol: "→", class: "steady" };
            
            if (pressure !== undefined && pressure !== null) {
                const pressureNum = parseFloat(pressure);
                this.pressureHistory.push(pressureNum);
                if (this.pressureHistory.length > this.pressureHistoryMaxLength) {
                    this.pressureHistory.shift();
                }

                trend = this.getPressureTrend();
                atmosphericCard.querySelector('.pressure-value').textContent = `${pressureNum.toFixed(2)} inHg`;
                const trendIndicator = atmosphericCard.querySelector('.trend-indicator');
                trendIndicator.textContent = trend.symbol;
                trendIndicator.className = `trend-indicator ${trend.class}`;
            }
            
            atmosphericCard.querySelector('.solar-value').textContent = `${solar} W/m²`;
            
            const uvElement = atmosphericCard.querySelector('.uv-value');

            uvElement.textContent = `UV: ${uv}`;
            
            uvElement.className = 'uv-value';
            if (uv !== '--') {
                const uvValue = parseFloat(uv);
                if (uvValue >= 11) {
                    uvElement.classList.add('uv-extreme');
                } else if (uvValue >= 8) {
                    uvElement.classList.add('uv-very-high');
                } else if (uvValue >= 6) {
                    uvElement.classList.add('uv-high');
                } else if (uvValue >= 3) {
                    uvElement.classList.add('uv-moderate');
                } else {
                    uvElement.classList.add('uv-low');
                }
            }
            
            this.createAtmosphericAnimation(atmosphericCard, trend.class, parseFloat(uv), parseFloat(solar));
        }

        if (uvCard) {
            uvCard.querySelector('.solar-value').textContent = `${solar} W/m²`;

            const uvElement = uvCard.querySelector('.uv-value');

            uvElement.textContent = `UV: ${uv}`;
            
            uvElement.className = 'uv-value';
            if (uv !== '--') {
                const uvValue = parseFloat(uv);
                if (uvValue >= 11) {
                    uvElement.classList.add('uv-extreme');
                } else if (uvValue >= 8) {
                    uvElement.classList.add('uv-very-high');
                } else if (uvValue >= 6) {
                    uvElement.classList.add('uv-high');
                } else if (uvValue >= 3) {
                    uvElement.classList.add('uv-moderate');
                } else {
                    uvElement.classList.add('uv-low');
                }
            }
            
            this.createAtmosphericAnimation(atmosphericCard, trend.class, parseFloat(uv), parseFloat(solar));
        }

        const now = new Date();
        document.getElementById('update-time').textContent =
            now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const progress = ((now.getTime() % this.updateInterval) / this.updateInterval) * 100;
        const progressElem = document.getElementById('update-progress');
        if (progressElem) {
        }

        this.updateWindStats(windSpeed, windGust);
    }
    
    
    addTemperatureAnimation(selector, temperature) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        const container = card.querySelector('.temp-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (temperature >= 80) {
            this.createHotTempAnimation(container, temperature);
        } else if (temperature >= 60) {
            this.createMildTempAnimation(container, temperature);
        } else if (temperature >= 40) {
            this.createCoolTempAnimation(container, temperature);
        } else {
            this.createColdTempAnimation(container, temperature);
        }
    }
    
    createHotTempAnimation(container, temperature) {
        const sun = document.createElement('div');
        sun.className = 'sun-hot';
        container.appendChild(sun);
        
        for (let i = 0; i < 8; i++) {
            const heatWave = document.createElement('div');
            heatWave.className = 'heat-wave';
            const size = Math.random() * 40 + 50;
            const duration = Math.random() * 4 + 4;
            const delay = Math.random() * 6;
            container.appendChild(heatWave);
        }
        
    }
    
    createMildTempAnimation(container, temperature) {
        const sun = document.createElement('div');
        sun.className = 'sun-mild';
        container.appendChild(sun);
        
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-light';
            const cloudWidth = Math.random() * 40 + 60;
            const duration = Math.random() * 20 + 40;
            container.appendChild(cloud);
        }
    }
    
    createCoolTempAnimation(container, temperature) {
        const sun = document.createElement('div');
        sun.className = 'sun-cool';
        container.appendChild(sun);
        
        for (let i = 0; i < 5; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-light';
            const cloudWidth = Math.random() * 60 + 60;
            const duration = Math.random() * 20 + 40;
            const delay = Math.random() * 10;
            container.appendChild(cloud);
        }
    }
    
    createColdTempAnimation(container, temperature) {
        const darkCloud = document.createElement('div');
        darkCloud.className = 'dark-cloud';
        container.appendChild(darkCloud);
        
        for (let i = 0; i < 20; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            const size = Math.random() * 4 + 2;
            const fallDuration = Math.random() * 10 + 15;
            const delay = Math.random() * 10;
            container.appendChild(snowflake);
        }
        


    }
    
    addHumidityAnimation(selector, humidity) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        this.removeExistingAnimations(card);
        
        const container = document.createElement('div');
        container.className = 'weather-icon-container';
        
        const humidityEl = document.createElement('div');
        humidityEl.className = 'humidity';
        
        const droplet = document.createElement('div');
        droplet.className = 'droplet';

        if (humidity > 80) {
            droplet.classList.add('high');
        } else if (humidity > 60) {
            droplet.classList.add('medium');
        } else if (humidity > 40) {
            droplet.classList.add('low');
        } else {
            droplet.classList.add('very-low');
        }
        
        humidityEl.appendChild(droplet);
        container.appendChild(humidityEl);
        card.appendChild(container);
    }
    
    addPressureAnimation(selector, trendClass) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        this.removeExistingAnimations(card);
        
        const container = document.createElement('div');
        container.className = 'weather-icon-container';
        
        const pressureIcon = document.createElement('div');
        pressureIcon.className = 'pressure-icon';
        
        const circle = document.createElement('div');
        circle.className = 'pressure-circle';
        
        const arrow = document.createElement('div');
        arrow.className = 'pressure-arrow';

        if (trendClass.includes('rising')) {
            arrow.classList.add('rising');
            circle.classList.add('rising');
        } else if (trendClass.includes('falling')) {
            arrow.classList.add('falling');
            circle.classList.add('falling');
        } else {
            arrow.classList.add('steady');
            circle.classList.add('steady');
        }
        
        pressureIcon.appendChild(circle);
        pressureIcon.appendChild(arrow);
        container.appendChild(pressureIcon);
        card.appendChild(container);
    }
    
    createAtmosphericAnimation(card, trendClass, uvIndex, solarValue) {
        const container = card.querySelector('.atmos-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        this.createPressureAnimation(container, trendClass);
        
        if (!isNaN(uvIndex) || !isNaN(solarValue)) {
            this.createSolarAnimation(container, uvIndex, solarValue);
        }


        this.addAtmosphericParticles(container, trendClass);
    }

    createUVAnimation(card, uvIndex, solarValue) {
        const container = card.querySelector('.atmos-animation-container');
        if (!container) return;
        container.innerHTML = '';

        if (!isNaN(uvIndex) || !isNaN(solarValue)) {
            this.createSolarAnimation(container, uvIndex, solarValue);
        }

        this.addAtmosphericParticles(container, 'steady');
    }


        
        this.addAtmosphericParticles(container, trendClass);
    }
    

    createPressureAnimation(container, trendClass) {
        const pressureSystem = document.createElement('div');
        pressureSystem.className = 'pressure-system';
        if (trendClass.includes('rising')) {
            pressureSystem.classList.add('rising');
        } else if (trendClass.includes('falling')) {
            pressureSystem.classList.add('falling');
        } else {
            pressureSystem.classList.add('steady');
        }

        container.appendChild(pressureSystem);

        

    }
    
    createSolarAnimation(container, uvIndex, solarValue) {
        const sun = document.createElement('div');
        sun.className = 'atmospheric-sun';
        const solarSize = !isNaN(solarValue) ?
            Math.min(65, Math.max(30, 30 + (solarValue / 20))) : 40;

        if (!isNaN(uvIndex)) {
            if (uvIndex >= 11) {
                sun.classList.add('extreme');
            } else if (uvIndex >= 8) {
                sun.classList.add('very-high');
            } else if (uvIndex >= 6) {
                sun.classList.add('high');
            } else if (uvIndex >= 3) {
                sun.classList.add('moderate');
            } else {
                sun.classList.add('low');
            }
        } else {
            sun.classList.add('default');
        }
        
        if (!isNaN(uvIndex) && uvIndex > 0) {
            const rayCount = Math.min(20, Math.max(8, Math.floor(uvIndex * 2)));
            
            for (let i = 0; i < rayCount; i++) {
                const ray = document.createElement('div');
                ray.className = 'sun-ray';

                let rayColor;
                if (uvIndex >= 11) rayColor = '#7e22ce';
                else if (uvIndex >= 8) rayColor = '#ef4444';
                else if (uvIndex >= 6) rayColor = '#f97316';
                else if (uvIndex >= 3) rayColor = '#facc15';
                else rayColor = '#4ade80';

                sun.appendChild(ray);
            }
        }
        
        container.appendChild(sun);

        

    }
    
    addAtmosphericParticles(container, trendClass) {
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            
            
            const size = Math.random() * 3 + 1;
            
            let color;
            if (trendClass.includes('rising')) {
                color = `rgba(${80 + Math.random() * 40}, ${140 + Math.random() * 60}, ${220 + Math.random() * 35}, ${0.3 + Math.random() * 0.3})`;
            } else if (trendClass.includes('falling')) {
                color = `rgba(${220 + Math.random() * 35}, ${80 + Math.random() * 40}, ${80 + Math.random() * 40}, ${0.3 + Math.random() * 0.3})`;
            } else {
                color = `rgba(${180 + Math.random() * 40}, ${180 + Math.random() * 40}, ${180 + Math.random() * 40}, ${0.2 + Math.random() * 0.2})`;
            }
            
            
            const duration = Math.random() * 30 + 30;
            let animationName;
            
            if (trendClass.includes('rising')) {
                animationName = 'float-rise';
            } else if (trendClass.includes('falling')) {
                animationName = 'float-fall';
            } else {
                animationName = 'float-steady';
            }
            
            
            container.appendChild(particle);
        }
        
    }
    
    createWindAnimation(card, windSpeed, windDirection) {
        const container = card.querySelector('.wind-animation-container');
        if (container) {
            container.innerHTML = '';
        }
        
        const directionOffset = windDirection ? (windDirection - 90) : 0;
        const gradientDirection = `${directionOffset}deg`;
        
        const turbulence = document.createElement('div');
        turbulence.className = 'wind-turbulence';
        
        const turbulenceSpeed = Math.max(1, Math.min(15, 15 - windSpeed * 0.7));
        
        container.appendChild(turbulence);
        
        const particles = document.createElement('div');
        particles.className = 'wind-particles';
        container.appendChild(particles);
        
        const arrowContainer = document.createElement('div');
        arrowContainer.className = 'wind-direction-arrow';
        
        const arrowSize = Math.min(80, Math.max(30, 30 + windSpeed * 2));
        
        const pulseSpeed = Math.max(1, 3 - (windSpeed * 0.1));
        
        container.appendChild(arrowContainer);
        
        const particleCount = Math.min(Math.max(Math.round(windSpeed * 3), 8), 60);
        const baseSpeed = Math.max(1, Math.min(8, windSpeed * 0.4));
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'wind-particle';
            
            const size = Math.random() * 4 + 1; // 1-5px
            const yPos = Math.random() * 100; // 0-100%
            const xPos = Math.random() * 100; // 0-100%
            
            const speedFactor = windSpeed * (1 / size) * 0.8;
            const speed = (Math.random() * 1.5 + 0.5) * baseSpeed * speedFactor; 
            const delay = Math.random() * 6; // Random start times
            
            const opacity = Math.min(0.9, (size * 0.15) + (Math.random() * 0.2) + 0.2);
            
            const hue = 210 + (Math.random() * 20 - 10); // Blue-ish
            const sat = 70 + (Math.random() * 30); // Medium-high saturation
            const light = 70 + (Math.random() * 20); // Light color
            const color = `hsla(${hue}, ${sat}%, ${light}%, ${opacity})`;
            
            
        
        particles.appendChild(particle);
        }
        
        const lineCount = Math.min(Math.max(Math.round(windSpeed * 0.7), 5), 15);
        
        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            line.className = 'wind-line';
            
            const yPos = Math.random() * 100; // 0-100%
            const xPos = Math.random() * 40 + 60; // 60-100% (right side)
            const width = Math.random() * 40 + (windSpeed * 1.5); // Longer lines for higher speed
            
            const angle = (Math.random() * 15 - 7.5) + (windDirection ? (windDirection - 90) : 0);
            
            const lineOpacity = Math.min(0.7, 0.1 + (windSpeed * 0.02) + (Math.random() * 0.1));
            
            const lineSpeed = 4 - (Math.min(3, windSpeed * 0.15));
            const lineDelay = Math.random() * 3;
            
            
            
            const lineColor = `rgba(255,255,255,${Math.min(0.8, 0.2 + (windSpeed * 0.03))})`;
            
            particles.appendChild(line);
        }
        
        if (windSpeed > 8) {
            const vortexCount = Math.floor((windSpeed - 8) / 3) + 1;
            
            for (let i = 0; i < vortexCount; i++) {
                const vortex = document.createElement('div');
                vortex.className = 'wind-vortex';
                
                const yPos = Math.random() * 80 + 10;
                const xPos = Math.random() * 60 + 20;
                
                const size = Math.random() * 10 + (windSpeed * 0.7);
                
                const rotateSpeed = Math.max(1.5, 6 - (windSpeed * 0.2));
                const moveSpeed = Math.max(3, 10 - (windSpeed * 0.4)); 
                
                
                particles.appendChild(vortex);
            }
        }
    }
    
    
    addIndoorAnimation(selector, temperature, humidity) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        const container = card.querySelector('.home-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        this.createHomeAnimation(container, temperature, humidity);
    }
    
    createHomeAnimation(container, temperature, humidity) {
        const house = document.createElement('div');
        container.appendChild(house);
        
        const roof = document.createElement('div');
        house.appendChild(roof);
        
        const windowLeft = document.createElement('div');
        house.appendChild(windowLeft);
        
        const windowRight = document.createElement('div');
        house.appendChild(windowRight);
        
        const door = document.createElement('div');
        house.appendChild(door);
        
        const doorknob = document.createElement('div');
        door.appendChild(doorknob);
        
        if (temperature < 50) {
            const chimney = document.createElement('div');
            house.appendChild(chimney);
            
            for (let i = 0; i < 5; i++) {
                const smoke = document.createElement('div');
                
                const delay = i * 1.5;
                
                chimney.appendChild(smoke);
            }
        }
        
        this.addHomeAmbientEffects(container, temperature);
        



    }
    
    addHomeAmbientEffects(container, temperature) {
        const ground = document.createElement('div');
        
        if (temperature < 32) {
        } else {
        }
        
        container.appendChild(ground);
    }
    
    removeExistingAnimations(card) {
        const existing = card.querySelector('.weather-icon-container');
        if (existing) {
            existing.remove();
        }
    }

    updateValue(selector, value, unit) {
        const element = document.querySelector(`${selector} .value`);
        if (element) {
            element.textContent = value ? `${parseFloat(value).toFixed(1)}${unit}` : `--${unit}`;
        }
    }

    updateChannelSensor(selector, data) {
        const element = document.querySelector(`${selector} .value`);
        if (element && data) {
            const temp = data.temperature?.value || '--';
            const humidity = data.humidity?.value || '--';
            element.textContent = `${temp}°F | ${humidity}%`;
        }
    }

    async updateDashboard() {
        const data = await fetchRealtimeData(this.retryDelay, this.maxRetries);
        if (data) {
            this.updateUI(data);
        }
    }

    initTimeDisplays() {
        const updateTimes = () => {
            const now = new Date();

            const leonardoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
            document.getElementById('leonardo-time').textContent =
                leonardoTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

            const florenceTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
            document.getElementById('florence-time').textContent =
                florenceTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });

            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();

            const fillPercentage = ((seconds + (milliseconds / 1000)) / 60) * 100;

            document.querySelectorAll('.time-fill').forEach((fill, index) => {
                setTimeout(() => {
                }, index * 100);
            });

            document.querySelectorAll('.time').forEach((timeElement, index) => {
                const hue1 = index === 0 ? 230 : 330; // Base hue for each clock (blue/purple)
                const hue2 = index === 0 ? 250 : 350; // Target hue (slightly different)

                const progress = seconds / 60;
                const opacity = 0.8 + (Math.sin(progress * Math.PI) * 0.2);

            });
        };


        updateTimes();
        setInterval(updateTimes, 50); // More frequent updates for smoother fill
    }

    initSaunaControl() {
        this.isHeatingOn = false;
        this.setupSaunaListeners();
        this.updateSauna();
        setInterval(() => this.updateSauna(), SAUNA_CONFIG.UPDATE_INTERVAL);
    }

    setupSaunaListeners() {
        const toggleButton = document.getElementById('sauna-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.handleToggleSauna());
        }
    }


    async handleToggleSauna() {
        this.isHeatingOn = !this.isHeatingOn;
        try {
            await toggleSauna(this.isHeatingOn);
            await this.updateSauna();
        } catch (error) {
            console.error(`Sauna ${this.isHeatingOn ? 'start' : 'stop'} Error:`, error);
            this.showError(`Failed to ${this.isHeatingOn ? 'start' : 'stop'} sauna: ${error.message}`);
            this.isHeatingOn = !this.isHeatingOn;
        }
    }

    async updateSauna() {
        try {
            const data = await fetchSaunaData();
            this.updateSaunaUI(data);
        } catch (error) {
            console.error('Fetch Sauna Data Error:', error);
            this.showError(`Failed to fetch sauna data: ${error.message}`);
        }
    }
    updateSaunaUI(data) {
        try {
            const saunaTempElement = document.getElementById("sauna-temperature");
            const saunaStatusElement = document.getElementById("sauna-status");
            const toggleButton = document.getElementById("sauna-toggle");
            const saunaCard = document.getElementById("sauna-info");
            const saunaInfoElement =
                document.querySelector(".sauna-info") || saunaCard;
            
            let temperatureInFahrenheit = 0;
            let targetTempFahrenheit = 0;
            
            let additionalInfoElement = document.getElementById("sauna-additional-info");
            if (!additionalInfoElement) {
                additionalInfoElement = document.createElement("div");
                additionalInfoElement.id = "sauna-additional-info";
                additionalInfoElement.className = "sauna-additional-info";
                saunaInfoElement.insertBefore(additionalInfoElement, toggleButton);
            }
            additionalInfoElement.innerHTML = ''; // Clear previous content
            
            if (data && data.hasOwnProperty('temperature')) {
                temperatureInFahrenheit = Math.round((parseFloat(data.temperature) * 9/5) + 32);
                saunaTempElement.textContent = `${temperatureInFahrenheit}°F`;
            } else {
                saunaTempElement.textContent = "--°F";
            }
            
            if (data && data.hasOwnProperty('targetTemperature')) {
                targetTempFahrenheit = Math.round((parseFloat(data.targetTemperature) * 9/5) + 32);
            }
            
            let isHeating = false;
            let isOffline = false;
            let isLocked = false;
            let isEmergencyStop = false;
            
            if (data && data.hasOwnProperty('statusCode')) {
                const statusCode = data.statusCode;
                
                switch (statusCode) {
                    case 230: // Sauna offline
                        isOffline = true;
                        saunaStatusElement.textContent = "Offline";
                        toggleButton.textContent = "Sauna Offline";
                        toggleButton.disabled = true;
                        toggleButton.classList.add("sauna-disabled");
                        break;
                        
                    case 231: // Online and heating
                        isHeating = true;
                        this.isHeatingOn = true;
                        saunaStatusElement.textContent = "Heating";
                        toggleButton.textContent = "Turn Sauna Off";
                        
                        if (data.targetTemperature) {
                            const ambientTemp = 70; // Assumed room temperature in Fahrenheit
                            const tempProgress = temperatureInFahrenheit - ambientTemp;
                            const totalTempJourney = targetTempFahrenheit - ambientTemp;
                            const progressPercent = Math.min(100, Math.max(0, Math.round((tempProgress / totalTempJourney) * 100)));
                            
                            const estimatedMinutes = data.duration > 0 ? 
                                data.duration : 
                                Math.max(0, Math.round(180 * (1 - (progressPercent / 100))))
                            
                            additionalInfoElement.innerHTML = `
                                <div class="heating-target">Target: ${targetTempFahrenheit}°F</div>
                                <div class="heating-progress">
                                    <div class="progress-bar">
                                <!-- <div class="progress" style="width: ${progressPercent}%"></div> -->
                                    </div>
                                    <div class="progress-text">${progressPercent}% (${estimatedMinutes} min. remaining)</div>
                                </div>
                            `;
                            
                            if (data.duration > 0) {
                                const durationHours = Math.floor(data.duration / 60);
                                const durationMinutes = data.duration % 60;
                                const durationText = durationHours > 0 ? 
                                    `${durationHours}h ${durationMinutes}m` : 
                                    `${durationMinutes}m`;
                                
                                additionalInfoElement.innerHTML += `
                                    <div class="heating-duration">Session duration: ${durationText}</div>
                                `;
                            }
                        }
                        break;
                        
                    case 232: // Online but not heating
                        this.isHeatingOn = false;
                        saunaStatusElement.textContent = "Off";
                        toggleButton.textContent = "Turn Sauna On";
                        if (data.door === false) {
                            additionalInfoElement.innerHTML = `
                                <div class="door-status door-open">Door is open</div>
                                <div class="door-message">Close door to use sauna</div>
                            `;
                            toggleButton.disabled = true;
                            toggleButton.classList.add("sauna-disabled");
                        } else {
                            toggleButton.disabled = false;
                            toggleButton.classList.remove("sauna-disabled");
                        }
                        break;
                        
                    case 233: // Being used by another user and locked
                        isLocked = true;
                        saunaStatusElement.textContent = "In Use";
                        toggleButton.textContent = "Sauna Locked";
                        toggleButton.disabled = true;
                        toggleButton.classList.add("sauna-disabled");
                        additionalInfoElement.innerHTML = `
                            <div class="lock-status">Sauna is currently being used by another user</div>
                        `;
                        break;
                        
                    case 400: // Emergency stop
                        isEmergencyStop = true;
                        saunaStatusElement.textContent = "Emergency Stop";
                        toggleButton.textContent = "Emergency Stop Active";
                        toggleButton.disabled = true;
                        toggleButton.classList.add("sauna-emergency");
                        additionalInfoElement.innerHTML = `
                            <div class="emergency-status">Sauna emergency stop is active</div>
                            <div class="emergency-help">Check sauna control panel</div>
                        `;
                        break;
                        
                    default:
                        saunaStatusElement.textContent = "Unknown";
                        toggleButton.textContent = "Status Unknown";
                        additionalInfoElement.innerHTML = `
                            <div class="status-code">Status code: ${statusCode}</div>
                        `;
                }
                
                toggleButton.classList.toggle("sauna-on-active", isHeating);
                saunaTempElement.classList.toggle("sauna-heating", isHeating);
                saunaStatusElement.classList.toggle("sauna-heating", isHeating);
                
                saunaTempElement.classList.toggle("sauna-off", !isHeating && !isOffline && !isLocked && !isEmergencyStop);
                saunaStatusElement.classList.toggle("sauna-off", !isHeating && !isOffline && !isLocked && !isEmergencyStop);
                
                saunaTempElement.classList.toggle("sauna-offline", isOffline);
                saunaStatusElement.classList.toggle("sauna-offline", isOffline);
                
                saunaTempElement.classList.toggle("sauna-locked", isLocked);
                saunaStatusElement.classList.toggle("sauna-locked", isLocked);
                
                saunaTempElement.classList.toggle("sauna-emergency", isEmergencyStop);
                saunaStatusElement.classList.toggle("sauna-emergency", isEmergencyStop);
                
                this.createSaunaAnimation(saunaCard, isHeating, temperatureInFahrenheit, isOffline, isLocked, isEmergencyStop);
            } else {
                saunaStatusElement.textContent = "Unknown";
                additionalInfoElement.innerHTML = `
                    <div class="status-unknown">Unable to retrieve sauna status</div>
                `;
            }
        } catch (error) {
            console.error("An error occurred while executing updateSaunaUI:", error);
        }
    }
    
    createSaunaAnimation(card, isHeating, temperature, isOffline = false, isLocked = false, isEmergencyStop = false) {
        const container = card.querySelector('.sauna-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        this.createSaunaBackground(container);
        
        if (isOffline) {
            this.createOfflineSaunaEffects(container);
        } else if (isLocked) {
            this.createLockedSaunaEffects(container);
        } else if (isEmergencyStop) {
            this.createEmergencyStopEffects(container);
        } else if (isHeating) {
            this.createHeatedSaunaEffects(container, temperature);
        } else {
            this.createIdleSaunaEffects(container);
        }
    }
    
    createSaunaBackground(container) {
        const ground = document.createElement('div');
        container.appendChild(ground);
        
        const barrelBody = document.createElement('div');
        container.appendChild(barrelBody);
        
        for (let i = 0; i < 8; i++) {
            const slat = document.createElement('div');
            barrelBody.appendChild(slat);
        }
        
        const barrelFront = document.createElement('div');
        barrelBody.appendChild(barrelFront);
        
        const barrelBack = document.createElement('div');
        barrelBody.appendChild(barrelBack);
        
        const door = document.createElement('div');
        barrelBody.appendChild(door);
        
        const doorHandle = document.createElement('div');
        door.appendChild(doorHandle);
        
        const doorWindow = document.createElement('div');
        door.appendChild(doorWindow);
        
        const chimney = document.createElement('div');
        barrelBody.appendChild(chimney);
        
        const steps = document.createElement('div');
        container.appendChild(steps);
    }
    
    createHeatedSaunaEffects(container, temperature) {
        const steamCount = Math.min(Math.max(3, Math.round(temperature / 20)), 8);
        for (let i = 0; i < steamCount; i++) {
            const steam = document.createElement('div');
            
            const delay = i * 1.2;
            const duration = Math.random() * 2 + 3;
            
            container.appendChild(steam);
        }
        
        const windowGlow = document.createElement('div');
        container.appendChild(windowGlow);
        
        const saunaGlow = document.createElement('div');
        container.appendChild(saunaGlow);
        
        if (temperature > 100) {
            const heatDistortion = document.createElement('div');
            container.appendChild(heatDistortion);
            
            const waveCount = Math.min(Math.max(2, Math.round(temperature / 40)), 4);
            for (let i = 0; i < waveCount; i++) {
                const heatWave = document.createElement('div');
                heatDistortion.appendChild(heatWave);
            }
        }
        
        const barrelTint = document.createElement('div');
        container.appendChild(barrelTint);
    }
    
    createIdleSaunaEffects(container) {
        const coolAmbient = document.createElement('div');
        container.appendChild(coolAmbient);
        
        const windowGlow = document.createElement('div');
        container.appendChild(windowGlow);
        
        const moonlight = document.createElement('div');
        container.appendChild(moonlight);
        
        const barrelShadow = document.createElement('div');
        container.appendChild(barrelShadow);
        
        const barrelTint = document.createElement('div');
        container.appendChild(barrelTint);
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 5;
            
            container.appendChild(particle);
        }
    }
    
    createOfflineSaunaEffects(container) {
        const offlineOverlay = document.createElement('div');
        container.appendChild(offlineOverlay);
        
        for (let i = 0; i < 50; i++) {
            const staticDot = document.createElement('div');
            
            const duration = Math.random() * 0.3 + 0.2;
            const delay = Math.random() * 0.5;
            
            offlineOverlay.appendChild(staticDot);
        }
        
        const wifiIcon = document.createElement('div');
        wifiIcon.textContent = '📡';
        
        const slash = document.createElement('div');
        wifiIcon.appendChild(slash);
        
        
        offlineOverlay.appendChild(wifiIcon);
        
    }
    
    createLockedSaunaEffects(container) {
        const lockedOverlay = document.createElement('div');
        container.appendChild(lockedOverlay);
        
        const lockIcon = document.createElement('div');
        
        const lockBody = document.createElement('div');
        lockIcon.appendChild(lockBody);
        
        const lockShackle = document.createElement('div');
        lockIcon.appendChild(lockShackle);
        
        lockedOverlay.appendChild(lockIcon);
        
        for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            
            const delay = i * 1;
            
            lockedOverlay.appendChild(ripple);
        }
        
    }
    
    createEmergencyStopEffects(container) {
        const emergencyOverlay = document.createElement('div');
        container.appendChild(emergencyOverlay);
        
        const warningFlash = document.createElement('div');
        emergencyOverlay.appendChild(warningFlash);
        
        const warningSymbol = document.createElement('div');
        
        const triangle = document.createElement('div');
        warningSymbol.appendChild(triangle);
        
        const exclamation = document.createElement('div');
        warningSymbol.appendChild(exclamation);
        
        const dot = document.createElement('div');
        warningSymbol.appendChild(dot);
        
        emergencyOverlay.appendChild(warningSymbol);
        
    }

    applyDynamicTheme() {
        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth();

        let season = 'spring';
        if (month <= 1 || month === 11) {
            season = 'winter';
        } else if (month >= 2 && month <= 4) {
            season = 'spring';
        } else if (month >= 5 && month <= 7) {
            season = 'summer';
        } else {
            season = 'fall';
        }

        let timeOfDay = 'day';
        if (hour >= 5 && hour < 12) {
            timeOfDay = 'morning';
        } else if (hour >= 12 && hour < 17) {
            timeOfDay = 'day';
        } else if (hour >= 17 && hour < 20) {
            timeOfDay = 'evening';
        } else {
            timeOfDay = 'night';
        }

        const body = document.body;
        body.classList.remove('spring','summer','fall','winter','morning','day','evening','night');
        body.classList.add(season, timeOfDay);
    }


    updateWindStats(currentSpeed, currentGust) {
        const now = new Date();
        const todayStart = now.setHours(0,0,0,0);
        
        if (todayStart > this.lastDayReset) {
            this.dailyWindHigh = 0;
            this.lastDayReset = todayStart;
        }

        const speed = parseFloat(currentSpeed) || 0;
        const gust = parseFloat(currentGust) || 0;
        const maxCurrent = Math.max(speed, gust);
        
        if (maxCurrent > this.dailyWindHigh) {
            this.dailyWindHigh = maxCurrent;
            const highElement = document.querySelector('#wind-combined .high');
            if (highElement) {
                highElement.textContent = `Today's High: ${this.dailyWindHigh.toFixed(1)} mph`;
            }
        }
    }
}

export default WeatherDashboard;
