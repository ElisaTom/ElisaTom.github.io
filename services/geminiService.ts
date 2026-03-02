import { GoogleGenAI, Type } from "@google/genai";

// We use the new @google/genai SDK as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getOracleSuggestion = async (
  domain: string,
  mode: 'random' | 'smart',
  preferences?: { energy?: number; budget?: number }
) => {
  if (!process.env.API_KEY) return null;

  const modelId = 'gemini-3-flash-preview';
  
  let prompt = `You are "The Oracle", a mystical relationship advisor for a couple named Eli & Nic.
  Suggest a unique, specific idea for their "Couple Operating System".
  Domain: ${domain}.
  `;

  if (mode === 'smart' && preferences) {
    prompt += `
    They are looking for something with Energy Level: ${preferences.energy}/5 and Budget Level: ${preferences.budget}/3.
    Make it tailored and exciting.
    `;
  } else {
    prompt += `Surprise them with something completely random but delightful.`;
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          estimatedCost: { type: Type.STRING },
          energyLevel: { type: Type.INTEGER },
          matchScore: { type: Type.INTEGER, description: "A percentage match score from 0 to 100" }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse Oracle response", e);
    return null;
  }
};

export const pickFromList = async (
  options: any[], 
  domain: string, 
  criteria: any
) => {
  if (!process.env.API_KEY || options.length === 0) return null;

  const prompt = `
    You are The Oracle. Analyze this list of ${domain} options and pick the SINGLE BEST match for Eli & Nic right now.
    
    Current Constraints/Vibe:
    ${Object.entries(criteria).map(([key, val]) => `- ${key}: ${val}`).join('\n')}

    Options List:
    ${JSON.stringify(options.map(o => ({ 
      id: o.id, 
      name: o.name || o.title, 
      details: `${o.category || o.genre || o.type} - ${o.platform || ''}`,
      status: o.status
    })))}

    Return the ID of the chosen item and a witty, mystical reason why it fits their current state.
    If the constraints don't match anything perfectly, pick the closest one but mention it in the reason.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          selectedId: { type: Type.STRING },
          reason: { type: Type.STRING },
          matchScore: { type: Type.INTEGER }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Oracle selection failed", e);
    return null;
  }
};

export const searchPlace = async (query: string) => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find information about: ${query}. return a short summary and the address if available.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    // Extract text and grounding
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    console.error("Search failed", e);
    return null;
  }
};

export const getPlaceFromMaps = async (query: string, userLocation?: { latitude: number, longitude: number }) => {
  if (!process.env.API_KEY) return null;

  const modelId = 'gemini-2.5-flash';
  
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (userLocation) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: userLocation
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Find details about this place: "${query}". Provide a 1-sentence summary and its full address.`,
      config: config
    });
    
    return {
      text: response.text,
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    console.error("Maps grounding failed", e);
    return null;
  }
};

export const generateLoveNote = async (beneficiary: 'Him' | 'Her') => {
  if (!process.env.API_KEY) return "I love you!";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a short, sweet, poetic love note for ${beneficiary === 'Him' ? 'Nic' : 'Eli'}. Max 20 words. Romantic but modern style.`,
  });

  return response.text;
};