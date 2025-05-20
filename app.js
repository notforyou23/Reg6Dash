// Add these constants at the top of your file, after the CONFIG
const SAUNA_CONFIG = {
    API_URL: 'https://api.huum.eu/action/home',
    USERNAME: 'notforyou23@gmail.com',
    PASSWORD: 'ofDYxD',
    UPDATE_INTERVAL: 50000 // 50 seconds
};

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

    async fetchRealtimeData(retryCount = 0) {
        const url = new URL('https://api.ecowitt.net/api/v3/device/real_time');
        url.searchParams.append('application_key', CONFIG.APPLICATION_KEY);
        url.searchParams.append('api_key', CONFIG.API_KEY);
        url.searchParams.append('mac', CONFIG.MAC);
        url.searchParams.append('call_back', 'all');

        try {
            const response = await fetch(url);
            if (response.status === 429 && retryCount < this.maxRetries) {
                console.log(`Rate limited, retrying in ${this.retryDelay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.fetchRealtimeData(retryCount + 1);
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching realtime data:', error);
            this.showError(`Failed to fetch weather data: ${error.message}`);
            return null;
        }
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
        
        // Update Outdoor Temperature and Humidity
        const temp = weatherData.outdoor?.temperature?.value;
        const feelsLike = weatherData.outdoor?.feels_like?.value;
        const humidity = weatherData.outdoor?.humidity?.value;
        
        const outdoorCombined = document.querySelector('#outdoor-combined');
        
        if (temp !== undefined && temp !== null) {
            outdoorCombined.querySelector('.temp-value').textContent = `${parseFloat(temp).toFixed(1)}°F`;
            // Add temperature animations
            this.addTemperatureAnimation('#outdoor-combined', parseFloat(temp));
        }
        if (feelsLike !== undefined && feelsLike !== null) {
            outdoorCombined.querySelector('.feels-like').textContent =
                `Feels like ${parseFloat(feelsLike).toFixed(1)}°F`;
        }
        if (humidity !== undefined && humidity !== null) {
            outdoorCombined.querySelector('.humidity-value').textContent = `${parseFloat(humidity).toFixed(0)}%`;
        }
        
        // Update Wind with direction
        const windSpeed = weatherData.wind?.wind_speed?.value;
        const windGust = weatherData.wind?.wind_gust?.value;
        const windDir = weatherData.wind?.wind_direction?.value;
        
        const windCard = document.querySelector('#wind-combined');
        
        if (windSpeed !== undefined && windSpeed !== null) {
            windCard.querySelector('.wind-speed-value').textContent = `${parseFloat(windSpeed).toFixed(1)} mph`;
            // Create wind animation based on speed
            this.createWindAnimation(windCard, parseFloat(windSpeed), windDir);
        }

        if (windGust !== undefined && windGust !== null) {
            windCard.querySelector('.gust').textContent = `Gust: ${parseFloat(windGust).toFixed(1)} mph`;
        }
        
        if (windDir !== undefined) {
            const directionValue = windCard.querySelector('.wind-direction-value');
            directionValue.textContent = this.getWindDirection(windDir);
            directionValue.style.setProperty('--rotation', `${windDir}deg`);
        }

        // Update Pressure with trend and Solar/UV in combined atmospheric card
        const pressure = weatherData.pressure?.relative?.value;
        const solar = weatherData.solar_and_uvi?.solar?.value || '--';
        const uv = weatherData.solar_and_uvi?.uvi?.value || '--';
        
        const atmosphericCard = document.querySelector('#atmospheric-combined');
        
        if (atmosphericCard) {
            // Define trend with a default value
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
            
            // Update Solar & UV in the same card
            atmosphericCard.querySelector('.solar-value').textContent = `${solar} W/m²`;
            
            const uvElement = atmosphericCard.querySelector('.uv-value');
            uvElement.textContent = `UV: ${uv}`;
            
            // Set UV class based on value for appropriate styling
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
            
            // Create atmospheric animation based on pressure trend and UV/solar values
            this.createAtmosphericAnimation(atmosphericCard, trend.class, parseFloat(uv), parseFloat(solar));
        }

        // Update Indoor combined
        const indoorTemp = weatherData.indoor?.temperature?.value || '--';
        const indoorHum = weatherData.indoor?.humidity?.value || '--';
        document.querySelector('#indoor-combined .value').textContent = 
            `${parseFloat(indoorTemp).toFixed(1)}°F | ${indoorHum}%`;
        this.addIndoorAnimation('#indoor-combined', parseFloat(indoorTemp), parseFloat(indoorHum));

        // Update Sauna sensor (Channel 3)
        const ch3 = weatherData.temp_and_humidity_ch3;
        if (ch3) {
            const temp = ch3.temperature?.value || '--';
            const humidity = ch3.humidity?.value || '--';
            document.querySelector('#sauna-sensor .value').textContent = 
                `${temp}°F | ${humidity}%`;
            this.addIndoorAnimation('#sauna-sensor', parseFloat(temp), parseFloat(humidity));
        }

        // Update last updated time
        const now = new Date();
        document.getElementById('update-time').textContent =
            now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        // Calculate progress until next update
        const progress = ((now.getTime() % this.updateInterval) / this.updateInterval) * 100;
        const progressElem = document.getElementById('update-progress');
        if (progressElem) {
            progressElem.style.width = `${progress}%`;
        }

        // Update wind stats
        this.updateWindStats(windSpeed, windGust);
    }
    
    // Weather animation methods
    
    addTemperatureAnimation(selector, temperature) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        // Get the animation container
        const container = card.querySelector('.temp-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        // Create temperature animation based on temperature value
        if (temperature >= 80) {
            // Hot with sun rays and heat waves
            this.createHotTempAnimation(container, temperature);
        } else if (temperature >= 60) {
            // Mild sunny
            this.createMildTempAnimation(container, temperature);
        } else if (temperature >= 40) {
            // Cool with partial clouds
            this.createCoolTempAnimation(container, temperature);
        } else {
            // Cold with snow or frost
            this.createColdTempAnimation(container, temperature);
        }
    }
    
    createHotTempAnimation(container, temperature) {
        // Add a sun in the top right
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.position = 'absolute';
        sun.style.top = '20px';
        sun.style.right = '20px';
        sun.style.width = '60px';
        sun.style.height = '60px';
        sun.style.background = '#f59e0b';
        sun.style.borderRadius = '50%';
        sun.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.9)';
        sun.style.animation = 'pulse-sun 3s infinite alternate';
        container.appendChild(sun);
        
        // Add heat wave effects
        for (let i = 0; i < 8; i++) {
            const heatWave = document.createElement('div');
            heatWave.style.position = 'absolute';
            
            // Random positions throughout the container
            heatWave.style.top = `${Math.random() * 80 + 10}%`;
            heatWave.style.left = `${Math.random() * 80 + 10}%`;
            
            // Size variations
            const size = Math.random() * 40 + 50;
            heatWave.style.width = `${size}px`;
            heatWave.style.height = `${size}px`;
            
            // Styling
            heatWave.style.background = 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 70%)';
            heatWave.style.borderRadius = '50%';
            
            // Animation
            const duration = Math.random() * 4 + 4;
            const delay = Math.random() * 6;
            heatWave.style.animation = `heat-pulse ${duration}s ${delay}s infinite alternate`;
            
            container.appendChild(heatWave);
        }
        
        // Add keyframes for heat wave animation
        const style = document.createElement('style');
        style.textContent = `
        @keyframes heat-pulse {
            0% { transform: scale(0.8); opacity: 0.2; }
            100% { transform: scale(1.2); opacity: 0.6; }
        }`;
        document.head.appendChild(style);
    }
    
    createMildTempAnimation(container, temperature) {
        // Mild sun
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.position = 'absolute';
        sun.style.top = '30px';
        sun.style.right = '30px';
        sun.style.width = '50px';
        sun.style.height = '50px';
        sun.style.background = '#f59e0b';
        sun.style.borderRadius = '50%';
        sun.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.7)';
        sun.style.animation = 'pulse-sun 4s infinite alternate';
        container.appendChild(sun);
        
        // Add some light clouds
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.style.position = 'absolute';
            cloud.style.bottom = `${Math.random() * 40 + 20}%`;
            cloud.style.left = `${Math.random() * 40}%`;
            
            const cloudWidth = Math.random() * 40 + 60;
            cloud.style.width = `${cloudWidth}px`;
            cloud.style.height = `${cloudWidth * 0.6}px`;
            cloud.style.background = 'rgba(255, 255, 255, 0.15)';
            cloud.style.borderRadius = '50px';
            cloud.style.filter = 'blur(5px)';
            
            const duration = Math.random() * 20 + 40;
            cloud.style.animation = `float-cloud ${duration}s infinite alternate ease-in-out`;
            
            container.appendChild(cloud);
        }
    }
    
    createCoolTempAnimation(container, temperature) {
        // Smaller sun with clouds
        const sun = document.createElement('div');
        sun.style.position = 'absolute';
        sun.style.top = '30px';
        sun.style.right = '40px';
        sun.style.width = '35px';
        sun.style.height = '35px';
        sun.style.background = '#fcd34d';
        sun.style.borderRadius = '50%';
        sun.style.boxShadow = '0 0 15px rgba(252, 211, 77, 0.6)';
        sun.style.zIndex = '2';
        container.appendChild(sun);
        
        // Add more clouds for the cool weather
        for (let i = 0; i < 5; i++) {
            const cloud = document.createElement('div');
            cloud.style.position = 'absolute';
            cloud.style.top = `${Math.random() * 70 + 15}%`;
            cloud.style.left = `${Math.random() * 70}%`;
            
            const cloudWidth = Math.random() * 60 + 60;
            cloud.style.width = `${cloudWidth}px`;
            cloud.style.height = `${cloudWidth * 0.6}px`;
            cloud.style.background = 'rgba(203, 213, 225, 0.25)';
            cloud.style.borderRadius = '50px';
            cloud.style.filter = 'blur(4px)';
            
            const duration = Math.random() * 20 + 40;
            const delay = Math.random() * 10;
            cloud.style.animation = `float-cloud ${duration}s ${delay}s infinite alternate ease-in-out`;
            
            container.appendChild(cloud);
        }
    }
    
    createColdTempAnimation(container, temperature) {
        // Add a dark cloud covering much of the area
        const darkCloud = document.createElement('div');
        darkCloud.style.position = 'absolute';
        darkCloud.style.top = '20%';
        darkCloud.style.left = '20%';
        darkCloud.style.width = '75%';
        darkCloud.style.height = '35%';
        darkCloud.style.background = 'rgba(148, 163, 184, 0.3)';
        darkCloud.style.borderRadius = '50px';
        darkCloud.style.filter = 'blur(10px)';
        darkCloud.style.animation = 'float-cloud 60s infinite alternate ease-in-out';
        container.appendChild(darkCloud);
        
        // Add snowflakes for very cold weather
        for (let i = 0; i < 20; i++) {
            const snowflake = document.createElement('div');
            snowflake.style.position = 'absolute';
            snowflake.style.top = `${Math.random() * 40}%`;
            snowflake.style.left = `${Math.random() * 90 + 5}%`;
            
            const size = Math.random() * 4 + 2;
            snowflake.style.width = `${size}px`;
            snowflake.style.height = `${size}px`;
            snowflake.style.background = 'rgba(255, 255, 255, 0.8)';
            snowflake.style.borderRadius = '50%';
            snowflake.style.filter = 'blur(0.5px)';
            
            const fallDuration = Math.random() * 10 + 15;
            const delay = Math.random() * 10;
            snowflake.style.animation = `snowfall ${fallDuration}s ${delay}s infinite linear`;
            
            container.appendChild(snowflake);
        }
        
        // Add keyframes for snowfall animation
        const style = document.createElement('style');
        style.textContent = `
        @keyframes snowfall {
            0% { 
                transform: translateY(-20px) rotate(0deg); 
                opacity: 0; 
            }
            20% { 
                opacity: 0.8;
            }
            100% { 
                transform: translateY(200px) rotate(360deg); 
                opacity: 0;
            }
        }`;
        document.head.appendChild(style);
    }
    
    addHumidityAnimation(selector, humidity) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        // First remove any existing animations to avoid conflicts
        this.removeExistingAnimations(card);
        
        // Create new container
        const container = document.createElement('div');
        container.className = 'weather-icon-container';
        
        // Create humidity element
        const humidityEl = document.createElement('div');
        humidityEl.className = 'humidity';
        
        // Create droplet
        const droplet = document.createElement('div');
        droplet.className = 'droplet';
        
        // Adjust color based on humidity
        if (humidity > 80) {
            droplet.style.background = '#3b82f6'; // More saturated blue for high humidity
        } else if (humidity > 60) {
            droplet.style.background = '#60a5fa'; // Medium blue
        } else if (humidity > 40) {
            droplet.style.background = '#93c5fd'; // Light blue
        } else {
            droplet.style.background = '#bfdbfe'; // Very light blue for low humidity
            droplet.style.opacity = '0.7';
        }
        
        humidityEl.appendChild(droplet);
        container.appendChild(humidityEl);
        card.appendChild(container);
    }
    
    addPressureAnimation(selector, trendClass) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        // First remove any existing animations to avoid conflicts
        this.removeExistingAnimations(card);
        
        // Create new container
        const container = document.createElement('div');
        container.className = 'weather-icon-container';
        
        // Create pressure icon
        const pressureIcon = document.createElement('div');
        pressureIcon.className = 'pressure-icon';
        
        // Create pressure circle and arrow
        const circle = document.createElement('div');
        circle.className = 'pressure-circle';
        
        const arrow = document.createElement('div');
        arrow.className = 'pressure-arrow';
        
        // Set arrow rotation based on trend
        if (trendClass.includes('rising')) {
            arrow.style.transform = 'rotate(-30deg)';
            circle.style.borderColor = '#10b981'; // Green for rising
        } else if (trendClass.includes('falling')) {
            arrow.style.transform = 'rotate(30deg)';
            circle.style.borderColor = '#ef4444'; // Red for falling
        } else {
            arrow.style.transform = 'rotate(0deg)';
            circle.style.borderColor = '#60a5fa'; // Blue for steady
        }
        
        pressureIcon.appendChild(circle);
        pressureIcon.appendChild(arrow);
        container.appendChild(pressureIcon);
        card.appendChild(container);
    }
    
    createAtmosphericAnimation(card, trendClass, uvIndex, solarValue) {
        // Get the animation container
        const container = card.querySelector('.atmos-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        // Create appropriate animations based on pressure trend, UV index, and solar radiation
        this.createPressureAnimation(container, trendClass);
        
        // Create a sun/UV animation if we have valid values
        if (!isNaN(uvIndex) || !isNaN(solarValue)) {
            this.createSolarAnimation(container, uvIndex, solarValue);
        }
        
        // Add some atmospheric particles
        this.addAtmosphericParticles(container, trendClass);
    }
    
    createPressureAnimation(container, trendClass) {
        // Create pressure system visualization
        const pressureSystem = document.createElement('div');
        pressureSystem.className = 'pressure-system';
        pressureSystem.style.position = 'absolute';
        pressureSystem.style.width = '120px';
        pressureSystem.style.height = '120px';
        pressureSystem.style.top = '40%';
        pressureSystem.style.left = '30%';
        pressureSystem.style.transform = 'translate(-50%, -50%)';
        pressureSystem.style.borderRadius = '50%';
        pressureSystem.style.opacity = '0.2';
        
        // Different styling based on pressure trend
        if (trendClass.includes('rising')) {
            // High pressure system - clockwise rotation, blue gradient
            pressureSystem.style.border = '2px solid rgba(59, 130, 246, 0.3)';
            pressureSystem.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 70%)';
            pressureSystem.style.animation = 'rotate-clockwise 60s linear infinite';
        } else if (trendClass.includes('falling')) {
            // Low pressure system - counter-clockwise rotation, red gradient
            pressureSystem.style.border = '2px solid rgba(239, 68, 68, 0.3)';
            pressureSystem.style.background = 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0) 70%)';
            pressureSystem.style.animation = 'rotate-counterclockwise 60s linear infinite';
        } else {
            // Steady pressure - subtle pulse, neutral gradient
            pressureSystem.style.border = '2px solid rgba(148, 163, 184, 0.3)';
            pressureSystem.style.background = 'radial-gradient(circle, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0) 70%)';
            pressureSystem.style.animation = 'pulse-pressure 4s ease-in-out infinite alternate';
        }
        
        container.appendChild(pressureSystem);
        
        // Add rotation keyframes if they don't exist yet
        const styleElement = document.getElementById('atmos-keyframes');
        if (!styleElement) {
            const style = document.createElement('style');
            style.id = 'atmos-keyframes';
            style.textContent = `
            @keyframes rotate-clockwise {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            @keyframes rotate-counterclockwise {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(-360deg); }
            }
            
            @keyframes pulse-pressure {
                0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.1; }
                100% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.3; }
            }`;
            document.head.appendChild(style);
        }
    }
    
    createSolarAnimation(container, uvIndex, solarValue) {
        // Create a sun with size based on solar radiation and color based on UV
        const sun = document.createElement('div');
        sun.className = 'atmospheric-sun';
        sun.style.position = 'absolute';
        sun.style.top = '30%';
        sun.style.right = '25%';
        
        // Size based on solar radiation (if available)
        const solarSize = !isNaN(solarValue) ? 
            Math.min(65, Math.max(30, 30 + (solarValue / 20))) : 40;
        
        sun.style.width = `${solarSize}px`;
        sun.style.height = `${solarSize}px`;
        sun.style.borderRadius = '50%';
        
        // Color and glow based on UV index
        if (!isNaN(uvIndex)) {
            if (uvIndex >= 11) {
                // Extreme UV
                sun.style.background = '#7e22ce';
                sun.style.boxShadow = '0 0 30px rgba(126, 34, 206, 0.7)';
                sun.style.animation = 'uv-extreme-pulse 2s infinite alternate';
            } else if (uvIndex >= 8) {
                // Very High UV
                sun.style.background = '#ef4444';
                sun.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.7)';
            } else if (uvIndex >= 6) {
                // High UV
                sun.style.background = '#f97316';
                sun.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.7)';
            } else if (uvIndex >= 3) {
                // Moderate UV
                sun.style.background = '#facc15';
                sun.style.boxShadow = '0 0 15px rgba(250, 204, 21, 0.7)';
            } else {
                // Low UV
                sun.style.background = '#4ade80';
                sun.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.7)';
            }
        } else {
            // Default if no UV data
            sun.style.background = '#fcd34d';
            sun.style.boxShadow = '0 0 15px rgba(252, 211, 77, 0.7)';
        }
        
        // Add a pulsing animation
        sun.style.animation = sun.style.animation || 'pulse-sun 4s infinite alternate';
        
        // Add UV rays if we have UV data
        if (!isNaN(uvIndex) && uvIndex > 0) {
            // Add more rays for higher UV
            const rayCount = Math.min(20, Math.max(8, Math.floor(uvIndex * 2)));
            
            for (let i = 0; i < rayCount; i++) {
                const ray = document.createElement('div');
                ray.style.position = 'absolute';
                ray.style.top = '50%';
                ray.style.left = '50%';
                ray.style.width = '2px';
                ray.style.height = `${Math.min(25, Math.max(10, uvIndex * 2))}px`;
                ray.style.transformOrigin = 'center bottom';
                ray.style.transform = `rotate(${i * (360 / rayCount)}deg) translateY(-25px)`;
                
                // Ray color based on UV
                if (uvIndex >= 11) ray.style.background = '#7e22ce'; // Extreme
                else if (uvIndex >= 8) ray.style.background = '#ef4444'; // Very high
                else if (uvIndex >= 6) ray.style.background = '#f97316'; // High
                else if (uvIndex >= 3) ray.style.background = '#facc15'; // Moderate
                else ray.style.background = '#4ade80'; // Low
                
                sun.appendChild(ray);
            }
        }
        
        container.appendChild(sun);
        
        // Add UV extreme pulse animation if needed
        if (!isNaN(uvIndex) && uvIndex >= 11) {
            const uvStyle = document.createElement('style');
            uvStyle.textContent = `
            @keyframes uv-extreme-pulse {
                0% { background: #7e22ce; box-shadow: 0 0 30px rgba(126, 34, 206, 0.7); }
                100% { background: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.7); }
            }`;
            document.head.appendChild(uvStyle);
        }
    }
    
    addAtmosphericParticles(container, trendClass) {
        // Add some ambient particles that float around based on pressure trend
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            
            // Random positions
            particle.style.top = `${Math.random() * 80 + 10}%`;
            particle.style.left = `${Math.random() * 80 + 10}%`;
            
            // Size variations
            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.borderRadius = '50%';
            
            // Color varies by pressure trend
            let color;
            if (trendClass.includes('rising')) {
                // Blue-ish for high pressure
                color = `rgba(${80 + Math.random() * 40}, ${140 + Math.random() * 60}, ${220 + Math.random() * 35}, ${0.3 + Math.random() * 0.3})`;
            } else if (trendClass.includes('falling')) {
                // Red-ish for low pressure
                color = `rgba(${220 + Math.random() * 35}, ${80 + Math.random() * 40}, ${80 + Math.random() * 40}, ${0.3 + Math.random() * 0.3})`;
            } else {
                // Neutral for steady pressure
                color = `rgba(${180 + Math.random() * 40}, ${180 + Math.random() * 40}, ${180 + Math.random() * 40}, ${0.2 + Math.random() * 0.2})`;
            }
            
            particle.style.background = color;
            particle.style.boxShadow = `0 0 ${size + 1}px ${color.replace(')', ', 0.5)')}`;
            
            // Animation direction based on trend
            const duration = Math.random() * 30 + 30;
            let animationName;
            
            if (trendClass.includes('rising')) {
                animationName = 'float-rise';
            } else if (trendClass.includes('falling')) {
                animationName = 'float-fall';
            } else {
                animationName = 'float-steady';
            }
            
            particle.style.animation = `${animationName} ${duration}s linear infinite`;
            
            container.appendChild(particle);
        }
        
        // Add keyframes for particle movement if they don't exist
        const particleStyle = document.getElementById('atmos-particle-keyframes');
        if (!particleStyle) {
            const style = document.createElement('style');
            style.id = 'atmos-particle-keyframes';
            style.textContent = `
            @keyframes float-rise {
                0% {
                    transform: translate(0, 0) rotate(0deg);
                    opacity: 0.1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate(0, -100px) rotate(360deg);
                    opacity: 0.1;
                }
            }
            
            @keyframes float-fall {
                0% {
                    transform: translate(0, -50px) rotate(0deg);
                    opacity: 0.1;
                }
                50% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate(0, 50px) rotate(360deg);
                    opacity: 0.1;
                }
            }
            
            @keyframes float-steady {
                0% {
                    transform: translate(-20px, 0) rotate(0deg);
                    opacity: 0.1;
                }
                50% {
                    opacity: 0.6;
                    transform: translate(20px, 0) rotate(180deg);
                }
                100% {
                    transform: translate(-20px, 0) rotate(360deg);
                    opacity: 0.1;
                }
            }`;
            document.head.appendChild(style);
        }
    }
    
    createWindAnimation(card, windSpeed, windDirection) {
        // Clear any existing animation
        const container = card.querySelector('.wind-animation-container');
        if (container) {
            container.innerHTML = '';
        }
        
        // Create gradient background flow effect based on wind direction
        const directionOffset = windDirection ? (windDirection - 90) : 0;
        const gradientDirection = `${directionOffset}deg`;
        
        // Create turbulence background effect - make it more dynamic
        const turbulence = document.createElement('div');
        turbulence.className = 'wind-turbulence';
        turbulence.style.background = `linear-gradient(${gradientDirection}, 
            rgba(96, 165, 250, 0) 0%, 
            rgba(96, 165, 250, ${0.05 + (windSpeed * 0.005)}) 50%, 
            rgba(96, 165, 250, 0) 100%)`;
        
        // Adjust animation speed based on wind speed
        const turbulenceSpeed = Math.max(1, Math.min(15, 15 - windSpeed * 0.7));
        turbulence.style.animationDuration = `${turbulenceSpeed}s`;
        
        container.appendChild(turbulence);
        
        // Create particle container
        const particles = document.createElement('div');
        particles.className = 'wind-particles';
        container.appendChild(particles);
        
        // Create directional arrow indicator
        const arrowContainer = document.createElement('div');
        arrowContainer.className = 'wind-direction-arrow';
        arrowContainer.style.transform = `rotate(${windDirection}deg)`;
        
        // Adjust size based on wind speed
        const arrowSize = Math.min(80, Math.max(30, 30 + windSpeed * 2));
        arrowContainer.style.width = `${arrowSize}px`;
        arrowContainer.style.height = `${arrowSize}px`;
        
        // Add pulse animation speed based on wind speed
        const pulseSpeed = Math.max(1, 3 - (windSpeed * 0.1));
        arrowContainer.style.animationDuration = `${pulseSpeed}s`;
        
        container.appendChild(arrowContainer);
        
        // Adjust particle count and speed based on wind speed
        const particleCount = Math.min(Math.max(Math.round(windSpeed * 3), 8), 60);
        const baseSpeed = Math.max(1, Math.min(8, windSpeed * 0.4));
        
        // Create different types of particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'wind-particle';
            
            // Randomize particle properties
            const size = Math.random() * 4 + 1; // 1-5px
            const yPos = Math.random() * 100; // 0-100%
            const xPos = Math.random() * 100; // 0-100%
            
            // Create varied speeds with correlation to size (smaller = faster)
            const speedFactor = windSpeed * (1 / size) * 0.8;
            const speed = (Math.random() * 1.5 + 0.5) * baseSpeed * speedFactor; 
            const delay = Math.random() * 6; // Random start times
            
            // Small particles are more transparent
            const opacity = Math.min(0.9, (size * 0.15) + (Math.random() * 0.2) + 0.2);
            
            // Color varies slightly
            const hue = 210 + (Math.random() * 20 - 10); // Blue-ish
            const sat = 70 + (Math.random() * 30); // Medium-high saturation
            const light = 70 + (Math.random() * 20); // Light color
            const color = `hsla(${hue}, ${sat}%, ${light}%, ${opacity})`;
            
            // Set particle styles
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.top = `${yPos}%`;
            particle.style.left = `${xPos}%`;
            particle.style.background = color;
            
            // Create dynamic animation properties
            const keyframes = `
            @keyframes particle-${i} {
                0% {
                    transform: translate(0, 0) rotate(0deg);
                    opacity: ${opacity};
                }
                100% {
                    transform: translate(${-120 - Math.random() * 30}%, ${(Math.random() * 40 - 20)}%) rotate(${Math.random() * 360}deg);
                    opacity: 0;
                }
            }`;
            
            // Create and append style element
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            // Apply animation
            particle.style.animation = `particle-${i} ${10/speed}s ${-delay}s linear infinite`;
            
            particles.appendChild(particle);
        }
        
        // Create wind lines for texture - vary by wind speed
        const lineCount = Math.min(Math.max(Math.round(windSpeed * 0.7), 5), 15);
        
        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            line.className = 'wind-line';
            
            // Randomize line properties
            const yPos = Math.random() * 100; // 0-100%
            const xPos = Math.random() * 40 + 60; // 60-100% (right side)
            const width = Math.random() * 40 + (windSpeed * 1.5); // Longer lines for higher speed
            
            // Apply direction to lines with some natural variation
            const angle = (Math.random() * 15 - 7.5) + (windDirection ? (windDirection - 90) : 0);
            
            // Higher wind speeds get more visible lines
            const lineOpacity = Math.min(0.7, 0.1 + (windSpeed * 0.02) + (Math.random() * 0.1));
            
            // Animation speed based on wind speed
            const lineSpeed = 4 - (Math.min(3, windSpeed * 0.15));
            const lineDelay = Math.random() * 3;
            
            // Longer lines for stronger winds
            line.style.top = `${yPos}%`;
            line.style.left = `${xPos}%`;
            line.style.width = `${width}%`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.opacity = lineOpacity.toString();
            line.style.animation = `wind-line-move ${lineSpeed}s ${-lineDelay}s linear infinite`;
            
            // Width of the line varies with wind speed
            line.style.height = `${Math.max(1, Math.min(3, windSpeed * 0.1))}px`;
            
            // Color intensity based on wind speed
            const lineColor = `rgba(255,255,255,${Math.min(0.8, 0.2 + (windSpeed * 0.03))})`;
            line.style.background = lineColor;
            
            particles.appendChild(line);
        }
        
        // Create some vortex effects for stronger winds
        if (windSpeed > 8) {
            const vortexCount = Math.floor((windSpeed - 8) / 3) + 1;
            
            for (let i = 0; i < vortexCount; i++) {
                const vortex = document.createElement('div');
                vortex.className = 'wind-vortex';
                
                // Position randomly but more to the left (upwind)
                const yPos = Math.random() * 80 + 10;
                const xPos = Math.random() * 60 + 20;
                
                // Size based on wind speed
                const size = Math.random() * 10 + (windSpeed * 0.7);
                
                // Animation speed based on wind speed
                const rotateSpeed = Math.max(1.5, 6 - (windSpeed * 0.2));
                const moveSpeed = Math.max(3, 10 - (windSpeed * 0.4)); 
                
                vortex.style.top = `${yPos}%`;
                vortex.style.left = `${xPos}%`;
                vortex.style.width = `${size}px`;
                vortex.style.height = `${size}px`;
                vortex.style.animationDuration = `${rotateSpeed}s, ${moveSpeed}s`;
                vortex.style.animationDelay = `0s, ${Math.random() * -5}s`;
                
                particles.appendChild(vortex);
            }
        }
    }
    
    
    addIndoorAnimation(selector, temperature, humidity) {
        const card = document.querySelector(selector);
        if (!card) return;
        
        // Get the animation container
        const container = card.querySelector('.home-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        // Create a cozy home animation
        this.createHomeAnimation(container, temperature, humidity);
    }
    
    createHomeAnimation(container, temperature, humidity) {
        // Create a house with windows
        const house = document.createElement('div');
        house.style.position = 'absolute';
        house.style.top = '50%';
        house.style.left = '50%';
        house.style.transform = 'translate(-50%, -50%)';
        house.style.width = '80px';
        house.style.height = '60px';
        house.style.background = '#c084fc';
        house.style.borderRadius = '5px';
        house.style.boxShadow = '0 0 15px rgba(192, 132, 252, 0.3)';
        house.style.zIndex = '2';
        container.appendChild(house);
        
        // Create a roof
        const roof = document.createElement('div');
        roof.style.position = 'absolute';
        roof.style.top = '-25px';
        roof.style.left = '-10px';
        roof.style.width = '100px';
        roof.style.height = '30px';
        roof.style.background = '#a855f7';
        roof.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        roof.style.zIndex = '3';
        house.appendChild(roof);
        
        // Add windows that glow
        const windowLeft = document.createElement('div');
        windowLeft.style.position = 'absolute';
        windowLeft.style.top = '15px';
        windowLeft.style.left = '15px';
        windowLeft.style.width = '15px';
        windowLeft.style.height = '15px';
        windowLeft.style.background = 'rgba(255, 255, 220, 0.9)';
        windowLeft.style.borderRadius = '2px';
        windowLeft.style.boxShadow = '0 0 10px rgba(255, 255, 200, 0.5)';
        windowLeft.style.animation = 'window-glow 4s infinite alternate';
        house.appendChild(windowLeft);
        
        const windowRight = document.createElement('div');
        windowRight.style.position = 'absolute';
        windowRight.style.top = '15px';
        windowRight.style.right = '15px';
        windowRight.style.width = '15px';
        windowRight.style.height = '15px';
        windowRight.style.background = 'rgba(255, 255, 220, 0.9)';
        windowRight.style.borderRadius = '2px';
        windowRight.style.boxShadow = '0 0 10px rgba(255, 255, 200, 0.5)';
        windowRight.style.animation = 'window-glow 4.5s 0.5s infinite alternate';
        house.appendChild(windowRight);
        
        // Add a door
        const door = document.createElement('div');
        door.style.position = 'absolute';
        door.style.bottom = '0';
        door.style.left = '50%';
        door.style.transform = 'translateX(-50%)';
        door.style.width = '20px';
        door.style.height = '30px';
        door.style.background = '#9333ea';
        door.style.borderRadius = '3px 3px 0 0';
        house.appendChild(door);
        
        // Add doorknob
        const doorknob = document.createElement('div');
        doorknob.style.position = 'absolute';
        doorknob.style.top = '50%';
        doorknob.style.right = '3px';
        doorknob.style.width = '3px';
        doorknob.style.height = '3px';
        doorknob.style.background = '#ffd700';
        doorknob.style.borderRadius = '50%';
        door.appendChild(doorknob);
        
        // Add smoke coming from chimney if it's cold outside
        if (temperature < 50) {
            const chimney = document.createElement('div');
            chimney.style.position = 'absolute';
            chimney.style.top = '-15px';
            chimney.style.right = '20px';
            chimney.style.width = '10px';
            chimney.style.height = '20px';
            chimney.style.background = '#a855f7';
            chimney.style.borderRadius = '2px';
            chimney.style.zIndex = '1';
            house.appendChild(chimney);
            
            // Add smoke particles
            for (let i = 0; i < 5; i++) {
                const smoke = document.createElement('div');
                smoke.style.position = 'absolute';
                smoke.style.bottom = '100%';
                smoke.style.left = '50%';
                smoke.style.transform = 'translateX(-50%)';
                smoke.style.width = '15px';
                smoke.style.height = '15px';
                smoke.style.background = 'rgba(200, 200, 200, 0.4)';
                smoke.style.borderRadius = '50%';
                smoke.style.filter = 'blur(2px)';
                
                const delay = i * 1.5;
                smoke.style.animation = `rise-fade 4s ${delay}s infinite`;
                
                chimney.appendChild(smoke);
            }
        }
        
        // Add ambient effects around the house
        this.addHomeAmbientEffects(container, temperature);
        
        // Add keyframes for animations
        const style = document.createElement('style');
        style.textContent = `
        @keyframes window-glow {
            0% { opacity: 0.7; box-shadow: 0 0 5px rgba(255, 255, 200, 0.3); }
            100% { opacity: 1; box-shadow: 0 0 15px rgba(255, 255, 200, 0.8); }
        }
        
        @keyframes rise-fade {
            0% { 
                transform: translate(-50%, 0) scale(0.8); 
                opacity: 0.8;
            }
            100% { 
                transform: translate(-50%, -50px) scale(1.5); 
                opacity: 0;
            }
        }`;
        document.head.appendChild(style);
    }
    
    addHomeAmbientEffects(container, temperature) {
        // Add ground/lawn
        const ground = document.createElement('div');
        ground.style.position = 'absolute';
        ground.style.bottom = '0';
        ground.style.left = '0';
        ground.style.width = '100%';
        ground.style.height = '20%';
        
        // Different ground based on temperature
        if (temperature < 32) {
            // Snow
            ground.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))';
        } else {
            // Grass
            ground.style.background = 'linear-gradient(to bottom, rgba(74, 222, 128, 0.2), rgba(74, 222, 128, 0.05))';
        }
        
        ground.style.borderRadius = '0 0 5px 5px';
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
        const data = await this.fetchRealtimeData();
        if (data) {
            this.updateUI(data);
        }
    }

    initTimeDisplays() {
        const updateTimes = () => {
            const now = new Date();

            // Leonardo, NJ (Eastern Time)
            const leonardoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
            document.getElementById('leonardo-time').textContent =
                leonardoTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

            // Florence, Italy (Central European Time)
            const florenceTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
            document.getElementById('florence-time').textContent =
                florenceTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });

            // Update liquid fill effect with spring animation
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();

            // Make it smoother by including milliseconds (0-1 value for the current second)
            const fillPercentage = ((seconds + (milliseconds / 1000)) / 60) * 100;

            // Apply the fill height to the fill elements with a slight delay between them
            document.querySelectorAll('.time-fill').forEach((fill, index) => {
                // Add a slight stagger effect between the fills
                setTimeout(() => {
                    fill.style.height = `${fillPercentage}%`;
                }, index * 100);
            });

            // Add subtle glow effect instead of pulse
            document.querySelectorAll('.time').forEach((timeElement, index) => {
                // Create subtle color animation based on seconds and minutes
                const hue1 = index === 0 ? 230 : 330; // Base hue for each clock (blue/purple)
                const hue2 = index === 0 ? 250 : 350; // Target hue (slightly different)

                // Calculate progress through the minute for subtle animation
                const progress = seconds / 60;
                const opacity = 0.8 + (Math.sin(progress * Math.PI) * 0.2);

                // Apply gradient with subtle animation
                timeElement.style.background = `linear-gradient(to right,
                    hsl(${hue1}, 80%, 75%, ${opacity}) 0%,
                    hsl(${hue2}, 80%, 65%, ${opacity}) 100%)`;
                timeElement.style.opacity = opacity;
            });
        };

        // Add CSS for better time display
        const style = document.createElement('style');
        style.textContent = `
            .time {
                transition: opacity 0.5s ease, background 0.5s ease;
                background-clip: text !important;
                -webkit-background-clip: text !important;
                color: transparent !important;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
            }
        `;
        document.head.appendChild(style);

        updateTimes();
        setInterval(updateTimes, 50); // More frequent updates for smoother fill
    }

    initSaunaControl() {
        this.isHeatingOn = false;
        this.setupSaunaListeners();
        this.fetchSaunaData();
        setInterval(() => this.fetchSaunaData(), SAUNA_CONFIG.UPDATE_INTERVAL);
    }

    setupSaunaListeners() {
        const toggleButton = document.getElementById('sauna-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleSauna());
        }
    }

    getBasicAuthHeader() {
        return btoa(`${SAUNA_CONFIG.USERNAME}:${SAUNA_CONFIG.PASSWORD}`);
    }

    async toggleSauna() {
        this.isHeatingOn = !this.isHeatingOn;
        const endpoint = this.isHeatingOn ? "start" : "stop";
        const url = `${SAUNA_CONFIG.API_URL}/${endpoint}`;
        const headers = new Headers({
            "Authorization": `Basic ${this.getBasicAuthHeader()}`,
            "Content-Type": "application/json"
        });
        // Updated target temperature to 188°F (86.67°C) and set duration to 3 hours (180 minutes)
        const body = this.isHeatingOn ? JSON.stringify({ 
            targetTemperature: 86.67,
            duration: 180
        }) : null;
        try {
            const response = await fetch(url, { method: 'POST', headers: headers, body: body });
            if (!response.ok) {
                throw new Error(`Sauna ${this.isHeatingOn ? "start" : "stop"} request failed: ${response.statusText}`);
            }
            await this.fetchSaunaData();
        } catch (error) {
            console.error(`Sauna ${this.isHeatingOn ? "start" : "stop"} Error:`, error);
            this.showError(`Failed to ${this.isHeatingOn ? "start" : "stop"} sauna: ${error.message}`);
            this.isHeatingOn = !this.isHeatingOn;
        }
    }

    async fetchSaunaData() {
        const url = `${SAUNA_CONFIG.API_URL}/status`;
        const headers = new Headers({
            "Authorization": `Basic ${this.getBasicAuthHeader()}`
        });
        try {
            const response = await fetch(url, { method: 'GET', headers: headers });
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            this.updateSaunaUI(data);
        } catch (error) {
            console.error("Fetch Sauna Data Error:", error);
            this.showError(`Failed to fetch sauna data: ${error.message}`);
        }
    }

    updateSaunaUI(data) {
        try {
            const saunaTempElement = document.getElementById("sauna-temperature");
            const saunaStatusElement = document.getElementById("sauna-status");
            const toggleButton = document.getElementById("sauna-toggle");
            const saunaCard = document.getElementById("sauna-info");
            const saunaInfoElement = document.querySelector(".sauna-info");
            
            let temperatureInFahrenheit = 0;
            let targetTempFahrenheit = 0;
            
            // Create or get additional info element for extra sauna details
            let additionalInfoElement = document.getElementById("sauna-additional-info");
            if (!additionalInfoElement) {
                additionalInfoElement = document.createElement("div");
                additionalInfoElement.id = "sauna-additional-info";
                additionalInfoElement.className = "sauna-additional-info";
                // Insert before the toggle button
                saunaInfoElement.insertBefore(additionalInfoElement, toggleButton);
            }
            additionalInfoElement.innerHTML = ''; // Clear previous content
            
            if (data && data.hasOwnProperty('temperature')) {
                temperatureInFahrenheit = Math.round((parseFloat(data.temperature) * 9/5) + 32);
                saunaTempElement.textContent = `${temperatureInFahrenheit}°F`;
            } else {
                saunaTempElement.textContent = "--°F";
            }
            
            // Get target temperature if available
            if (data && data.hasOwnProperty('targetTemperature')) {
                targetTempFahrenheit = Math.round((parseFloat(data.targetTemperature) * 9/5) + 32);
            }
            
            // Handle different status codes
            let isHeating = false;
            let isOffline = false;
            let isLocked = false;
            let isEmergencyStop = false;
            
            if (data && data.hasOwnProperty('statusCode')) {
                const statusCode = data.statusCode;
                
                // Handle different status codes
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
                        
                        // Add heating progress information
                        if (data.targetTemperature) {
                            // Calculate progress based on relative temperature gain, not absolute values
                            // Start from ambient temperature (assume ~70°F as room temperature base)
                            const ambientTemp = 70; // Assumed room temperature in Fahrenheit
                            const tempProgress = temperatureInFahrenheit - ambientTemp;
                            const totalTempJourney = targetTempFahrenheit - ambientTemp;
                            const progressPercent = Math.min(100, Math.max(0, Math.round((tempProgress / totalTempJourney) * 100)));
                            
                            // Calculate remaining time more accurately based on duration and progress
                            // If we have duration info use it, otherwise estimate based on temperature
                            const estimatedMinutes = data.duration > 0 ? 
                                data.duration : 
                                Math.max(0, Math.round(180 * (1 - (progressPercent / 100))))
                            
                            // Add the heating progress bar
                            additionalInfoElement.innerHTML = `
                                <div class="heating-target">Target: ${targetTempFahrenheit}°F</div>
                                <div class="heating-progress">
                                    <div class="progress-bar">
                                        <div class="progress" style="width: ${progressPercent}%"></div>
                                    </div>
                                    <div class="progress-text">${progressPercent}% (${estimatedMinutes} min. remaining)</div>
                                </div>
                            `;
                            
                            // Add heating duration if available
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
                
                // Update UI classes based on state
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
                
                // Create sauna animation based on status and temperature
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
        // Get the animation container
        const container = card.querySelector('.sauna-animation-container');
        if (!container) return;
        container.innerHTML = '';
        
        // Create wooden sauna background
        this.createSaunaBackground(container);
        
        // Add appropriate animations based on sauna status
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
        // Create ground/backdrop
        const ground = document.createElement('div');
        ground.style.position = 'absolute';
        ground.style.bottom = '0';
        ground.style.left = '0';
        ground.style.width = '100%';
        ground.style.height = '20%';
        ground.style.background = 'linear-gradient(to bottom, rgba(74, 100, 50, 0.1), rgba(74, 100, 50, 0.2))';
        ground.style.zIndex = '1';
        container.appendChild(ground);
        
        // Create barrel sauna body
        const barrelBody = document.createElement('div');
        barrelBody.style.position = 'absolute';
        barrelBody.style.width = '80px';
        barrelBody.style.height = '60px';
        barrelBody.style.top = '50%';
        barrelBody.style.left = '50%';
        barrelBody.style.transform = 'translate(-50%, -50%)';
        barrelBody.style.background = 'linear-gradient(to bottom, rgba(160, 82, 45, 0.4), rgba(120, 60, 30, 0.4))';
        barrelBody.style.borderRadius = '30px';
        barrelBody.style.zIndex = '2';
        barrelBody.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.1)';
        barrelBody.style.overflow = 'hidden';
        container.appendChild(barrelBody);
        
        // Create wooden slats for barrel
        for (let i = 0; i < 8; i++) {
            const slat = document.createElement('div');
            slat.style.position = 'absolute';
            slat.style.width = '100%';
            slat.style.height = '8px';
            slat.style.top = `${i * 8 + 4}px`;
            slat.style.background = `rgba(${140 + Math.random() * 40}, ${70 + Math.random() * 20}, ${30 + Math.random() * 20}, 0.4)`;
            slat.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
            barrelBody.appendChild(slat);
        }
        
        // Create barrel end circles (front and back)
        const barrelFront = document.createElement('div');
        barrelFront.style.position = 'absolute';
        barrelFront.style.width = '20px';
        barrelFront.style.height = '60px';
        barrelFront.style.left = '-10px';
        barrelFront.style.top = '0';
        barrelFront.style.background = 'rgba(140, 70, 30, 0.5)';
        barrelFront.style.borderRadius = '30px 0 0 30px';
        barrelFront.style.zIndex = '3';
        barrelBody.appendChild(barrelFront);
        
        const barrelBack = document.createElement('div');
        barrelBack.style.position = 'absolute';
        barrelBack.style.width = '20px';
        barrelBack.style.height = '60px';
        barrelBack.style.right = '-10px';
        barrelBack.style.top = '0';
        barrelBack.style.background = 'rgba(140, 70, 30, 0.5)';
        barrelBack.style.borderRadius = '0 30px 30px 0';
        barrelBack.style.zIndex = '3';
        barrelBody.appendChild(barrelBack);
        
        // Create door on the barrel
        const door = document.createElement('div');
        door.style.position = 'absolute';
        door.style.width = '24px';
        door.style.height = '40px';
        door.style.left = '-5px';
        door.style.top = '10px';
        door.style.background = 'rgba(120, 60, 20, 0.6)';
        door.style.borderRadius = '20px 0 0 20px';
        door.style.border = '1px solid rgba(80, 40, 10, 0.5)';
        door.style.zIndex = '4';
        barrelBody.appendChild(door);
        
        // Add handle to door
        const doorHandle = document.createElement('div');
        doorHandle.style.position = 'absolute';
        doorHandle.style.width = '4px';
        doorHandle.style.height = '4px';
        doorHandle.style.left = '3px';
        doorHandle.style.top = '20px';
        doorHandle.style.background = 'rgba(220, 220, 220, 0.8)';
        doorHandle.style.borderRadius = '50%';
        doorHandle.style.zIndex = '5';
        door.appendChild(doorHandle);
        
        // Add window to door
        const doorWindow = document.createElement('div');
        doorWindow.style.position = 'absolute';
        doorWindow.style.width = '10px';
        doorWindow.style.height = '10px';
        doorWindow.style.left = '7px';
        doorWindow.style.top = '8px';
        doorWindow.style.background = 'rgba(200, 230, 255, 0.3)';
        doorWindow.style.borderRadius = '50%';
        doorWindow.style.border = '1px solid rgba(80, 40, 10, 0.5)';
        doorWindow.style.zIndex = '5';
        door.appendChild(doorWindow);
        
        // Create chimney on top
        const chimney = document.createElement('div');
        chimney.style.position = 'absolute';
        chimney.style.width = '8px';
        chimney.style.height = '18px';
        chimney.style.top = '-15px';
        chimney.style.right = '20px';
        chimney.style.background = 'rgba(100, 100, 100, 0.6)';
        chimney.style.borderRadius = '2px';
        chimney.style.zIndex = '5';
        barrelBody.appendChild(chimney);
        
        // Create small deck/steps in front of sauna
        const steps = document.createElement('div');
        steps.style.position = 'absolute';
        steps.style.width = '30px';
        steps.style.height = '5px';
        steps.style.bottom = '20%';
        steps.style.left = '30%';
        steps.style.background = 'rgba(120, 60, 20, 0.5)';
        steps.style.borderRadius = '2px';
        steps.style.zIndex = '3';
        container.appendChild(steps);
    }
    
    createHeatedSaunaEffects(container, temperature) {
        // Add steam coming from chimney
        const steamCount = Math.min(Math.max(3, Math.round(temperature / 20)), 8);
        for (let i = 0; i < steamCount; i++) {
            const steam = document.createElement('div');
            steam.style.position = 'absolute';
            steam.style.bottom = '60%';
            steam.style.right = '39%';
            steam.style.width = '12px';
            steam.style.height = '12px';
            steam.style.background = 'rgba(255, 255, 255, 0.7)';
            steam.style.borderRadius = '50%';
            steam.style.filter = 'blur(3px)';
            steam.style.zIndex = '6';
            
            const delay = i * 1.2;
            const duration = Math.random() * 2 + 3;
            steam.style.animation = `steam-rise ${duration}s ${delay}s infinite`;
            
            container.appendChild(steam);
        }
        
        // Add warm glow inside window
        const windowGlow = document.createElement('div');
        windowGlow.style.position = 'absolute';
        windowGlow.style.width = '12px';
        windowGlow.style.height = '12px';
        windowGlow.style.top = '40%';
        windowGlow.style.left = '43%';
        windowGlow.style.background = 'radial-gradient(circle, rgba(255, 200, 100, 0.6) 0%, rgba(255, 150, 50, 0) 70%)';
        windowGlow.style.borderRadius = '50%';
        windowGlow.style.filter = 'blur(2px)';
        windowGlow.style.zIndex = '6';
        windowGlow.style.animation = 'pulse 2s infinite alternate';
        container.appendChild(windowGlow);
        
        // Add a warm glow around the sauna
        const saunaGlow = document.createElement('div');
        saunaGlow.style.position = 'absolute';
        saunaGlow.style.width = '90px';
        saunaGlow.style.height = '70px';
        saunaGlow.style.top = '50%';
        saunaGlow.style.left = '50%';
        saunaGlow.style.transform = 'translate(-50%, -50%)';
        saunaGlow.style.background = 'radial-gradient(ellipse, rgba(255, 150, 50, 0.15) 0%, rgba(255, 100, 0, 0) 70%)';
        saunaGlow.style.borderRadius = '35px';
        saunaGlow.style.filter = 'blur(5px)';
        saunaGlow.style.zIndex = '1';
        saunaGlow.style.animation = 'pulse 3s infinite alternate';
        container.appendChild(saunaGlow);
        
        // Add air distortion effect for heat (similar to home card)
        if (temperature > 100) {
            const heatDistortion = document.createElement('div');
            heatDistortion.style.position = 'absolute';
            heatDistortion.style.top = '30%';
            heatDistortion.style.right = '39%';
            heatDistortion.style.width = '20px';
            heatDistortion.style.height = '30px';
            heatDistortion.style.background = 'transparent';
            heatDistortion.style.borderRadius = '50%';
            heatDistortion.style.zIndex = '7';
            heatDistortion.style.opacity = '0.7';
            container.appendChild(heatDistortion);
            
            // Add ripple effect with multiple heat waves
            const waveCount = Math.min(Math.max(2, Math.round(temperature / 40)), 4);
            for (let i = 0; i < waveCount; i++) {
                const heatWave = document.createElement('div');
                heatWave.style.position = 'absolute';
                heatWave.style.top = '0';
                heatWave.style.left = '0';
                heatWave.style.right = '0';
                heatWave.style.bottom = '0';
                heatWave.style.borderRadius = '50%';
                heatWave.style.border = `1px solid rgba(255, 255, 255, ${0.1 - (i * 0.02)})`;
                heatWave.style.transform = 'scale(0.8)';
                heatWave.style.animation = `heat-wave ${2 + i * 0.5}s ${i * 0.5}s infinite`;
                heatDistortion.appendChild(heatWave);
            }
        }
        
        // Add a slight orange tint to the barrel when hot
        const barrelTint = document.createElement('div');
        barrelTint.style.position = 'absolute';
        barrelTint.style.width = '80px';
        barrelTint.style.height = '60px';
        barrelTint.style.top = '50%';
        barrelTint.style.left = '50%';
        barrelTint.style.transform = 'translate(-50%, -50%)';
        barrelTint.style.background = `rgba(255, 100, 0, ${Math.min(0.1, temperature / 1000)})`;
        barrelTint.style.borderRadius = '30px';
        barrelTint.style.zIndex = '4';
        barrelTint.style.mixBlendMode = 'overlay';
        container.appendChild(barrelTint);
    }
    
    createIdleSaunaEffects(container) {
        // Add cool blue ambient light 
        const coolAmbient = document.createElement('div');
        coolAmbient.style.position = 'absolute';
        coolAmbient.style.width = '100%';
        coolAmbient.style.height = '100%';
        coolAmbient.style.background = 'linear-gradient(to bottom, rgba(100, 150, 255, 0.05) 0%, rgba(30, 60, 100, 0.05) 100%)';
        coolAmbient.style.zIndex = '1';
        container.appendChild(coolAmbient);
        
        // Add cool glow to window
        const windowGlow = document.createElement('div');
        windowGlow.style.position = 'absolute';
        windowGlow.style.width = '10px';
        windowGlow.style.height = '10px';
        windowGlow.style.top = '40%';
        windowGlow.style.left = '43%';
        windowGlow.style.background = 'radial-gradient(circle, rgba(180, 200, 255, 0.3) 0%, rgba(150, 180, 255, 0) 70%)';
        windowGlow.style.borderRadius = '50%';
        windowGlow.style.filter = 'blur(2px)';
        windowGlow.style.zIndex = '6';
        container.appendChild(windowGlow);
        
        // Add moonlight effect on sauna at night
        const moonlight = document.createElement('div');
        moonlight.style.position = 'absolute';
        moonlight.style.width = '150%';
        moonlight.style.height = '40px';
        moonlight.style.top = '20%';
        moonlight.style.left = '-25%';
        moonlight.style.background = 'linear-gradient(to right, rgba(150, 180, 255, 0) 0%, rgba(150, 180, 255, 0.05) 50%, rgba(150, 180, 255, 0) 100%)';
        moonlight.style.transform = 'rotate(15deg)';
        moonlight.style.zIndex = '2';
        moonlight.style.opacity = '0.7';
        container.appendChild(moonlight);
        
        // Add slight shadow under sauna barrel
        const barrelShadow = document.createElement('div');
        barrelShadow.style.position = 'absolute';
        barrelShadow.style.width = '80px';
        barrelShadow.style.height = '10px';
        barrelShadow.style.bottom = '20%';
        barrelShadow.style.left = '50%';
        barrelShadow.style.transform = 'translateX(-50%)';
        barrelShadow.style.background = 'radial-gradient(ellipse, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 70%)';
        barrelShadow.style.borderRadius = '50%';
        barrelShadow.style.filter = 'blur(5px)';
        barrelShadow.style.zIndex = '1';
        container.appendChild(barrelShadow);
        
        // Add a cool blue tint to the barrel when cold
        const barrelTint = document.createElement('div');
        barrelTint.style.position = 'absolute';
        barrelTint.style.width = '80px';
        barrelTint.style.height = '60px';
        barrelTint.style.top = '50%';
        barrelTint.style.left = '50%';
        barrelTint.style.transform = 'translate(-50%, -50%)';
        barrelTint.style.background = 'rgba(100, 150, 255, 0.05)';
        barrelTint.style.borderRadius = '30px';
        barrelTint.style.zIndex = '4';
        barrelTint.style.mixBlendMode = 'multiply';
        container.appendChild(barrelTint);
        
        // Add subtle nighttime particles (like tiny stars or mist)
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.top = `${Math.random() * 70 + 10}%`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.background = 'rgba(255, 255, 255, 0.3)';
            particle.style.borderRadius = '50%';
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            particle.style.zIndex = '3';
            
            // Add subtle twinkling effect
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 5;
            particle.style.animation = `pulse ${duration}s ${delay}s infinite alternate`;
            
            container.appendChild(particle);
        }
    }
    
    createOfflineSaunaEffects(container) {
        // Add a dark gray overlay to indicate offline status
        const offlineOverlay = document.createElement('div');
        offlineOverlay.style.position = 'absolute';
        offlineOverlay.style.width = '100%';
        offlineOverlay.style.height = '100%';
        offlineOverlay.style.background = 'linear-gradient(to bottom, rgba(30, 30, 30, 0.4) 0%, rgba(10, 10, 10, 0.6) 100%)';
        offlineOverlay.style.zIndex = '5';
        container.appendChild(offlineOverlay);
        
        // Add static noise effect
        for (let i = 0; i < 50; i++) {
            const staticDot = document.createElement('div');
            staticDot.style.position = 'absolute';
            staticDot.style.width = '3px';
            staticDot.style.height = '3px';
            staticDot.style.top = `${Math.random() * 100}%`;
            staticDot.style.left = `${Math.random() * 100}%`;
            staticDot.style.background = 'rgba(255, 255, 255, 0.3)';
            staticDot.style.borderRadius = '50%';
            staticDot.style.opacity = Math.random() * 0.3 + 0.1;
            staticDot.style.zIndex = '6';
            
            // Flicker animation for static dots
            const duration = Math.random() * 0.3 + 0.2;
            const delay = Math.random() * 0.5;
            staticDot.style.animation = `static-flicker ${duration}s ${delay}s infinite alternate`;
            
            offlineOverlay.appendChild(staticDot);
        }
        
        // Add a wifi icon with a slash through it
        const wifiIcon = document.createElement('div');
        wifiIcon.style.position = 'absolute';
        wifiIcon.style.top = '40%';
        wifiIcon.style.left = '50%';
        wifiIcon.style.transform = 'translate(-50%, -50%)';
        wifiIcon.style.width = '40px';
        wifiIcon.style.height = '40px';
        wifiIcon.style.zIndex = '7';
        wifiIcon.style.opacity = '0.8';
        wifiIcon.textContent = '📡';
        wifiIcon.style.fontSize = '24px';
        wifiIcon.style.display = 'flex';
        wifiIcon.style.alignItems = 'center';
        wifiIcon.style.justifyContent = 'center';
        
        // Add a slash through the icon
        const slash = document.createElement('div');
        slash.style.position = 'absolute';
        slash.style.width = '50px';
        slash.style.height = '2px';
        slash.style.background = 'rgba(239, 68, 68, 0.8)';
        slash.style.transform = 'rotate(45deg)';
        slash.style.borderRadius = '1px';
        wifiIcon.appendChild(slash);
        
        // Pulse animation
        wifiIcon.style.animation = 'pulse 2s infinite alternate';
        
        offlineOverlay.appendChild(wifiIcon);
        
        // Add keyframes for static flickering if not exists
        const styleElement = document.getElementById('static-keyframes');
        if (!styleElement) {
            const style = document.createElement('style');
            style.id = 'static-keyframes';
            style.textContent = `
            @keyframes static-flicker {
                0% { opacity: 0.1; }
                100% { opacity: 0.4; }
            }`;
            document.head.appendChild(style);
        }
    }
    
    createLockedSaunaEffects(container) {
        // Add a blue-tinted overlay for locked status
        const lockedOverlay = document.createElement('div');
        lockedOverlay.style.position = 'absolute';
        lockedOverlay.style.width = '100%';
        lockedOverlay.style.height = '100%';
        lockedOverlay.style.background = 'linear-gradient(to bottom, rgba(30, 64, 175, 0.2) 0%, rgba(30, 58, 138, 0.3) 100%)';
        lockedOverlay.style.zIndex = '5';
        container.appendChild(lockedOverlay);
        
        // Add lock icon
        const lockIcon = document.createElement('div');
        lockIcon.style.position = 'absolute';
        lockIcon.style.top = '40%';
        lockIcon.style.left = '50%';
        lockIcon.style.transform = 'translate(-50%, -50%)';
        lockIcon.style.width = '30px';
        lockIcon.style.height = '30px';
        lockIcon.style.zIndex = '7';
        lockIcon.style.opacity = '0.9';
        
        // Create the lock body
        const lockBody = document.createElement('div');
        lockBody.style.position = 'absolute';
        lockBody.style.width = '20px';
        lockBody.style.height = '15px';
        lockBody.style.bottom = '0';
        lockBody.style.left = '5px';
        lockBody.style.background = 'rgba(255, 255, 255, 0.9)';
        lockBody.style.borderRadius = '3px';
        lockIcon.appendChild(lockBody);
        
        // Create the lock shackle
        const lockShackle = document.createElement('div');
        lockShackle.style.position = 'absolute';
        lockShackle.style.width = '14px';
        lockShackle.style.height = '12px';
        lockShackle.style.top = '0';
        lockShackle.style.left = '8px';
        lockShackle.style.border = '3px solid rgba(255, 255, 255, 0.9)';
        lockShackle.style.borderBottom = 'none';
        lockShackle.style.borderRadius = '10px 10px 0 0';
        lockIcon.appendChild(lockShackle);
        
        // Pulse animation
        lockIcon.style.animation = 'lock-pulse 2s infinite alternate';
        lockedOverlay.appendChild(lockIcon);
        
        // Add ripple effects around the lock
        for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.top = '40%';
            ripple.style.left = '50%';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.width = '50px';
            ripple.style.height = '50px';
            ripple.style.border = '2px solid rgba(255, 255, 255, 0.4)';
            ripple.style.borderRadius = '50%';
            ripple.style.zIndex = '6';
            ripple.style.opacity = '0';
            
            const delay = i * 1;
            ripple.style.animation = `ripple 4s ${delay}s infinite linear`;
            
            lockedOverlay.appendChild(ripple);
        }
        
        // Add keyframes for lock animation if not exists
        const lockStyleElement = document.getElementById('lock-keyframes');
        if (!lockStyleElement) {
            const style = document.createElement('style');
            style.id = 'lock-keyframes';
            style.textContent = `
            @keyframes lock-pulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes ripple {
                0% { 
                    width: 30px; 
                    height: 30px;
                    opacity: 0.6;
                }
                100% { 
                    width: 80px; 
                    height: 80px; 
                    opacity: 0;
                }
            }`;
            document.head.appendChild(style);
        }
    }
    
    createEmergencyStopEffects(container) {
        // Add red warning overlay
        const emergencyOverlay = document.createElement('div');
        emergencyOverlay.style.position = 'absolute';
        emergencyOverlay.style.width = '100%';
        emergencyOverlay.style.height = '100%';
        emergencyOverlay.style.background = 'linear-gradient(to bottom, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)';
        emergencyOverlay.style.zIndex = '5';
        container.appendChild(emergencyOverlay);
        
        // Create flashing warning effect
        const warningFlash = document.createElement('div');
        warningFlash.style.position = 'absolute';
        warningFlash.style.width = '100%';
        warningFlash.style.height = '100%';
        warningFlash.style.background = 'rgba(239, 68, 68, 0.2)';
        warningFlash.style.zIndex = '6';
        warningFlash.style.animation = 'emergency-flash 2s infinite alternate';
        emergencyOverlay.appendChild(warningFlash);
        
        // Add warning symbol
        const warningSymbol = document.createElement('div');
        warningSymbol.style.position = 'absolute';
        warningSymbol.style.top = '40%';
        warningSymbol.style.left = '50%';
        warningSymbol.style.transform = 'translate(-50%, -50%)';
        warningSymbol.style.width = '40px';
        warningSymbol.style.height = '40px';
        warningSymbol.style.zIndex = '7';
        warningSymbol.style.opacity = '0.9';
        warningSymbol.style.animation = 'warning-pulse 1s infinite alternate';
        
        // Create the warning triangle
        const triangle = document.createElement('div');
        triangle.style.position = 'absolute';
        triangle.style.width = '0';
        triangle.style.height = '0';
        triangle.style.borderLeft = '20px solid transparent';
        triangle.style.borderRight = '20px solid transparent';
        triangle.style.borderBottom = '35px solid rgba(255, 255, 255, 0.9)';
        triangle.style.top = '0';
        triangle.style.left = '0';
        warningSymbol.appendChild(triangle);
        
        // Add exclamation mark
        const exclamation = document.createElement('div');
        exclamation.style.position = 'absolute';
        exclamation.style.top = '10px';
        exclamation.style.left = '18px';
        exclamation.style.width = '4px';
        exclamation.style.height = '14px';
        exclamation.style.background = 'rgba(239, 68, 68, 0.9)';
        exclamation.style.borderRadius = '2px';
        warningSymbol.appendChild(exclamation);
        
        // Add the dot of the exclamation mark
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.bottom = '6px';
        dot.style.left = '18px';
        dot.style.width = '4px';
        dot.style.height = '4px';
        dot.style.background = 'rgba(239, 68, 68, 0.9)';
        dot.style.borderRadius = '50%';
        warningSymbol.appendChild(dot);
        
        emergencyOverlay.appendChild(warningSymbol);
        
        // Add keyframes for emergency animations if not exists
        const emergencyStyleElement = document.getElementById('emergency-keyframes');
        if (!emergencyStyleElement) {
            const style = document.createElement('style');
            style.id = 'emergency-keyframes';
            style.textContent = `
            @keyframes emergency-flash {
                0% { opacity: 0.1; }
                25% { opacity: 0.3; }
                50% { opacity: 0.1; }
                75% { opacity: 0.3; }
                100% { opacity: 0.1; }
            }
            
            @keyframes warning-pulse {
                0% { transform: translate(-50%, -50%) scale(0.9); }
                100% { transform: translate(-50%, -50%) scale(1.1); }
            }`;
            document.head.appendChild(style);
        }
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
        
        // Reset stats if it's a new day
        if (todayStart > this.lastDayReset) {
            this.dailyWindHigh = 0;
            this.lastDayReset = todayStart;
        }

        // Update daily high if current speed or gust is higher
        const speed = parseFloat(currentSpeed) || 0;
        const gust = parseFloat(currentGust) || 0;
        const maxCurrent = Math.max(speed, gust);
        
        if (maxCurrent > this.dailyWindHigh) {
            this.dailyWindHigh = maxCurrent;
            // Update the display
            const highElement = document.querySelector('#wind-combined .high');
            if (highElement) {
                highElement.textContent = `Today's High: ${this.dailyWindHigh.toFixed(1)} mph`;
            }
        }
    }
}

// Initialize the dashboard when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});
