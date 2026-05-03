import { View, Text, StyleSheet } from 'react-native';
import { Tier } from '../store/useTierStore';
import DraggableItem from './DraggableItem';

interface TierRowProps {
  tier: Tier;
  onDragEnd: (itemId: string, y: number) => void;
  onLayout?: (tierId: string, y: number, height: number) => void;
}

export default function TierRow({ tier, onDragEnd, onLayout }: TierRowProps) {
  return (
    <View
      style={styles.row}
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        onLayout?.(tier.id, y, height);
      }}
    >
      <View style={[styles.label, { backgroundColor: tier.color }]}>
        <Text style={styles.labelText}>{tier.title}</Text>
      </View>
      <View style={styles.items}>
        {tier.items.map((item) => (
          <DraggableItem
            key={item.id}
            itemId={item.id}
            uri={item.uri}
            onDragEnd={onDragEnd}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  labelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  items: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    gap: 4,
  },
});
