import { useState } from 'react'
import { CalendarDays, ClipboardList, ExternalLink, Landmark, ShieldCheck, UserCheck } from 'lucide-react'
import { PageTitle, Card, DemoBadge } from '../components/ui'
import ReadAloud from '../components/ReadAloud'
import data from '../data/schemes.json'
import { pick } from '../i18n'

export default function Schemes({ t, lang, initial }) {
  const [cat, setCat] = useState(initial)
  const category = data.categories.find((c) => c.id === cat)
  const scheme = category && data.schemes[category.scheme]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageTitle t={t} icon={Landmark} title={t('sch.title')} />

      <h2 className="mb-4 text-xl font-semibold text-navy-900">{t('sch.question')}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`flex flex-col items-center rounded-sm border bg-white px-3 py-5 text-center shadow-sm transition ${
              c.id === cat ? 'border-navy-500 ring-2 ring-navy-100' : 'border-slate-200 hover:border-navy-300'
            }`}
          >
            <span className="text-4xl" aria-hidden="true">{c.emoji}</span>
            <span className="mt-2 font-semibold text-navy-900">{pick(c.label, lang)}</span>
          </button>
        ))}
      </div>

      {!scheme && <p className="mt-8 text-center text-slate-500">{t('sch.pick')}</p>}

      {scheme && (
        <Card key={cat} className="anim-in mt-6 overflow-hidden">
          <div className="border-b border-slate-100 bg-navy-50/60 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-navy-900">{pick(scheme.name, lang)}</h3>
                <p className="mt-1 text-slate-700">
                  <span className="font-semibold">{t('sch.purpose')}:</span> {pick(scheme.purpose, lang)}
                </p>
              </div>
              <DemoBadge>{t('ans.demo')}</DemoBadge>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <ListBlock icon={UserCheck} title={t('sch.eligibility')} items={pick(scheme.eligibility, lang)} />
            <ListBlock icon={ShieldCheck} title={t('sch.coverage')} items={pick(scheme.coverage, lang)} />
            <ListBlock icon={ClipboardList} title={t('sch.apply')} items={pick(scheme.apply, lang)} ordered />
            <div className="space-y-4">
              <Block icon={CalendarDays} title={t('sch.dates')}>
                <p className="text-sm text-slate-700">{pick(scheme.dates, lang)}</p>
              </Block>
              <Block icon={ExternalLink} title={t('sch.source')}>
                <p className="text-sm font-medium text-navy-800">
                  {scheme.source.name} — <span className="font-mono text-xs">{scheme.source.url}</span>
                </p>
              </Block>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <p className="text-xs text-amber-800">⚠ {t('sch.sample')}</p>
            <ReadAloud t={t} />
          </div>
        </Card>
      )}
    </div>
  )
}

function Block({ icon: Icon, title, children }) {
  return (
    <div className="rounded-sm border border-slate-200 p-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900">
        <Icon size={16} className="text-navy-600" /> {title}
      </h4>
      {children}
    </div>
  )
}

function ListBlock({ icon, title, items, ordered }) {
  return (
    <Block icon={icon} title={title}>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            {ordered ? (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold text-navy-800">{i + 1}</span>
            ) : (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indgreen" />
            )}
            {it}
          </li>
        ))}
      </ul>
    </Block>
  )
}
