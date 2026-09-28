import { ExternalLink, FileSearch, Landmark, Lock, MessageSquareText, Mic, Play, Scale, ShieldCheck, Sparkles, Trash2, Workflow } from 'lucide-react'
import { Panel, SectionHeading } from '../components/ui'
import sources from '../data/sources.json'

export default function Home({ t, go, startDemo }) {
  const services = [
    { id: 'ask', icon: MessageSquareText, title: t('home.ask.t'), desc: t('home.ask.d'), bar: 'border-navy-600', ico: 'bg-navy-700' },
    { id: 'documents', icon: FileSearch, title: t('home.doc.t'), desc: t('home.doc.d'), bar: 'border-saffron', ico: 'bg-[#d9731a]' },
    { id: 'schemes', icon: Landmark, title: t('home.scheme.t'), desc: t('home.scheme.d'), bar: 'border-indgreen', ico: 'bg-indgreen' },
    { id: 'grievance', icon: Scale, title: t('home.grievance'), desc: t('home.grvD'), bar: 'border-maroon', ico: 'bg-maroon' },
    { id: 'architecture', icon: Workflow, title: t('home.arch'), desc: t('home.archD'), bar: 'border-slate-500', ico: 'bg-slate-600' },
  ]
  const flow = [
    { icon: Mic, label: t('flow.1') },
    { icon: ShieldCheck, label: t('flow.2') },
    { icon: Landmark, label: t('flow.3') },
    { icon: Sparkles, label: t('flow.4') },
    { icon: Trash2, label: t('flow.5') },
  ]

  return (
    <>
      {/* Banner */}
      <section className="banner bg-navy-800 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-saffron">{t('home.welcome')}</p>
            <h1 className="mt-2 text-2xl font-bold leading-snug md:text-3xl">{t('home.tagline')}</h1>
            <p className="mt-3 text-navy-100">{t('home.subtitle')}</p>
            <button
              onClick={startDemo}
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-saffron px-6 py-3 font-bold text-navy-900 shadow hover:bg-[#ffa94d]"
            >
              <Play size={18} fill="currentColor" /> {t('home.start')}
            </button>
            <p className="mt-5 flex items-start gap-2 text-sm text-navy-100">
              <Lock size={15} className="mt-0.5 shrink-0 text-saffron" /> {t('home.privacy')}
            </p>
          </div>

          <div className="rounded-sm bg-white text-slate-800 shadow-lg">
            <div className="border-b-2 border-saffron bg-slate-100 px-4 py-2 text-sm font-bold text-navy-900">{t('home.flow')}</div>
            <ol className="divide-y divide-slate-100">
              {flow.map(({ icon: Icon, label }, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">{i + 1}</span>
                  <Icon size={16} className="text-navy-600" />
                  <span className="font-medium">{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Services */}
        <SectionHeading>{t('home.services')}</SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {services.map(({ id, icon: Icon, title, desc, bar, ico }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`group flex flex-col items-center border border-b-4 border-slate-300 bg-white px-3 py-5 text-center transition hover:bg-slate-50 ${bar}`}
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-full text-white ${ico}`}>
                <Icon size={26} />
              </span>
              <span className="mt-3 font-bold text-navy-900 group-hover:underline">{title}</span>
              <span className="mt-1 line-clamp-2 text-xs text-slate-600">{desc}</span>
            </button>
          ))}
        </div>

        {/* Info panels */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Panel title={t('home.whatsNew')}>
            <ul className="divide-y divide-slate-100 text-sm">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-start gap-2 px-4 py-2.5">
                  {n <= 2 && <span className="blink mt-0.5 shrink-0 rounded-sm bg-red-600 px-1 text-[10px] font-bold text-white">NEW</span>}
                  <span>{t(`ticker.${n}`)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t('foot.links')}>
            <ul className="divide-y divide-slate-100 text-sm">
              {sources.map((s) => (
                <li key={s.id}>
                  <a href={`https://${s.url}`} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-2.5 text-navy-700 hover:bg-slate-50 hover:underline">
                    <span>
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-xs text-slate-500">{s.org}</span>
                    </span>
                    <ExternalLink size={13} className="shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t('home.safety')}>
            <ul className="space-y-3 px-4 py-3 text-sm">
              {[
                { icon: Trash2, k: 'home.safety.1' },
                { icon: ShieldCheck, k: 'home.safety.2' },
                { icon: Landmark, k: 'home.safety.3' },
              ].map(({ icon: Icon, k }) => (
                <li key={k} className="flex items-start gap-2.5">
                  <Icon size={16} className="mt-0.5 shrink-0 text-indgreen" />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  )
}
