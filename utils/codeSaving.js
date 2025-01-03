import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090';

// Fetch code from the server
export const fetchCode = async (roomId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/fetch/${roomId}`);
    return response.data.code || '';
  } catch (error) {
    console.error('Error fetching code:', error);
    return '';
  }
};

// Save code to the server
export const saveCode = async (roomId, code) => {
  try {
    await axios.post(`${API_BASE_URL}/save`, { roomId, code });
  } catch (error) {
    console.error('Error saving code:', error);
  }
};
