'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage } from '@/types';
import { motion, useReducedMotion } from 'motion/react';

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

  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <div className="chat-toggle-wrapper">
        {/* Floating invitation pill when chat is closed */}
        {!isOpen && !shouldReduceMotion && (
          <motion.div
            className="chat-invitation-pill"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            onClick={() => setIsOpen(true)}
          >
            <span style={{ color: 'var(--green)' }}>●</span> Ask Mama Nkechi ✨
          </motion.div>
        )}

        <div style={{ position: 'relative' }}>
          {/* Ambient Pulsing Ring */}
          {!isOpen && !shouldReduceMotion && (
            <motion.span
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '3px solid var(--green)',
                pointerEvents: 'none',
              }}
              animate={{ scale: [1, 1.25, 1.35], opacity: [0.7, 0.2, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}

          <motion.button
            className="chat-toggle"
            id="chatToggle"
            onClick={() => setIsOpen(o => !o)}
            aria-label="Open Mama Nkechi assistant"
            whileHover={!shouldReduceMotion ? { scale: 1.08, rotate: -4 } : undefined}
            whileTap={!shouldReduceMotion ? { scale: 0.94 } : undefined}
          >
            👩🏾‍🦱
          </motion.button>
        </div>
      </div>

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
            <motion.div
              key={i}
              initial={!shouldReduceMotion ? { opacity: 0, y: 6 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {msg.content}
            </motion.div>
          ))}
          {loading && (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="message bot"
              style={{ color: 'var(--muted)', fontStyle: 'italic' }}
            >
              Mama Nkechi is calculating market price… 🤔
            </motion.div>
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
