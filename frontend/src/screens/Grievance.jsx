import { useState } from 'react'
import { ExternalLink, Info, Scale } from 'lucide-react'
import { PageTitle, Card, DemoBadge } from '../components/ui'
import data from '../data/grievances.json'
import { pick } from '../i18n'

export default function Grievance({ t, lang, initial }) {
  const [typeId, setTypeId] = useState(initial)
  const [portalNote, setPortalNote] = useState(false)
  const type = data.types.find((g) => g.id === typeId)

  const steps = type && [
    { title: t('grv.s1'), body: <p>{pick(type.authority, lang)}</p> },
    {
      title: t('grv.s2'),
      body: (
        <ul className="space-y-1">
          {pick(type.documents, lang).map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white" aria-hidden="true" />
              {d}
            </li>
          ))}
        </ul>
      ),
    },
    { title: t('grv.s3'), body: <p>{pick(type.channel, lang)}</p> },
    { title: t('grv.s4'), body: <p>{pick(data.tracking, lang)}</p> },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle t={t} icon={Scale} title={t('grv.title')} subtitle={t('grv.subtitle')} />

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">{t('grv.type')}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.types.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setTypeId(g.id)
              setPortalNote(false)
            }}
            className={`flex items-center gap-3 rounded-sm border bg-white px-4 py-3.5 text-left font-semibold text-navy-900 shadow-sm transition ${
              g.id === typeId ? 'border-navy-500 ring-2 ring-navy-100' : 'border-slate-200 hover:border-navy-300'
            }`}
          >
            <span className="text-2xl" aria-hidden="true">{g.emoji}</span>
            {pick(g.label, lang)}
          </button>
        ))}
      </div>

      {!type && <p className="mt-8 text-center text-slate-500">{t('grv.pick')}</p>}

      {type && (
        <Card key={typeId} className="anim-in mt-6 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-navy-900">
              {type.emoji} {pick(type.label, lang)}
            </h3>
            <DemoBadge>{t('ans.demo')}</DemoBadge>
          </div>

          <ol className="relative">
            {steps.map((s, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-navy-200" aria-hidden="true" />}
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('grv.step')} {i + 1}</div>
                  <div className="font-semibold text-navy-900">{s.title}</div>
                  <div className="mt-1.5 text-sm text-slate-700">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <button
              onClick={() => setPortalNote(true)}
              className="inline-flex items-center gap-2 rounded-sm bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800"
            >
              <ExternalLink size={17} /> {t('grv.portal')}
            </button>
            {portalNote && (
              <div className="anim-in mt-3 flex items-start gap-2 rounded-sm border border-navy-200 bg-navy-50 p-3 text-sm text-navy-900">
                <Info size={16} className="mt-0.5 shrink-0" /> {t('grv.portalNote')}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
