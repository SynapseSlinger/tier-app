import { SEARCH_CONFIG } from '../constants/config';

export type SearchProvider = 'pixabay' | 'google';

export interface SearchResult {
  id: string;
  uri: string;
  label: string;
  provider: SearchProvider;
}

async function searchPixabay(query: string): Promise<SearchResult[]> {
  const { apiKey } = SEARCH_CONFIG.pixabay;
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encoded}&image_type=photo&per_page=40&safesearch=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay Fehler: ${res.status}`);

  const data = await res.json();
  return (data.hits ?? []).map((hit: any) => ({
    id: `pixabay_${hit.id}`,
    uri: hit.webformatURL,
    label: hit.tags?.split(',')[0]?.trim() ?? query,
    provider: 'pixabay' as const,
  }));
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  const { apiKey, searchEngineId } = SEARCH_CONFIG.google;
  const encoded = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encoded}&searchType=image&num=10`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Fehler: ${res.status}`);

  const data = await res.json();
  return (data.items ?? []).map((item: any, idx: number) => ({
    id: `google_${idx}_${item.link}`,
    uri: item.link,
    label: item.title ?? query,
    provider: 'google' as const,
  }));
}

export async function searchImages(
  query: string,
  provider: SearchProvider
): Promise<SearchResult[]> {
  if (provider === 'pixabay') return searchPixabay(query);
  return searchGoogle(query);
}
