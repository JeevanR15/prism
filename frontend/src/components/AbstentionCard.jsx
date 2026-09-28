import { Ban, Check, FileX, Search, ShieldAlert, Upload, UserRound, X } from 'lucide-react'
import { DemoBadge } from './ui'

export default function AbstentionCard({ t, go }) {
  const rows = [
    { icon: Search, label: t('abs.kb'), status: t('abs.done'), tone: 'ok' },
    { icon: FileX, label: t('abs.byelaws'), status: t('abs.notAvail'), tone: 'warn' },
    { icon: Ban, label: t('abs.guess'), status: t('abs.never'), tone: 'block' },
  ]
  const tone = {
    ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warn: 'bg-amber-50 text-amber-800 ring-amber-300',
    block: 'bg-red-50 text-red-700 ring-red-200',
  }
  const toneIcon = { ok: Check, warn: X, block: Ban }

  return (
    <div className="anim-in overflow-hidden rounded-sm border-2 border-amber-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-100/70 px-5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-900">
          <ShieldAlert size={15} /> {t('abs.badge')}
        </span>
        <DemoBadge>{t('ans.demo')}</DemoBadge>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-amber-100 text-amber-700 ring-4 ring-amber-50">
          <ShieldAlert size={34} />
        </div>

        <div>
          <h3 className="text-xl font-bold leading-snug text-slate-900">“{t('abs.title')}”</h3>
          <p className="mt-2 font-medium text-navy-800">{t('abs.body')}</p>

          <div className="mt-5 rounded-sm border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('abs.verify')}
            </div>
            <ul className="divide-y divide-slate-100">
              {rows.map(({ icon: Icon, label, status, tone: tn }) => {
                const TI = toneIcon[tn]
                return (
                  <li key={label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Icon size={16} className="shrink-0 text-slate-500" />
                    <span className="flex-1 text-slate-800">{label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tone[tn]}`}>
                      <TI size={12} strokeWidth={3} /> {status}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-5 rounded-sm bg-navy-50 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-navy-700">{t('abs.action')}</div>
            <p className="mt-1 font-medium text-navy-900">{t('abs.actionText')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => go('documents')}
                className="inline-flex items-center gap-1.5 rounded-sm bg-navy-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-800"
              >
                <Upload size={15} /> {t('abs.upload')}
              </button>
              <button
                onClick={() => go('grievance', 'cooperative')}
                className="inline-flex items-center gap-1.5 rounded-sm border border-navy-200 bg-white px-3.5 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                <UserRound size={15} /> {t('abs.authority')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
