-- ============================================================
-- Nex EV Portal — Schema inicial
-- ============================================================

-- Perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('cliente', 'admin')),
  unidade text,
  ativo boolean NOT NULL DEFAULT true,
  drive_folder_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX profiles_perfil_idx ON profiles(perfil);
CREATE INDEX profiles_ativo_idx ON profiles(ativo);

-- Documentos exigidos (configurável pelo admin)
CREATE TABLE IF NOT EXISTS documentos_exigidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  obrigatorio boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0
);

-- Uploads do cliente → Nex
CREATE TABLE IF NOT EXISTS documentos_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  documento_exigido_id uuid NOT NULL REFERENCES documentos_exigidos(id),
  arquivo_url text,
  drive_url text,
  status text NOT NULL CHECK (status IN ('pendente', 'enviado', 'aprovado', 'rejeitado')) DEFAULT 'pendente',
  observacao text,
  enviado_por uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documentos_cliente_cliente_id_idx ON documentos_cliente(cliente_id);
CREATE INDEX documentos_cliente_status_idx ON documentos_cliente(status);

-- Documentos do Nex → cliente
CREATE TABLE IF NOT EXISTS documentos_nex (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('contrato', 'fiscal', 'comunicado', 'outro')),
  arquivo_url text,
  drive_url text,
  enviado_por uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documentos_nex_cliente_id_idx ON documentos_nex(cliente_id);

-- Imagens institucionais
CREATE TABLE IF NOT EXISTS imagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('fachada', 'espaco_interno', 'logo', 'outro')),
  arquivo_url text,
  drive_url text,
  visibilidade text NOT NULL CHECK (visibilidade IN ('todos', 'especifico')) DEFAULT 'todos',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX imagens_categoria_idx ON imagens(categoria);
CREATE INDEX imagens_visibilidade_idx ON imagens(visibilidade);

-- Relação imagens ↔ clientes específicos
CREATE TABLE IF NOT EXISTS imagens_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imagem_id uuid NOT NULL REFERENCES imagens(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(imagem_id, cliente_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_exigidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_nex ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagens_clientes ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se o user autenticado é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND perfil = 'admin'
    AND ativo = true
  );
$$;

-- Helper: retorna o profile id do user autenticado
CREATE OR REPLACE FUNCTION my_profile_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- profiles: cliente lê apenas o próprio, admin lê todos
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- documentos_exigidos: todos autenticados leem, só admin escreve
CREATE POLICY "doc_exigidos_select" ON documentos_exigidos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "doc_exigidos_insert_admin" ON documentos_exigidos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "doc_exigidos_update_admin" ON documentos_exigidos
  FOR UPDATE USING (is_admin());

CREATE POLICY "doc_exigidos_delete_admin" ON documentos_exigidos
  FOR DELETE USING (is_admin());

-- documentos_cliente: cliente lê/escreve apenas os seus, admin tudo
CREATE POLICY "doc_cliente_select" ON documentos_cliente
  FOR SELECT USING (cliente_id = my_profile_id() OR is_admin());

CREATE POLICY "doc_cliente_insert" ON documentos_cliente
  FOR INSERT WITH CHECK (cliente_id = my_profile_id() OR is_admin());

CREATE POLICY "doc_cliente_update" ON documentos_cliente
  FOR UPDATE USING (cliente_id = my_profile_id() OR is_admin());

-- documentos_nex: cliente lê apenas os seus, admin escreve
CREATE POLICY "doc_nex_select" ON documentos_nex
  FOR SELECT USING (cliente_id = my_profile_id() OR is_admin());

CREATE POLICY "doc_nex_insert_admin" ON documentos_nex
  FOR INSERT WITH CHECK (is_admin());

-- imagens: todos autenticados leem (filtrado no app), admin escreve
CREATE POLICY "imagens_select" ON imagens
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "imagens_insert_admin" ON imagens
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "imagens_update_admin" ON imagens
  FOR UPDATE USING (is_admin());

CREATE POLICY "imagens_delete_admin" ON imagens
  FOR DELETE USING (is_admin());

-- imagens_clientes: cliente lê as suas, admin tudo
CREATE POLICY "imagens_clientes_select" ON imagens_clientes
  FOR SELECT USING (cliente_id = my_profile_id() OR is_admin());

CREATE POLICY "imagens_clientes_insert_admin" ON imagens_clientes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "imagens_clientes_delete_admin" ON imagens_clientes
  FOR DELETE USING (is_admin());

-- ============================================================
-- Storage bucket (executar no Supabase Dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ev-portal', 'ev-portal', false);
--
-- Storage RLS:
-- Authenticated users can read their own files
-- Only service role can upload

-- ============================================================
-- Dados iniciais de exemplo
-- ============================================================
INSERT INTO documentos_exigidos (nome, descricao, obrigatorio, ativo, ordem) VALUES
  ('RG ou CNH', 'Documento de identidade com foto (frente e verso)', true, true, 1),
  ('CPF', 'Cadastro de Pessoa Física', true, true, 2),
  ('Comprovante de Endereço', 'Conta de luz, água, telefone ou internet — últimos 3 meses', true, true, 3),
  ('Contrato Social ou MEI', 'Para Pessoa Jurídica: contrato social ou certificado MEI', false, true, 4),
  ('Foto do Sócio/Responsável', 'Foto 3x4 ou similar do responsável pela conta', false, true, 5)
ON CONFLICT DO NOTHING;
