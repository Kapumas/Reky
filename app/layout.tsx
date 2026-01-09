import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} - Reservas de Carga para Vehículos Eléctricos`,
  description: "Sistema de reservas de carga para vehículos eléctricos en edificios residenciales. Agenda tu turno de forma rápida y sencilla, gestiona tus reservas y optimiza el uso de los puntos de carga compartidos.",
  keywords: ["carga vehículos eléctricos", "reservas carga", "edificio residencial", "punto de carga", "vehículo eléctrico", "EV charging"],
  authors: [{ name: APP_NAME }],
  openGraph: {
    title: `${APP_NAME} - Reservas de Carga para Vehículos Eléctricos`,
    description: "Sistema de reservas de carga para vehículos eléctricos en edificios residenciales. Agenda tu turno de forma rápida y sencilla.",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} - Reservas de Carga para Vehículos Eléctricos`,
    description: "Sistema de reservas de carga para vehículos eléctricos en edificios residenciales.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`} style={{ backgroundColor: '#F6F8F7' }}>
        <Header />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
