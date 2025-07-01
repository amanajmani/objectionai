import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('Missing Groq API key');
}

export const groq = new Groq({
  apiKey: apiKey,
});

// Test Groq connection
export async function testGroqConnection() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
      model: 'llama3-8b-8192',
      max_tokens: 10,
    });
    
    console.log('Groq connected successfully');
    return true;
  } catch (error) {
    console.log('Groq connection error:', error.message);
    return false;
  }
}