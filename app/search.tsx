import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTierStore } from '../src/store/useTierStore';
import { searchImages, smartSearch, SearchProvider, SearchResult } from '../src/services/imageSearch';
import { isImageUsable } from '../src/services/imageCheck';
import { clearCache, getCacheStats } from '../src/services/searchCache';
import { BG, SURFACE, TEXT as TEXT_COLOR, TEXT_SECONDARY, TIER_COLORS } from '../src/constants/colors';

const AUTO_SELECT_COUNTS = [10, 20, 30, 50];
const PROVIDERS: { key: SearchProvider; label: string }[] = [
  { key: 'pixabay', label: '📷 Pixabay' },
  { key: 'serper',  label: '🌐 Web' },
  { key: 'smart',   label: '🤖 KI-Suche' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { addItem } = useTierStore();

  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<SearchProvider>('pixabay');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [cacheStats, setCacheStats] = useState<{ entries: number; sizeKB: number } | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    getCacheStats().then(setCacheStats);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    setError(null);
    setPage(1);
    setHasMore(false);
    setProgress(null);
    setBrokenIds(new Set());
    setFromCache(false);

    try {
      if (provider === 'smart') {
        setProgress({ done: 0, total: 1, current: 'Analysiere Thema...' });
        const items = await smartSearch(query.trim(), (done, total, current) => {
          setProgress({ done, total, current });
        });
        setResults(items);
        setProgress(null);
        if (items.length === 0) setError('Keine Bilder gefunden.');
      } else {
        const { results: items, hit } = await searchImages(query.trim(), provider, 1);
        setResults(items);
        setFromCache(hit);
        setHasMore(items.length >= 20);
        if (items.length === 0) setError(`Nichts gefunden für "${query}"`);
        if (hit) getCacheStats().then(setCacheStats);
      }
    } catch (e: any) {
      setError(e.message ?? 'Suche fehlgeschlagen');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [query, provider]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !query.trim() || provider === 'smart') return;
    setLoadingMore(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const { results: items } = await searchImages(query.trim(), provider, nextPage);
      setResults((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        return [...prev, ...items.filter((r) => !existingIds.has(r.id))];
      });
      setPage(nextPage);
      setHasMore(items.length >= 20);
    } catch (e: any) {
      setError(e.message ?? 'Mehr laden fehlgeschlagen');
    } finally {
      setLoadingMore(false);
    }
  }, [query, provider, page, loadingMore]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const markBroken = useCallback((id: string) => {
    setBrokenIds((prev) => { const next = new Set(prev); next.add(id); return next; });
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const visibleResults = results.filter((r) => !brokenIds.has(r.id));
  const allSelected = visibleResults.length > 0 && selected.size === visibleResults.length;

  const autoSelectCount = (count: number) =>
    setSelected(new Set(visibleResults.slice(0, count).map((r) => r.id)));

  const selectAll = () => setSelected(new Set(visibleResults.map((r) => r.id)));
  const clearSelection = () => setSelected(new Set());

  const handleAddSelected = () => {
    visibleResults.filter((r) => selected.has(r.id)).forEach((r) => {
      addItem({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        uri: r.uri,
        label: r.label,
      });
    });
    router.back();
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
        onPress={() => toggleSelect(item.id)}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.resultImage}
          onError={() => markBroken(item.id)}
          onLoad={() => {
            isImageUsable(item.uri).then((ok) => { if (!ok) markBroken(item.id); });
          }}
        />
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
        <View style={styles.labelBadge}>
          <Text style={styles.labelText} numberOfLines={1}>{item.label}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Provider Tabs */}
      <View style={styles.providerRow}>
        {PROVIDERS.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.providerButton, provider === p.key && styles.providerButtonActive]}
            onPress={() => { setProvider(p.key); setResults([]); setError(null); }}
          >
            <Text style={[styles.providerText, provider === p.key && styles.providerTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Cache-Info */}
      {cacheStats !== null && (provider === 'serper' || provider === 'smart') && (
        <View style={styles.cacheBar}>
          <Text style={styles.cacheInfo}>
            Cache: {cacheStats.entries} Einträge · {cacheStats.sizeKB} KB
          </Text>
          <Pressable
            style={styles.cacheClearButton}
            onPress={async () => {
              await clearCache();
              const stats = await getCacheStats();
              setCacheStats(stats);
            }}
          >
            <Text style={styles.cacheClearText}>Cache leeren</Text>
          </Pressable>
        </View>
      )}

      {provider === 'smart' && (
        <View style={styles.smartHint}>
          <Text style={styles.smartHintText}>
            Gib eine Kategorie ein – KI erstellt die Liste und sucht pro Item ein Bild.
          </Text>
        </View>
      )}

      {/* Suchzeile */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={
            provider === 'smart'
              ? 'z.B. TOTK Enemies, Winx Club, Tiere Afrikas...'
              : 'z.B. Tiere, Winx, TOTK Enemies...'
          }
          placeholderTextColor={TEXT_SECONDARY}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchButtonText}>
            {loading ? '...' : 'Suchen'}
          </Text>
        </Pressable>
      </View>

      {/* KI Fortschrittsanzeige */}
      {progress && (
        <View style={styles.progressBox}>
          <View style={styles.progressBarOuter}>
            <View
              style={[
                styles.progressBarInner,
                { width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress.done}/{progress.total} – {progress.current || 'Lade...'}
          </Text>
        </View>
      )}

      {/* Schnellauswahl */}
      {visibleResults.length > 0 && (
        <View style={styles.autoSelectBar}>
          <Text style={styles.autoSelectLabel}>Schnellauswahl:</Text>
          <View style={styles.autoSelectButtons}>
            {AUTO_SELECT_COUNTS.filter((n) => n <= visibleResults.length).map((n) => (
              <Pressable
                key={n}
                style={[styles.countButton, selected.size === n && styles.countButtonActive]}
                onPress={() => autoSelectCount(n)}
              >
                <Text style={[styles.countButtonText, selected.size === n && styles.countButtonTextActive]}>
                  {n}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.countButton, styles.allButton, allSelected && styles.countButtonActive]}
              onPress={allSelected ? clearSelection : selectAll}
            >
              <Text style={[styles.countButtonText, allSelected && styles.countButtonTextActive]}>
                {allSelected ? 'Alle ab' : `Alle (${visibleResults.length})`}
              </Text>
            </Pressable>
          </View>
          {fromCache && (
            <Text style={styles.cacheHitBadge}>⚡ Aus Cache geladen</Text>
          )}
          {brokenIds.size > 0 && (
            <Text style={styles.filteredNote}>({brokenIds.size} kaputte Bilder ausgeblendet)</Text>
          )}
        </View>
      )}

      {loading && !progress && <ActivityIndicator style={styles.loader} color={TEXT_COLOR} size="large" />}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={visibleResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          !loading && !progress ? (
            <Text style={styles.hint}>
              {provider === 'smart'
                ? 'Kategorie eingeben – KI findet alle Items automatisch'
                : 'Stichwort eingeben und auf "Suchen" tippen'}
            </Text>
          ) : null
        }
        ListFooterComponent={
          visibleResults.length > 0 && hasMore && provider !== 'smart' ? (
            <View style={styles.footer}>
              <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
                {loadingMore
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.loadMoreText}>Mehr laden ({visibleResults.length} bisher)</Text>
                }
              </Pressable>
            </View>
          ) : null
        }
      />

      {selected.size > 0 && (
        <Pressable style={styles.addButton} onPress={handleAddSelected}>
          <Text style={styles.addButtonText}>
            {selected.size} Bild{selected.size > 1 ? 'er' : ''} in den Pool →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  providerRow: { flexDirection: 'row', padding: 12, gap: 6 },
  providerButton: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: SURFACE, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  providerButtonActive: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  providerText: { color: TEXT_SECONDARY, fontWeight: '600', fontSize: 12 },
  providerTextActive: { color: '#fff' },
  smartHint: {
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor: '#1a2a3a', borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: '#2a4a6a',
  },
  smartHintText: { color: '#7ab8f5', fontSize: 12, lineHeight: 17 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  input: {
    flex: 1, backgroundColor: SURFACE, color: TEXT_COLOR,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, borderWidth: 1, borderColor: '#333',
  },
  searchButton: {
    backgroundColor: '#4A90D9', paddingHorizontal: 16,
    borderRadius: 8, justifyContent: 'center', minWidth: 72, alignItems: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  progressBox: { marginHorizontal: 12, marginBottom: 10 },
  progressBarOuter: {
    height: 6, backgroundColor: '#333',
    borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  progressBarInner: { height: '100%', backgroundColor: '#4A90D9', borderRadius: 3 },
  progressText: { color: TEXT_SECONDARY, fontSize: 12 },
  autoSelectBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10, gap: 8, flexWrap: 'wrap',
  },
  autoSelectLabel: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '600' },
  filteredNote: { color: '#ff8080', fontSize: 11, marginTop: 4, width: '100%' },
  cacheHitBadge: { color: '#4CAF50', fontSize: 11, marginTop: 4, width: '100%' },
  cacheBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#0f1f0f', borderBottomWidth: 1, borderBottomColor: '#1a3a1a',
  },
  cacheInfo: { color: '#4CAF50', fontSize: 11 },
  cacheClearButton: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: '#1a3a1a', borderWidth: 1, borderColor: '#2a5a2a',
  },
  cacheClearText: { color: '#4CAF50', fontSize: 11, fontWeight: '600' },
  autoSelectButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  countButton: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: '#444',
  },
  countButtonActive: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  countButtonText: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
  countButtonTextActive: { color: '#fff' },
  allButton: { paddingHorizontal: 14 },
  loader: { marginTop: 40 },
  grid: { paddingHorizontal: 8, paddingBottom: 120 },
  footer: { alignItems: 'center', paddingVertical: 16 },
  loadMoreButton: {
    backgroundColor: '#333', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 8, minWidth: 180, alignItems: 'center',
  },
  loadMoreText: { color: TEXT_COLOR, fontWeight: '600', fontSize: 14 },
  resultItem: {
    flex: 1, margin: 3, aspectRatio: 1, borderRadius: 6,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
    backgroundColor: '#111',
  },
  resultItemSelected: { borderColor: '#4A90D9' },
  resultImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  labelBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 3, paddingVertical: 2,
  },
  labelText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  checkmark: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#4A90D9',
    borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  checkmarkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  hint: { color: TEXT_SECONDARY, textAlign: 'center', marginTop: 60, fontSize: 14, paddingHorizontal: 24 },
  errorBox: {
    marginHorizontal: 12, marginBottom: 8, backgroundColor: '#3a1a1a',
    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#7f2020',
  },
  errorText: { color: '#ff8080', fontSize: 13, lineHeight: 18 },
  addButton: {
    position: 'absolute', bottom: 24, left: 24, right: 24,
    backgroundColor: TIER_COLORS.S, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  addButtonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
