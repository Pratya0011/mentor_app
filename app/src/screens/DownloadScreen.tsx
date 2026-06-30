import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MODEL,
  downloadModel,
  isModelDownloaded,
  type DownloadProgress,
} from '../lib/model';

const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 47;

type Phase = 'checking' | 'idle' | 'downloading' | 'ready' | 'error';

const fmtSize = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 MB';
  const mb = bytes / 1_000_000;
  return mb >= 1000 ? `${(mb / 1000).toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
};

const fmtSpeed = (bps: number): string => {
  if (!bps || bps <= 0) return '—';
  const mb = bps / 1_000_000;
  return mb >= 1 ? `${mb.toFixed(2)} MB/s` : `${(bps / 1000).toFixed(0)} KB/s`;
};

export default function DownloadScreen({ onStart }: { onStart: () => void }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  // On launch, detect whether the model is already downloaded.
  useEffect(() => {
    setPhase(isModelDownloaded() ? 'ready' : 'idle');
  }, []);

  const startDownload = async () => {
    setPhase('downloading');
    setProgress(null);
    try {
      await downloadModel(setProgress);
      setPhase('ready');
    } catch (err) {
      console.error('Model download failed:', err);
      setPhase('error');
    }
  };

  const pct = progress ? Math.round(progress.fraction * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <Text style={styles.title}>Mentor AI</Text>
        <Text style={styles.subtitle}>
          {MODEL.displayName} · {MODEL.quantization}
        </Text>
      </View>

      <View style={styles.card}>
        {phase === 'checking' && <ActivityIndicator color="#fff" />}

        {phase === 'idle' && (
          <>
            <Text style={styles.body}>
              The model runs fully offline on your device. Download it once
              (~{fmtSize(MODEL.approxSizeBytes)}) to get started.
            </Text>
            <Pressable style={styles.button} onPress={startDownload}>
              <Text style={styles.buttonText}>Download Model</Text>
            </Pressable>
          </>
        )}

        {phase === 'downloading' && (
          <>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.pct}>{pct}%</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>
                {fmtSize(progress?.bytesWritten ?? 0)} /{' '}
                {fmtSize(progress?.totalBytes || MODEL.approxSizeBytes)}
              </Text>
              <Text style={styles.stat}>{fmtSpeed(progress?.bytesPerSec ?? 0)}</Text>
            </View>
          </>
        )}

        {phase === 'ready' && (
          <>
            <Text style={styles.body}>
              Model ready. You&apos;re all set to chat — completely offline.
            </Text>
            <Pressable style={styles.button} onPress={onStart}>
              <Text style={styles.buttonText}>Start Conversation</Text>
            </Pressable>
          </>
        )}

        {phase === 'error' && (
          <>
            <Text style={styles.body}>
              Download failed. Check your connection and try again.
            </Text>
            <Pressable style={styles.button} onPress={startDownload}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    paddingTop: TOP_INSET,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },
  hero: { alignItems: 'center', gap: 8 },
  title: { color: '#fff', fontSize: 40, fontWeight: '700' },
  subtitle: { color: '#9CA0AA', fontSize: 14 },
  card: {
    backgroundColor: '#17171D',
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  body: { color: '#C7CAD1', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: {
    backgroundColor: '#3C87F7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A2A33',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5, backgroundColor: '#3C87F7' },
  pct: { color: '#fff', fontSize: 32, fontWeight: '700', textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { color: '#9CA0AA', fontSize: 13 },
});
