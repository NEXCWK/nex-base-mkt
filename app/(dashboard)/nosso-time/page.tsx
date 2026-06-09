"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { User, ChevronDown, ChevronUp, Pencil, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  email: string;
  name: string;
  role: string;
  bio: string;
  curiosities: string;
  age: string;
  likes: string;
  sports: string;
  photoUrl: string;
  updatedAt?: string;
}

type ProfileFormData = Omit<TeamMember, "email" | "updatedAt">;

const EMPTY_FORM: ProfileFormData = {
  name: "",
  role: "",
  bio: "",
  curiosities: "",
  age: "",
  likes: "",
  sports: "",
  photoUrl: "",
};

function resizeImage(file: File, maxPx = 480, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

function PhotoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setProcessing(true);
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-medium cursor-pointer hover:border-black transition-colors group shrink-0"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-light">
            <User size={24} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {processing ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Camera size={16} className="text-white" />
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-dark mb-1">Foto de perfil</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-muted-foreground hover:text-black underline underline-offset-2 transition-colors"
        >
          {value ? "Trocar foto" : "Enviar foto"}
        </button>
        {value && (
          <>
            <span className="text-xs text-muted-foreground mx-1.5">·</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors"
            >
              Remover
            </button>
          </>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function NossoTimePage() {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email ?? "";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expanded profile card state
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Erro ao carregar o time");
      const data: TeamMember[] = await res.json();
      setMembers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  function openEditModal() {
    const mine = members.find((m) => m.email === sessionEmail);
    setForm(
      mine
        ? {
            name: mine.name,
            role: mine.role,
            bio: mine.bio,
            curiosities: mine.curiosities,
            age: mine.age,
            likes: mine.likes,
            sports: mine.sports,
            photoUrl: mine.photoUrl,
          }
        : { ...EMPTY_FORM, name: session?.user?.name ?? "" }
    );
    setSaveError("");
    setEditOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }
      await fetchTeam();
      setEditOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function setField(key: keyof ProfileFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const toggleExpand = (email: string) => {
    setExpandedEmail((prev) => (prev === email ? null : email));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-black">Nosso Time</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conheça as pessoas que fazem parte do time Nex.
          </p>
        </div>
        {sessionEmail && (
          <Button variant="accent" size="sm" onClick={openEditModal}>
            <Pencil size={14} />
            Editar meu perfil
          </Button>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="rounded-lg border border-gray-medium bg-gray-light p-12 text-center">
          <User size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum membro cadastrado ainda. Seja o primeiro a preencher seu perfil.
          </p>
        </div>
      )}

      {/* Team grid */}
      {!loading && !error && members.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const isExpanded = expandedEmail === member.email;
            const isOwn = member.email === sessionEmail;

            return (
              <Card
                key={member.email}
                className={cn(
                  "overflow-hidden transition-all",
                  isOwn && "ring-2 ring-accent ring-offset-1"
                )}
              >
                <CardContent className="p-0">
                  {/* Photo / Avatar */}
                  <div className="h-32 bg-gray-light flex items-center justify-center overflow-hidden">
                    {member.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-medium flex items-center justify-center">
                        <User size={28} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-black truncate">
                          {member.name || member.email}
                        </h3>
                        {member.role && (
                          <Badge variant="muted" className="mt-1">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                      {isOwn && (
                        <button
                          onClick={openEditModal}
                          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-black hover:bg-gray-light transition-colors"
                          title="Editar meu perfil"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>

                    {member.bio && (
                      <p
                        className={cn(
                          "mt-2 text-xs text-muted-foreground leading-relaxed",
                          !isExpanded && "line-clamp-2"
                        )}
                      >
                        {member.bio}
                      </p>
                    )}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 border-t border-gray-medium pt-3">
                        {member.age && (
                          <div>
                            <span className="text-xs font-medium text-black">Idade: </span>
                            <span className="text-xs text-muted-foreground">{member.age}</span>
                          </div>
                        )}
                        {member.likes && (
                          <div>
                            <span className="text-xs font-medium text-black">Gostos: </span>
                            <span className="text-xs text-muted-foreground">{member.likes}</span>
                          </div>
                        )}
                        {member.sports && (
                          <div>
                            <span className="text-xs font-medium text-black">Esportes: </span>
                            <span className="text-xs text-muted-foreground">{member.sports}</span>
                          </div>
                        )}
                        {member.curiosities && (
                          <div>
                            <span className="text-xs font-medium text-black">Curiosidades: </span>
                            <span className="text-xs text-muted-foreground">
                              {member.curiosities}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => toggleExpand(member.email)}
                      className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-black transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={13} />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} />
                          Ver perfil completo
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit profile modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar meu perfil"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nome"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Seu nome"
            />
            <Input
              label="Cargo / Função"
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              placeholder="Ex: Designer"
            />
          </div>

          <Textarea
            label="Bio"
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            placeholder="Conte um pouco sobre você..."
            rows={3}
          />

          <Textarea
            label="Curiosidades"
            value={form.curiosities}
            onChange={(e) => setField("curiosities", e.target.value)}
            placeholder="Algo interessante sobre você..."
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Idade"
              value={form.age}
              onChange={(e) => setField("age", e.target.value)}
              placeholder="Ex: 28"
              type="text"
            />
            <Input
              label="Esportes"
              value={form.sports}
              onChange={(e) => setField("sports", e.target.value)}
              placeholder="Ex: Futebol, Corrida"
            />
          </div>

          <Input
            label="Gostos / Hobbies"
            value={form.likes}
            onChange={(e) => setField("likes", e.target.value)}
            placeholder="Ex: Musica, Viagens, Fotografia"
          />

          <PhotoUpload value={form.photoUrl} onChange={(v) => setField("photoUrl", v)} />

          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
