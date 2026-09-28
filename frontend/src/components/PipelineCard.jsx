import { useEffect, useState } from 'react'
import { ArrowRight, ArrowDown, Check, ChevronDown, ChevronUp, Lock, ShieldCheck, Search, X, Languages } from 'lucide-react'
import sourcesData from '../data/sources.json'
import { StepIcon, MockTag } from './ui'
import { langName } from '../i18n'

// Stage timeline (ms spent in each stage before advancing):
// 0 understand · 1 check PII · 2 protect · 3 show redaction · 4 scan sources
// 5 sources matched · 6-8 retrieval checks appear · 9 complete
const DELAYS = [550, 650, 650, 700, 1200, 500, 400, 400, 400]
const DELAYS_PII = [550, 650, 650, 1800, 1200, 500, 400, 400, 400]
const FINAL = 9

const sourceName = (id) => sourcesData.find((s) => s.id === id)?.name ?? id

export default function PipelineCard({ result, t, lang, animate, latest, onDone, onProgress }) {
  const [stage, setStage] = useState(animate ? 0 : FINAL)
  const [openOverride, setOpenOverride] = useState(null)
  const open = openOverride ?? latest
  const { privacy, retrieval, detectedLang } = result
  const piiCount = privacy.entities.length

  useEffect(() => {
    onProgress?.()
    if (stage >= FINAL) {
      if (animate) onDone?.()
      return
    }
    const id = setTimeout(() => setStage((s) => s + 1), (piiCount ? DELAYS_PII : DELAYS)[stage])
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const stepStatus = (i) => {
    if (i < 3) return stage > i ? 'done' : stage === i ? 'active' : 'pending'
    return stage >= FINAL ? 'done' : stage >= 3 ? 'active' : 'pending'
  }
  const matchedNames = retrieval.sources.filter((s) => s.matched).map((s) => sourceName(s.id))

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
        <ShieldCheck size={16} className="text-emerald-600" />
        <span className="font-semibold text-navy-800">{t('pipe.title')}</span>
        <span>· {langName(detectedLang, lang)}</span>
        <span>· {t('pipe.protectedN', { n: piiCount })}</span>
        {matchedNames.length > 0 && <span>· {matchedNames.join(', ')}</span>}
        <button onClick={() => setOpenOverride(true)} className="ml-auto inline-flex items-center gap-1 font-medium text-navy-600 hover:underline">
          {t('pipe.details')} <ChevronDown size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="anim-in overflow-hidden rounded-sm border border-navy-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 bg-navy-50/70 px-4 py-2.5">
        <ShieldCheck size={18} className="text-navy-700" />
        <span className="font-semibold text-navy-900">{t('pipe.title')}</span>
        {stage >= 1 && (
          <span className="anim-in inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-navy-200">
            <Languages size={12} /> {t('pipe.lang')}: {langName(detectedLang, lang)}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <MockTag />
          {stage >= FINAL && (
            <button onClick={() => setOpenOverride(false)} className="inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:underline">
              {t('pipe.hide')} <ChevronUp size={13} />
            </button>
          )}
        </span>
      </div>

      <ol className="space-y-3 px-4 py-4">
        <Step status={stepStatus(0)} n={1} label={t('pipe.s1')} />
        <Step
          status={stepStatus(1)}
          n={2}
          label={t('pipe.s2')}
          note={stage >= 2 ? (piiCount ? t('pipe.found', { n: piiCount }) : t('pipe.none')) : null}
          warn={piiCount > 0}
        />
        <Step status={stepStatus(2)} n={3} label={t('pipe.s3')}>
          {stage >= 3 && <RedactionPanel privacy={privacy} t={t} />}
        </Step>
        <Step status={stepStatus(3)} n={4} label={t('pipe.s4') + (stage < FINAL && stage >= 3 ? '...' : '')}>
          {stage >= 4 && <Retrieval retrieval={retrieval} stage={stage} t={t} />}
        </Step>
      </ol>
    </div>
  )
}

function Step({ status, n, label, note, warn, children }) {
  return (
    <li className="flex gap-3">
      <StepIcon status={status} n={n} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className={`text-sm font-medium ${status === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>{label}</span>
          {note && (
            <span
              className={`anim-in rounded-full px-2 py-0.5 text-xs font-medium ${
                warn ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {note}
            </span>
          )}
        </div>
        {children}
      </div>
    </li>
  )
}

function RedactionPanel({ privacy, t }) {
  if (!privacy.entities.length) {
    return (
      <div className="anim-in mt-2 flex items-center gap-2 rounded-sm bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <ShieldCheck size={16} /> {t('pipe.noPii')}
      </div>
    )
  }
  return (
    <div className="anim-in mt-3">
      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-sm border border-red-200 bg-red-50/50 p-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-700">{t('pipe.original')}</div>
          <p className="text-sm leading-relaxed text-slate-800">
            {privacy.segments.map((s, i) =>
              s.type ? (
                <mark key={i} className="rounded bg-red-200/70 px-0.5 text-red-900">{s.text}</mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </p>
        </div>
        <div className="flex items-center justify-center gap-1 text-navy-600">
          <Lock size={16} />
          <ArrowRight size={18} className="hidden md:block" />
          <ArrowDown size={18} className="md:hidden" />
        </div>
        <div className="rounded-sm border border-emerald-300 bg-emerald-50/60 p-3 ring-2 ring-emerald-100">
          <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            <ShieldCheck size={12} /> {t('pipe.protected')}
          </div>
          <p className="text-sm leading-relaxed text-slate-800">
            {privacy.segments.map((s, i) =>
              s.type ? (
                <span key={i} className="mx-0.5 rounded bg-navy-700 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                  [{s.type}]
                </span>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </p>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-navy-800">
        <Lock size={14} /> {t('pipe.aiReceives')}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">{t('pipe.mock')}</p>
    </div>
  )
}

function Retrieval({ retrieval, stage, t }) {
  const scanning = stage === 4
  return (
    <div className="anim-in mt-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Search size={13} /> {t('ret.searching')}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {retrieval.sources.map(({ id, matched }) => {
          const src = sourcesData.find((s) => s.id === id)
          const hit = !scanning && matched
          const miss = !scanning && !matched
          return (
            <div
              key={id}
              className={`relative rounded-sm border px-2.5 py-2 transition-all duration-300 ${
                scanning
                  ? 'scanning border-navy-200 bg-white'
                  : hit
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold text-navy-900">{src.name}</span>
                {hit && <Check size={14} className="shrink-0 text-emerald-600" strokeWidth={3} />}
              </div>
              <div className="truncate text-[10px] text-slate-500">{src.url}</div>
              {!scanning && (
                <div className={`mt-0.5 text-[10px] font-medium ${hit ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {hit ? t('ret.match') : miss ? t('ret.noMatch') : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <ul className="mt-3 space-y-1.5">
        {retrieval.checks.map((c, i) =>
          stage >= 6 + i ? (
            <li key={c.key} className="anim-in flex items-start gap-2 text-sm">
              {c.ok ? (
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
              ) : (
                <X size={16} className="mt-0.5 shrink-0 text-amber-600" strokeWidth={3} />
              )}
              <span className={c.ok ? 'text-slate-800' : 'font-medium text-amber-800'}>
                {t(c.key)}
                {(c.detail || c.sources) && (
                  <span className="text-slate-500"> — {c.detail ?? c.sources.map(sourceName).join(', ')}</span>
                )}
              </span>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  )
}
