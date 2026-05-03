import { useRef, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTierStore } from '../src/store/useTierStore';
import TierRow from '../src/components/TierRow';
import ItemPool from '../src/components/ItemPool';
import { BG, TEXT as TEXT_COLOR } from '../src/constants/colors';

export default function EditorScreen() {
  const router = useRouter();
  const { tierList, addItem, moveItem, removeItems } = useTierStore();
  const tierLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const scrollOffset = useRef(0);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enterDeleteMode = useCallback((firstId: string) => {
    setDeleteMode(true);
    setSelectedIds(new Set([firstId]));
  }, []);

  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }, []);

  const cancelDeleteMode = useCallback(() => {
    setDeleteMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDelete = useCallback(() => {
    removeItems(Array.from(selectedIds));
    setDeleteMode(false);
    setSelectedIds(new Set());
  }, [selectedIds, removeItems]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      result.assets.forEach((asset) => {
        addItem({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          uri: asset.uri,
          label: asset.fileName ?? 'Item',
        });
      });
    }
  };

  const handleTierLayout = useCallback((tierId: string, y: number, height: number) => {
    tierLayouts.current[tierId] = { y, height };
  }, []);

  const handleDragEnd = useCallback(
    (itemId: string, absoluteY: number) => {
      if (deleteMode) return;
      for (const tier of tierList.tiers) {
        const layout = tierLayouts.current[tier.id];
        if (!layout) continue;
        const tierTop = layout.y - scrollOffset.current;
        const tierBottom = tierTop + layout.height;
        if (absoluteY >= tierTop && absoluteY <= tierBottom) {
          moveItem(itemId, tier.id);
          return;
        }
      }
      moveItem(itemId, null);
    },
    [tierList.tiers, moveItem, deleteMode]
  );

  const totalItems =
    tierList.unassignedPool.length +
    tierList.tiers.reduce((sum, t) => sum + t.items.length, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.tiers}
        onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {tierList.tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onDragEnd={handleDragEnd}
            onLayout={handleTierLayout}
            deleteMode={deleteMode}
            selectedIds={selectedIds}
            onLongPress={enterDeleteMode}
            onItemPress={toggleSelectItem}
          />
        ))}
      </ScrollView>

      {!deleteMode && tierList.unassignedPool.length > 0 && (
        <Pressable style={styles.quickVoteButton} onPress={() => router.push('/quick-vote')}>
          <Text style={styles.quickVoteText}>
            Quick Vote ({tierList.unassignedPool.length})
          </Text>
        </Pressable>
      )}

      <ItemPool
        items={tierList.unassignedPool}
        onDragEnd={handleDragEnd}
        onAddPress={pickImage}
        onSearchPress={() => router.push('/search')}
        deleteMode={deleteMode}
        selectedIds={selectedIds}
        onLongPress={enterDeleteMode}
        onItemPress={toggleSelectItem}
      />

      {deleteMode && (
        <View style={styles.deleteBar}>
          <Pressable style={styles.cancelButton} onPress={cancelDeleteMode}>
            <Text style={styles.cancelText}>Abbrechen</Text>
          </Pressable>
          <Pressable
            style={[styles.deleteButton, selectedIds.size === 0 && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={selectedIds.size === 0}
          >
            <Text style={styles.deleteText}>
              🗑 {selectedIds.size > 0 ? `${selectedIds.size} löschen` : 'Auswählen'}
            </Text>
          </Pressable>
          <Pressable style={styles.selectAllButton} onPress={() => {
            const allIds = [
              ...tierList.unassignedPool.map((i) => i.id),
              ...tierList.tiers.flatMap((t) => t.items.map((i) => i.id)),
            ];
            setSelectedIds(new Set(allIds));
          }}>
            <Text style={styles.selectAllText}>Alle ({totalItems})</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  tiers: { flex: 1 },
  quickVoteButton: {
    backgroundColor: '#4A90D9',
    marginHorizontal: 12, marginVertical: 8,
    paddingVertical: 12, borderRadius: 8, alignItems: 'center',
  },
  quickVoteText: { color: TEXT_COLOR, fontSize: 15, fontWeight: '700' },
  deleteBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 10,
    gap: 8,
  },
  cancelButton: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: '#333', alignItems: 'center',
  },
  cancelText: { color: TEXT_COLOR, fontWeight: '600', fontSize: 14 },
  deleteButton: {
    flex: 2, paddingVertical: 12, borderRadius: 8,
    backgroundColor: '#cc2222', alignItems: 'center',
  },
  deleteButtonDisabled: { backgroundColor: '#551111' },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  selectAllButton: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: '#333', alignItems: 'center',
  },
  selectAllText: { color: TEXT_COLOR, fontWeight: '600', fontSize: 13 },
});
