const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchChatGPTResponse = async (field_context, gridData, areaData) => {
  console.log("Calling backend GPT route");
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/gpt_response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field_context,
        gridData,
        areaData
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log(JSON.stringify(data));
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;

  } catch (error) {
    console.error('Error fetching GPT response:', error);
    return ["Error fetching AI suggestions."];
  }
};