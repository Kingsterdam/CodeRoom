const API_URL = "http://localhost:9090/send-invite"; // Use `http` for local development

export const sendInviteCode = async (email) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return data.message;
    } else {
      return data.error || "An error occurred while sending the invite.";
    }
  } catch (error) {
    console.error("Error executing code:", error);
    return "An unexpected error occurred.";
  }
};
