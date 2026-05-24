'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, LayoutDashboard, Image, Settings, UserCog, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/painel', label: 'Painel', icon: LayoutDashboard },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/imagens', label: 'Imagens', icon: Image },
  { href: '/admin/documentos-config', label: 'Documentos', icon: Settings },
  { href: '/admin/contas', label: 'Contas', icon: UserCog },
]

export function NavAdmin() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-nex-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin/painel" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-nex-yellow rounded flex items-center justify-center">
                <span className="font-heading font-bold text-sm text-nex-black">N</span>
              </div>
              <span className="font-heading font-bold text-white hidden sm:block">
                Nex EV Portal <span className="text-nex-yellow text-xs">ADMIN</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
                    pathname.startsWith(href)
                      ? 'bg-nex-yellow text-nex-black'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">Sair</span>
          </button>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors',
                pathname.startsWith(href) ? 'bg-nex-yellow text-nex-black' : 'text-gray-300 hover:text-white hover:bg-white/10'
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
