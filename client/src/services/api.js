const API_BASE_URL = 'http://localhost:3000/api';

export async function getAssets() {
  const response = await fetch(`${API_BASE_URL}/assets`);
  return response.json();
}
