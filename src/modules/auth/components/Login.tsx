import React, { useState, useRef, useEffect } from 'react'
import { KeyRound, ShieldAlert, User, Eye, EyeOff, Loader2, Sparkles, Building2 } from 'lucide-react'
import { useAuthStore } from '../store'

export interface LoginProps {
  productName?: string
  productTagline?: string
  productLogoSrc?: string
  developerName?: string
  copyrightText?: string
}

export default function Login({
  productName = 'Clinic Billing System',
  productTagline = 'Sign in to manage records and invoices',
  productLogoSrc = '/get-by-tech-logo.png',
  developerName = 'GetBytech',
  copyrightText = `© ${new Date().getFullYear()} GetBytech. All rights reserved.`
}: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLogoLoaded, setIsLogoLoaded] = useState(true)

  const usernameInputRef = useRef<HTMLInputElement>(null)

  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)

  // Auto-focus username field on load
  useEffect(() => {
    usernameInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your username and password.')
      return
    }

    const res = await login(username.trim(), password.trim())
    if (!res.success) {
      setError('Invalid username or password.')
    }
  }

  const isFormValid = username.trim().length > 0 && password.trim().length > 0

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between items-center bg-gradient-to-br from-[#0B132B] via-[#0D1B3E] to-[#070D1F] p-6 text-slate-100 font-sans selection:bg-[#00E5FF] selection:text-[#0B132B]">
      
      {/* Top Spacer for Vertical Balance */}
      <div className="hidden sm:block h-6" />

      {/* CENTERED LOGIN CARD */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 p-8 space-y-6 text-[#0B132B] animate-fade-in transition-all">
        
        {/* Product Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center">
            {isLogoLoaded && productLogoSrc ? (
              <img
                src={productLogoSrc}
                alt={productName}
                onError={() => setIsLogoLoaded(false)}
                className="h-14 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-[#0B132B] text-[#00E5FF] flex items-center justify-center shadow-lg shadow-[#00E5FF]/20 border border-[#00E5FF]/30">
                <Building2 className="h-6 w-6" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0B132B]">{productName}</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">{productTagline}</p>
          </div>
        </div>

        {/* Inline Error Message Area */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold animate-fade-in"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0B132B]/70 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <User className="h-4 w-4" />
              </span>
              <input
                id="username"
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-sm bg-[#F4F5F7]/60 text-[#0B132B] placeholder:text-slate-400 font-semibold transition-all"
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field with Mask Toggle */}
          <div>
            <label htmlFor="password" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0B132B]/70 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-sm bg-[#F4F5F7]/60 text-[#0B132B] placeholder:text-slate-400 font-semibold transition-all"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0B132B] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-[#0B132B] hover:bg-[#162244] text-[#00E5FF] font-black py-3 rounded-xl transition-all shadow-md shadow-[#00E5FF]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5FF] disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 mt-2 border border-[#00E5FF]/30"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#00E5FF]" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      {/* DEVELOPER BRANDING FOOTER */}
      <footer className="py-4 text-center space-y-1">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <span>Developed by</span>
          <strong className="text-[#00E5FF] tracking-tight font-extrabold">{developerName}</strong>
        </p>
        <p className="text-[11px] text-slate-400/80 font-mono">
          {copyrightText}
        </p>
      </footer>

    </div>
  )
}
