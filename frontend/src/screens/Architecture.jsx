import {
  ArrowDown, BookOpenCheck, Brain, Camera, Cpu, Database, EyeOff, FileInput, Languages, Mic, Monitor,
  Route, Search, ShieldCheck, Speaker, Timer, Trash2, User, Volume2, Workflow,
} from 'lucide-react'
import { PageTitle, Card } from '../components/ui'

// zone: where the step runs in the proposed design
const FLOW = [
  { icon: User, title: 'User', sub: 'Citizen, farmer or cooperative member', poc: null, zone: 'user' },
  { icon: FileInput, title: 'Voice / Text / Document', sub: 'Microphone, touchscreen, scanner', poc: 'Simulated voice · sample documents', zone: 'edge' },
  { icon: Languages, title: 'Language Processing', sub: 'Speech-to-text, OCR, language ID', poc: 'Unicode-script detection', zone: 'edge' },
  { icon: ShieldCheck, title: 'Privacy Gateway', sub: 'Sensitive-data detection', poc: 'Rule-based mock', zone: 'privacy' },
  { icon: EyeOff, title: 'PII Redaction', sub: 'Mask before any AI processing', poc: 'Regex mock', zone: 'privacy' },
  { icon: Route, title: 'Context Router', sub: 'Classify intent / domain', poc: 'Keyword routing', zone: 'ai' },
  { icon: Search, title: 'Knowledge Retrieval', sub: 'RAG over trusted government sources', poc: 'Local JSON knowledge base', zone: 'ai' },
  { icon: Brain, title: 'Response Generation', sub: 'LLM answer in the user’s language', poc: 'Pre-written responses', zone: 'ai' },
  { icon: BookOpenCheck, title: 'Source Verification', sub: 'Grounding check — abstain if unverified', poc: 'Rule-based abstention', zone: 'ai' },
  { icon: Volume2, title: 'Text + Voice Response', sub: 'On-screen answer + text-to-speech', poc: 'Simulated TTS', zone: 'edge' },
  { icon: Trash2, title: 'Session Clear', sub: 'Wipe temporary data on exit / timeout', poc: 'In-memory reset', zone: 'privacy' },
]

const ZONES = {
  user: { bar: 'bg-slate-400', label: 'User' },
  edge: { bar: 'bg-navy-500', label: 'Edge device (I/O)' },
  privacy: { bar: 'bg-emerald-500', label: 'Privacy layer — runs locally' },
  ai: { bar: 'bg-saffron', label: 'Knowledge + AI layer' },
}

const HARDWARE = [
  { icon: Cpu, label: 'Raspberry Pi / Edge Computer' },
  { icon: Monitor, label: 'Touchscreen' },
  { icon: Mic, label: 'Microphone' },
  { icon: Speaker, label: 'Speaker' },
  { icon: Camera, label: 'Camera / Document Scanner' },
]

const BACKEND = [
  { icon: Search, label: 'RAG', note: 'Retrieval over trusted documents' },
  { icon: Database, label: 'Knowledge Base', note: 'Acts, bye-laws, scheme guidelines' },
  { icon: Brain, label: 'LLM', note: 'Local / small model on edge where possible' },
  { icon: Timer, label: 'Session Manager', note: 'Temporary memory, inactivity timeout' },
]

export default function Architecture({ t }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle t={t} icon={Workflow} title={t('nav.architecture')} subtitle="How a request moves through PRISM — and what is mocked in this proof of concept." />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {Object.values(ZONES).map((z) => (
              <span key={z.label} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <span className={`h-2.5 w-2.5 rounded-sm ${z.bar}`} /> {z.label}
              </span>
            ))}
          </div>
          <ol>
            {FLOW.map(({ icon: Icon, title, sub, poc, zone }, i) => (
              <li key={title}>
                <div className="flex items-stretch overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
                  <span className={`w-1.5 shrink-0 ${ZONES[zone].bar}`} />
                  <div className="flex flex-1 flex-wrap items-center gap-3 px-3.5 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-navy-50 text-navy-700">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-navy-900">{title}</div>
                      <div className="text-xs text-slate-500">{sub}</div>
                    </div>
                    {poc && (
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                        POC: {poc}
                      </span>
                    )}
                  </div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex justify-center py-1 text-navy-300">
                    <ArrowDown size={16} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-navy-700">Edge / Hardware</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {HARDWARE.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 rounded-sm border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800">
                  <Icon size={17} className="text-navy-600" /> {label}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-navy-700">Backend</h2>
            <ul className="space-y-2">
              {BACKEND.map(({ icon: Icon, label, note }) => (
                <li key={label} className="flex items-center gap-3 rounded-sm border border-slate-200 px-3 py-2">
                  <Icon size={17} className="shrink-0 text-saffron" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">{label}</div>
                    <div className="text-xs text-slate-500">{note}</div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-500">MOCKED</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-sm bg-amber-50 px-3 py-2 text-xs text-amber-900">
              For this proof of concept, these backend components are mocked with local JSON data and rule-based logic.
              An optional Flask API (<code>backend/app.py</code>) serves the same mock pipeline.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-navy-700">Design principles</h2>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li>• Privacy before AI — redaction happens before any model sees the input</li>
              <li>• Source-grounded — every answer cites its source, or PRISM abstains</li>
              <li>• Voice-first and multilingual for low digital literacy</li>
              <li>• Temporary sessions — nothing stored after the user leaves</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
