import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Uses Gemini to figure out which column in a CSV corresponds to the expected DB fields.
 * @param {Array} headers - Array of string headers from the CSV
 * @param {Array} sampleRow - Array of string values from the first data row
 * @returns {Promise<Object>} - A mapping object { name: 'col_name', usn: 'col_name', branch_code: 'col_name' }
 */
export async function mapCsvColumnsWithAI(headers, sampleRow) {
  if (!genAI) {
    throw new Error("Gemini API Key is missing. Check .env.local");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
    You are an intelligent data parser. I am uploading a CSV of engineering students.
    My database needs exactly three columns:
    1. 'name' (the student's full name)
    2. 'usn' (the unique university seat number, usually looking like '4SH24CS001' or 'Roll No.')
    3. 'branch_code' (the department, e.g. 'CS', 'AI', 'EC', etc.)

    Here are the headers from the CSV: ${JSON.stringify(headers)}
    Here is a sample row of data from the CSV: ${JSON.stringify(sampleRow)}

    Return ONLY a raw JSON object with no markdown formatting or backticks. It must have exactly these keys: 'name', 'usn', 'branch_code'. 
    The values must be the EXACT header string from the CSV that corresponds to that field. If a field cannot be found, make the value null.
    
    Example output format:
    {"name": "Student Name", "usn": "Roll Number", "branch_code": "Dept"}
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up any potential markdown formatting from the response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Mapping Error:", error);
    throw new Error("Failed to map columns using AI. Please check your CSV format.");
  }
}
