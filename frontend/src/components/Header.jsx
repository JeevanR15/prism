import { useState } from 'react'
import { Trash2, Globe, Home as HomeIcon, Megaphone } from 'lucide-react'
import { Logo } from './ui'
import { LANGS } from '../i18n'

const NAV = ['home', 'ask', 'documents', 'schemes', 'grievance', 'architecture']
const FONT_SIZES = { 'A-': '14px', A: '16px', 'A+': '18px' }

// Second line of the bilingual masthead (gov sites pair Hindi/regional with English).
const MASTHEAD = {
  en: 'प्रिज़्म — जन अधिकार सूचना एवं सहायता मॉड्यूल',
  hi: 'प्रिज़्म — जन अधिकार सूचना एवं सहायता मॉड्यूल',
  te: 'ప్రిజమ్ — ప్రజా హక్కుల సమాచార & సహాయ మాడ్యూల్',
}

export function LanguageSelect({ lang, setLang, t, className = '', dark = false }) {
  return (
    <label className={`inline-flex items-center gap-1.5 ${className}`}>
      <Globe size={14} className={dark ? 'text-slate-300' : 'text-navy-600'} />
      <span className="sr-only">{t('hdr.language')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className={`cursor-pointer rounded-sm border px-1.5 py-0.5 text-sm outline-none ${
          dark ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-300 bg-white font-medium text-navy-800'
        }`}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.code === 'en' ? 'English' : `${l.native} (${l.label})`}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Header({ t, lang, setLang, screen, go, onClear }) {
  const [size, setSize] = useState('A')
  const setFont = (k) => {
    setSize(k)
    document.documentElement.style.fontSize = FONT_SIZES[k]
  }

  return (
    <header>
      {/* Utility strip */}
      <div className="bg-[#1b1b1b] text-[12px] text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5">
          <span>
            <b className="text-white">{t('util.proto')}</b>
            <span className="hidden sm:inline"> &nbsp;|&nbsp; {t('util.notOfficial')}</span>
          </span>
          <div className="flex items-center gap-3">
            <a href="#main" className="hidden hover:text-white hover:underline md:inline">{t('util.skip')}</a>
            <span className="hidden text-slate-600 md:inline">|</span>
            <div className="flex items-center gap-0.5" aria-label="Text size">
              {Object.keys(FONT_SIZES).map((k) => (
                <button
                  key={k}
                  onClick={() => setFont(k)}
                  className={`min-w-6 rounded-sm px-1 font-semibold ${size === k ? 'bg-white text-black' : 'hover:bg-slate-700'}`}
                >
                  {k}
                </button>
              ))}
            </div>
            <span className="text-slate-600">|</span>
            <LanguageSelect lang={lang} setLang={setLang} t={t} dark />
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="border-b-4 border-saffron bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button onClick={() => go('home')} className="flex items-center gap-3 text-left">
            <Logo size={52} />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-slate-700">{MASTHEAD[lang]}</div>
              <div className="text-xl font-bold text-navy-900 sm:text-2xl">PRISM</div>
              <div className="text-xs font-medium text-slate-600 sm:text-sm">Public Rights Information &amp; Support Module</div>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden border-l border-slate-300 pl-4 text-right leading-tight lg:block">
              <div className="text-xs font-bold tracking-wide text-slate-700">SMART INDIA HACKATHON 2026</div>
              <div className="text-[11px] text-slate-500">Problem Statement SIH26088</div>
              <div className="mt-1 flex h-1 w-full">
                <span className="flex-1 bg-saffron" /><span className="flex-1 bg-slate-200" /><span className="flex-1 bg-indgreen" />
              </div>
            </div>
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-red-700 bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">{t('hdr.clear')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main menu */}
      <nav className="sticky top-0 z-30 bg-navy-800 shadow">
        <div className="no-scrollbar overflow-x-auto">
          <div className="mx-auto flex w-max border-l border-navy-700">
          {NAV.map((id) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-r border-navy-700 px-4 py-3 text-sm font-semibold transition ${
                screen === id ? 'bg-saffron text-navy-900' : 'text-white hover:bg-navy-900'
              }`}
            >
              {id === 'home' && <HomeIcon size={15} />}
              {t(`nav.${id}`)}
            </button>
          ))}
          </div>
        </div>
      </nav>

      {/* News ticker */}
      <div className="border-b border-slate-300 bg-[#fff8e7]">
        <div className="mx-auto flex max-w-6xl items-stretch text-sm">
          <span className="flex shrink-0 items-center gap-1.5 bg-maroon px-3 py-1.5 font-semibold text-white">
            <Megaphone size={14} /> {t('ticker.label')}
          </span>
          <div className="ticker relative flex-1 overflow-hidden py-1.5">
            <div className="ticker-track whitespace-nowrap text-slate-800">
              {[1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => (
                <span key={i} className="mx-8">
                  <span className="mr-2 text-maroon">◆</span>
                  {t(`ticker.${n}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
