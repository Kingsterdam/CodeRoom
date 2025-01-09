const API_BASE_URL = 'http://localhost:9090/api';

export const fetchRooms = async () => {
  
  try {
    const response = await fetch(`${API_BASE_URL}/v1/room`, {
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const fetchFromRedis = async (room_id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/room/${room_id}`, {
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const createRoom = async (roomId) => {
  console.log("creating room with id", roomId)
  try {
    const response = await fetch(`${API_BASE_URL}/v1/room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId }),
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const incrementRoomMembers = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/room/${roomId}/increment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error incrementing members:', error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  console.log(messageData)
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
// Message-related API functions

export const fetchMessagesForRoom = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/room/${roomId}`, {
      credentials: 'include'
    });
    console.log(response)
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};



export const fetchLatestMessages = async (roomId, limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/room/${roomId}/latest?limit=${limit}`, {
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching latest messages:', error);
    throw error;
  }
};

export const fetchMessagesByDateRange = async (roomId, startDate, endDate) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/messages/room/${roomId}/date-range?start_date=${startDate}&end_date=${endDate}`, {
        credentials: 'include'
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages by date range:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};