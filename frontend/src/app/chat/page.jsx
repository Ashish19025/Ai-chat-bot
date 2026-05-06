"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";

// ── Constants ──────────────────────────────────────────────
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const MAX_TEXTAREA_HEIGHT = 128;

// ── Helpers ────────────────────────────────────────────────
function formatRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < MINUTE_MS) return "Just now";
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  return new Date(date).toLocaleDateString();
}

// ── MessageBubble ──────────────────────────────────────────
function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 msg-enter ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 select-none ${
          isUser ? "bg-green-500 text-black" : "bg-gray-700 text-white"
        }`}
      >
        {isUser ? "👤" : "🤖"}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-green-500 text-black rounded-tr-sm"
            : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/60"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

// ── TypingIndicator ────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-700 text-white flex-shrink-0">
        🤖
      </div>
      <div className="bg-gray-800 border border-gray-700/60 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-green-400 rounded-full typing-dot inline-block"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to reverse a string",
  "Give me 5 ideas for a weekend project",
  "Summarise the history of the internet",
];

// ── ChatPage ───────────────────────────────────────────────
export default function ChatPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
  }, [authLoading, token, router]);

  // Load session list
  const loadSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/history");
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load sessions:", err.message);
    }
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Open a session
  const openSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setMessages([]);
    setLoadingSession(true);
    try {
      const res = await api.get(`/history/${sessionId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Failed to load session:", err.message);
    } finally {
      setLoadingSession(false);
      inputRef.current?.focus();
    }
  };

  // New chat
  const newChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  // Delete session
  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.delete(`/history/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete error:", err.message);
    }
  };

  // Send message
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await api.post("/chat", { message: text, sessionId: activeSessionId });
      const { reply, sessionId } = res.data;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (!activeSessionId) {
        setActiveSessionId(sessionId);
        await loadSessions();
      } else {
        setSessions((prev) =>
          prev
            .map((s) =>
              s._id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        );
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Something went wrong.";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeSession = sessions.find((s) => s._id === activeSessionId);

  // Loading spinner while auth initialises
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }
  if (!token) return null;

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        {/* Logo + New Chat */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 gap-3">
          <span className="font-bold text-green-400 text-base whitespace-nowrap">SaaS AI</span>
          <button
            onClick={newChat}
            className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap"
          >
            + New Chat
          </button>
        </div>

        {/* User email */}
        <div className="px-4 py-2 border-b border-gray-800">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-1">
          {sessions.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-600">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => openSession(session._id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition group relative border-l-2 ${
                  activeSessionId === session._id
                    ? "bg-gray-800/70 border-green-500"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate font-medium leading-snug">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {formatRelativeTime(session.updatedAt || session.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteSession(e, session._id)}
                    title="Delete session"
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition p-0.5 flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="w-full flex items-center gap-2 text-gray-500 hover:text-red-400 hover:bg-red-500/8 px-3 py-2 rounded-lg text-xs transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center px-4 border-b border-gray-800 bg-gray-950 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-gray-300 truncate">
            {activeSession?.title || "New Conversation"}
          </h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loadingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Loading conversation…</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-6xl mb-4 select-none">🤖</div>
              <h2 className="text-xl font-bold text-white mb-2">How can I help you today?</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                Ask me anything — questions, writing, coding, analysis, or just a chat.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="text-left p-3.5 bg-gray-800/60 hover:bg-gray-700 border border-gray-700 hover:border-green-500/40 rounded-xl text-sm text-gray-300 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4 pb-2">
              {messages.map((msg, i) => (
                <MessageBubble key={`${msg.role}-${i}`} role={msg.role} content={msg.content} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-green-500/60 focus-within:ring-1 focus-within:ring-green-500/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
                }}
                placeholder="Message AI…"
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed max-h-32"
                style={{ minHeight: "1.25rem" }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="bg-green-500 hover:bg-green-400 text-black p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-2">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
