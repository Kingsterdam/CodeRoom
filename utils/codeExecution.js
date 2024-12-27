const API_URL = 'http://localhost:5000/execute'; 

export const executeCode = async (language, code) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, code }),
    });

    const data = await response.json();
    
    if (data.output) {
      return { success: true, output: data.output };
    } else if (data.error) {
      return { success: false, output: data.error };
    }
  } catch (error) {
    console.error("Error executing code:", error);
    return { success: false, output: "An error occurred while executing the code." };
  }
};
