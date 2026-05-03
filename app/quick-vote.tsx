import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTierStore } from '../src/store/useTierStore';
import { BG, TEXT as TEXT_COLOR, TEXT_SECONDARY } from '../src/constants/colors';

export default function QuickVoteScreen() {
  const router = useRouter();
  const { tierList, moveItem } = useTierStore();
  const currentItem = tierList.unassignedPool[0];

  const handleVote = (tierId: string) => {
    if (!currentItem) return;
    moveItem(currentItem.id, tierId);
    if (tierList.unassignedPool.length <= 1) {
      router.back();
    }
  };

  if (!currentItem) {
    return (
      <View style={styles.container}>
        <Text style={styles.doneText}>Alle Items wurden einsortiert!</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Zurück zum Editor</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>
        {tierList.unassignedPool.length} verbleibend
      </Text>
      <Image source={{ uri: currentItem.uri }} style={styles.preview} resizeMode="contain" />
      <Text style={styles.label}>{currentItem.label}</Text>
      <View style={styles.buttons}>
        {tierList.tiers.map((tier) => (
          <Pressable
            key={tier.id}
            style={[styles.tierButton, { backgroundColor: tier.color }]}
            onPress={() => handleVote(tier.id)}
          >
            <Text style={styles.tierButtonText}>{tier.title}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.skipButton} onPress={() => router.back()}>
        <Text style={styles.skipText}>Überspringen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  counter: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    marginBottom: 16,
  },
  preview: {
    width: 240,
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    color: TEXT_COLOR,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tierButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  tierButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  skipButton: {
    marginTop: 24,
    padding: 12,
  },
  skipText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  doneText: {
    color: TEXT_COLOR,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
});
