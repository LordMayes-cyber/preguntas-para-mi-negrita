import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Entre nosotros · Un espacio para querernos",
  description: "Unas preguntas, todas tus palabras y una carta escrita con amor. Un pequeño espacio para dos.",
  robots: { index: false, follow: false }, icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
