"use server"

// This file manages multiple API keys and rotates through them evenly

// Store the keys in environment variables named GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
// This function retrieves all available keys
async function getAllApiKeys(): Promise<string[]> {
  const keys: string[] = []

  // Look for numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`]
    if (key) {
      keys.push(key)
    }
  }

  // If no numbered keys found, fall back to the original GEMINI_API_KEY
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY)
  }

  return keys
}

// Keep track of the last used key index
let currentKeyIndex = 0

// Get the next API key in the rotation
export async function getNextApiKey(): Promise<string> {
  const keys = await getAllApiKeys()

  if (keys.length === 0) {
    throw new Error("No Gemini API keys found in environment variables")
  }

  // Get the next key and update the index
  const key = keys[currentKeyIndex]

  // Increment and wrap around if needed
  currentKeyIndex = (currentKeyIndex + 1) % keys.length

  return key
}

// Get the total number of available keys
export async function getKeyCount(): Promise<number> {
  const keys = await getAllApiKeys()
  return keys.length
}

