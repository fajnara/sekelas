import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// The design loads Plus Jakarta Sans at 400/500/600/700/800.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Sekelas",
  description: "Tugas kelas, tanpa drama.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#edebf3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
