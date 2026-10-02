'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage } from '@/types';

const SUGGESTIONS = [
  'Find household items',
  'Show furniture',
  'Help with procurement',
  'Track my cart',
];

const INITIAL_MESSAGE: ChatMessage = {
  role: 'bot',
  content: "Hi! I'm Amara. What are you looking for today?",
};

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const messagesRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat(text, sessionToken, token || undefined) as {
        reply: string;
        session_token: string;
        products?: unknown[];
      };
      setSessionToken(res.session_token);

      const botMsg: ChatMessage = { role: 'assistant', content: res.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I had trouble connecting. Please try again!",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <button
        className="chat-toggle"
        id="chatToggle"
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open Buy Am assistant"
      >
        👩🏾‍🦱
      </button>

      <section
        className={`chat-panel ${isOpen ? 'open' : ''}`}
        id="chatPanel"
        aria-label="Buy Am chat assistant"
      >
        <div className="chat-header">
          <strong>Ask Amara</strong>
          <span>Your friendly Buy Am shopping assistant</span>
        </div>

        <div className="chat-messages" id="chatMessages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="message bot" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Amara is thinking…
            </div>
          )}
        </div>

        <div className="suggestions">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className="suggestion"
              onClick={() => sendMessage(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <form className="chat-form" id="chatForm" onSubmit={handleSubmit}>
          <input
            id="chatInput"
            type="text"
            placeholder="Ask Amara anything..."
            autoComplete="off"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" aria-label="Send message" disabled={loading}>➤</button>
        </form>
      </section>
    </>
  );
}
