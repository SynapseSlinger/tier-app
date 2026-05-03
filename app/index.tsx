import { useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTierStore } from '../src/store/useTierStore';
import TierRow from '../src/components/TierRow';
import ItemPool from '../src/components/ItemPool';
import { BG, TEXT as TEXT_COLOR } from '../src/constants/colors';

export default function EditorScreen() {
  const router = useRouter();
  const { tierList, addItem, moveItem } = useTierStore();
  const tierLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const scrollOffset = useRef(0);

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
      const tiers = tierList.tiers;
      for (const tier of tiers) {
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
    [tierList.tiers, moveItem]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.tiers}
        onScroll={(e) => {
          scrollOffset.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {tierList.tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onDragEnd={handleDragEnd}
            onLayout={handleTierLayout}
          />
        ))}
      </ScrollView>

      {tierList.unassignedPool.length > 0 && (
        <Pressable style={styles.quickVoteButton} onPress={() => router.push('/quick-vote')}>
          <Text style={styles.quickVoteText}>Quick Vote ({tierList.unassignedPool.length})</Text>
        </Pressable>
      )}

      <ItemPool
        items={tierList.unassignedPool}
        onDragEnd={handleDragEnd}
        onAddPress={pickImage}
        onSearchPress={() => router.push('/search')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  tiers: {
    flex: 1,
  },
  quickVoteButton: {
    backgroundColor: '#4A90D9',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickVoteText: {
    color: TEXT_COLOR,
    fontSize: 15,
    fontWeight: '700',
  },
});
