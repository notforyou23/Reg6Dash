import { SAUNA_CONFIG } from '../scripts/config.js';

function getBasicAuthHeader() {
  return btoa(`${SAUNA_CONFIG.USERNAME}:${SAUNA_CONFIG.PASSWORD}`);
}

export async function toggleSauna(isHeatingOn) {
  const endpoint = isHeatingOn ? 'start' : 'stop';
  const url = `${SAUNA_CONFIG.API_URL}/${endpoint}`;
  const headers = new Headers({
    Authorization: `Basic ${getBasicAuthHeader()}`,
    'Content-Type': 'application/json',
  });
  const body = isHeatingOn
    ? JSON.stringify({ targetTemperature: 86.67, duration: 180 })
    : null;
  const response = await fetch(url, { method: 'POST', headers, body });
  if (!response.ok) {
    throw new Error(`Sauna ${isHeatingOn ? 'start' : 'stop'} request failed: ${response.statusText}`);
  }
}

export async function fetchSaunaData() {
  const url = `${SAUNA_CONFIG.API_URL}/status`;
  const headers = new Headers({
    Authorization: `Basic ${getBasicAuthHeader()}`,
  });
  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  return response.json();
}
