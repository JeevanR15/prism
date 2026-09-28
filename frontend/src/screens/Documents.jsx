import { useEffect, useRef, useState } from 'react'
import { FileText, FileSearch, Info, Lock, Sparkles, Upload } from 'lucide-react'
import { PageTitle, Card, DemoBadge, StepIcon } from '../components/ui'
import ReadAloud from '../components/ReadAloud'
import documents from '../data/documents.json'
import { pick, langName } from '../i18n'

const STEP_MS = 550

export default function Documents({ t, lang, session, setSession }) {
  const [step, setStep] = useState(-1) // -1 idle, 0..3 processing, 4 finished
  const [uploadName, setUploadName] = useState(null)
  const timer = useRef(null)
  const doc = documents.find((d) => d.id === session.docId)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (step < 0 || step >= 4) return
    timer.current = setTimeout(() => {
      if (step === 3) setSession((s) => ({ ...s, docExplained: true }))
      setStep(step + 1)
    }, STEP_MS)
    return () => clearTimeout(timer.current)
  }, [step, setSession])

  const select = (id) => {
    clearTimeout(timer.current)
    setStep(-1)
    setUploadName(null)
    setSession((s) => ({ ...s, docId: id, docExplained: false }))
  }

  const processing = step >= 0 && step < 4

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle t={t} icon={FileSearch} title={t('doc.title')} subtitle={t('doc.subtitle')} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Picker */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('doc.samples')}</div>
            <div className="space-y-2">
              {documents.map((d) => (
                <button
                  key={d.id}
                  onClick={() => select(d.id)}
                  className={`flex w-full items-center gap-3 rounded-sm border px-3 py-3 text-left transition ${
                    d.id === session.docId ? 'border-navy-500 bg-navy-50 ring-2 ring-navy-100' : 'border-slate-200 hover:border-navy-300'
                  }`}
                >
                  <span className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
                    PDF
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-900">{d.file}</span>
                    <span className="block text-xs text-slate-500">
                      {d.pages} p · {d.size} · {langName(d.language, lang)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <label className="flex cursor-pointer flex-col items-center rounded-sm border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition hover:border-navy-400 hover:bg-navy-50/40">
            <Upload size={22} className="text-navy-600" />
            <span className="mt-2 text-sm font-semibold text-navy-800">{t('doc.upload')}</span>
            <span className="text-xs text-slate-500">{t('doc.uploadHint')}</span>
            <input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => {
                setUploadName(e.target.files?.[0]?.name ?? null)
                e.target.value = ''
              }}
            />
          </label>
          {uploadName && (
            <div className="anim-in flex gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>
                <b className="break-all">{uploadName}</b> — {t('doc.uploadNote')}
              </span>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="min-w-0 space-y-5">
          {!doc ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-sm border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              <FileText size={36} className="text-slate-300" />
              <p className="mt-3">{t('doc.empty')}</p>
            </div>
          ) : (
            <>
              <Card className="p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Meta label={t('doc.document')} value={doc.file} />
                  <Meta label={t('doc.lang')} value={langName(doc.language, lang)} />
                  <Meta label={t('doc.topic')} value={pick(doc.topic, lang)} />
                </div>

                <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('doc.preview')}</div>
                <div className="mt-2 rounded-sm border border-slate-200 bg-[#fdfdfb] px-5 py-4 text-sm leading-relaxed text-slate-700 shadow-inner">
                  {doc.preview.map((line, i) => (
                    <p key={i} className={i === 0 ? 'mb-2 text-[11px] font-bold tracking-wider text-red-600' : i <= 2 ? 'font-semibold text-slate-900' : 'mt-1'}>
                      {highlight(line, doc.pii)}
                    </p>
                  ))}
                </div>

                {!session.docExplained && !processing && (
                  <button
                    onClick={() => setStep(0)}
                    className="mt-5 inline-flex items-center gap-2 rounded-sm bg-navy-700 px-5 py-3 font-semibold text-white shadow hover:bg-navy-800"
                  >
                    <Sparkles size={18} /> {t('doc.explain')}
                  </button>
                )}

                {processing && (
                  <ol className="mt-5 space-y-2.5">
                    {['doc.p1', 'doc.p2', 'doc.p3', 'doc.p4'].map((k, i) => (
                      <li key={k} className="flex items-center gap-3 text-sm">
                        <StepIcon status={step > i ? 'done' : step === i ? 'active' : 'pending'} n={i + 1} />
                        <span className={step >= i ? 'text-slate-800' : 'text-slate-400'}>{t(k)}</span>
                        {k === 'doc.p2' && step > i && doc.pii.length > 0 && (
                          <span className="anim-in rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            {t('doc.protectedN', { n: doc.pii.length })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              {session.docExplained && <Explanation doc={doc} t={t} lang={lang} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Explanation({ doc, t, lang }) {
  const ex = doc.explanation
  return (
    <Card className="anim-in overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-saffron bg-navy-800 px-5 py-2">
        <span className="font-semibold text-white">{t('doc.plain')}</span>
        <DemoBadge>{t('ans.demo')}</DemoBadge>
      </div>
      <div className="space-y-5 p-5">
        <p className="text-[17px] leading-relaxed text-slate-800">{pick(ex.summary, lang)}</p>

        <Section title={t('doc.meaning')}>
          <p className="rounded-sm bg-navy-50 px-4 py-3 text-navy-900">{pick(ex.meaning, lang)}</p>
        </Section>

        <Section title={t('doc.points')}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {pick(ex.points, lang).map((p, i) => (
              <li key={i} className="flex items-start gap-2 rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-800">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                {p}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('doc.next')}>
          <ol className="space-y-2">
            {pick(ex.next, lang).map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">{i + 1}</span>
                <span className="pt-0.5 text-slate-800">{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t('doc.source')}>
          <p className="text-sm text-slate-700">{pick(doc.source, lang)}</p>
          {doc.pii.length > 0 && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-emerald-700">
              <Lock size={12} /> {t('doc.protectedN', { n: doc.pii.length })}
            </p>
          )}
        </Section>

        <ReadAloud t={t} />
      </div>
    </Card>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold text-navy-900">{value}</div>
    </div>
  )
}

// Highlight a sample document's known personal details in the preview.
function highlight(line, pii) {
  const hit = pii.find((p) => line.includes(p.value))
  if (!hit) return line
  const [before, after] = line.split(hit.value)
  return (
    <>
      {highlight(before, pii)}
      <mark className="rounded bg-red-100 px-0.5 text-red-800" title={`[${hit.type}]`}>{hit.value}</mark>
      {highlight(after, pii)}
    </>
  )
}
