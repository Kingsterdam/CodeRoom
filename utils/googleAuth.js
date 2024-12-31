import axios from 'axios';

const API_URL = 'http://localhost:9090';

export const getLoginUrl = () => {
    return `${API_URL}/auth/google`;
};

export const getAuthStatus = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/status`, {
            withCredentials: true
        });
        return response.data.user;
    } catch (error) {
        if (error.response?.status !== 401) {
            console.error('Error fetching authentication status:', error);
        }
        return null;
    }
};

export const logoutUser = async () => {
    try {
        await axios.get(`${API_URL}/auth/logout`, {
            withCredentials: true
        });
        // Force reload the page to clear any client-side state
        window.location.href = '/';
        return true;
    } catch (error) {
        console.error('Error logging out:', error);
        throw error; // Propagate error to component
    }
};