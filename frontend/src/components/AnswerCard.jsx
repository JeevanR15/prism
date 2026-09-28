import { ArrowRight, FileText, Gauge, Landmark } from 'lucide-react'
import { Logo, DemoBadge, Card } from './ui'
import ReadAloud from './ReadAloud'
import { pick } from '../i18n'

const CONF_STYLE = {
  high: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function AnswerCard({ intent, t, lang, go }) {
  return (
    <Card className="anim-in overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-saffron bg-navy-800 px-5 py-2">
        <span className="flex items-center gap-2 font-semibold text-white">
          <Logo size={22} /> PRISM
        </span>
        <DemoBadge>{t('ans.demo')}</DemoBadge>
      </div>

      <div className="p-5">
        <p className="text-[17px] leading-relaxed text-slate-800">{pick(intent.response, lang)}</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <Meta icon={Landmark} label={t('ans.source')} value={pick(intent.source, lang)} />
          <Meta icon={FileText} label={t('ans.document')} value={pick(intent.document, lang)} />
          <Meta
            icon={Gauge}
            label={t('ans.confidence')}
            value={
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ${CONF_STYLE[intent.confidence]}`}>
                {t(`conf.${intent.confidence}`)}
              </span>
            }
          />
        </dl>

        <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">{t('ans.next')}</h3>
        <ol className="mt-2 space-y-2">
          {pick(intent.next_steps, lang).map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 text-slate-800">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-2">
          <ReadAloud t={t} />
          {intent.action && (
            <button
              onClick={() => go(intent.action.screen, intent.action.param)}
              className="inline-flex items-center gap-1.5 rounded-sm bg-navy-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-navy-800"
            >
              {t(intent.action.label)} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <Icon size={13} /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
