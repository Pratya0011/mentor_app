import { useState } from 'react';

import ChatScreen from './src/screens/ChatScreen';
import DownloadScreen from './src/screens/DownloadScreen';

type Screen = 'download' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('download');

  return screen === 'chat' ? (
    <ChatScreen onBack={() => setScreen('download')} />
  ) : (
    <DownloadScreen onStart={() => setScreen('chat')} />
  );
}
