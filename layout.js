import "./globals.css";

export const metadata = {
  title: "Hajszál Pontosan — Időpontfoglalás",
  description: "Foglalj hajvágást gyorsan, pontosan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
