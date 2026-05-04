import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Zap, Box, Search } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  imageUrl?: string;
  intent?: string;
}

interface ChatComponentProps {
  externalMessage: string;
  onExternalMessageSent: () => void;
}

const suggestedQuestions = [
  { icon: <Sparkles size={18} />, text: "iPhone 18 Leaks and Rumors" },
  { icon: <Zap size={18} />, text: "Best AI-integrated laptops in 2026" },
  { icon: <Box size={18} />, text: "Compare Tesla Model 3 vs. latest BYD models" },
];

const loadingTexts = [
  "Rufus is thinking...",
  "Accessing real-time web data...",
  "Analyzing product reviews...",
  "Compiling pros and cons...",
  "Generating unbiased recommendation..."
];

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const ChatComponent: FC<ChatComponentProps> = ({ externalMessage, onExternalMessageSent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const currentSession = generateSessionId();
    setSessionId(currentSession);
  }, []);

  useEffect(() => {
    if (externalMessage) {
      handleSend(externalMessage);
      onExternalMessageSent();
    }
  }, [externalMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let interval: any;
    if (isTyping) {
      setLoadingTextIndex(0);
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_query: text, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "Sorry, I couldn't process that.",
        sender: 'ai',
        imageUrl: data.images && data.images.length > 0 ? data.images[0] : undefined,
        intent: data.intent
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error connecting to the backend. Please ensure the FastAPI server is running and Tavily API key is set.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  const renderAnimatedText = (text: string) => {
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    return paragraphs.map((p, index) => (
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.3, duration: 0.5, ease: 'easeOut' }}
        style={{ marginBottom: index !== paragraphs.length - 1 ? '1rem' : '0' }}
        dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
      />
    ));
  };

  return (
    <div className="glass-panel chat-main">
      <div className="chat-header">
        <div className="chat-title">Rufus-Twin Dashboard</div>
        <Bot size={28} color="var(--accent-neon)" />
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="hero-empty-state">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="hero-content"
            >
              <div className="hero-icon-wrapper">
                <Bot size={64} color="var(--accent-neon)" />
              </div>
              <h1 className="hero-title">Welcome to Rufus-Twin</h1>
              <p className="hero-subtitle">Your AI-powered shopping assistant. Search the web for real-time reviews, pricing, and pros/cons for any product!</p>
              
              <div className="suggested-questions">
                {suggestedQuestions.map((q, i) => (
                  <motion.div
                    key={i}
                    className="suggestion-chip"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' }}
                    onClick={() => handleSend(q.text)}
                  >
                    {q.icon}
                    <span>{q.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`message-wrapper ${msg.sender}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="message-bubble">
                  {msg.sender === 'ai' && (
                    <div className="product-image-container">
                      {msg.imageUrl ? (
                        <img src={msg.imageUrl} alt="Product" className="product-image" />
                      ) : (
                        <div className="ai-image-fallback">
                          <div className="fallback-glow"></div>
                          <div className="scanline"></div>
                          <Sparkles size={40} className="animate-pulse" color="var(--accent-neon)" />
                          <span className="fallback-text">AI Analyzing Data</span>
                        </div>
                      )}
                      
                      {msg.intent === 'RESEARCH' && (
                        <div className="research-badge" style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(6, 182, 212, 0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid var(--accent-neon)',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--accent-neon)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
                          zIndex: 2
                        }}>
                          <Search size={12} />
                          <span>Real-time Research</span>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.sender === 'ai' ? renderAnimatedText(msg.text) : msg.text}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                key="typing"
                className="message-wrapper ai"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              >
                <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={18} className="animate-spin-slow" color="var(--accent-neon)" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loadingTextIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}
                    >
                      {loadingTexts[loadingTextIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="input-capsule" onSubmit={onSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type any product or question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="send-button" disabled={!inputValue.trim() || isTyping}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
