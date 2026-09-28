import { ExternalLink, Info } from 'lucide-react'
import sources from '../data/sources.json'

const QUICK = ['home', 'ask', 'documents', 'schemes', 'grievance', 'architecture']
const POLICIES = ['foot.policy', 'foot.privacy', 'foot.access', 'foot.help', 'foot.feedback', 'foot.sitemap']

export default function Footer({ t, go }) {
  return (
    <footer className="mt-12">
      <div className="bg-[#1f2a3c] text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 border-b border-slate-600 pb-2 font-semibold text-white">{t('foot.about')}</h3>
            <p className="leading-relaxed text-slate-400">{t('home.subtitle')}</p>
          </div>
          <div>
            <h3 className="mb-3 border-b border-slate-600 pb-2 font-semibold text-white">{t('foot.quick')}</h3>
            <ul className="space-y-1.5">
              {QUICK.map((id) => (
                <li key={id}>
                  <button onClick={() => go(id)} className="hover:text-white hover:underline">› {t(`nav.${id}`)}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 border-b border-slate-600 pb-2 font-semibold text-white">{t('foot.links')}</h3>
            <ul className="space-y-1.5">
              {sources.map((s) => (
                <li key={s.id}>
                  <a href={`https://${s.url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white hover:underline">
                    › {s.name} <ExternalLink size={11} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 border-b border-slate-600 pb-2 font-semibold text-white">{t('foot.policies')}</h3>
            <ul className="space-y-1.5 text-slate-400">
              {POLICIES.map((k) => (
                <li key={k}>› {t(k)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#151d2b] text-xs text-slate-400">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-4">
          <p className="flex items-start gap-2 text-slate-300">
            <Info size={14} className="mt-0.5 shrink-0 text-saffron" />
            <span>{t('footer')}</span>
          </p>
          <div className="flex flex-col gap-1 border-t border-slate-700 pt-2 sm:flex-row sm:justify-between">
            <span>{t('foot.owner')}</span>
            <span>{t('foot.updated')}: 24-09-2026 &nbsp;|&nbsp; {t('foot.best')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
