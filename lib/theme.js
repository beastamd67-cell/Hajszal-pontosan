export const COLORS = {
  bg: "#E4E4E1",
  bgCard: "#FAFAF8",
  ink: "#171716",
  inkSoft: "#6E6E6A",
  dark: "#232322",
  mid: "#86867F",
  stripeLight: "#C9C9C4",
  line: "#D3D3CE",
  ok: "#3F3F3C",
};

export const SERVICE = { id: "hajvagas", name: "Hajvágás", duration: 60, price: 3500, priceLabel: "3 500 Ft" };

// Heti beosztás: 0 = vasárnap, 1 = hétfő ... 6 = szombat.
// start / end percben (14:30 = 14*60+30). null = azon a napon nincs foglalás.
// Az időpontok óránként követik egymást a "start"-tól. Az "end" az utolsó
// időpont VÉGE (18:30 -> az utolsó időpont 17:30-kor kezdődik).
// A hétköznapi kezdés az iskolai órarend (utolsó óra vége) alapján van:
//   Hétfő, Szerda: 15:05-kor ér véget  -> 15:30-tól
//   Kedd:          14:15-kor ér véget  -> 14:30-tól
//   Csütörtök, Péntek: 13:25-kor ér véget -> 14:30-tól
export const WEEK_SCHEDULE = {
  0: null,                                   // vasárnap: zárva
  1: { start: 15 * 60 + 30, end: 18 * 60 + 30 },  // hétfő
  2: { start: 14 * 60 + 30, end: 18 * 60 + 30 },  // kedd
  3: { start: 15 * 60 + 30, end: 18 * 60 + 30 },  // szerda
  4: { start: 14 * 60 + 30, end: 18 * 60 + 30 },  // csütörtök
  5: { start: 14 * 60 + 30, end: 18 * 60 + 30 },  // péntek
  6: { start: 9 * 60, end: 18 * 60 },        // szombat (nincs iskola)
};
// Utalási adatok (ezek jelennek meg az ügyfélnek a fizetésnél)
export const BANK = {
  holder: "Bodnár Merse Hunor",
  bank: "Erste Bank",
  account: "11600006-00000002-08195490",
};
// Ez a szöveg kerül a foglalás összeg mezőjébe, ha utalással fizet
export const TRANSFER_TAG = "utalás";

export const SLOT_STEP = 60;
export const HU_DAYS = ["Vas", "Hét", "Ked", "Szer", "Csüt", "Pén", "Szo"];
export const HU_MONTHS = ["jan", "feb", "márc", "ápr", "máj", "jún", "júl", "aug", "szept", "okt", "nov", "dec"];
