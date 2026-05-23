"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function FirstAccessModal() {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const user = session?.user as { firstAccess?: boolean } | undefined;
    if (user?.firstAccess && !done) setOpen(true);
  }, [session, done]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("A senha deve ter no minimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("As senhas nao conferem.");
      return;
    }
    setLoading(true);
    try {
      const userId = (session?.user as { id?: string })?.id;
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar senha");
      }
      await update({ firstAccess: false });
      setDone(true);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Primeiro acesso - troque sua senha"
      description="Por seguranca, defina uma nova senha para o seu usuario antes de continuar."
      closable={false}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nova senha"
          type="password"
          placeholder="Minimo 8 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Repita a nova senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Salvar nova senha
        </Button>
      </form>
    </Modal>
  );
}
