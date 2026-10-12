'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage } from '@/types';

interface BargainProduct {
  id: number;
  name: string;
  price: number;
  min_price?: number;
  max_price?: number;
  unit?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Find household items',
  'Show furniture',
  'Help with procurement',
  'Track my cart',
];

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm Mama Nkechi. What are you looking for today? Tell me wetin you need!",
};

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const [bargainProduct, setBargainProduct] = useState<BargainProduct | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Listen to Price Am bargain event
  useEffect(() => {
    const handleBargain = (e: Event) => {
      const customEvent = e as CustomEvent<{ product: BargainProduct }>;
      const prod = customEvent.detail?.product;
      if (!prod) return;

      setIsOpen(true);
      setBargainProduct(prod);

      const priceFormatted = Number(prod.price).toLocaleString();
      const unitNotice = prod.unit && prod.unit !== 'quantity' ? ` per ${prod.unit}` : '';
      const bargainGreeting: ChatMessage = {
        role: 'assistant',
        content: `Nne how much you get? 😂\n\nI dey listen! Tell me wetin you fit pay for ${prod.name} (Store price: ₦${priceFormatted}${unitNotice}). Oya, drop your price make we talk! 💃🏾`,
      };

      setMessages(prev => [...prev, bargainGreeting]);
    };

    window.addEventListener('open-bargain-chat', handleBargain);
    return () => window.removeEventListener('open-bargain-chat', handleBargain);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userDisplayText = text;
    const userMsg: ChatMessage = { role: 'user', content: userDisplayText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // If bargaining for a product, provide context to the backend AI
    const unitPart = bargainProduct?.unit && bargainProduct.unit !== 'quantity' ? ` per ${bargainProduct.unit}` : '';
    const minPart = bargainProduct?.min_price ? `, Min floor price: ₦${bargainProduct.min_price}` : '';
    const messageForAi = bargainProduct
      ? `[Customer is pricing product: "${bargainProduct.name}" (Storefront price: ₦${bargainProduct.price}${unitPart}${minPart})]: ${text}`
      : text;

    try {
      const res = await aiApi.chat(messageForAi, sessionToken, token || undefined) as {
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
        content: "Ehya, network wan delay me small! Abeg try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Bargain suggestions
  const bargainOffers = bargainProduct ? [
    `I get ₦${Math.round(bargainProduct.price * 0.85).toLocaleString()}`,
    `₦${Math.round(bargainProduct.price * 0.75).toLocaleString()} last`,
    `Abeg cut 20% for me`,
  ] : null;

  return (
    <>
      <button
        className="chat-toggle"
        id="chatToggle"
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open Mama Nkechi assistant"
      >
        👩🏾‍🦱
      </button>

      <section
        className={`chat-panel ${isOpen ? 'open' : ''}`}
        id="chatPanel"
        aria-label="Mama Nkechi shopping assistant"
      >
        <div className="chat-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong>Mama Nkechi 👩🏾‍🦱</strong>
            <span>Your friendly Buy Am shopping & bargaining assistant</span>
          </div>
          <button
            type="button"
            className="chat-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {bargainProduct && (
          <div className="chat-bargain-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 16 }}>🏷️</span>
              <span style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Pricing: {bargainProduct.name}
              </span>
              <span style={{ color: 'var(--red)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                (₦{Number(bargainProduct.price).toLocaleString()})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBargainProduct(null)}
              className="chat-bargain-clear"
              title="Clear product"
            >
              ✕
            </button>
          </div>
        )}

        <div className="chat-messages" id="chatMessages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="message bot" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Mama Nkechi is calculating market price… 🤔
            </div>
          )}
        </div>

        <div className="suggestions">
          {(bargainOffers || DEFAULT_SUGGESTIONS).map(s => (
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
            placeholder={bargainProduct ? "Type how much you get (e.g. 15,000)..." : "Ask Mama Nkechi anything..."}
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
