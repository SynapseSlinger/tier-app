import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

const CORRECT_PIN = process.env.EXPO_PUBLIC_APP_PIN ?? '';
const SESSION_KEY = 'tier_app_auth';

function isAuthenticated(): boolean {
  try {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(SESSION_KEY) === 'ok';
    }
  } catch {}
  return false;
}

function setAuthenticated() {
  try {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, 'ok');
    }
  } catch {}
}

interface Props {
  children: React.ReactNode;
}

export default function PinGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!CORRECT_PIN || isAuthenticated()) setUnlocked(true);
  }, []);

  const submit = useCallback((pin: string) => {
    if (pin === CORRECT_PIN) {
      setAuthenticated();
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1200);
    }
  }, []);

  const press = useCallback((digit: string) => {
    setError(false);
    setInput((prev) => {
      const next = prev + digit;
      if (next.length === CORRECT_PIN.length) {
        // defer so the last dot renders before the check
        setTimeout(() => submit(next), 80);
        return next;
      }
      return next;
    });
  }, [submit]);

  const del = useCallback(() => {
    setError(false);
    setInput((prev) => prev.slice(0, -1));
  }, []);

  if (unlocked) return <>{children}</>;

  const dots = Array.from({ length: CORRECT_PIN.length }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        i < input.length && styles.dotFilled,
        error && styles.dotError,
      ]}
    />
  ));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Tier App</Text>
      <Text style={styles.subtitle}>PIN eingeben</Text>

      <View style={styles.dotsRow}>{dots}</View>

      {error && <Text style={styles.errorText}>Falscher PIN</Text>}

      <View style={styles.pad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => {
          if (key === '') return <View key={idx} style={styles.padEmpty} />;
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.padKey, pressed && styles.padKeyPressed]}
              onPress={() => key === '⌫' ? del() : press(key)}
            >
              <Text style={styles.padKeyText}>{key}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 15, marginBottom: 36 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#555', backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  dotError: { backgroundColor: '#cc2222', borderColor: '#cc2222' },
  errorText: { color: '#ff6060', fontSize: 13, marginBottom: 8 },
  pad: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 240, marginTop: 28, gap: 12,
  },
  padEmpty: { width: 72, height: 72 },
  padKey: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  padKeyPressed: { backgroundColor: '#2a2a2a' },
  padKeyText: { color: '#fff', fontSize: 22, fontWeight: '500' },
});
