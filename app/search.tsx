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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTierStore } from '../src/store/useTierStore';
import { searchImages, SearchProvider, SearchResult } from '../src/services/imageSearch';
import { BG, SURFACE, TEXT as TEXT_COLOR, TEXT_SECONDARY, TIER_COLORS } from '../src/constants/colors';

export default function SearchScreen() {
  const router = useRouter();
  const { addItem } = useTierStore();

  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<SearchProvider>('pixabay');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    try {
      const items = await searchImages(query.trim(), provider);
      setResults(items);
      if (items.length === 0) Alert.alert('Keine Ergebnisse', `Nichts gefunden für "${query}"`);
    } catch (e: any) {
      Alert.alert('Fehler', e.message ?? 'Suche fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, [query, provider]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
        {(['pixabay', 'google'] as SearchProvider[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.providerButton, provider === p && styles.providerButtonActive]}
            onPress={() => setProvider(p)}
          >
            <Text style={[styles.providerText, provider === p && styles.providerTextActive]}>
              {p === 'pixabay' ? 'Pixabay' : 'Google'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="z.B. Tiere, Winx, TOTK..."
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

      {loading && <ActivityIndicator style={styles.loader} color={TEXT_COLOR} size="large" />}

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
      />

      {selected.size > 0 && (
        <Pressable style={styles.addButton} onPress={handleAddSelected}>
          <Text style={styles.addButtonText}>
            {selected.size} Item{selected.size > 1 ? 's' : ''} hinzufügen →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  providerRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: SURFACE,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  providerButtonActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  providerText: {
    color: TEXT_SECONDARY,
    fontWeight: '600',
    fontSize: 14,
  },
  providerTextActive: {
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: SURFACE,
    color: TEXT_COLOR,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  loader: {
    marginTop: 40,
  },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  resultItem: {
    flex: 1,
    margin: 3,
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resultItemSelected: {
    borderColor: '#4A90D9',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  hint: {
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 60,
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: TIER_COLORS.S,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
