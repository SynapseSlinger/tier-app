import { SEARCH_CONFIG } from '../constants/config';

export async function getTopicList(topic: string): Promise<string[]> {
  const { apiKey } = SEARCH_CONFIG.anthropic;
  if (!apiKey) throw new Error('Anthropic API Key fehlt.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `List all specific items, characters, or enemies in this category: "${topic}".
Return ONLY a comma-separated list of names. No descriptions, no numbering, no extra text.
Keep names concise and searchable (good for image search).
Maximum 60 items.

Examples:
- "Winx Club Charaktere" → "Bloom, Stella, Flora, Musa, Tecna, Aisha, Roxy, Daphne"
- "TOTK Enemies" → "Bokoblin, Moblin, Lizalfos, Lynel, Gibdo, Gloom Hands, Horriblin, Construct"
- "Tiere Afrikas" → "Löwe, Elefant, Giraffe, Zebra, Gepard, Nashorn, Flusspferd, Gorilla"`,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Claude Fehler: ${res.status}`);
  }

  const text: string = data.content?.[0]?.text ?? '';
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 60);
}
