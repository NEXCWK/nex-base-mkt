import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DocumentoStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const statusLabels: Record<DocumentoStatus, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

export const statusColors: Record<DocumentoStatus, string> = {
  pendente: 'bg-gray-100 text-gray-600 border-gray-200',
  enviado: 'bg-blue-50 text-blue-700 border-blue-200',
  aprovado: 'bg-nex-yellow-light text-nex-black border-nex-yellow',
  rejeitado: 'bg-red-50 text-red-700 border-red-200',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export const MAX_DOC_SIZE = 10 * 1024 * 1024  // 10MB
export const MAX_IMG_SIZE = 20 * 1024 * 1024  // 20MB
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']
