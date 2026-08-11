import { OPEN_HOUR, CLOSE_HOUR, HU_MONTHS } from "./theme";

export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatHuDate(d) {
  return `${HU_MONTHS[d.getMonth()]}. ${d.getDate()}.`;
}

export function nextOpenDays(count) {
  const days = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (d.getDay() !== 0) days.push(new Date(d));
    d = new Date(d.getTime() + 86400000);
  }
  return days;
}

export function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function pad(n) { return String(n).padStart(2, "0"); }

export function toICSDate(date) {
  return (
    date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + "T" +
    pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + "00Z"
  );
}

export function buildICS({ title, description, location, start, durationMinutes, uid }) {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hajszal Pontosan//Idopontfoglalo//HU",
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`, `DTEND:${toICSDate(end)}`,
    `SUMMARY:${title}`, `DESCRIPTION:${description}`, `LOCATION:${location}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(filename, icsContent) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function googleCalendarLink({ title, description, location, start, durationMinutes }) {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE", text: title, dates: `${toICSDate(start)}/${toICSDate(end)}`,
    details: description, location,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function buildICSCalendar(events, calName) {
  const body = events.map((ev) => {
    const end = new Date(ev.start.getTime() + ev.durationMinutes * 60000);
    return [
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(ev.start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.description}`,
      `LOCATION:${ev.location}`,
      "END:VEVENT",
    ].join("\r\n");
  }).join("\r\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hajszal Pontosan//Idopontfoglalo//HU",
    `X-WR-CALNAME:${calName}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    body,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function findClosure(dk, closures) {
  return closures.find((c) => dk >= c.start_date && dk <= c.end_date) || null;
}

export function sanitizePhoneInput(v) {
  return v.replace(/[^0-9+\-\s()]/g, "");
}

export function isPhoneValid(v) {
  const digits = (v.match(/\d/g) || []).length;
  return /^[0-9+\-\s()]+$/.test(v) && digits >= 9;
}

export function slotsForDay({ dayBookings, isToday, closed }) {
  if (closed) return [];
  const slots = [];
  const startMin = OPEN_HOUR * 60;
  const endMin = CLOSE_HOUR * 60 - 60;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let t = startMin; t <= endMin; t += 60) {
    const overlaps = dayBookings.some((b) => {
      const bStart = b.start_minutes, bEnd = b.start_minutes + b.duration;
      const tEnd = t + 60;
      return t < bEnd && tEnd > bStart;
    });
    const isPast = isToday && t <= nowMinutes;
    if (!overlaps && !isPast) slots.push(t);
  }
  return slots;
}
