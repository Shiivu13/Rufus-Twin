import { useState } from 'react';
import { Bot } from 'lucide-react';
import { ChatComponent } from './components/ChatComponent';
import { ThreeBackground } from './components/ThreeBackground';
import './hero.css';

function App() {
  const [externalMessage, setExternalMessage] = useState<string>('');

  return (
    <>
      <ThreeBackground />

      <div className="bg-orbs-container" style={{ opacity: 0.3 }}>
        <div className="orb orb-purple"></div>
        <div className="orb orb-blue"></div>
      </div>

      <div className="app-container">
        <aside className="glass-panel sidebar">
          <div className="sidebar-logo">
            <Bot size={32} color="var(--accent-neon)" />
            <span className="logo-text">Rufus</span>
          </div>
          
          <div className="sidebar-status">
            <div className="status-dot"></div>
            <span>System Active</span>
          </div>
        </aside>

        <ChatComponent externalMessage={externalMessage} onExternalMessageSent={() => setExternalMessage('')} />
      </div>
    </>
  );
}

export default App;
