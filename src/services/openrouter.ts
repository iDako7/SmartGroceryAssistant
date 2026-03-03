const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-20250514'

export async function callOpenRouter(
  messages: Array<{ role: string; content: string }>
): Promise<unknown> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Malformed API response: missing content')
  }

  return JSON.parse(content)
}
