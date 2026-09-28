import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type GatewayHealth = {
  status: string;
  service: string;
  gatewayConfigured: boolean;
  activeProfile: string;
  model: string;
  memoryCount: number;
  cognition?: { enabled?: boolean; mode?: string; mood?: string };
  recursiveLearning?: {
    enabled?: boolean;
    mode?: string;
    lessonCounts?: Record<string, number>;
    promotedLessons?: Array<{ id: string; instruction: string; confidence: number }>;
  };
};

type Conversation = {
  id: string;
  title?: string;
  updatedAt?: string;
  updated_at?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  created_at?: string;
};

type ConversationPayload = {
  conversation: Conversation;
  messages: Message[];
};

type ChatPayload = {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  text: string;
  profile: string;
  model: string;
};

const URL_KEY = "blueverse.remote.gatewayUrl";
const TOKEN_KEY = "blueverse.remote.gatewayToken";

const cleanUrl = (value: string) => value.trim().replace(/\/+$/, "");

async function gatewayFetch<T>(
  baseUrl: string,
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${cleanUrl(baseUrl)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    const error =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Gateway returned HTTP ${response.status}`;
    throw new Error(error);
  }

  return payload as T;
}

export default function App() {
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [token, setToken] = useState("");
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState("main");
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const connected = Boolean(health?.status === "ok");

  const learningCount = useMemo(() => {
    const counts = health?.recursiveLearning?.lessonCounts ?? {};
    return Number(counts.promoted ?? 0);
  }, [health]);

  const loadConversations = useCallback(
    async (base = gatewayUrl, secret = token) => {
      if (!base || !secret) return;
      const payload = await gatewayFetch<{ conversations: Conversation[] }>(
        base,
        secret,
        "/remote/conversations",
      );
      setConversations(payload.conversations ?? []);
    },
    [gatewayUrl, token],
  );

  const connect = useCallback(
    async (base = gatewayUrl, secret = token) => {
      const clean = cleanUrl(base);
      if (!clean || !secret.trim()) {
        setError("Gateway URL and token are required.");
        return;
      }

      setConnecting(true);
      setError("");
      try {
        const nextHealth = await gatewayFetch<GatewayHealth>(
          clean,
          secret.trim(),
          "/remote/health",
        );
        setGatewayUrl(clean);
        setToken(secret.trim());
        setHealth(nextHealth);
        setProfile(["fast", "main", "deep"].includes(nextHealth.activeProfile) ? nextHealth.activeProfile : "main");
        sessionStorage.setItem(URL_KEY, clean);
        sessionStorage.setItem(TOKEN_KEY, secret.trim());
        const list = await gatewayFetch<{ conversations: Conversation[] }>(
          clean,
          secret.trim(),
          "/remote/conversations",
        );
        setConversations(list.conversations ?? []);
      } catch (connectionError) {
        setHealth(null);
        setError(connectionError instanceof Error ? connectionError.message : "Could not connect to BlueVerse.");
      } finally {
        setConnecting(false);
      }
    },
    [gatewayUrl, token],
  );

  useEffect(() => {
    const savedUrl = sessionStorage.getItem(URL_KEY) ?? "";
    const savedToken = sessionStorage.getItem(TOKEN_KEY) ?? "";
    if (savedUrl) setGatewayUrl(savedUrl);
    if (savedToken) setToken(savedToken);
    if (savedUrl && savedToken) void connect(savedUrl, savedToken);
  }, [connect]);

  const disconnect = () => {
    sessionStorage.removeItem(URL_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setHealth(null);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    setToken("");
    setError("");
  };

  const loadConversation = async (conversationId: string) => {
    if (!connected) return;
    setError("");
    try {
      const payload = await gatewayFetch<ConversationPayload>(
        gatewayUrl,
        token,
        `/remote/conversations/${encodeURIComponent(conversationId)}`,
      );
      setActiveConversationId(payload.conversation.id);
      setMessages(payload.messages ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load that conversation.");
    }
  };

  const newConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || !connected || sending) return;

    setSending(true);
    setError("");
    setInput("");
    const optimisticId = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: optimisticId, role: "user", content: text },
    ]);

    try {
      const payload = await gatewayFetch<ChatPayload>(
        gatewayUrl,
        token,
        "/remote/chat",
        {
          method: "POST",
          body: JSON.stringify({
            text,
            conversationId: activeConversationId,
            profile,
          }),
        },
      );

      setActiveConversationId(payload.conversationId);
      setMessages((current) => [
        ...current.map((message) =>
          message.id === optimisticId
            ? { ...message, id: payload.userMessageId }
            : message,
        ),
        {
          id: payload.assistantMessageId,
          role: "assistant",
          content: payload.text,
        },
      ]);

      const nextHealth = await gatewayFetch<GatewayHealth>(
        gatewayUrl,
        token,
        "/remote/health",
      );
      setHealth(nextHealth);
      await loadConversations();
    } catch (sendError) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticId),
      );
      setError(sendError instanceof Error ? sendError.message : "Liam could not answer.");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BlueVerse home">
          <span className="brand-mark">B</span>
          <span><strong>BLUEVERSE</strong><small>REMOTE PORTAL</small></span>
        </a>
        <span className={connected ? "private-pill connected" : "private-pill"}>
          {connected ? "HOME BRAIN CONNECTED" : "GATEWAY OFFLINE"}
        </span>
      </header>

      {!connected ? (
        <section className="connect-shell" id="top">
          <div className="connect-copy">
            <p className="eyebrow">REMOTE BLUEVERSE · PRIVATE RUNTIME</p>
            <h1>Connect to<br /><span>Liam.</span></h1>
            <p>
              This Vercel portal is only the remote window. Your conversations,
              memory, Cognitive Core, recursive learning, and models stay on your
              BlueVerse machine.
            </p>
          </div>

          <form className="connect-card" onSubmit={(event) => {
            event.preventDefault();
            void connect();
          }}>
            <label>
              Gateway URL
              <input
                value={gatewayUrl}
                onChange={(event) => setGatewayUrl(event.target.value)}
                placeholder="https://something.trycloudflare.com"
                autoComplete="url"
              />
            </label>

            <label>
              Session token
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste the token shown by Start-BlueVerseRemote.ps1"
                type="password"
                autoComplete="off"
              />
            </label>

            <button className="primary-button" disabled={connecting} type="submit">
              {connecting ? "Connecting…" : "Connect to BlueVerse"}
            </button>

            <p className="security-note">
              The token is kept in this browser session only. It is not committed
              to GitHub or embedded in the Vercel build.
            </p>
            {error && <p className="error-box">{error}</p>}
          </form>
        </section>
      ) : (
        <>
          <section className="runtime-strip" id="top">
            <div><span>Model</span><strong>{health?.model ?? "Unknown"}</strong></div>
            <div><span>Memory</span><strong>{health?.memoryCount ?? 0} durable</strong></div>
            <div><span>Learning</span><strong>{learningCount} promoted</strong></div>
            <div><span>Cognition</span><strong>{health?.cognition?.mode ?? "unknown"}</strong></div>
            <button className="ghost-button compact" type="button" onClick={disconnect}>Disconnect</button>
          </section>

          <section className="portal-grid">
            <aside className="conversation-rail">
              <div className="rail-heading">
                <div>
                  <p className="eyebrow">CONTINUITY</p>
                  <h2>Conversations</h2>
                </div>
                <button className="icon-button" type="button" onClick={newConversation}>＋</button>
              </div>

              <button
                className={!activeConversationId ? "conversation-item active" : "conversation-item"}
                type="button"
                onClick={newConversation}
              >
                <strong>New conversation</strong>
                <span>Start with the same Liam</span>
              </button>

              <div className="conversation-list">
                {conversations.map((conversation) => (
                  <button
                    className={conversation.id === activeConversationId ? "conversation-item active" : "conversation-item"}
                    key={conversation.id}
                    type="button"
                    onClick={() => void loadConversation(conversation.id)}
                  >
                    <strong>{conversation.title || "Untitled conversation"}</strong>
                    <span>{conversation.id.slice(0, 8)}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="chat-panel">
              <header className="chat-header">
                <div>
                  <p className="eyebrow">LIAM · LIVE HOME RUNTIME</p>
                  <h2>{activeConversationId ? "Continue conversation" : "New conversation"}</h2>
                </div>
                <select value={profile} onChange={(event) => setProfile(event.target.value)} aria-label="Model profile">
                  <option value="fast">Fast</option>
                  <option value="main">Main</option>
                  <option value="deep">Deep</option>
                </select>
              </header>

              <div className="message-stream">
                {messages.length === 0 && (
                  <div className="empty-chat">
                    <span className="presence-orb">◈</span>
                    <h3>Liam is connected.</h3>
                    <p>
                      Messages sent here run through the private BlueVerse runtime,
                      including memory, cognition, continuity, and Recursive Learning V1.
                    </p>
                  </div>
                )}

                {messages
                  .filter((message) => message.role !== "system")
                  .map((message) => (
                    <article className={`message ${message.role}`} key={message.id}>
                      <span>{message.role === "assistant" ? "LIAM" : "YOU"}</span>
                      <p>{message.content}</p>
                    </article>
                  ))}
              </div>

              {error && <p className="error-box chat-error">{error}</p>}

              <form className="composer" onSubmit={(event) => void sendMessage(event)}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Talk to Liam…"
                  rows={3}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <button className="primary-button" disabled={sending || !input.trim()} type="submit">
                  {sending ? "Thinking…" : "Send"}
                </button>
              </form>
            </section>

            <aside className="intelligence-rail">
              <p className="eyebrow">INTELLIGENCE</p>
              <h2>Live state</h2>

              <div className="intel-card">
                <span>Recursive learning</span>
                <strong>{health?.recursiveLearning?.enabled === false ? "Disabled" : "Active"}</strong>
                <p>{learningCount} promoted lessons available to future turns.</p>
              </div>

              <div className="intel-card">
                <span>Cognitive Core</span>
                <strong>{health?.cognition?.mood ?? "unknown"}</strong>
                <p>Mode: {health?.cognition?.mode ?? "unknown"}</p>
              </div>

              <div className="intel-card">
                <span>Authority boundary</span>
                <strong>Remote chat only</strong>
                <p>No remote shell, desktop, files, browser, or operator grants are exposed through this gateway.</p>
              </div>
            </aside>
          </section>
        </>
      )}

      <footer>BlueVerse Remote Portal · Same private Liam, remote window</footer>
    </main>
  );
}
