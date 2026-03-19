import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ ...styles.msgRow, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && <div style={styles.agentAvatar}>AI</div>}
      <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleAgent) }}>
        {msg.content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < msg.content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function Workspace() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expired, setExpired] = useState(false);
  const [remainingMs, setRemainingMs] = useState(null);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const serverPollRef = useRef(null);
  const localTickRef = useRef(null);

  // Fetch session info
  const fetchSession = useCallback(async () => {
    try {
      const { data } = await api.get(`/sessions/${sessionId}`);
      setSession(data);
      setExpired(data.expired);
      setRemainingMs(data.remaining_ms);
      if (data.expired && serverPollRef.current) {
        clearInterval(serverPollRef.current);
      }
    } catch (err) {
      if (err.response?.status === 404) navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  // Fetch message history
  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${sessionId}`);
      setMessages(data);
    } catch {}
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchSession(), fetchHistory()]).finally(() => setLoading(false));
  }, [fetchSession, fetchHistory]);

  // Server poll every 15 seconds to sync time
  useEffect(() => {
    serverPollRef.current = setInterval(fetchSession, 15000);
    return () => clearInterval(serverPollRef.current);
  }, [fetchSession]);

  // Local countdown — ticks every second
  useEffect(() => {
    if (remainingMs === null) return;
    clearInterval(localTickRef.current);

    localTickRef.current = setInterval(() => {
      setRemainingMs(prev => {
        if (prev <= 1000) {
          clearInterval(localTickRef.current);
          setExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(localTickRef.current);
  }, [remainingMs !== null]); // only re-run when remainingMs goes from null → number

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || expired) return;

    setInput('');
    setSending(true);
    setError('');

    // Optimistic add
    const optimisticMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data } = await api.post('/chat', {
        session_id: parseInt(sessionId),
        message: text,
      });

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: data.reply }
      ]);
      setRemainingMs(data.remaining_ms);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send';
      if (err.response?.status === 403) {
        setExpired(true);
        setError('Your session has expired.');
      } else {
        setError(msg);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const urgency = remainingMs !== null && remainingMs < 5 * 60 * 1000; // under 5 min

  if (loading) return (
    <div style={styles.center}><Spinner size={40} /></div>
  );

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <Link to="/" style={styles.backLink}>← Marketplace</Link>

        {session && (
          <>
            <div style={styles.agentInfo}>
              <div style={styles.agentAvatar2}>{session.agent_icon}</div>
              <div style={styles.agentName}>{session.agent_name}</div>
              <div style={styles.agentMeta}>{session.agent_description}</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.timerSection}>
              <div style={styles.timerLabel}>Time remaining</div>
              <div style={{
                ...styles.timer,
                color: expired ? 'var(--red)' : urgency ? 'var(--amber)' : 'var(--green)',
              }}>
                {expired ? 'Expired' : formatTime(remainingMs)}
              </div>
              {!expired && remainingMs !== null && (
                <div style={styles.timerBar}>
                  <div style={{
                    ...styles.timerFill,
                    width: `${Math.min(100, (remainingMs / (session.duration_hours * 3600000)) * 100)}%`,
                    background: urgency ? 'var(--amber)' : 'var(--green)',
                  }} />
                </div>
              )}
            </div>

            <div style={styles.divider} />

            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Duration</span>
              <span style={styles.metaVal}>{session.duration_hours}h</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Cost</span>
              <span style={styles.metaVal}>${session.total_cost.toFixed(2)}</span>
            </div>
          </>
        )}

        {expired && (
          <div style={styles.expiredBox}>
            <div style={styles.expiredTitle}>Session ended</div>
            <p style={styles.expiredText}>Hire this agent again to continue.</p>
            <Link to={`/hire/${session?.agent_id}`} style={styles.rehireBtn}>
              Hire again
            </Link>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={styles.chatArea}>
        <div style={styles.messages}>
          {messages.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{session?.agent_icon}</div>
              <div style={styles.emptyText}>
                Say hello! {session?.agent_name} is ready to help.
              </div>
            </div>
          )}

          {messages.map(msg => (
            <Message key={msg.id} msg={msg} />
          ))}

          {sending && (
            <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
              <div style={styles.agentAvatar}>AI</div>
              <div style={{ ...styles.bubble, ...styles.bubbleAgent }}>
                <Spinner size={16} color="var(--text-muted)" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={expired ? 'Session expired — cannot send messages' : 'Type a message... (Enter to send, Shift+Enter for new line)'}
            disabled={expired || sending}
            rows={3}
            style={{
              ...styles.textarea,
              opacity: expired ? 0.5 : 1,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={expired || sending || !input.trim()}
            style={{
              ...styles.sendBtn,
              opacity: (expired || sending || !input.trim()) ? 0.5 : 1,
            }}
          >
            {sending ? <Spinner size={18} color="#fff" /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex', height: 'calc(100vh - 64px)',
    maxWidth: 1200, margin: '0 auto',
  },

  sidebar: {
    width: 260, flexShrink: 0,
    background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
    padding: 24, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  backLink: { color: 'var(--text-muted)', fontSize: 13, display: 'block', marginBottom: 24 },
  agentAvatar2: {
    fontSize: 36, marginBottom: 10,
    width: 60, height: 60, borderRadius: 14,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  agentInfo: { marginBottom: 20 },
  agentName: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 6 },
  agentMeta: { color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },

  timerSection: { marginBottom: 4 },
  timerLabel: { color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  timer: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 10 },
  timerBar: { height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 2, transition: 'width 1s linear' },

  metaRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  metaLabel: { color: 'var(--text-muted)', fontSize: 13 },
  metaVal: { fontSize: 13, fontWeight: 600 },

  expiredBox: {
    marginTop: 'auto', background: 'var(--red-dim)',
    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 16,
  },
  expiredTitle: { fontWeight: 700, color: 'var(--red)', marginBottom: 6, fontSize: 14 },
  expiredText: { color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 },
  rehireBtn: {
    display: 'block', textAlign: 'center',
    padding: '8px', borderRadius: 8,
    background: 'var(--accent)', color: '#fff',
    fontSize: 13, fontWeight: 600,
  },

  chatArea: {
    flex: 1, display: 'flex', flexDirection: 'column',
    minWidth: 0,
  },
  messages: {
    flex: 1, overflowY: 'auto',
    padding: '24px 28px', display: 'flex',
    flexDirection: 'column', gap: 16,
  },

  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 0', gap: 14,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: 'var(--text-muted)', fontSize: 15 },

  msgRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  agentAvatar: {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
    color: 'var(--accent-light)', fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%', padding: '12px 16px',
    borderRadius: 14, fontSize: 14, lineHeight: 1.65,
    wordBreak: 'break-word',
  },
  bubbleUser: {
    background: 'var(--accent)', color: '#fff',
    borderBottomRightRadius: 4,
  },
  bubbleAgent: {
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    color: 'var(--text)', borderBottomLeftRadius: 4,
    display: 'flex', alignItems: 'center',
  },

  errorBanner: {
    margin: '0 24px 8px',
    background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
    color: 'var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },

  inputArea: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    display: 'flex', gap: 10, alignItems: 'flex-end',
    background: 'var(--bg-card)',
  },
  textarea: {
    flex: 1, padding: '12px 16px',
    borderRadius: 10, background: 'var(--bg-hover)',
    border: '1px solid var(--border)', color: 'var(--text)',
    fontSize: 14, lineHeight: 1.5, resize: 'none',
    transition: 'border-color 0.15s',
  },
  sendBtn: {
    padding: '12px 20px', borderRadius: 10,
    background: 'var(--accent)', color: '#fff',
    fontSize: 14, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
    alignSelf: 'flex-end',
    transition: 'opacity 0.15s',
  },

  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' },
};
