import { useEffect, useRef, useState } from 'react'
import { Volume2, Square } from 'lucide-react'

// Simulated text-to-speech: animates for a few seconds, plays no audio.
export default function ReadAloud({ t, compact = false }) {
  const [speaking, setSpeaking] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const toggle = () => {
    clearTimeout(timer.current)
    if (speaking) return setSpeaking(false)
    setSpeaking(true)
    timer.current = setTimeout(() => setSpeaking(false), 4000)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={t('ans.tts')}
      className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition ${
        speaking
          ? 'border-navy-500 bg-navy-600 text-white'
          : 'border-slate-300 bg-white text-navy-700 hover:border-navy-500 hover:bg-navy-50'
      }`}
    >
      {speaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={16} />}
      {speaking ? (
        <>
          <span className="wave flex items-center gap-[3px]" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </span>
          <span>{t('ans.speaking')}</span>
        </>
      ) : (
        <span>{t('ans.read')}</span>
      )}
      {!compact && speaking && <span className="text-[11px] opacity-75">({t('ans.tts')})</span>}
    </button>
  )
}
