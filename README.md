# Hajszál Pontosan — Időpontfoglaló weboldal

Ez egy kész, telepíthető Next.js alkalmazás: hajvágás időpontfoglalás,
megosztott naptárral (Supabase adatbázis), jelszóval védett fodrász
nézettel, .ics naptárba mentéssel (iPhone/Android), és online fizetés
kapcsolóval (jelenleg teszt módban, lásd lent).

Kb. **20-30 perc** alatt élesíthető, ha végigmész a lépéseken. Minden
szolgáltatás, amit itt használunk, ingyenes induló csomaggal rendelkezik.

---

## 1. lépés — Supabase adatbázis létrehozása (ingyenes)

1. Regisztrálj a https://supabase.com oldalon, és hozz létre egy új projektet
   (válassz egy jelszót az adatbázishoz — ezt csak egyszer kéri, jegyezd meg).
2. Amint elkészült a projekt, menj a bal oldali menüben **SQL Editor**-ra,
   nyiss egy új query-t, másold be a `supabase/schema.sql` fájl tartalmát,
   és futtasd le (Run gomb). Ez létrehozza a `bookings` és `closures` táblákat.
3. Menj a **Settings → API** oldalra. Onnan kelleni fog:
   - **Project URL** → ez lesz a `SUPABASE_URL`
   - **service_role key** (NE az "anon public" kulcsot használd!) → ez lesz
     a `SUPABASE_SERVICE_ROLE_KEY`

   Fontos: a service_role kulcsot soha ne oszd meg senkivel, és soha ne
   kerüljön be nyilvános (pl. frontend) kódba — ez az alkalmazás úgy van
   megírva, hogy ez a kulcs csak a szerver oldalon, biztonságosan fut.

## 2. lépés — Admin jelszó kiválasztása

Válassz egy erős jelszót, amivel te (a fodrász) be tudsz lépni a
`/admin` oldalra a foglalások megtekintéséhez és a szabadság
beállításához. Ezt a következő lépésben adod majd meg.

## 3. lépés — Feltöltés GitHub-ra

1. Hozz létre egy ingyenes fiókot a https://github.com oldalon, ha még
   nincs.
2. Hozz létre egy új, üres repository-t (pl. `hajszal-pontosan`).
3. Töltsd fel ebbe a mappa teljes tartalmát (a GitHub weboldalán is meg
   lehet tenni: "uploading an existing file", vagy git paranccsal, ha
   ismerős).

## 4. lépés — Telepítés Vercelre (ingyenes hosting)

1. Regisztrálj a https://vercel.com oldalon (a legegyszerűbb: "Continue
   with GitHub").
2. Kattints **Add New → Project**, és válaszd ki az imént feltöltött
   `hajszal-pontosan` repository-t.
3. A build beállításokat nem kell módosítani (Next.js-t automatikusan
   felismeri).
4. Mielőtt rákattintasz a Deploy gombra, nyisd meg az **Environment
   Variables** részt, és add hozzá:
   - `SUPABASE_URL` = a Project URL az 1. lépésből
   - `SUPABASE_SERVICE_ROLE_KEY` = a service_role kulcs az 1. lépésből
   - `ADMIN_PASSWORD` = a 2. lépésben választott jelszó
5. Kattints **Deploy**. Pár perc múlva kapsz egy élő linket, valami
   ilyesmit: `https://hajszal-pontosan.vercel.app` — ez már működik,
   bárki foglalhat rajta időpontot, és te a `/admin` aloldalon (pl.
   `https://hajszal-pontosan.vercel.app/admin`) tudod kezelni.

## 5. lépés — Saját domain (opcionális)

Ha szeretnél saját domaint (pl. `hajszalpontosan.hu`), vásárolj egyet
bármelyik domain-regisztrátornál, majd a Vercel projekt **Settings →
Domains** menüjében add hozzá és kövesd az ott mutatott DNS
beállítási lépéseket (pár kattintás, a Vercel megmutatja pontosan mit
kell beállítani a domain szolgáltatónál).

## Online fizetésről

A fizetési lépés jelenleg **teszt módban** fut (nincs mögötte valódi
bank), ezért induláskor érdemes a "fizetés a szalonban" opciót
használni élesben — ez már most is teljesen működik.

Amikor készen állsz a valódi online kártyás fizetésre:
1. Nyiss egy Stripe fiókot (https://stripe.com), és menj át a
   cégellenőrzésen (ez pár napot vehet igénybe).
2. Szólj, és bekötjük a Stripe Checkout-ot a fizetési lépésbe — ehhez
   már csak az API kulcsaid kellenek majd.

## Helyi tesztelés (ha van fejlesztői gépem)

```
npm install
cp .env.example .env.local   # töltsd ki a saját kulcsaiddal
npm run dev
```

Ezután a http://localhost:3000 címen fut az oldal, a
http://localhost:3000/admin a fodrász nézet.

## Mit tud most az oldal

- Ügyfél foglalhat hajvágás időpontot 9:00–19:00 között, óránként
  (napi 10 időpont), a már foglalt/lefoglalt időpontokat nem látja
  szabadnak (adatbázis szinten is védett duplikáció ellen).
- Telefonszám mező: alapból `+36`-tal, betűt nem enged beírni, csak
  érvényes számformátumnál enged tovább lépni.
- Fizetés: online (teszt mód) vagy helyszíni választható.
- Foglalás után .ics fájl letölthető (iPhone/Android natív
  naptárjába), illetve egy Google Naptár link is elérhető.
- `/admin` (jelszóval védett): összes foglalás listázása, törlése,
  naptárba mentése; szabadság/zárás beállítása dátumtartománnyal —
  ekkor az ügyfél nem tud azokra a napokra foglalni, és amíg tart a
  zárás, egy figyelmeztető sáv is megjelenik a foglalási oldalon.
