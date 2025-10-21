// app/font.ts
import localFont from "next/font/local";

// Sans: Geist Variable
export const geist = localFont({
  src: [{ path: "./fonts/GeistVF.woff", style: "normal", weight: "100 900" }],
  variable: "--font-geist",
  display: "swap",
});

// Mono: Geist Mono Variable
export const geistMono = localFont({
  src: [{ path: "./fonts/GeistMonoVF.woff", style: "normal", weight: "100 900" }],
  variable: "--font-geist-mono",
  display: "swap",
});
