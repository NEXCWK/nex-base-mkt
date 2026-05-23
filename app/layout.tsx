import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nex | Marketing, Comunicacao & Vendas",
  description: "Base de conhecimento da area de Marketing, Comunicacao e Vendas do Nex Coworking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
