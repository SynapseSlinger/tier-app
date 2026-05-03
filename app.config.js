module.exports = ({ config }) => ({
  ...config,
  extra: {
    pixabayApiKey: process.env.PIXABAY_API_KEY ?? '',
    googleApiKey: process.env.GOOGLE_API_KEY ?? '',
    googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID ?? '',
  },
});
