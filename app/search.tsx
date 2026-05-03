import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTierStore } from '../src/store/useTierStore';
import { searchImages, SearchProvider, SearchResult } from '../src/services/imageSearch';
import { BG, SURFACE, TEXT as TEXT_COLOR, TEXT_SECONDARY, TIER_COLORS } from '../src/constants/colors';

const AUTO_SELECT_COUNTS = [10, 20, 30, 50];

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

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    setError(null);
    setPage(1);
    setHasMore(false);
    try {
      const items = await searchImages(query.trim(), provider, 1);
      setResults(items);
      setHasMore(items.length >= 20);
      if (items.length === 0) setError(`Nichts gefunden für "${query}"`);
    } catch (e: any) {
      setError(e.message ?? 'Suche fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, [query, provider]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !query.trim()) return;
    setLoadingMore(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const items = await searchImages(query.trim(), provider, nextPage);
      setResults((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newItems = items.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
      setPage(nextPage);
      setHasMore(items.length >= 20);
    } catch (e: any) {
      setError(e.message ?? 'Mehr laden fehlgeschlagen');
    } finally {
      setLoadingMore(false);
    }
  }, [query, provider, page, loadingMore]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const autoSelectCount = (count: number) => {
    const toSelect = results.slice(0, count).map((r) => r.id);
    setSelected(new Set(toSelect));
  };

  const selectAll = () => setSelected(new Set(results.map((r) => r.id)));
  const clearSelection = () => setSelected(new Set());

  const handleAddSelected = () => {
    const toAdd = results.filter((r) => selected.has(r.id));
    toAdd.forEach((r) => {
      addItem({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        uri: r.uri,
        label: r.label,
      });
    });
    router.back();
  };

  const allSelected = results.length > 0 && selected.size === results.length;

  const renderItem = ({ item }: { item: SearchResult }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
        onPress={() => toggleSelect(item.id)}
      >
        <Image source={{ uri: item.uri }} style={styles.resultImage} />
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.providerRow}>
        {(['pixabay', 'serper'] as SearchProvider[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.providerButton, provider === p && styles.providerButtonActive]}
            onPress={() => setProvider(p)}
          >
            <Text style={[styles.providerText, provider === p && styles.providerTextActive]}>
              {p === 'pixabay' ? '📷 Pixabay' : '🌐 Web-Suche'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="z.B. Tiere, Winx, TOTK Enemies..."
          placeholderTextColor={TEXT_SECONDARY}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Suchen</Text>
        </Pressable>
      </View>

      {results.length > 0 && (
        <View style={styles.autoSelectBar}>
          <Text style={styles.autoSelectLabel}>Schnellauswahl:</Text>
          <View style={styles.autoSelectButtons}>
            {AUTO_SELECT_COUNTS.filter((n) => n <= results.length).map((n) => (
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
                {allSelected ? 'Alle ab' : `Alle (${results.length})`}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {loading && <ActivityIndicator style={styles.loader} color={TEXT_COLOR} size="large" />}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.hint}>Stichwort eingeben und auf "Suchen" tippen</Text>
          ) : null
        }
        ListFooterComponent={
          results.length > 0 ? (
            <View style={styles.footer}>
              {hasMore && (
                <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
                  {loadingMore
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.loadMoreText}>Mehr laden ({results.length} bisher)</Text>
                  }
                </Pressable>
              )}
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
  providerRow: { flexDirection: 'row', padding: 12, gap: 8 },
  providerButton: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: SURFACE, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  providerButtonActive: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  providerText: { color: TEXT_SECONDARY, fontWeight: '600', fontSize: 14 },
  providerTextActive: { color: '#fff' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  input: {
    flex: 1, backgroundColor: SURFACE, color: TEXT_COLOR,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, borderWidth: 1, borderColor: '#333',
  },
  searchButton: { backgroundColor: '#4A90D9', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  autoSelectBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10, gap: 8, flexWrap: 'wrap',
  },
  autoSelectLabel: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '600' },
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
  },
  resultItemSelected: { borderColor: '#4A90D9' },
  resultImage: { width: '100%', height: '100%' },
  checkmark: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#4A90D9',
    borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  checkmarkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  hint: { color: TEXT_SECONDARY, textAlign: 'center', marginTop: 60, fontSize: 14 },
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
