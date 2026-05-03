import { Image, StyleSheet, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface DraggableItemProps {
  uri: string;
  itemId: string;
  onDragEnd: (itemId: string, y: number) => void;
  deleteMode?: boolean;
  selected?: boolean;
  onLongPress?: (itemId: string) => void;
  onPress?: (itemId: string) => void;
}

export default function DraggableItem({
  uri,
  itemId,
  onDragEnd,
  deleteMode = false,
  selected = false,
  onLongPress,
  onPress,
}: DraggableItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!deleteMode)
    .onStart(() => {
      scale.value = withSpring(1.15);
      zIndex.value = 100;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(itemId, e.absoluteY);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
    });

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onEnd(() => {
      if (onLongPress) runOnJS(onLongPress)(itemId);
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (deleteMode && onPress) runOnJS(onPress)(itemId);
  });

  const gesture = deleteMode
    ? Gesture.Race(tap, longPress)
    : Gesture.Race(pan, longPress);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <Image
          source={{ uri }}
          style={[styles.image, selected && styles.imageSelected]}
        />
        {deleteMode && (
          <View style={[styles.badge, selected ? styles.badgeSelected : styles.badgeEmpty]}>
            {selected && <Text style={styles.badgeText}>✕</Text>}
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 56, height: 56 },
  image: { width: 56, height: 56, borderRadius: 4 },
  imageSelected: { opacity: 0.5 },
  badge: {
    position: 'absolute', top: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeEmpty: { borderColor: '#fff', backgroundColor: 'transparent' },
  badgeSelected: { borderColor: '#ff4444', backgroundColor: '#ff4444' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
