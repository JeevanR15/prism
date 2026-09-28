import { useEffect, useState } from 'react'
import { Check, FileText, MessageSquare, ShieldCheck, Trash2, Loader2 } from 'lucide-react'

export default function ClearSessionModal({ open, t, summary, onConfirm, onCancel, onFinish }) {
  const [phase, setPhase] = useState('confirm') // confirm | clearing | done
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (open) {
      setPhase('confirm')
      setStep(0)
    }
  }, [open])

  useEffect(() => {
    if (phase !== 'clearing') return
    if (step >= 3) {
      const id = setTimeout(() => setPhase('done'), 400)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setStep((s) => s + 1), 600)
    return () => clearTimeout(id)
  }, [phase, step])

  if (!open) return null

  const items = [
    { icon: MessageSquare, label: t('clr.history'), detail: summary.messages, result: t('clr.cleared') },
    { icon: FileText, label: t('clr.doc'), detail: summary.doc, result: t('clr.removed') },
    { icon: ShieldCheck, label: t('clr.input'), detail: summary.protected, result: t('clr.cleared') },
  ]

  const confirm = () => {
    onConfirm()
    setPhase('clearing')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div className="anim-in w-full max-w-md overflow-hidden rounded-sm bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-red-50 text-red-600">
              <Trash2 size={22} />
            </span>
            <h2 className="text-lg font-bold text-navy-900">{phase === 'done' ? t('clr.done') : t('clr.title')}</h2>
          </div>

          {phase === 'confirm' && <p className="mt-3 text-slate-600">{t('clr.body')}</p>}

          <ul className="mt-5 space-y-2.5">
            {items.map(({ icon: Icon, label, detail, result }, i) => {
              const done = phase === 'done' || (phase === 'clearing' && step > i)
              const active = phase === 'clearing' && step === i
              return (
                <li key={label} className={`flex items-center gap-3 rounded-sm border px-3.5 py-2.5 transition ${done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200'}`}>
                  <Icon size={18} className="shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">{label}</div>
                    <div className="truncate text-xs text-slate-500">{done ? result : detail}</div>
                  </div>
                  {done && (
                    <span className="anim-in flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                  {active && <Loader2 size={18} className="animate-spin text-navy-600" />}
                </li>
              )
            })}
          </ul>

          {phase === 'done' && <p className="anim-in mt-4 text-xs text-slate-500">{t('clr.mock')}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
          {phase === 'confirm' && (
            <>
              <button onClick={onCancel} className="rounded-sm px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                {t('clr.cancel')}
              </button>
              <button onClick={confirm} className="rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                {t('clr.confirm')}
              </button>
            </>
          )}
          {phase === 'done' && (
            <button onClick={onFinish} className="rounded-sm bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              {t('clr.home')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
