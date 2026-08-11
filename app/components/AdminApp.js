"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, X, Loader2, ClipboardList, CalendarOff, Plus, Trash2, Lock, LogOut, Link as LinkIcon, Copy, CheckCheck } from "lucide-react";
import { COLORS, SERVICE, HU_DAYS } from "../../lib/theme";
import { dateKey, formatHuDate, minutesToLabel, buildICS, downloadICS } from "../../lib/utils";
import BarberStripe from "./BarberStripe";

export default function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    fetch("/api/admin-check")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.ok))
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true); setLoginError("");
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { setLoggedIn(true); }
      else { const d = await res.json().catch(() => ({})); setLoginError(d.error || "Hibás jelszó"); }
    } catch {
      setLoginError("Nem sikerült bejelentkezni.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin-logout", { method: "POST" }).catch(() => {});
    setLoggedIn(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.ink }}>
      <header style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={22} color={COLORS.dark} />
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.03em" }}>FODRÁSZ NÉZET</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/" style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: "underline" }}>Vissza a foglaláshoz</a>
            {loggedIn && (
              <button onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
                border: `1px solid ${COLORS.line}`, background: COLORS.bgCard, color: COLORS.inkSoft,
                fontSize: 12.5, fontWeight: 700, textTransform: "uppercase",
              }}><LogOut size={13} /> Kilépés</button>
            )}
          </div>
        </div>
      </header>
      <BarberStripe />

      {checking ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, marginTop: 24, fontSize: 14, justifyContent: "center" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Betöltés…
        </div>
      ) : !loggedIn ? (
        <LoginForm password={password} setPassword={setPassword} onSubmit={handleLogin} error={loginError} loading={loggingIn} />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}

function LoginForm({ password, setPassword, onSubmit, error, loading }) {
  return (
    <div style={{ maxWidth: 360, margin: "60px auto", padding: "0 20px" }}>
      <form onSubmit={onSubmit} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, textTransform: "uppercase", marginBottom: 14 }}>
          <Lock size={16} /> Belépés
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Jelszó"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${COLORS.line}`, fontSize: 14 }}
        />
        {error && <div style={{ color: COLORS.dark, fontSize: 13, marginTop: 8 }}>{error}</div>}
        <button type="submit" disabled={loading || !password} style={{
          marginTop: 14, width: "100%", padding: "11px", borderRadius: 10, border: "none",
          background: COLORS.dark, color: "#fff", fontWeight: 700, fontSize: 13.5, textTransform: "uppercase",
          opacity: loading || !password ? 0.6 : 1,
        }}>{loading ? "Belépés…" : "Belépés"}</button>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [closures, setClosures] = useState([]);
  const [error, setError] = useState("");
  const [newClosure, setNewClosure] = useState({ start: "", end: "", reason: "" });
  const [savingClosure, setSavingClosure] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [bRes, cRes] = await Promise.all([
        fetch("/api/bookings?all=true"),
        fetch("/api/closures"),
      ]);
      if (bRes.status === 401) { setError("A munkamenet lejárt, jelentkezz be újra."); return; }
      const bData = await bRes.json();
      const cData = await cRes.json();
      setBookings(bData.bookings || []);
      setClosures(cData.closures || []);
    } catch {
      setError("Nem sikerült betölteni az adatokat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancelBooking(id) {
    try {
      const res = await fetch(`/api/bookings?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Nem sikerült törölni a foglalást.");
    }
  }

  function downloadStylistICS(b) {
    const [y, m, d] = b.date.split("-").map(Number);
    const start = new Date(y, m - 1, d, Math.floor(b.start_minutes / 60), b.start_minutes % 60);
    const ics = buildICS({
      title: `${SERVICE.name} — ${b.name}`, description: `Ügyfél: ${b.name} (${b.phone})`,
      location: "Hajszál Pontosan Fodrászat", start, durationMinutes: b.duration,
      uid: `${b.id}@hajszalpontosan-stylist`,
    });
    downloadICS(`ugyfel-${b.date}-${minutesToLabel(b.start_minutes)}.ics`, ics);
  }

  async function addClosure() {
    if (!newClosure.start || !newClosure.end) return;
    setSavingClosure(true);
    try {
      const res = await fetch("/api/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: newClosure.start, end: newClosure.end, reason: newClosure.reason.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClosures((prev) => [...prev, data.closure]);
      setNewClosure({ start: "", end: "", reason: "" });
    } catch {
      setError("Nem sikerült elmenteni a zárást.");
    } finally {
      setSavingClosure(false);
    }
  }

  async function removeClosure(id) {
    try {
      const res = await fetch(`/api/closures?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setClosures((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Nem sikerült törölni a zárást.");
    }
  }

  const grouped = useMemo(() => {
    const map = {};
    bookings.forEach((b) => { map[b.date] = map[b.date] || []; map[b.date].push(b); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [bookings]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
      <CalendarFeedCard />

      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "18px 20px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, textTransform: "uppercase" }}>
          <CalendarOff size={17} /> Szabadság / zárás jelzése
        </div>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>
          Ha huzamosabb ideig nem leszel elérhető, add meg itt — az érintett napokon ügyfél nem tud foglalni.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>Kezdete</div>
            <input type="date" value={newClosure.start} onChange={(e) => setNewClosure({ ...newClosure, start: e.target.value })}
              style={{ padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.line}`, background: "#fff", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>Vége</div>
            <input type="date" value={newClosure.end} onChange={(e) => setNewClosure({ ...newClosure, end: e.target.value })}
              style={{ padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.line}`, background: "#fff", fontSize: 13 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>Indoklás (opcionális)</div>
            <input value={newClosure.reason} onChange={(e) => setNewClosure({ ...newClosure, reason: e.target.value })}
              placeholder="pl. szabadság" style={{ padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.line}`, background: "#fff", fontSize: 13, width: "100%" }} />
          </div>
          <button onClick={addClosure} disabled={savingClosure || !newClosure.start || !newClosure.end} style={{
            padding: "10px 16px", borderRadius: 8, border: "none", background: COLORS.dark, color: "#fff",
            fontWeight: 700, fontSize: 12.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6,
            opacity: (savingClosure || !newClosure.start || !newClosure.end) ? 0.6 : 1,
          }}><Plus size={14} /> Hozzáad</button>
        </div>

        {closures.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
            {closures.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EFEFEC", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                <span>
                  <strong style={{ fontFamily: "'Space Mono', monospace" }}>{c.start_date} → {c.end_date}</strong>
                  {c.reason && <span style={{ color: COLORS.inkSoft }}> · {c.reason}</span>}
                </span>
                <button onClick={() => removeClosure(c.id)} style={{ border: "none", background: "none", color: COLORS.inkSoft, display: "flex" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: 0, textTransform: "uppercase" }}>Foglalások</h2>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, marginTop: 20, fontSize: 14 }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Betöltés…
        </div>
      ) : error ? (
        <p style={{ color: COLORS.dark, marginTop: 20 }}>{error}</p>
      ) : grouped.length === 0 ? (
        <p style={{ color: COLORS.inkSoft, marginTop: 20, fontSize: 14 }}>Még nincs egyetlen foglalás sem.</p>
      ) : (
        grouped.map(([dk, list]) => {
          const [y, m, d] = dk.split("-").map(Number);
          const dObj = new Date(y, m - 1, d);
          return (
            <div key={dk} style={{ marginTop: 22 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>
                {HU_DAYS[dObj.getDay()]} · {formatHuDate(dObj)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {list.map((b) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: COLORS.bgCard, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14, color: COLORS.dark, minWidth: 46 }}>
                        {minutesToLabel(b.start_minutes)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>
                          {b.phone} · {b.duration} perc · {b.paid ? "kifizetve online" : "fizet helyben"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => downloadStylistICS(b)} title="Naptárba mentés" style={{ border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 8, padding: 7, display: "flex" }}>
                        <Calendar size={14} color={COLORS.ink} />
                      </button>
                      <button onClick={() => cancelBooking(b.id)} title="Törlés" style={{ border: `1px solid ${COLORS.line}`, background: "#fff", borderRadius: 8, padding: 7, display: "flex" }}>
                        <X size={14} color={COLORS.dark} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function CalendarFeedCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadLink() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/calendar-feed-link");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setUrl(data.url);
    } catch {
      setError("Nem sikerült lekérni a linket.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard nem elerheto, a mezobol kezzel is kimasolhato */ }
  }

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 17, textTransform: "uppercase" }}>
        <LinkIcon size={16} /> Automatikus naptár szinkron
      </div>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>
        Ezzel a linkkel a telefonod (vagy bárki más, pl. a fodrász) Naptár appja automatikusan,
        magától frissül minden új foglalással — nem kell egyesével letölteni semmit.
      </p>

      {!url ? (
        <button onClick={loadLink} disabled={loading} style={{
          marginTop: 12, padding: "10px 16px", borderRadius: 8, border: "none", background: COLORS.dark, color: "#fff",
          fontWeight: 700, fontSize: 12.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6,
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <LinkIcon size={14} />}
          Link lekérése
        </button>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input readOnly value={url} onFocus={(e) => e.target.select()} style={{
              flex: 1, padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.line}`, background: "#fff",
              fontSize: 12, fontFamily: "'Space Mono', monospace",
            }} />
            <button onClick={copyLink} style={{
              padding: "9px 14px", borderRadius: 8, border: "none", background: COLORS.dark, color: "#fff",
              fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copied ? "Kimásolva" : "Másolás"}
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 12, lineHeight: 1.5 }}>
            <strong>iPhone:</strong> Beállítások → Naptár → Fiókok → Fiók hozzáadása → Egyéb →
            Előfizetett naptár hozzáadása → illeszd be a linket.<br />
            <strong>Android / Google Naptár:</strong> számítógépen nyisd meg a calendar.google.com
            oldalt → Egyéb naptárak melletti + → Feliratkozás URL-ről → illeszd be a linket. Ezután
            a telefonos Google Naptár appban is automatikusan megjelenik.
          </div>
          <p style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>
            Ez a link bizalmas (ügyfélneveket és telefonszámokat tartalmaz) — csak azzal oszd meg, akinek látnia kell.
          </p>
        </>
      )}
      {error && <div style={{ color: COLORS.dark, fontSize: 13, marginTop: 8 }}>{error}</div>}
    </div>
  );
}
