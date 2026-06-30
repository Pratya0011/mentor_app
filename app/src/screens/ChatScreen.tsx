import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { chat, loadModel, type ChatMessage } from '../lib/llama';
import { buildSystemPrompt, retrieveContext } from '../lib/rag';

const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 47;

export default function ChatScreen({ onBack }: { onBack: () => void }) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);

  // Load the model into memory once when the chat opens.
  useEffect(() => {
    let cancelled = false;
    loadModel()
      .then(() => !cancelled && setLoading(false))
      .catch((err) => {
        console.error('Model load failed:', err);
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || generating || loading || loadError) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    // Show user message + an empty assistant bubble we stream into.
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setGenerating(true);

    try {
      // 1. Retrieve relevant context from the backend (RAG).
      //    If the server is unreachable, fall back to no context.
      let systemPrompt: string;
      try {
        // Retrieve using ONLY the current question. Mixing in prior turns
        // (especially long assistant answers) pollutes the query — e.g. asking
        // "what is typescript" after a RAG answer would still match RAG chunks.
        const { chunks } = await retrieveContext(text);
        systemPrompt = buildSystemPrompt(chunks);
      } catch (retrieveErr) {
        console.warn('Retrieval failed, answering without context:', retrieveErr);
        systemPrompt = buildSystemPrompt([]);
      }

      // 2. Generate the answer on-device, grounded in the retrieved context.
      await chat(
        [{ role: 'system', content: systemPrompt }, ...history],
        (partial) => {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: partial };
            return next;
          });
        },
      );
    } catch (err) {
      console.error('Generation failed:', err);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: '⚠️ Something went wrong generating a reply.',
        };
        return next;
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.muted}>Loading model…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Failed to load the model. Go back and try again.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <Text style={[styles.muted, styles.empty]}>
              Ask your mentor anything to get started.
            </Text>
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}>
                <Text style={styles.bubbleText}>
                  {item.content || (generating ? '…' : '')}
                </Text>
              </View>
            );
          }}
        />
      )}

      {!loading && !loadError && (
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            placeholderTextColor="#6B6F78"
            style={styles.input}
            multiline
            editable={!generating}
          />
          <Pressable
            onPress={send}
            disabled={generating || !input.trim()}
            style={[
              styles.sendBtn,
              (generating || !input.trim()) && styles.sendDisabled,
            ]}>
            {generating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', paddingTop: TOP_INSET },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#22222A',
  },
  back: { color: '#3C87F7', fontSize: 16, fontWeight: '600' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  spacer: { width: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: '#6B6F78', fontSize: 15 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 64 },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3C87F7' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#17171D' },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#22222A',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: '#fff',
    backgroundColor: '#17171D',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#3C87F7',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
