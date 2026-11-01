import { useRef, useState } from 'react'
import { DEFAULT_BOUNDS, targetHrMax, type HrmaxMethod, type Sex, type ZoneMethod } from './lib/formulas'
import { deriveModel } from './lib/model'
import { Field, Source, Stat } from './ui'
import {
  HrmaxTab, HrrTab, IntensityTab, KarvonenTab, PulseTab, RecoveryTab, RhrTab, ThrTab, ZonesTab, type Shared,
} from './tabs'

const TABS = [
  { key: 'hrmax', en: 'HRmax', ar: 'أقصى معدل للنبض', num: '01' },
  { key: 'rhr', en: 'Resting HR', ar: 'نبض الراحة', num: '02' },
  { key: 'hrr', en: 'HR Reserve', ar: 'احتياطي النبض', num: '03' },
  { key: 'thr', en: 'Target HR', ar: 'النبض المستهدف', num: '04' },
  { key: 'karvonen', en: 'Karvonen', ar: 'معادلة كارفونن', num: '05' },
  { key: 'zones', en: 'Training Zones', ar: 'مناطق التدريب', num: '06' },
  { key: 'intensity', en: 'Intensity', ar: 'شدة المجهود', num: '07' },
  { key: 'recovery', en: 'HR Recovery', ar: 'استشفاء النبض', num: '08' },
  { key: 'pulse', en: 'Pulse Rate', ar: 'حساب النبض اليدوي', num: '09' },
] as const
type TabKey = (typeof TABS)[number]['key']

function EcgBanner({ rhr }: { rhr: number | null }) {
  const beat = rhr ? Math.min(2.4, Math.max(0.3, 60 / rhr)) : 0.9
  const unit = 'M0 30 H30 L36 30 L42 22 L48 30 L54 30 L58 34 L64 2 L70 48 L75 30 H92 L98 24 L106 30 H120'
  return (
    <div aria-hidden className="ecg-banner" dir="ltr">
      <svg width="2400" height="110" viewBox="0 0 2400 70" className="ecg-track" style={{ ['--beat' as string]: `${beat}s` }}>
        <g fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
          {Array.from({ length: 20 }, (_, i) => <path key={i} d={unit} transform={`translate(${i * 120} 5)`} />)}
        </g>
      </svg>
    </div>
  )
}

function HeartIcon() {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
    <path d="M4 12h4l2-3.5 3.1 6L15 12h4" />
  </svg>
}

export default function App() {
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex>('')
  const [rhr, setRhr] = useState('')
  const [measured, setMeasured] = useState('')
  const [method, setMethod] = useState<HrmaxMethod>('tanaka')
  const [intensity, setIntensity] = useState(70)
  const [zoneMethod, setZoneMethod] = useState<ZoneMethod>('hrmax')
  const [boundsStr, setBoundsStr] = useState<string[]>(DEFAULT_BOUNDS.map(String))
  const [currentHr, setCurrentHr] = useState('')
  const [peakHr, setPeakHr] = useState('')
  const [tab, setTab] = useState<TabKey>('hrmax')
  const activeHeadingRef = useRef<HTMLDivElement>(null)
  function chooseTab(key: TabKey) {
    setTab(key)
    if (window.matchMedia('(max-width: 780px)').matches) {
      window.requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        activeHeadingRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      })
    }
  }

  const model = deriveModel({ age, sex, rhr, measuredHrmax: measured, method })
  const s: Shared = {
    model, sex, method, setMethod, intensity, setIntensity, zoneMethod, setZoneMethod,
    boundsStr, setBoundsStr, currentHr, setCurrentHr, peakHr, setPeakHr,
  }
  const thr = model.hrmax !== null ? targetHrMax(model.hrmax, intensity) : null
  const currentTab = TABS.find((x) => x.key === tab)!
  function fillExample() { setAge('30'); setSex('male'); setRhr('60'); setMeasured(''); setMethod('tanaka'); setIntensity(70); setCurrentHr('150'); setPeakHr('180') }
  function clearInputs() { setAge(''); setSex(''); setRhr(''); setMeasured(''); setMethod('tanaka'); setCurrentHr(''); setPeakHr('') }

  return (
    <div className="app-shell" dir="rtl">
      <header className="top-bar">
        <div className="brand"><span className="brand-mark"><HeartIcon /></span><div><span className="brand-name">PULSE<span>LAB</span></span><span className="brand-sub">HEART RATE SCIENCE</span></div></div>
      </header>

      <section className="hero-card" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> HEART RATE CALCULATOR</span>
          <h1 id="hero-heading">افهم نبضك.<br/><span>احسب شدة تمرينك.</span></h1>
          <p>كل ما تحتاجه لحساب معدلات ضربات القلب في مكان واحد، مع شرح علمي مفصل لكل معادلة، ومثال بالأرقام يساعدك تفهم النتيجة مش مجرد تشوفها.</p>
        </div>
        <div className="hero-visual" aria-hidden><div className="hero-visual-top"><span>LIVE METRIC EXPLORER</span><span className="live-dots">● ● ●</span></div><EcgBanner rhr={model.rhr}/><div className="hero-visual-footer"><span>HEART RATE <b>·</b> BPM</span><span>01 — 09</span></div></div>
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <div className="nav-card">
            <div className="nav-heading"><span>استكشف الحاسبات</span><span className="nav-number">09</span></div>
            <nav className="calculator-nav" aria-label="اختيار الحاسبة" role="tablist">
              {TABS.map((item) => <button key={item.key} role="tab" id={`tab-${item.key}`} aria-controls="calculator-panel" aria-selected={tab === item.key} onClick={() => chooseTab(item.key)} className={`nav-item ${tab === item.key ? 'nav-active' : ''}`}>
                <span className="nav-item-number">{item.num}</span><span className="nav-item-titles"><b dir="ltr">{item.en}</b><small>{item.ar}</small></span><span className="nav-item-arrow" aria-hidden>‹</span>
              </button>)}
            </nav>
          </div>
          <div className="sidebar-tip"><span className="tip-icon">✦</span><h3>ابدأ بالبيانات الأساسية</h3><p>اكتب عمرك ونبض الراحة، وبعدها بدّل بين الحاسبات. كل النتائج متصلة بنفس البيانات وتتحدث فورًا.</p></div>
        </aside>

        <main className="main-column">
          <section className="inputs-card" aria-labelledby="inputs-h">
            <div className="block-heading"><div><span className="block-kicker">STEP 01 / YOUR DATA</span><h2 id="inputs-h">البيانات الأساسية</h2><p>أدخل القياسات المتاحة عندك. القيم لا تغادر متصفحك.</p></div><div className="inputs-actions"><button type="button" className="ghost-button" onClick={fillExample}>جرّب مثال</button><button type="button" className="text-button" onClick={clearInputs}>مسح المدخلات</button></div></div>
            <div className="input-grid">
              <Field id="age" label="العمر" unit="سنة" placeholder="مثال: 30" value={age} onChange={setAge} error={model.errors.age} />
              <div className="field-block"><label htmlFor="sex" className="field-label">الجنس <span className="field-qualifier">لمعادلة Gulati فقط</span></label><select id="sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)} className="select-field"><option value="">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
              <Field id="rhr" label="نبض الراحة (RHR)" unit="BPM" placeholder="مثال: 60" value={rhr} onChange={setRhr} error={model.errors.rhr} hint="قيمة مقاسة، وليست ناتجة عن معادلة" />
              <Field id="measured" label="أقصى نبض تم قياسه" unit="BPM" placeholder="إن كان لديك اختبار" optional value={measured} onChange={(v) => { setMeasured(v); if (v.trim() !== '' && method !== 'measured') setMethod('measured') }} error={model.errors.measured} />
            </div>
            <div className="input-note"><span aria-hidden>◎</span> <span>مصدر حساب HRmax الآن: <strong>{model.hrmaxLabel}</strong>. يمكنك اختيار معادلة أخرى من قسم HRmax. القياس الفعلي يُفضّل أن يكون من اختبار مجهود موثوق وتحت إشراف مناسب.</span></div>
          </section>

          <section className="overview-section" aria-label="ملخص النتائج">
            <div className="overview-head"><div><span className="block-kicker">STEP 02 / YOUR METRICS</span><h2>نتائجك في لمحة</h2></div><span className="update-label"><span className="badge-dot"/> تحديث تلقائي</span></div>
            <div className="metrics-grid" aria-live="polite">
              <Stat label="HRmax · أقصى نبض تقديري/مقاس" value={model.hrmax} sub={`المصدر: ${model.hrmaxLabel}`} />
              <Stat label="RHR · نبض الراحة" value={model.rhr} sub="قيمة تدخلها يدويًا" />
              <Stat label="HRR · احتياطي النبض" value={model.hrr} sub="HRmax − RHR" />
              <Stat label={`Target HR · عند ${intensity}% HRmax`} value={thr} sub="باستخدام نسبة من أقصى نبض" />
            </div>
          </section>

          <div className="active-section-heading" ref={activeHeadingRef}><div><span className="block-kicker">STEP 03 / CALCULATOR</span><h2>{currentTab.ar} <span dir="ltr">/ {currentTab.en}</span></h2></div><span className="active-counter">{currentTab.num} / 09</span></div>
          <div id="calculator-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="active-tab-panel">
            {tab === 'hrmax' && <HrmaxTab s={s} />}
            {tab === 'rhr' && <RhrTab s={s} />}
            {tab === 'hrr' && <HrrTab s={s} />}
            {tab === 'thr' && <ThrTab s={s} />}
            {tab === 'karvonen' && <KarvonenTab s={s} />}
            {tab === 'zones' && <ZonesTab s={s} />}
            {tab === 'intensity' && <IntensityTab s={s} />}
            {tab === 'recovery' && <RecoveryTab s={s} />}
            {tab === 'pulse' && <PulseTab />}
          </div>
        </main>
      </div>

      <footer className="site-footer">
        <div><div className="footer-brand"><HeartIcon /><strong>PULSE LAB</strong></div><p>أداة تعليمية للتدريب وليست وسيلة للتشخيص أو لتحديد حدود آمنة فردية. معادلات HRmax تقديرية، وبعض الأدوية والحالات المرضية تغيّر استجابة النبض. مع أعراض مثل ألم الصدر أو الدوخة أوقف المجهود واطلب تقييمًا طبيًا.</p></div>
        <div className="footer-sources"><h3>مراجع موثوقة</h3><div><Source href="https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates">American Heart Association</Source><Source href="https://pubmed.ncbi.nlm.nih.gov/11153730/">Tanaka 2001</Source><Source href="https://pubmed.ncbi.nlm.nih.gov/22376273/">Nes 2013</Source><Source href="https://pubmed.ncbi.nlm.nih.gov/20585008/">Gulati 2010</Source><Source href="https://pubmed.ncbi.nlm.nih.gov/13470504/">Karvonen 1957</Source><Source href="https://my.clevelandclinic.org/health/articles/23490-heart-rate-recovery">Cleveland Clinic</Source><Source href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11946962/">INTERLIVE review</Source><Source href="https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979">Mayo Clinic</Source></div></div>
      </footer>
    </div>
  )
}
