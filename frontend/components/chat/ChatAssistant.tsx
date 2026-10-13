'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { ChatMessage, DealAccepted } from '@/types';
import { motion, useReducedMotion } from 'motion/react';

interface BargainProduct {
  id: number;
  name: string;
  price: number;
  min_price?: number;
  max_price?: number;
  unit?: string;
  image?: string;
  images?: { url: string }[];
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
  const [addingDealId, setAddingDealId] = useState<number | null>(null);
  const [addedDealIds, setAddedDealIds] = useState<Set<number>>(new Set());

  const messagesRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const { addItem, addToGuestCart, openCart } = useCart();

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

      const img = prod.images?.[0]?.url || (prod as any).image;
      setIsOpen(true);
      setBargainProduct({ ...prod, image: img });

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

  const handleAddDealToCart = async (deal: DealAccepted) => {
    setAddingDealId(deal.product_id);
    try {
      if (token) {
        await addItem(deal.product_id, 1, deal.agreed_price);
      } else {
        addToGuestCart({
          id: deal.product_id,
          name: deal.product_name,
          price: deal.original_price,
          images: deal.image ? [{ url: deal.image, id: 0, sort_order: 0, alt_text: deal.product_name }] : [],
          stock_quantity: 99,
          slug: '',
          status: 'active',
          featured: false,
          created_at: new Date().toISOString(),
        } as any, deal.agreed_price);
      }
      setAddedDealIds(prev => new Set([...prev, deal.product_id]));
      openCart();
    } catch (e) {
      console.error('Failed to add bargained deal to cart:', e);
    } finally {
      setAddingDealId(null);
    }
  };

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
      ? `[Customer is pricing product: "${bargainProduct.name}" (ID: ${bargainProduct.id}, Storefront price: ₦${bargainProduct.price}${unitPart}${minPart})]: ${text}`
      : text;

    try {
      const res = await aiApi.chat(messageForAi, sessionToken, token || undefined, bargainProduct?.id) as {
        reply: string;
        session_token: string;
        products?: unknown[];
        deal?: DealAccepted;
      };
      setSessionToken(res.session_token);

      let recognizedDeal = res.deal;

      // Smart client-side fallback if Mama Nkechi accepted in text without tag
      if (!recognizedDeal && bargainProduct) {
        const replyLower = res.reply.toLowerCase();
        const agreementKeywords = [
          'accept', 'deal', 'gree', 'take am', 'pay ₦', 'shake hand',
          'sealed', 'sharp sharp', 'add am to cart', 'i like your face',
          'pay '
        ];
        const hasAgreement = agreementKeywords.some(kw => replyLower.includes(kw));

        const priceRegex = /₦?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:k|\b)/gi;
        const allMatches = [...(text + ' ' + res.reply).matchAll(priceRegex)];
        const candidates: number[] = [];
        for (const m of allMatches) {
          const raw = m[1].replace(/,/g, '');
          let val = parseFloat(raw);
          if (m[0].toLowerCase().includes('k')) val *= 1000;
          if (val > 100) candidates.push(val);
        }

        const minPrice = bargainProduct.min_price || Math.round(bargainProduct.price * 0.7);
        const validPrice = candidates.find(p => p >= minPrice && p <= bargainProduct.price);

        if (hasAgreement && validPrice) {
          recognizedDeal = {
            product_id: bargainProduct.id,
            product_name: bargainProduct.name,
            agreed_price: validPrice,
            original_price: bargainProduct.price,
            unit: bargainProduct.unit,
            image: bargainProduct.image,
          };
        }
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        deal: recognizedDeal,
      };
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
            >
              <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>

              {msg.deal && (
                <div className="chat-deal-card">
                  <div className="chat-deal-header">
                    <span className="chat-deal-badge-pill">
                      ✨ Price Am Deal Agreed! 💃🏾
                    </span>
                  </div>

                  <div className="chat-deal-body">
                    {msg.deal.image ? (
                      <img
                        src={msg.deal.image}
                        alt={msg.deal.product_name}
                        className="chat-deal-img"
                      />
                    ) : (
                      <div className="chat-deal-img" style={{ display: 'grid', placeItems: 'center', fontSize: 22 }}>
                        🛍️
                      </div>
                    )}
                    <div className="chat-deal-info">
                      <strong className="chat-deal-title">{msg.deal.product_name}</strong>
                      <div className="chat-deal-prices">
                        <span className="chat-deal-original">
                          ₦{Number(msg.deal.original_price).toLocaleString()}
                        </span>
                        <span className="chat-deal-agreed">
                          ₦{Number(msg.deal.agreed_price).toLocaleString()}
                        </span>
                        {msg.deal.unit && msg.deal.unit !== 'quantity' && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                            /{msg.deal.unit}
                          </span>
                        )}
                        {msg.deal.original_price > msg.deal.agreed_price && (
                          <span className="chat-deal-savings">
                            Save ₦{Number(msg.deal.original_price - msg.deal.agreed_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`chat-deal-add-btn ${addedDealIds.has(msg.deal.product_id) ? 'added' : ''}`}
                    onClick={() => handleAddDealToCart(msg.deal!)}
                    disabled={addingDealId === msg.deal.product_id}
                  >
                    {addedDealIds.has(msg.deal.product_id) ? (
                      <>✓ Added to Cart at ₦{Number(msg.deal.agreed_price).toLocaleString()}! 🛒</>
                    ) : addingDealId === msg.deal.product_id ? (
                      <>Adding to cart... ⏳</>
                    ) : (
                      <>🛒 Add to Cart @ ₦{Number(msg.deal.agreed_price).toLocaleString()}</>
                    )}
                  </button>
                </div>
              )}
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
