import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Zap, Box } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const suggestedQuestions = [
  { icon: <Sparkles size={18} />, text: "Which product has the best reviews?" },
  { icon: <Zap size={18} />, text: "Compare the Holographic Display and Neural Earbuds" },
  { icon: <Box size={18} />, text: "Show me the most affordable gaming mouse" },
];

export const ChatComponent: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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

    // Simulate AI response -> Actually call backend
    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_query: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "Sorry, I couldn't process that.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error connecting to the backend. Please ensure the FastAPI server is running.",
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

  // Render text with animated paragraphs
  const renderAnimatedText = (text: string) => {
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    return paragraphs.map((p, index) => (
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.3, duration: 0.5, ease: 'easeOut' }}
        style={{ marginBottom: index !== paragraphs.length - 1 ? '1rem' : '0' }}
      >
        {p}
      </motion.p>
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
              <p className="hero-subtitle">Your AI-powered shopping assistant. How can I help you discover the perfect gear today?</p>
              
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
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
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
            placeholder="Type your message here..."
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
