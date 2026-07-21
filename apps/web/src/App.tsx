import { useCallback, useEffect, useState } from "react";

type ServiceStatus = {
  name: string;
  url: string;
  reachable: boolean;
  detail: string;
};

const modules = [
  { icon: "◈", title: "Liam Chat", copy: "Local conversation and model routing", state: "Planned" },
  { icon: "✦", title: "Knowledge Vault", copy: "Original notes with AI-organized summaries", state: "Planned" },
  { icon: "◎", title: "Image Studio", copy: "ComfyUI workflows through one calm interface", state: "Connected" },
  { icon: "⌁", title: "Ops Intelligence", copy: "Tickets, procedures, and customer-service tools", state: "Planned" },
];

export default function App() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Service check failed");
      setServices(await response.json());
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BlueVerse home">
          <span className="brand-mark">B</span>
          <span><strong>BLUEVERSE</strong><small>AI PORTAL</small></span>
        </a>
        <span className="private-pill">PRIVATE NETWORK</span>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">LOCAL INTELLIGENCE · HUMAN CONTROL</p>
        <h1>Your AI world,<br /><span>connected.</span></h1>
        <p className="hero-copy">One private place for conversation, knowledge, creative tools, and the workflows that make work lighter.</p>
        <div className="hero-actions">
          <a className="primary-button" href="#modules">Enter BlueVerse</a>
          <button className="ghost-button" type="button" onClick={() => void refresh()}>Check connections</button>
        </div>
      </section>

      <section className="module-grid" id="modules" aria-label="Portal modules">
        {modules.map((module) => (
          <article className="module-card" key={module.title}>
            <div className="module-icon">{module.icon}</div>
            <span className="module-state">{module.state}</span>
            <h2>{module.title}</h2>
            <p>{module.copy}</p>
          </article>
        ))}
      </section>

      <section className="connections" aria-labelledby="connections-title">
        <div>
          <p className="eyebrow">SYSTEM PULSE</p>
          <h2 id="connections-title">Connected services</h2>
          <p>These checks stay on your network. An unavailable service does not expose it to the internet.</p>
        </div>
        <div className="service-list">
          {loading && <p className="empty-state">Checking the BlueVerse current…</p>}
          {!loading && services.length === 0 && <p className="empty-state">Portal API is not reachable yet.</p>}
          {services.map((service) => (
            <div className="service-row" key={service.name}>
              <span className={service.reachable ? "status-dot online" : "status-dot"} />
              <div><strong>{service.name}</strong><small>{service.detail}</small></div>
              <code>{service.url}</code>
            </div>
          ))}
        </div>
      </section>

      <footer>BlueVerse AI Portal · Foundation 0.1</footer>
    </main>
  );
}
