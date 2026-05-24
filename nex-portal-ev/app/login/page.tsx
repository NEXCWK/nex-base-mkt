import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-nex-yellow rounded-xl mb-4">
            <span className="font-heading font-bold text-2xl text-nex-black">N</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-nex-black">Nex EV Portal</h1>
          <p className="text-gray-500 mt-1 text-sm">Portal de Escritório Virtual</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
