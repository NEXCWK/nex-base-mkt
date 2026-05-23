"use client";
import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("E-mail ou senha invalidos.");
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Image
              src="/brand/logo-nex-preto.png"
              alt="Nex Coworking"
              width={140}
              height={52}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm font-semibold text-gray-dark tracking-wide uppercase">
            Marketing, Comunicacao & Vendas
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-medium p-6 shadow-sm">
          <h2 className="text-base font-bold mb-5">Entrar na plataforma</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@nexcoworking.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-xs text-red-500 -mt-1">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Acesso restrito ao time interno
        </p>
      </div>
    </div>
  );
}
