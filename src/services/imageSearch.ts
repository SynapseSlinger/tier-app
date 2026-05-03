import { SEARCH_CONFIG } from '../constants/config';

export type SearchProvider = 'pixabay' | 'google';

export interface SearchResult {
  id: string;
  uri: string;
  label: string;
  provider: SearchProvider;
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().trim().replace(/\s+/g, ' ');
}

function deduplicateByLabel(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = normalizeLabel(r.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchPixabay(query: string): Promise<SearchResult[]> {
  const { apiKey } = SEARCH_CONFIG.pixabay;
  const encoded = encodeURIComponent(query);
  // per_page=100 damit nach Deduplizierung noch genug übrig bleibt
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encoded}&image_type=photo&per_page=100&safesearch=true&order=popular`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay Fehler: ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = (data.hits ?? []).map((hit: any) => ({
    id: `pixabay_${hit.id}`,
    uri: hit.webformatURL,
    // Erstes Tag als Label – das ist meistens das Hauptsubjekt (z.B. "cat", "lion")
    label: hit.tags?.split(',')[0]?.trim() ?? query,
    provider: 'pixabay' as const,
  }));

  return deduplicateByLabel(results);
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  const { apiKey, searchEngineId } = SEARCH_CONFIG.google;
  const encoded = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encoded}&searchType=image&num=10`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Fehler: ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = (data.items ?? []).map((item: any, idx: number) => ({
    id: `google_${idx}_${item.link}`,
    uri: item.link,
    // Titel kürzen auf erstes sinnvolles Wort/Phrase vor "-" oder "|"
    label: (item.title ?? query).split(/[-|]/)[0].trim(),
    provider: 'google' as const,
  }));

  return deduplicateByLabel(results);
}

export async function searchImages(
  query: string,
  provider: SearchProvider
): Promise<SearchResult[]> {
  if (provider === 'pixabay') return searchPixabay(query);
  return searchGoogle(query);
}
