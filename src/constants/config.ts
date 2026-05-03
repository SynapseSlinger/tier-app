export const SEARCH_CONFIG = {
  pixabay: {
    apiKey: process.env.EXPO_PUBLIC_PIXABAY_API_KEY ?? '',
  },
  google: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? '',
    searchEngineId: process.env.EXPO_PUBLIC_GOOGLE_SEARCH_ENGINE_ID ?? '',
  },
};
