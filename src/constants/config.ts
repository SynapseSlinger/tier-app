import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const SEARCH_CONFIG = {
  pixabay: {
    apiKey: (extra.pixabayApiKey as string) ?? '',
  },
  google: {
    apiKey: (extra.googleApiKey as string) ?? '',
    searchEngineId: (extra.googleSearchEngineId as string) ?? '',
  },
};
