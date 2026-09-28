import { Check, Loader2, X } from 'lucide-react'

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0b3a82" />
      <path d="M32 12 L50 46 H14 Z" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <path d="M6 34 L26 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 30 L58 22" stroke="#ff9933" strokeWidth="3" strokeLinecap="round" />
      <path d="M41 33 L58 33" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 36 L58 44" stroke="#46b04a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function DemoBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800">
      {children}
    </span>
  )
}

export function MockTag({ children = 'MOCK' }) {
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-500">
      {children}
    </span>
  )
}

// status: 'pending' | 'active' | 'done' | 'fail'
export function StepIcon({ status, n }) {
  if (status === 'done')
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Check size={14} strokeWidth={3} />
      </span>
    )
  if (status === 'fail')
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
        <X size={14} strokeWidth={3} />
      </span>
    )
  if (status === 'active')
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600 ring-2 ring-navy-200">
        <Loader2 size={14} className="animate-spin" />
      </span>
    )
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-400">
      {n}
    </span>
  )
}

export function PageTitle({ icon: Icon, title, subtitle, right, t }) {
  return (
    <div className="mb-6">
      {t && (
        <nav className="mb-4 text-xs text-slate-500" aria-label="Breadcrumb">
          <span>{t('nav.home')}</span>
          <span className="mx-1.5">›</span>
          <span className="font-semibold text-navy-800">{title}</span>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-300 pb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-navy-700 text-white">
              <Icon size={20} />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="-mt-0.5 h-0.5 w-24 bg-saffron" />
    </div>
  )
}

export function SectionHeading({ children }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-navy-900">{children}</h2>
      <div className="mt-1.5 h-[3px] w-16 bg-saffron" />
    </div>
  )
}

// Boxy panel with a coloured title bar, as on most GIGW-style portals.
export function Panel({ title, children, className = '' }) {
  return (
    <div className={`border border-slate-300 bg-white ${className}`}>
      <div className="border-b-2 border-saffron bg-navy-800 px-4 py-2 text-sm font-bold text-white">{title}</div>
      {children}
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`rounded-sm border border-slate-300 bg-white ${className}`}>{children}</div>
}
