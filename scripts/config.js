export const CONFIG = {
    APPLICATION_KEY: "5B39045E3312D99FE79E167EF56FB0E0",
    API_KEY: "58b67f54-13ce-4cdc-94fa-e5bf91eb4c30",
    MAC: "D4:8A:FC:82:38:47"
};

export const SAUNA_CONFIG = {
    API_URL: 'https://api.huum.eu/action/home',
    USERNAME: 'notforyou23@gmail.com',
    PASSWORD: 'ofDYxD',
    // Adaptive polling intervals
    IDLE_INTERVAL: 120000,        // 2 minutes when sauna is off/idle
    HEATING_INTERVAL: 30000,      // 30 seconds when actively heating
    CRITICAL_INTERVAL: 15000,     // 15 seconds when near target temp
    OFFLINE_INTERVAL: 300000,     // 5 minutes when offline (reduce load)
    ERROR_BACKOFF_INTERVAL: 180000, // 3 minutes after errors
    
    // Temperature thresholds for critical polling
    CRITICAL_TEMP_THRESHOLD: 10,  // °F from target to switch to critical polling
    
    // Error handling
    MAX_CONSECUTIVE_ERRORS: 3,
    BACKOFF_MULTIPLIER: 2
};
