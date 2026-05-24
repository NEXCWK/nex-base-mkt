export type UserPerfil = 'cliente' | 'admin'

export type DocumentoStatus = 'pendente' | 'enviado' | 'aprovado' | 'rejeitado'

export type DocumentoCategoria = 'contrato' | 'fiscal' | 'comunicado' | 'outro'

export type ImagemCategoria = 'fachada' | 'espaco_interno' | 'logo' | 'outro'

export type ImagemVisibilidade = 'todos' | 'especifico'

export interface Profile {
  id: string
  user_id: string
  nome: string
  email: string
  perfil: UserPerfil
  unidade: string | null
  ativo: boolean
  drive_folder_id: string | null
  created_at: string
}

export interface DocumentoExigido {
  id: string
  nome: string
  descricao: string | null
  obrigatorio: boolean
  ativo: boolean
  ordem: number
}

export interface DocumentoCliente {
  id: string
  cliente_id: string
  documento_exigido_id: string
  arquivo_url: string | null
  drive_url: string | null
  status: DocumentoStatus
  observacao: string | null
  enviado_por: string | null
  created_at: string
  updated_at: string
  documento_exigido?: DocumentoExigido
  cliente?: Profile
}

export interface DocumentoNex {
  id: string
  cliente_id: string
  nome: string
  categoria: DocumentoCategoria
  arquivo_url: string | null
  drive_url: string | null
  enviado_por: string | null
  created_at: string
  cliente?: Profile
}

export interface Imagem {
  id: string
  nome: string
  categoria: ImagemCategoria
  arquivo_url: string | null
  drive_url: string | null
  visibilidade: ImagemVisibilidade
  created_at: string
  clientes?: string[]
}

export interface ImagemCliente {
  id: string
  imagem_id: string
  cliente_id: string
}

export interface ClienteComStatus extends Profile {
  total_documentos: number
  documentos_aprovados: number
  documentos_pendentes: number
  documentos_rejeitados: number
  status_geral: 'completo' | 'pendente' | 'com_rejeicao'
}
