import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ClearSessionModal from './components/ClearSessionModal'
import LanguageGate from './components/LanguageGate'
import Home from './screens/Home'
import Ask from './screens/Ask'
import Documents from './screens/Documents'
import Schemes from './screens/Schemes'
import Grievance from './screens/Grievance'
import Architecture from './screens/Architecture'
import documents from './data/documents.json'
import { makeT } from './i18n'

// Everything the user produces lives here, in memory only, so "Clear Session" can wipe it.
const EMPTY_SESSION = { messages: [], docId: null, docExplained: false }

export default function App() {
  const [route, setRoute] = useState({ screen: 'home', param: null })
  const [lang, setLang] = useState('hi')
  const [langPicked, setLangPicked] = useState(false)
  // A deliberate language choice by the user (ticks off step 1 of the guided demo).
  const chooseLang = (l) => {
    setLang(l)
    setLangPicked(true)
  }
  const [session, setSession] = useState(EMPTY_SESSION)
  const [sessionKey, setSessionKey] = useState(0)
  const [guided, setGuided] = useState(false)
  const [clearSummary, setClearSummary] = useState(null)
  const t = makeT(lang)

  const go = (screen, param = null) => {
    setRoute({ screen, param })
    window.scrollTo({ top: 0 })
  }

  const openClear = () => {
    const userMsgs = session.messages.filter((m) => m.role === 'user').length
    const protectedCount = session.messages
      .filter((m) => m.role === 'prism')
      .reduce((n, m) => n + m.result.privacy.entities.length, 0)
    const doc = documents.find((d) => d.id === session.docId)
    setClearSummary({
      messages: `${userMsgs} Q&A`,
      doc: doc ? doc.file : '—',
      protected: `${protectedCount} PII`,
    })
  }

  const clearNow = () => {
    setSession(EMPTY_SESSION)
    setSessionKey((k) => k + 1)
  }

  const screens = {
    home: <Home t={t} lang={lang} setLang={setLang} go={go} startDemo={() => { setGuided(true); go('ask') }} />,
    ask: <Ask t={t} lang={lang} setLang={chooseLang} langPicked={langPicked} session={session} setSession={setSession} go={go} guided={guided} setGuided={setGuided} />,
    documents: <Documents t={t} lang={lang} session={session} setSession={setSession} />,
    schemes: <Schemes t={t} lang={lang} initial={route.param} />,
    grievance: <Grievance t={t} lang={lang} initial={route.param} />,
    architecture: <Architecture t={t} />,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header t={t} lang={lang} setLang={chooseLang} screen={route.screen} go={go} onClear={openClear} />
      <main id="main" className="flex-1" key={`${route.screen}-${route.param}-${sessionKey}`}>
        {screens[route.screen]}
      </main>
      <Footer t={t} go={go} />
      {!langPicked && <LanguageGate onChoose={chooseLang} />}
      <ClearSessionModal
        open={!!clearSummary}
        t={t}
        summary={clearSummary ?? {}}
        onConfirm={clearNow}
        onCancel={() => setClearSummary(null)}
        onFinish={() => {
          setClearSummary(null)
          setGuided(false)
          setLangPicked(false) // new session: ask for the language again
          go('home')
        }}
      />
    </div>
  )
}
