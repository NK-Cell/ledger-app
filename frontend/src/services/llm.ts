import type { AISettings, ParsedRecord } from '../types'

interface LLMResponse {
  records: ParsedRecord[]
  summary: {
    totalExpense: number
    totalIncome: number
    netAmount: number
  }
}

function buildPrompt(categories: { name: string; type: string }[], today: string): string {
  const catList = categories
    .map(c => `- ${c.name} (${c.type === 'INCOME' ? 'income' : 'expense'})`)
    .join('\n')

  return `You are a financial record parser. Given a user's natural language text about their daily income/expenses, extract each item as a structured record.

Available categories:
${catList}

Rules:
- Classify each item into the most appropriate category based on common sense
- Default type to "expense" unless clearly income-related
- The "description" field should be a concise label for the item (keep it in the user's language)
- Date defaults to today (${today}) if not specified
- Handle Chinese shorthand: 打车/滴滴/地铁/公交 → 交通, 吃饭/早/午/晚餐/外卖 → 餐饮, 买衣服/鞋/化妆品 → 购物
- If an item is ambiguous or doesn't match any category well, use your best judgment with the closest match
- Amounts are in CNY (人民币), can be decimals like 16.9
- If a single line contains multiple items, split them (e.g. "早餐12午餐20" → two items)
- Return ONLY valid JSON, no markdown, no code fences, no explanation

Return JSON format:
{
  "records": [
    {
      "amount": 12,
      "type": "EXPENSE",
      "categoryName": "餐饮",
      "description": "早餐",
      "date": "${today}"
    }
  ],
  "summary": {
    "totalExpense": 12,
    "totalIncome": 0,
    "netAmount": -12
  }
}`
}

export async function parseText(
  text: string,
  categories: { name: string; type: string }[],
  settings: AISettings
): Promise<LLMResponse> {
  const today = new Date().toISOString().split('T')[0]
  const systemPrompt = buildPrompt(categories, today)

  const baseUrl = settings.endpoint.replace(/\/+$/, '')
  const url = `${baseUrl}/v1/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    let msg = `LLM API error (${response.status})`
    try {
      const errJson = JSON.parse(error)
      msg = errJson.error?.message || errJson.error || msg
    } catch {
      msg = error || msg
    }
    throw new Error(msg)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from LLM')
  }

  try {
    const parsed: LLMResponse = JSON.parse(content)
    if (!Array.isArray(parsed.records)) {
      throw new Error('Invalid response format: records array missing')
    }
    for (const r of parsed.records) {
      r.type = r.type.toUpperCase() as 'INCOME' | 'EXPENSE'
    }
    return parsed
  } catch (e) {
    throw new Error(`Failed to parse LLM response: ${e instanceof Error ? e.message : 'invalid JSON'}`)
  }
}
