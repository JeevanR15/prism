import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Languages, Lock, MessageSquareText, Mic, Send, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { PageTitle } from '../components/ui'
import PipelineCard from '../components/PipelineCard'
import AnswerCard from '../components/AnswerCard'
import AbstentionCard from '../components/AbstentionCard'
import { processQuery } from '../services/prism'
import { LANGS, langName } from '../i18n'

export default function Ask({ t, lang, setLang, langPicked, session, setSession, go, guided, setGuided }) {
  const [input, setInput] = useState('')
  const [voice, setVoice] = useState('idle') // idle | listening | transcribed
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const timers = useRef([])
  const endRef = useRef(null)
  const { messages } = session

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

  const scrollDown = () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

  const submit = async (text, via = 'text') => {
    const q = text.trim()
    if (!q || busy) return
    setBusy(true)
    setInput('')
    const result = await processQuery(q)

    // Respond in the language the user spoke/typed (for Telugu / Hindi input).
    if (result.detectedLang !== 'en' && result.detectedLang !== lang) {
      setLang(result.detectedLang)
      setToast(result.detectedLang)
      later(() => setToast(null), 3500)
    }
    const id = Date.now()
    setSession((s) => ({
      ...s,
      messages: [...s.messages, { id, role: 'user', text: q, via }, { id: id + 1, role: 'prism', result, done: false }],
    }))
  }

  const markDone = (id) => {
    setSession((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, done: true } : m)) }))
    setBusy(false)
  }

  // Mock voice input: "listen" for 1.5 s, then insert a predefined question and submit it.
  const startVoice = () => {
    if (busy || voice !== 'idle') return
    const question = t('voice.q')
    setVoice('listening')
    later(() => {
      setInput(question)
      setVoice('transcribed')
    }, 1500)
    later(() => {
      setVoice('idle')
      submit(question, 'voice')
    }, 2500)
  }

  const samples = [t('ask.q1'), t('ask.q2'), t('ask.q3'), t('ask.q4')]
  const lastPrism = [...messages].reverse().find((m) => m.role === 'prism')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle t={t}
        icon={MessageSquareText}
        title={t('ask.title')}
        subtitle={t('ask.subtitle')}
        right={<LangTabs lang={lang} setLang={setLang} />}
      />

      {guided && <GuideBar t={t} lang={lang} langPicked={langPicked} messages={messages} onHide={() => setGuided(false)} />}

      {toast && (
        <div className="anim-in mb-4 flex items-center gap-2 rounded-sm border border-navy-200 bg-navy-50 px-4 py-2.5 text-sm font-medium text-navy-800">
          <Languages size={16} /> {t('ask.langSwitched', { lang: langName(toast, toast) })}
        </div>
      )}

      {/* Conversation */}
      <div className="space-y-4">
        {messages.length === 0 && (
          <div className="rounded-sm border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-navy-600">
              <Mic size={26} />
            </div>
            <p className="mx-auto mt-3 max-w-md text-slate-600">{t('ask.empty')}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700">
              <Lock size={12} /> {t('home.privacy')}
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="anim-in flex justify-end">
              <div className="max-w-[85%] rounded-sm rounded-br-md bg-navy-700 px-4 py-3 text-white shadow-sm">
                {m.via === 'voice' && (
                  <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-navy-100">
                    <Mic size={11} /> {t('ask.viaVoice')}
                  </div>
                )}
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="space-y-3">
              <PipelineCard
                result={m.result}
                t={t}
                lang={lang}
                animate={!m.done}
                latest={m === lastPrism}
                onDone={() => markDone(m.id)}
                onProgress={scrollDown}
              />
              {m.done && m.result.kind === 'abstain' && <AbstentionCard t={t} go={go} />}
              {m.done && m.result.kind !== 'abstain' && <AnswerCard intent={m.result.intent} t={t} lang={lang} go={go} />}
            </div>
          ),
        )}
        <div ref={endRef} className="scroll-mb-28" />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 bg-gradient-to-t from-[#f2f4f7] via-[#f2f4f7] to-transparent px-4 pb-4 pt-3">
        {voice === 'transcribed' && (
          <div className="anim-in mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 size={13} /> {t('ask.transcribed')}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
          className="flex items-center gap-2 rounded-sm border border-slate-300 bg-white p-2 shadow-sm focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-100"
        >
          {voice === 'listening' ? (
            <div className="flex flex-1 items-center gap-3 px-3 py-2 text-navy-700">
              <span className="wave flex items-center gap-[3px] text-red-500" aria-hidden="true">
                <span /><span /><span /><span /><span />
              </span>
              <span className="font-medium">{t('ask.listening')}</span>
            </div>
          ) : (
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ask.placeholder')}
              disabled={busy}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:text-slate-400 disabled:opacity-60"
            />
          )}
          <button
            type="button"
            onClick={startVoice}
            disabled={busy || voice !== 'idle'}
            className={`relative inline-flex items-center gap-1.5 rounded-sm px-3.5 py-2.5 text-sm font-semibold transition ${
              voice === 'listening'
                ? 'bg-red-600 text-white'
                : 'bg-navy-50 text-navy-700 hover:bg-navy-100 disabled:opacity-50'
            } ${guided && messages.length === 0 && voice === 'idle' && langPicked ? 'ring-4 ring-saffron/50' : ''}`}
          >
            {voice === 'listening' && <span className="absolute inset-0 animate-ping rounded-sm bg-red-400 opacity-40" />}
            <Mic size={18} className="relative" />
            <span className="relative hidden sm:inline">{t('ask.voice')}</span>
          </button>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-sm bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40"
          >
            <Send size={16} />
            <span className="hidden sm:inline">{t('ask.send')}</span>
          </button>
        </form>
      </div>

      <div className="pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('ask.try')}:</span>
          {samples.map((q) => (
            <Chip key={q} disabled={busy} onClick={() => submit(q)}>{q}</Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('ask.scenarios')}:</span>
          <Chip disabled={busy} tone="green" onClick={() => submit(t('demo.privacy'))}>
            <ShieldCheck size={13} /> {t('ask.privacyDemo')}
          </Chip>
          <Chip disabled={busy} tone="amber" onClick={() => submit(t('demo.safety'))}>
            <ShieldAlert size={13} /> {t('ask.safetyDemo')}
          </Chip>
        </div>
        {lang !== 'en' && <p className="mt-2 text-[11px] text-slate-500">{t('ask.protoLang')}</p>}
      </div>
    </div>
  )
}

function Chip({ children, onClick, disabled, tone }) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
        tones[tone] ?? 'border-slate-200 bg-white text-navy-800 hover:border-navy-400 hover:bg-navy-50'
      }`}
    >
      {children}
    </button>
  )
}

function LangTabs({ lang, setLang }) {
  return (
    <div className="inline-flex rounded-sm border border-slate-200 bg-white p-1 shadow-sm" role="tablist">
      {LANGS.map((l) => (
        <button
          key={l.code}
          role="tab"
          aria-selected={lang === l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-sm px-3.5 py-1.5 text-sm font-semibold transition ${
            lang === l.code ? 'bg-navy-700 text-white' : 'text-navy-700 hover:bg-navy-50'
          }`}
        >
          {l.native}
        </button>
      ))}
    </div>
  )
}

function GuideBar({ t, lang, langPicked, messages, onHide }) {
  const done = [
    langPicked,
    messages.some((m) => m.via === 'voice'),
    messages.some((m) => m.role === 'prism' && m.done),
    false,
  ]
  const current = done.indexOf(false)
  return (
    <div className="mb-5 rounded-sm border border-orange-200 bg-orange-50/60 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-800">{t('guide.title')}</span>
        <button onClick={onHide} className="inline-flex items-center gap-1 text-xs text-orange-800 hover:underline">
          <X size={12} /> {t('guide.hide')}
        </button>
      </div>
      <ol className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {[1, 2, 3, 4].map((n, i) => (
          <li
            key={n}
            className={`flex items-center gap-2 text-sm ${
              done[i] ? 'text-emerald-700' : i === current ? 'font-semibold text-navy-900' : 'text-slate-500'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                done[i] ? 'bg-emerald-600 text-white' : i === current ? 'bg-saffron text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done[i] ? '✓' : n}
            </span>
            <span>
              {t(`guide.${n}`)}
              {n === 1 && langPicked && <b>: {langName(lang, lang)}</b>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
