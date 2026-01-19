import { GoogleGenAI } from "@google/genai";
import { ProductionJob, Resource } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Analyzes the current production schedule and answers user queries.
 */
export const analyzeProductionData = async (
  query: string,
  jobs: ProductionJob[],
  resources: Resource[]
): Promise<string> => {
  if (!apiKey) return "API Key is missing. Please check your configuration.";

  try {
    const context = JSON.stringify({ jobs, resources }, null, 2);
    
    const prompt = `
      You are an expert Production Planner AI assistant for an MJF (Multi Jet Fusion) 3D Printing Facility named "ProPlan AI".
      
      Here is the current production data (Jobs and Resources) in JSON format:
      ${context}

      User Query: "${query}"

      Context:
      - Resources include HP Jet Fusion Printers, Cooling Stations, and Post-processing units (sandblasting, dyeing).
      - "Cooling" is a critical phase in MJF; natural cooling takes time but ensures part quality.
      - Nesting Density is important for efficiency.
      - Powder freshness (reusability) is a key factor.

      Instructions:
      1. Analyze the JSON data to answer the user's question.
      2. If asked to optimize, consider nesting jobs together if possible, or managing cooling unit availability.
      3. Identify bottlenecks (e.g., all cooling stations full, or printers waiting for unpacking).
      4. Keep answers concise, professional, and actionable.
      5. Format lists or key points clearly using markdown.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "I processed the data but couldn't generate a meaningful response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while analyzing the production data.";
  }
};

/**
 * Generates a mock schedule optimization report.
 */
export const generateOptimizationReport = async (
  jobs: ProductionJob[],
  resources: Resource[]
): Promise<string> => {
  if (!apiKey) return "API Key is missing.";

  const context = JSON.stringify({ jobs, resources }, null, 2);
  const prompt = `
    Analyze the following MJF production schedule:
    ${context}

    Please generate a brief "Daily MJF Production Report" that includes:
    1. Overall health of the printing and cooling lines.
    2. Critical jobs that are delayed or require immediate post-processing.
    3. Recommendations for powder usage optimization or nesting density improvements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating report.";
  }
};
