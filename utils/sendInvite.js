const API_URL = "http://localhost:9090/send-invite"; // Use `http` for local development

// Frontend code modifications
export const sendInviteCode = async (email, url, room) => {
  const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, url, room })
  });
  
  // Parse the JSON response
  const data = await response.json();
  
  // If the response wasn't ok, throw an error with the response data
  if (!response.ok) {
      throw new Error(data.error || 'Failed to send invite');
  }
  
  return data;
};
