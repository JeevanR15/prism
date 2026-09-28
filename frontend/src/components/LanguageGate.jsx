import { Globe } from 'lucide-react'
import { Logo } from './ui'
import { LANGS } from '../i18n'

// Shown at the start of every session so the user picks their language first.
const TITLE = { hi: 'अपनी भाषा चुनें', en: 'Choose your language', te: 'మీ భాషను ఎంచుకోండి' }
const NOTE = {
  hi: 'आप इसे कभी भी ऊपर दिए गए विकल्प से बदल सकते हैं।',
  en: 'You can change this anytime from the top bar.',
  te: 'మీరు దీన్ని ఎప్పుడైనా పై బార్ నుండి మార్చవచ్చు.',
}

export default function LanguageGate({ onChoose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="lang-gate-title">
      <div className="anim-in w-full max-w-lg overflow-hidden rounded-sm bg-white shadow-2xl">
        <div className="flex h-1.5">
          <span className="flex-1 bg-saffron" /><span className="flex-1 bg-white" /><span className="flex-1 bg-indgreen" />
        </div>

        <div className="flex items-center gap-3 border-b-2 border-saffron bg-navy-800 px-6 py-4 text-white">
          <Logo size={44} />
          <div className="leading-tight">
            <div className="text-xs text-navy-100">प्रिज़्म — जन अधिकार सूचना एवं सहायता मॉड्यूल</div>
            <div className="text-xl font-bold">PRISM</div>
            <div className="text-xs text-navy-100">Public Rights Information &amp; Support Module</div>
          </div>
        </div>

        <div className="px-6 py-6">
          <h2 id="lang-gate-title" className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <Globe size={20} className="text-navy-600" />
            {LANGS.map((l) => TITLE[l.code]).join(' / ')}
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {LANGS.map((l, i) => (
              <button
                key={l.code}
                onClick={() => onChoose(l.code)}
                autoFocus={i === 0}
                className="flex flex-col items-center rounded-sm border-2 border-slate-300 bg-white px-3 py-5 transition hover:border-navy-600 hover:bg-navy-50 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-saffron"
              >
                <span className="text-2xl font-bold text-navy-900">{l.native}</span>
                <span className="mt-1 h-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {l.label !== l.native && l.label}
                </span>
              </button>
            ))}
          </div>

          <ul className="mt-5 space-y-0.5 text-xs text-slate-500">
            {LANGS.map((l) => (
              <li key={l.code}>{NOTE[l.code]}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
