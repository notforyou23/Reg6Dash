import { CONFIG } from '../scripts/config.js';

export async function fetchRealtimeData(retryDelay = 5000, maxRetries = 3, retryCount = 0) {
  const url = new URL('https://api.ecowitt.net/api/v3/device/real_time');
  url.searchParams.append('application_key', CONFIG.APPLICATION_KEY);
  url.searchParams.append('api_key', CONFIG.API_KEY);
  url.searchParams.append('mac', CONFIG.MAC);
  url.searchParams.append('call_back', 'all');

  const response = await fetch(url);
  if (response.status === 429 && retryCount < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return fetchRealtimeData(retryDelay, maxRetries, retryCount + 1);
  }
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
