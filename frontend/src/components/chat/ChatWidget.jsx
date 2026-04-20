import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const SESSION_KEY = (doctorId) => `chat_session_${doctorId}`;

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
          🩺
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0">
        🩺
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatWidget({ doctorId, whatsappNumber, primaryColor = '#3B82F6' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Inicializa sessão
  useEffect(() => {
    if (!open || initialized) return;

    async function init() {
      const saved = localStorage.getItem(SESSION_KEY(doctorId));
      const { data } = await api.post('/chat/session', { doctorId, sessionToken: saved });
      const token = data.sessionToken;
      localStorage.setItem(SESSION_KEY(doctorId), token);
      setSessionToken(token);

      // Carrega histórico ou envia saudação inicial
      const history = await api.get(`/chat/session/${token}/messages`);
      if (history.data.length > 0) {
        setMessages(history.data);
      } else {
        // Mensagem de boas-vindas automática
        setLoading(true);
        const reply = await api.post(`/chat/session/${token}/message`, {
          message: 'Olá',
        });
        setMessages([reply.data]);
        setLoading(false);
      }
      setInitialized(true);
    }

    init().catch(console.error);
  }, [open, initialized, doctorId]);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Foco no input ao abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !sessionToken) return;

    setInput('');
    setMessages((m) => [...m, { id: Date.now(), role: 'user', content: text }]);
    setLoading(true);

    try {
      const { data } = await api.post(`/chat/session/${sessionToken}/message`, { message: text });
      setMessages((m) => [...m, data]);
    } catch {
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', content: 'Desculpe, tive um problema. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/55${whatsappNumber.replace(/\D/g, '')}`
    : null;

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: primaryColor }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full text-white shadow-2xl hover:opacity-90 transition-all flex items-center justify-center text-2xl"
        aria-label="Abrir chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Janela do chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div style={{ background: primaryColor }} className="px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🩺</div>
                <div>
                  <p className="font-semibold text-sm">Secretária Virtual</p>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block" />
                    Online agora
                  </p>
                </div>
              </div>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition"
                  title="Falar com o médico"
                >
                  📱 WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0" style={{ maxHeight: 380 }}>
            {!initialized && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Conectando...
              </div>
            )}
            {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={loading || !initialized}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 bg-white max-h-24 leading-snug"
                style={{ scrollbarWidth: 'none' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || !initialized}
                style={{ background: primaryColor }}
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40 transition hover:opacity-90 flex-shrink-0"
              >
                ➤
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Powered by Fast Atendimento · IA
            </p>
          </div>
        </div>
      )}
    </>
  );
}