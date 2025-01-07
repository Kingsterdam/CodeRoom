const API_BASE_URL = 'http://localhost:9090/api/v1';

export const fetchRooms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/room`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const createRoom = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const incrementRoomMembers = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/room/${roomId}/increment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  } catch (error) {
    console.error('Error incrementing members:', error);
    throw error;
  }
};