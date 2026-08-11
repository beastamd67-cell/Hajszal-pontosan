"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Scissors, Calendar, Clock, User, Phone, Check, X, Loader2, ClipboardList, CreditCard, Lock, CalendarOff } from "lucide-react";
import { COLORS, SERVICE, HU_DAYS, HU_MONTHS } from "../../lib/theme";
import {
  dateKey, formatHuDate, nextOpenDays, minutesToLabel, buildICS, downloadICS,
  googleCalendarLink, findClosure, sanitizePhoneInput, isPhoneValid, slotsForDay,
} from "../../lib/utils";
import BarberStripe from "./BarberStripe";

export default function BookingApp() {
  const days = useMemo(() => nextOpenDays(14), []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+36 ");
  const [payNow, setPayNow] = useState(true);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [dayBookings, setDayBookings] = useState([]);
  const [closures, setClosures] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch("/api/closures")
      .then((r) => r.json())
      .then((d) => setClosures(d.closures || []))
      .catch(() => setClosures([]));
  }, []);

  const loadDayBookings = useCallback(async (day) => {
    setLoadingDay(true); setError("");
    try {
      const res = await fetch(`/api/bookings?date=${dateKey(day)}`);
      const data = await res.json();
      setDayBookings(data.bookings || []);
    } catch {
      setDayBookings([]);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  useEffect(() => { loadDayBookings(selectedDay); setSelectedSlot(null); }, [selectedDay, loadDayBookings]);

  const todayClosure = useMemo(() => findClosure(dateKey(new Date()), closures), [closures]);
  const selectedDayClosure = useMemo(() => findClosure(dateKey(selectedDay), closures), [selectedDay, closures]);

  const availableSlots = useMemo(() => slotsForDay({
    dayBookings, isToday: dateKey(selectedDay) === dateKey(new Date()), closed: !!selectedDayClosure,
  }), [dayBookings, selectedDay, selectedDayClosure]);

  function cardValid() {
    return card.number.replace(/\s/g, "").length >= 12 && card.expiry.length >= 4 && card.cvc.length >= 3;
  }

  async function handleConfirm() {
    if (selectedSlot === null || !name.trim() || !isPhoneValid(phone)) return;
    if (payNow && !cardValid()) { setError("Add meg a kártyaadatokat a fizetéshez, vagy válts fizetés helyben opcióra."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey(selectedDay),
          startMinutes: selectedSlot,
          duration: SERVICE.duration,
          name: name.trim(),
          phone: phone.trim(),
          paid: payNow,
          amount: SERVICE.priceLabel,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError("Ezt az időpontot közben lefoglalták. Válassz egy másikat.");
        await loadDayBookings(selectedDay); setSelectedSlot(null); setStep(1);
        return;
      }
      if (!res.ok) { setError("Nem sikerült menteni a foglalást. Próbáld újra."); return; }
      setConfirmed({
        id: data.booking.id,
        startMinutes: data.booking.start_minutes,
        duration: data.booking.duration,
        name: data.booking.name,
        phone: data.booking.phone,
        paid: data.booking.paid,
        amount: data.booking.amount,
      });
    } catch {
      setError("Nem sikerült menteni a foglalást. Próbáld újra.");
    } finally {
      setSaving(false);
    }
  }

  function resetBookingFlow() {
    setConfirmed(null); setSelectedSlot(null); setName(""); setPhone("+36 ");
    setCard({ number: "", expiry: "", cvc: "" }); setStep(1);
  }

  const eventStartDate = confirmed
    ? new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(),
        Math.floor(confirmed.startMinutes / 60), confirmed.startMinutes % 60)
    : null;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.ink }}>
      <header style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: COLORS.dark,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              border: `2px solid ${COLORS.ink}`,
            }}>
              <Scissors size={19} color={COLORS.bg} />
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.03em", lineHeight: 1 }}>
                HAJSZÁL PONTOSAN
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, letterSpacing: "0.04em", marginTop: 1 }}>
                gyors, pontos, laza fazon
              </div>
            </div>
          </div>
          <a href="/admin" style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            border: `1px solid ${COLORS.line}`, background: COLORS.bgCard, color: COLORS.inkSoft,
            fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", textDecoration: "none",
          }}><ClipboardList size={14} /> Fodrász</a>
        </div>
      </header>
      <BarberStripe />

      {todayClosure && !confirmed && (
        <div style={{ maxWidth: 620, margin: "18px auto 0", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: COLORS.dark, color: "#fff", borderRadius: 12, padding: "14px 16px" }}>
            <CalendarOff size={18} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Most nem lehet foglalni</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                {todayClosure.reason || "A fodrász jelenleg nincs elérhető."} — visszatér: {formatHuDate(new Date(todayClosure.end_date + "T00:00:00"))}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmed ? (
        <ConfirmationTicket confirmed={confirmed} day={selectedDay} eventStartDate={eventStartDate} onNewBooking={resetBookingFlow} />
      ) : (
        <BookingFlow
          days={days} closures={closures} selectedDay={selectedDay} setSelectedDay={setSelectedDay}
          selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
          availableSlots={availableSlots} loadingDay={loadingDay} selectedDayClosure={selectedDayClosure}
          name={name} setName={setName} phone={phone} setPhone={setPhone}
          payNow={payNow} setPayNow={setPayNow} card={card} setCard={setCard}
          step={step} setStep={setStep}
          onConfirm={handleConfirm} saving={saving} error={error}
        />
      )}
    </div>
  );
}

function BookingFlow(props) {
  const {
    days, closures, selectedDay, setSelectedDay, selectedSlot, setSelectedSlot,
    availableSlots, loadingDay, selectedDayClosure,
    name, setName, phone, setPhone,
    payNow, setPayNow, card, setCard, step, setStep,
    onConfirm, saving, error,
  } = props;

  const canGoStep2 = selectedSlot !== null;
  const canGoStep3 = name.trim() && isPhoneValid(phone);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 80px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: COLORS.bgCard, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 24,
      }}>
        <div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 19, textTransform: "uppercase", letterSpacing: "0.01em" }}>{SERVICE.name}</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
            {SERVICE.duration} perc · 9:00–19:00 között, óránként
          </div>
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 18 }}>{SERVICE.priceLabel}</div>
      </div>

      <Progress step={step} />

      {step === 1 && (
        <div style={{ marginTop: 22 }}>
          <StepLabel n="1" label="Nap és időpont" />
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 2px", marginTop: 4 }}>
            {days.map((d) => {
              const active = dateKey(d) === dateKey(selectedDay);
              const closed = !!findClosure(dateKey(d), closures);
              return (
                <button key={dateKey(d)} onClick={() => setSelectedDay(d)} disabled={closed} style={{
                  flex: "0 0 auto", padding: "10px 14px", borderRadius: 12, minWidth: 68, position: "relative",
                  border: `1.5px solid ${active ? COLORS.dark : COLORS.line}`,
                  background: closed ? "#EFEFEC" : active ? COLORS.dark : COLORS.bgCard,
                  color: closed ? COLORS.mid : active ? "#fff" : COLORS.ink, textAlign: "center",
                  opacity: closed ? 0.6 : 1, cursor: closed ? "not-allowed" : "pointer",
                }}>
                  <div style={{ fontSize: 11.5, opacity: 0.75, fontWeight: 700, textTransform: "uppercase" }}>{HU_DAYS[d.getDay()]}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, marginTop: 2 }}>{d.getDate()}</div>
                  <div style={{ fontSize: 10.5, opacity: 0.75 }}>{HU_MONTHS[d.getMonth()]}</div>
                  {closed && <CalendarOff size={12} style={{ position: "absolute", top: 4, right: 4 }} />}
                </button>
              );
            })}
          </div>

          {selectedDayClosure ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#EFEFEC", border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
              <CalendarOff size={16} color={COLORS.inkSoft} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13.5, color: COLORS.inkSoft }}>
                Ezen a napon nincs foglalás: {selectedDayClosure.reason || "a fodrász nem dolgozik."}
              </div>
            </div>
          ) : loadingDay ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, marginTop: 12, fontSize: 14 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Szabad időpontok betöltése…
            </div>
          ) : availableSlots.length === 0 ? (
            <p style={{ color: COLORS.inkSoft, fontSize: 14, marginTop: 12 }}>Erre a napra nincs több szabad időpont.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(74px, 1fr))", gap: 8, marginTop: 14 }}>
              {availableSlots.map((t) => (
                <button key={t} onClick={() => setSelectedSlot(t)} style={{
                  padding: "10px 6px", borderRadius: 10, fontFamily: "'Space Mono', monospace", fontSize: 13.5, fontWeight: 700,
                  border: `1.5px solid ${selectedSlot === t ? COLORS.dark : COLORS.line}`,
                  background: selectedSlot === t ? COLORS.dark : COLORS.bgCard,
                  color: selectedSlot === t ? "#fff" : COLORS.ink,
                }}>{minutesToLabel(t)}</button>
              ))}
            </div>
          )}

          <NavButtons onNext={() => setStep(2)} nextDisabled={!canGoStep2} nextLabel="Tovább" />
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: 22 }}>
          <StepLabel n="2" label="Adataid" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, maxWidth: 420 }}>
            <LabeledInput icon={<User size={15} />} placeholder="Teljes név" value={name} onChange={setName} />
            <LabeledInput icon={<Phone size={15} />} placeholder="+36 30 123 4567" value={phone}
              onChange={(v) => setPhone(sanitizePhoneInput(v))} />
            {phone.trim() && !isPhoneValid(phone) && (
              <div style={{ fontSize: 12.5, color: COLORS.dark, marginTop: -4 }}>
                Adj meg egy érvényes telefonszámot, csak számjegyekkel (betű nem engedélyezett).
              </div>
            )}
          </div>
          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!canGoStep3} nextLabel="Tovább a fizetéshez" />
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 22 }}>
          <StepLabel n="3" label="Fizetés" />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setPayNow(true)} style={{
              flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
              border: `1.5px solid ${payNow ? COLORS.dark : COLORS.line}`,
              background: payNow ? COLORS.dark : COLORS.bgCard, color: payNow ? "#fff" : COLORS.ink,
            }}>Online fizetés most</button>
            <button onClick={() => setPayNow(false)} style={{
              flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
              border: `1.5px solid ${!payNow ? COLORS.dark : COLORS.line}`,
              background: !payNow ? COLORS.dark : COLORS.bgCard, color: !payNow ? "#fff" : COLORS.ink,
            }}>Fizetés a szalonban</button>
          </div>

          {payNow && (
            <div style={{ marginTop: 16, background: COLORS.bgCard, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, maxWidth: 420 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>
                <Lock size={12} /> Teszt mód — nem történik valódi terhelés, amíg nincs bekötve fizetési szolgáltató
              </div>
              <LabeledInput icon={<CreditCard size={15} />} placeholder="Kártyaszám" value={card.number}
                onChange={(v) => setCard({ ...card, number: v })} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <LabeledInput placeholder="HH/ÉÉ" value={card.expiry} onChange={(v) => setCard({ ...card, expiry: v })} />
                <LabeledInput placeholder="CVC" value={card.cvc} onChange={(v) => setCard({ ...card, cvc: v })} />
              </div>
            </div>
          )}

          {!payNow && (
            <p style={{ color: COLORS.inkSoft, fontSize: 13.5, marginTop: 14 }}>
              A {SERVICE.priceLabel} összeget a helyszínen fizeted a hajvágás után.
            </p>
          )}

          {error && (
            <div style={{ color: COLORS.dark, background: "#EFEFEC", border: `1px solid ${COLORS.mid}`, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, marginTop: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setStep(2)} style={{
              padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${COLORS.line}`, background: "transparent", color: COLORS.ink, fontWeight: 700, fontSize: 13, textTransform: "uppercase",
            }}>Vissza</button>
            <button onClick={onConfirm} disabled={saving} style={{
              padding: "12px 24px", borderRadius: 10, border: "none", background: COLORS.dark, color: "#fff",
              fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.02em",
              display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1,
            }}>
              {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
              {payNow ? "Fizetés és foglalás" : "Foglalás megerősítése"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Progress({ step }) {
  const labels = ["Időpont", "Adatok", "Fizetés"];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {labels.map((l, i) => (
        <div key={l} style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 4, background: i + 1 <= step ? COLORS.dark : COLORS.line }} />
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      {onBack && (
        <button onClick={onBack} style={{
          padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${COLORS.line}`, background: "transparent", color: COLORS.ink, fontWeight: 700, fontSize: 13, textTransform: "uppercase",
        }}>Vissza</button>
      )}
      <button onClick={onNext} disabled={nextDisabled} style={{
        padding: "12px 24px", borderRadius: 10, border: "none",
        background: nextDisabled ? COLORS.mid : COLORS.dark, color: "#fff", fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.02em",
        opacity: nextDisabled ? 0.6 : 1,
      }}>{nextLabel}</button>
    </div>
  );
}

function StepLabel({ n, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        width: 24, height: 24, borderRadius: "50%", background: COLORS.ink, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, fontFamily: "'Space Mono', monospace",
      }}>{n}</span>
      <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 19, textTransform: "uppercase", letterSpacing: "0.01em" }}>{label}</span>
    </div>
  );
}

function LabeledInput({ icon, placeholder, value, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10,
      border: `1.5px solid ${COLORS.line}`, background: COLORS.bgCard, flex: 1,
    }}>
      {icon && <span style={{ color: COLORS.mid }}>{icon}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
        border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", fontFamily: "'Barlow', sans-serif",
      }} />
    </div>
  );
}

function ConfirmationTicket({ confirmed, day, eventStartDate, onNewBooking }) {
  const description = `Foglalás: ${SERVICE.name} — ${confirmed.name} (${confirmed.phone})${confirmed.paid ? " — kifizetve online" : " — fizetés a szalonban"}`;
  const location = "Hajszál Pontosan Fodrászat";

  function handleClientICS() {
    const ics = buildICS({
      title: `${SERVICE.name} — Hajszál Pontosan`, description, location,
      start: eventStartDate, durationMinutes: confirmed.duration, uid: `${confirmed.id}@hajszalpontosan`,
    });
    downloadICS(`fodraszat-${dateKey(day)}-${minutesToLabel(confirmed.startMinutes)}.ics`, ics);
  }

  const gcalLink = googleCalendarLink({
    title: `${SERVICE.name} — Hajszál Pontosan`, description, location,
    start: eventStartDate, durationMinutes: confirmed.duration,
  });

  return (
    <div style={{ maxWidth: 460, margin: "40px auto", padding: "0 20px", animation: "riseIn 260ms ease-out" }}>
      <div style={{ background: COLORS.bgCard, border: `1.5px dashed ${COLORS.mid}`, borderRadius: 16, padding: "28px 26px", position: "relative" }}>
        <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: COLORS.dark, color: "#fff", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
          FOGLALÁS MEGVAN
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Scissors size={26} color={COLORS.dark} />
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, marginTop: 8, letterSpacing: "0.02em" }}>{SERVICE.name.toUpperCase()}</div>
          <div style={{ color: COLORS.inkSoft, fontSize: 14, marginTop: 2 }}>{confirmed.name} · {confirmed.phone}</div>
          <div style={{ fontSize: 13, marginTop: 6, color: COLORS.ok, fontWeight: 700 }}>
            {confirmed.paid ? `Kifizetve online — ${confirmed.amount}` : `Fizetés a szalonban — ${confirmed.amount}`}
          </div>
        </div>

        <div style={{ borderTop: `1px dashed ${COLORS.line}`, margin: "20px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div>
            <Calendar size={16} color={COLORS.mid} style={{ marginBottom: 4 }} />
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15 }}>{formatHuDate(day)}</div>
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{HU_DAYS[day.getDay()]}</div>
          </div>
          <div>
            <Clock size={16} color={COLORS.mid} style={{ marginBottom: 4 }} />
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15 }}>{minutesToLabel(confirmed.startMinutes)}</div>
            <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{confirmed.duration} perc</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
          <button onClick={handleClientICS} style={{
            padding: "12px", borderRadius: 10, border: "none", background: COLORS.dark, color: "#fff",
            fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.02em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}><Calendar size={15} /> Hozzáadás a naptárhoz (iPhone / Android)</button>
          <a href={gcalLink} target="_blank" rel="noreferrer" style={{
            padding: "12px", borderRadius: 10, border: `1.5px solid ${COLORS.line}`, color: COLORS.ink,
            fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.02em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none",
          }}>Megnyitás Google Naptárban</a>
        </div>
        <p style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 14, textAlign: "center" }}>
          A fodrász naptárába a foglalás automatikusan bekerült — a "Fodrász" nézetben látható.
        </p>
      </div>

      <button onClick={onNewBooking} style={{
        display: "block", margin: "18px auto 0", background: "none", border: "none", color: COLORS.dark,
        fontWeight: 700, fontSize: 13, textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.02em",
      }}>Új foglalás indítása</button>
    </div>
  );
}
