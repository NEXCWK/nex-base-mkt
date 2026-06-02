"use client";
import { Suspense } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginCard() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="bg-white rounded-xl border border-gray-medium p-6 shadow-sm">
      <h2 className="text-base font-bold mb-2">Entrar na plataforma</h2>
      <p className="text-xs text-muted-foreground mb-5">
        Use sua conta Google do Nex para acessar.
      </p>

      {error === "AccessDenied" && (
        <p className="text-xs text-red-500 mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Acesso negado. Use um e-mail @nexcoworking.com.br.
        </p>
      )}
      {error && error !== "AccessDenied" && (
        <p className="text-xs text-red-500 mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Ocorreu um erro ao autenticar. Tente novamente.
        </p>
      )}

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex items-center justify-center gap-3 w-full border border-gray-medium rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-light transition-colors"
      >
        <GoogleIcon />
        Entrar com Google
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
            Marketing, Comunicacao &amp; Vendas
          </p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-xl border border-gray-medium p-6 shadow-sm h-32" />}>
          <LoginCard />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Acesso restrito ao time interno
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </g>
    </svg>
  );
}
