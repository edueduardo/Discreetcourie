import OpenAI from 'openai'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Chat completion with GPT-4o-mini (cost-effective for most tasks)
export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini'
) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    return {
      success: true,
      message: response.choices[0]?.message?.content || '',
      usage: response.usage,
    }
  } catch (error) {
    console.error('OpenAI chat completion error:', error)
    return {
      success: false,
      message: 'Failed to generate response',
      error,
    }
  }
}

// Streaming chat completion for real-time responses
export async function* chatCompletionStream(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini'
) {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error) {
    console.error('OpenAI streaming error:', error)
    throw error
  }
}

// Image analysis with GPT-4o Vision
export async function analyzeImage(imageUrl: string, prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 500,
    })

    return {
      success: true,
      analysis: response.choices[0]?.message?.content || '',
    }
  } catch (error) {
    console.error('Image analysis error:', error)
    return {
      success: false,
      analysis: 'Failed to analyze image',
      error,
    }
  }
}

// Transcribe audio with Whisper
export async function transcribeAudio(audioFile: File) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt', // Portuguese by default
    })

    return {
      success: true,
      text: response.text,
    }
  } catch (error) {
    console.error('Transcription error:', error)
    return {
      success: false,
      text: 'Failed to transcribe audio',
      error,
    }
  }
}

// Generate embeddings for semantic search
export async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return {
      success: true,
      embedding: response.data[0].embedding,
    }
  } catch (error) {
    console.error('Embedding generation error:', error)
    return {
      success: false,
      embedding: [],
      error,
    }
  }
}

// Content moderation
export async function moderateContent(text: string) {
  try {
    const response = await openai.moderations.create({
      input: text,
    })

    const result = response.results[0]
    return {
      success: true,
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
    }
  } catch (error) {
    console.error('Moderation error:', error)
    return {
      success: false,
      flagged: false,
      error,
    }
  }
}
