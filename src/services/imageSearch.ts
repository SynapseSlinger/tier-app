import { SEARCH_CONFIG } from '../constants/config';

export type SearchProvider = 'pixabay' | 'serper';

export interface SearchResult {
  id: string;
  uri: string;
  label: string;
  provider: SearchProvider;
}

const GENERIC_TAGS = new Set([
  'animal', 'animals', 'tiere', 'tier', 'nature', 'natur', 'wildlife', 'wild',
  'cute', 'niedlich', 'photo', 'foto', 'image', 'bild', 'beautiful', 'schön',
  'outdoor', 'background', 'hintergrund', 'portrait', 'macro', 'funny',
  'mammal', 'säugetier', 'fauna', 'creature', 'domestic', 'zoo', 'farm',
  'grass', 'gras', 'sky', 'himmel', 'water', 'wasser', 'forest', 'wald',
  'field', 'summer', 'winter', 'spring', 'autumn', 'green', 'blue',
  'kitten', 'feline', 'tabby', 'kitty', 'tomcat', 'pussycat',
  'puppy', 'canine', 'pup', 'hound',
  'lamb', 'ewe', 'ram', 'foal', 'mare', 'stallion', 'pony', 'colt',
  'calf', 'cattle', 'bull', 'cub', 'grizzly',
  'fawn', 'doe', 'buck', 'joey', 'chick', 'duckling', 'gosling', 'piglet', 'nestling',
]);

function getSpecificTags(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1 && !GENERIC_TAGS.has(t));
}

function deduplicate(results: Array<SearchResult & { specificTags: string[] }>): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const primary = r.specificTags[0];
    if (!primary || seen.has(primary)) return false;
    r.specificTags.slice(0, 3).forEach((t) => seen.add(t));
    return true;
  });
}

async function searchPixabay(query: string, page = 1): Promise<SearchResult[]> {
  const { apiKey } = SEARCH_CONFIG.pixabay;
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encoded}&image_type=photo&per_page=100&page=${page}&safesearch=true&order=popular`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay Fehler: ${res.status}`);

  const data = await res.json();
  const results = (data.hits ?? []).map((hit: any) => {
    const specificTags = getSpecificTags((hit.tags ?? '').split(','));
    return {
      id: `pixabay_${hit.id}`,
      uri: hit.webformatURL,
      label: specificTags[0] ?? query,
      provider: 'pixabay' as const,
      specificTags,
    };
  });

  return deduplicate(results);
}

async function searchSerper(query: string, page = 1): Promise<SearchResult[]> {
  const { apiKey } = SEARCH_CONFIG.serper;

  if (!apiKey) throw new Error('Serper API Key fehlt.');

  const res = await fetch('https://google.serper.dev/images', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 100, page }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Serper: Ungültige Antwort');
  }

  if (!res.ok) {
    throw new Error(data?.message ?? `Serper Fehler: ${res.status}`);
  }

  if (!data.images || data.images.length === 0) {
    throw new Error(`Keine Bilder gefunden für "${query}"`);
  }

  const results = data.images
    .filter((item: any) => item.imageUrl || item.thumbnailUrl)
    .map((item: any, idx: number) => {
      const label = (item.title ?? query).split(/[-|–]/)[0].trim();
      return {
        id: `serper_${idx}_${item.imageUrl}`,
        uri: item.imageUrl ?? item.thumbnailUrl,
        label,
        provider: 'serper' as const,
        specificTags: [label.toLowerCase()],
      };
    });

  return results;
}

export async function searchImages(
  query: string,
  provider: SearchProvider,
  page = 1
): Promise<SearchResult[]> {
  if (provider === 'pixabay') return searchPixabay(query, page);
  return searchSerper(query, page);
}
