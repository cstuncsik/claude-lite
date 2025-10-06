import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import { onStreamChunk } from './lib/tauri';
import { useChatsStore } from './store/chats';
import './App.css';

function App() {
  const { appendStreamDelta, finalizeStreamedMessage } = useChatsStore();

  useEffect(() => {
    // Listen for streaming chunks
    const unlisten = onStreamChunk((chunk) => {
      if (chunk.done) {
        finalizeStreamedMessage();
      } else {
        appendStreamDelta(chunk.delta);
      }
    });

    return () => {
      unlisten.then((fn: () => void) => fn());
    };
  }, []);

  return (
    <div className="flex h-full bg-linear-to-t from-slate-950 to-slate-900 text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-full overflow-hidden">
        <ChatView />
      </div>
    </div>
  );
}

export default App;
