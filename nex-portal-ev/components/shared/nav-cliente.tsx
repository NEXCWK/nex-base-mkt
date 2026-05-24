'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileUp, FolderOpen, Image, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/documentos', label: 'Documentos', icon: FileUp },
  { href: '/repositorio', label: 'Meus Arquivos', icon: FolderOpen },
  { href: '/imagens', label: 'Imagens', icon: Image },
]

export function NavCliente({ nomeCliente }: { nomeCliente: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-nex-yellow rounded flex items-center justify-center">
                <span className="font-heading font-bold text-sm text-nex-black">N</span>
              </div>
              <span className="font-heading font-bold text-nex-black hidden sm:block">Nex EV Portal</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-nex-yellow text-nex-black'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{nomeCliente}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors',
                pathname === href ? 'bg-nex-yellow text-nex-black' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
