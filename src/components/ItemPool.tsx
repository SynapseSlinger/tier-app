import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { Item } from '../store/useTierStore';
import { SURFACE, TEXT as TEXT_COLOR, TEXT_SECONDARY } from '../constants/colors';
import DraggableItem from './DraggableItem';

interface ItemPoolProps {
  items: Item[];
  onDragEnd: (itemId: string, y: number) => void;
  onAddPress?: () => void;
  onSearchPress?: () => void;
  deleteMode?: boolean;
  selectedIds?: Set<string>;
  onLongPress?: (itemId: string) => void;
  onItemPress?: (itemId: string) => void;
}

export default function ItemPool({
  items, onDragEnd, onAddPress, onSearchPress,
  deleteMode = false, selectedIds = new Set(),
  onLongPress, onItemPress,
}: ItemPoolProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {deleteMode ? `${selectedIds.size} ausgewählt` : 'Items'}
        </Text>
        {!deleteMode && (
          <View style={styles.actions}>
            <Pressable style={styles.searchButton} onPress={onSearchPress}>
              <Text style={styles.searchText}>🔍 Suchen</Text>
            </Pressable>
            <Pressable style={styles.addButton} onPress={onAddPress}>
              <Text style={styles.addText}>+ Galerie</Text>
            </Pressable>
          </View>
        )}
      </View>
      {items.length > 0 && !deleteMode && (
        <Text style={styles.hint}>
          Ziehen → in Tier einordnen · Lang drücken → mehrere auswählen & verschieben
        </Text>
      )}
      <ScrollView
        style={styles.poolScroll}
        contentContainerStyle={styles.pool}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            itemId={item.id}
            uri={item.uri}
            onDragEnd={onDragEnd}
            deleteMode={deleteMode}
            selected={selectedIds.has(item.id)}
            onLongPress={onLongPress}
            onPress={onItemPress}
          />
        ))}
        {items.length === 0 && !deleteMode && (
          <Text style={styles.emptyText}>Suche nach Bildern oder lade aus der Galerie</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#333',
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: { color: TEXT_COLOR, fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  searchButton: {
    backgroundColor: '#4A90D9', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 6,
  },
  searchText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  addButton: {
    backgroundColor: '#333', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 6,
  },
  addText: { color: TEXT_COLOR, fontSize: 13, fontWeight: '600' },
  poolScroll: { flex: 1 },
  pool: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingBottom: 20, gap: 6, minHeight: 64,
  },
  hint: {
    color: TEXT_SECONDARY, fontSize: 11, paddingHorizontal: 12,
    paddingBottom: 6, lineHeight: 16,
  },
  emptyText: { color: TEXT_SECONDARY, fontSize: 13, paddingVertical: 16 },
});
