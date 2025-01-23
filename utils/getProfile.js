import axios from 'axios';
import { username } from './googleAuth';

const API_BASE_URL = 'http://localhost:9090/profile';

// Fetch code from the server
export const fetchProfile = async () => {
    try {
        const email = username;
        const response = await axios.get(`${API_BASE_URL}/${email}`);
        return response.data || '';
    } catch (error) {
        console.error('Error fetching code:', error);
        return '';
    }
};
