import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers";
import { Toaster } from "react-hot-toast"; // 1. IMPORTAÇÃO AQUI!

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WFX | Modelagem 3D para Alta Joalharia",
  description: "Marketplace premium de arquivos STL validados para prototipagem e moldes de borracha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* suppressHydrationWarning é necessário porque o next-themes 
      adiciona a classe 'dark'/'light' no html antes da hidratação do React.
    */
    <html lang="pt-br" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 2. O COMPONENTE INVISÍVEL QUE MOSTRA OS AVISOS */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#0f172a', 
              color: '#fff',
              border: '1px solid #1e293b',
              fontSize: '14px',
              fontWeight: 'bold',
            }
          }} 
        />
        
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}