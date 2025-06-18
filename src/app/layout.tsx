import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@components/providers/AuthProvider";
import { Toaster } from "sonner";
import { startAnalysisWorker } from "@lib/worker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Manager",
  description: "Gerencie seus canais do YouTube com IA",
};

// Inicializar o worker quando o servidor iniciar
if (typeof window === 'undefined') {
  // Só executar no servidor
  startAnalysisWorker();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
