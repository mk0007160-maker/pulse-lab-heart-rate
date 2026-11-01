import { useMemo, useState } from 'react'
import {
  computeZones, DEFAULT_BOUNDS, karvonen, locateZone, percentHrMax, percentHrr,
  pulseBpm, recoveryDrop, targetHrMax, validateBounds, type HrmaxMethod, type Sex, type Zone, type ZoneMethod,
} from './lib/formulas'
import { parseNum, type Model } from './lib/model'
import { Field, Formula, Guide, GuidePart, WorkedExample, Missing, Panel, Source, Stat, ZONE_COLORS, ZONE_NAMES } from './ui'

export interface Shared {
  model: Model
  sex: Sex
  method: HrmaxMethod
  setMethod: (m: HrmaxMethod) => void
  intensity: number
  setIntensity: (n: number) => void
  zoneMethod: ZoneMethod
  setZoneMethod: (m: ZoneMethod) => void
  boundsStr: string[]
  setBoundsStr: (b: string[]) => void
  currentHr: string
  setCurrentHr: (v: string) => void
  peakHr: string
  setPeakHr: (v: string) => void
}

const needHrmax = <Missing>أدخل العمر (أو HRmax مقاس) علشان تظهر النتيجة. لو اخترت HRmax مقاس، اكتبه في خانة "أقصى نبض مقاس" فوق.</Missing>

/* ---------------- A. HRmax ---------------- */
const FORMULAS: { key: Exclude<HrmaxMethod, 'measured'>; name: string; eq: string; src: ReactNodeish }[] = [
  { key: 'fox', name: 'Fox', eq: '220 − Age', src: { text: 'Fox et al., 1971 — موثّقة في صفحة AHA', href: 'https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates' } },
  { key: 'tanaka', name: 'Tanaka', eq: '208 − (0.7 × Age)', src: { text: 'Tanaka, Monahan & Seals, 2001 (JACC)', href: 'https://pubmed.ncbi.nlm.nih.gov/11153730/' } },
  { key: 'nes', name: 'Nes', eq: '211 − (0.64 × Age)', src: { text: 'Nes et al., 2013 — HUNT Fitness Study', href: 'https://pubmed.ncbi.nlm.nih.gov/22376273/' } },
  { key: 'gulati', name: 'Gulati (للنساء)', eq: '206 − (0.88 × Age)', src: { text: 'Gulati et al., 2010 (Circulation)', href: 'https://pubmed.ncbi.nlm.nih.gov/20585008/' } },
]
type ReactNodeish = { text: string; href: string }

export function HrmaxTab({ s }: { s: Shared }) {
  const { model, method, setMethod } = s
  return (
    <Panel
      title="Maximum Heart Rate (HRmax)"
      note={
        <>
          هذه المعادلات <b className="text-fg">تقديرية</b> وليست قياسًا فعليًا، وتختلف نتائجها من شخص لآخر (الانحراف المعياري قد يتجاوز 10 BPM). موجّهة للبالغين. أدق طريقة هي اختبار مجهود مُشرف عليه.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {FORMULAS.map((f) => {
          const val = model.estimates?.[f.key] ?? null
          const blocked = f.key === 'gulati' && s.sex !== 'female'
          const active = method === f.key
          return (
            <div key={f.key} className={`rounded-xl border p-4 ${active ? 'border-pulse bg-panel2' : 'border-line'}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold">{f.name}</h3>
                <code dir="ltr" className="text-xs text-mute">{f.eq}</code>
              </div>
              <div className="my-3 text-start text-3xl font-bold" dir="ltr">
                {blocked ? <span className="text-base font-normal text-mute">اختر الجنس "أنثى"</span> : val === null ? <span className="text-mute/60">—</span> : <>{val} <span className="text-xs font-normal text-mute">BPM</span></>}
              </div>
              <button
                disabled={blocked || val === null}
                onClick={() => setMethod(f.key)}
                className="w-full rounded-lg border border-line px-3 py-1.5 text-sm enabled:hover:border-pulse disabled:opacity-40"
              >
                {active ? 'مستخدمة في الحسابات ✓' : 'استخدم هذه المعادلة'}
              </button>
              <p className="mt-2 text-xs text-mute"><Source href={f.src.href}>{f.src.text}</Source></p>
            </div>
          )
        })}
      </div>
      <div className={`mt-3 rounded-xl border p-4 ${method === 'measured' ? 'border-pulse bg-panel2' : 'border-line'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold">HRmax مقاس فعليًا</h3>
            <p className="text-xs text-mute">اكتب القيمة في خانة "أقصى نبض مقاس" بالأعلى: {model.measured ?? '—'} {model.measured !== null && 'BPM'}</p>
          </div>
          <button
            disabled={model.measured === null}
            onClick={() => setMethod('measured')}
            className="rounded-lg border border-line px-3 py-1.5 text-sm enabled:hover:border-pulse disabled:opacity-40"
          >
            {method === 'measured' ? 'مستخدمة في الحسابات ✓' : 'استخدم القيمة المقاسة'}
          </button>
        </div>
      </div>
      {model.errors.method && <p role="alert" className="mt-3 text-sm text-z5">{model.errors.method}</p>}
      <Guide title="يعني إيه أقصى معدل للنبض؟">
        <GuidePart title="التعريف العلمي"><p><b>HRmax</b> هو أعلى عدد ضربات يمكن أن يصل إليه القلب في الدقيقة أثناء مجهود أقصى أو شبه أقصى. هو ليس «المعدل الطبيعي» ولا معدل النبض المطلوب الحفاظ عليه طوال التدريب. الحساب اعتمادًا على العمر يعطي <b>توقعًا إحصائيًا</b> وليس قياسًا لقلبك شخصيًا.</p></GuidePart>
        <GuidePart title="ليه فيه أربع معادلات مختلفة؟"><p><b>Fox (220 − العمر):</b> أشهر طريقة مبسطة، لكنها قد تكون بعيدة عن القيمة الحقيقية لبعض الأشخاص. <b>Tanaka:</b> مبنية على تحليل تجميعي ودراسة تحقق على بالغين أصحاء. <b>Nes:</b> نتجت عن دراسة HUNT وشملت أكثر من 3,000 شخص. <b>Gulati:</b> تم تطويرها من بيانات نساء ولذلك تُعرض للإناث فقط. الاختلاف بينها لا يعني وجود معادلة دقيقة لكل فرد.</p></GuidePart>
        <WorkedExample><p>لو العمر <b>{model.age ?? 30} سنة</b>، فإن معادلة Tanaka:</p><code dir="ltr">208 − (0.7 × {model.age ?? 30}) = {model.estimates?.tanaka ?? 187} BPM</code><p>وبالتالي هذه القيمة هي <b>HRmax تقديري</b> فقط. عند اختيار معادلة مختلفة ستتغير حسابات المناطق والنبض المستهدف تلقائيًا.</p></WorkedExample>
        <GuidePart title="هل الأرقام الناتجة دقيقة 100%؟"><p>لا. الاختلاف بين الأشخاص قد يتجاوز 10 ضربات في الدقيقة؛ ودراسة Nes سجلت خطأ تقدير معياريًا يقارب 10.8 BPM. القياس أثناء اختبار مجهود أقصى بإشراف مختص قد يكون أنسب عند الحاجة لدقة فردية، لكنه أيضًا يتطلب شروط اختبار صحيحة. معادلات العمر هنا مخصصة للبالغين (18+)، ولا تعني أن الأطفال لهم نفس العلاقة.</p><p>المصادر: <Source href="https://pubmed.ncbi.nlm.nih.gov/11153730/">Tanaka 2001</Source> · <Source href="https://pubmed.ncbi.nlm.nih.gov/22376273/">Nes 2013</Source> · <Source href="https://pubmed.ncbi.nlm.nih.gov/20585008/">Gulati 2010</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- B. RHR ---------------- */
export function RhrTab({ s }: { s: Shared }) {
  const { model } = s
  return (
    <Panel
      title="Resting Heart Rate (RHR)"
      note="نبض الراحة قيمة تُقاس ولا يمكن استنتاجها من العمر وحده. الأفضل قياسه صباحًا بعد راحة هادئة، وتكرار القياس عدة أيام وأخذ المتوسط. تُستخدم القيمة تلقائيًا في HRR وKarvonen ومناطق %HRR وشدة %HRR."
    >
      <div className="max-w-xs">
        <Stat label="معدل النبض أثناء الراحة" value={model.rhr} />
      </div>
      {model.rhr === null && <div className="mt-3"><Missing>اكتب نبض الراحة في المدخلات الأساسية بالأعلى.</Missing></div>}
      <Guide title="فهم وقياس نبض الراحة">
        <GuidePart title="نبض الراحة معناه إيه؟"><p><b>Resting Heart Rate (RHR)</b> هو عدد ضربات القلب في الدقيقة وأنت مستيقظ ومرتاح، من غير نشاط بدني أو انفعال واضح. هو <b>قياس مباشر</b> وليس رقمًا يُستنتج من السن، ولذلك لا تظهر قيمته تلقائيًا بمجرد كتابة العمر.</p></GuidePart>
        <GuidePart title="إزاي تقيسه صح؟"><p>يفضل القياس صباحًا بعد الاستيقاظ وقبل القهوة أو النشاط. اجلس أو استرح بهدوء؛ ضع السبابة والوسطى على نبض الرسغ، وعدّ الضربات لمدة 60 ثانية، أو استخدم جهازًا موثوقًا. كرر القياس في أيام مختلفة ثم استخدم متوسطًا يمثل حالتك المعتادة. تجنب القياس مباشرة بعد صعود السلالم أو شرب المنبهات.</p></GuidePart>
        <WorkedExample><p>لو عددت <b>16 نبضة خلال 15 ثانية</b> → نبض الراحة ≈ <b>64 BPM</b>؛ لكن عدّ 60 ثانية يعطي قياسًا يدويًا أقل تأثرًا بخطأ النبضة الواحدة. لو قراءة الراحة المقاسة لديك {model.rhr === null ? '60' : model.rhr}، فستُستخدم تلقائيًا في حساب HRR ومعادلة Karvonen.</p></WorkedExample>
        <GuidePart title="إيه معنى الرقم؟"><p>معظم البالغين يكون نبض الراحة لديهم تقريبًا بين <b>60 و100 BPM</b>، وقد يكون أقل لدى بعض الرياضيين. الحرارة، الجفاف، الانفعال، النوم، الأدوية والحالة الصحية قد تؤثر عليه. هذا نطاق وصفي عام وليس تشخيصًا؛ القيم المتكررة غير المعتادة أو المصحوبة بأعراض تُناقَش مع مختص.</p><p>المراجع: <Source href="https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates">AHA</Source> · <Source href="https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979">Mayo Clinic</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- C. HRR ---------------- */
export function HrrTab({ s }: { s: Shared }) {
  const { model } = s
  return (
    <Panel
      title="Heart Rate Reserve (HRR)"
      note={<>احتياطي معدل ضربات القلب هو الفرق بين HRmax ونبض الراحة. لا تخلطه مع <b className="text-fg">Heart Rate Recovery</b> (انخفاض النبض بعد التمرين) رغم تشابه الاختصار.</>}
    >
      <Formula>HRR = HRmax − Resting HR</Formula>
      {model.hrmax !== null && model.rhr !== null ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={`HRmax (${model.hrmaxLabel})`} value={model.hrmax} />
          <Stat label="Resting HR" value={model.rhr} />
          <Stat label="HRR" value={model.hrr} />
        </div>
      ) : (
        <Missing>محتاج HRmax ونبض راحة علشان نحسب HRR.</Missing>
      )}
      <Guide title="ليه بنحسب احتياطي النبض؟">
        <GuidePart title="التعريف"><p><b>Heart Rate Reserve</b> هو المسافة العددية بين نبض القلب أثناء الراحة وبين أقصى نبض. وهو ليس نسبة مئوية بحد ذاته ولا معدل نبض مستهدف. نستخدم هذا الفرق لتحديد الشدة النسبية للفرد بطريقة تراعي نبض الراحة.</p></GuidePart>
        <WorkedExample><p>نطرح نبض الراحة من أقصى نبض:</p><code dir="ltr">{model.hrmax ?? 187} − {model.rhr ?? 60} = {model.hrr ?? 127} BPM</code><p>{model.hrr !== null ? 'ده الاحتياطي الحالي بناءً على بياناتك.' : 'الأرقام المعروضة مثال توضيحي لحد ما تدخل القيم المطلوبة.'} الرقم الناتج يُستخدم داخل معادلة Karvonen، مش مفروض توصل له كنبض فعلي أثناء الجري.</p></WorkedExample>
        <GuidePart title="ليه يختلف عن Heart Rate Recovery؟"><p>الاسمان اختصارهما HRR في بعض المراجع، لكن معناهما مختلف تمامًا: <b>Reserve</b> = أقصى نبض − نبض الراحة، أما <b>Recovery</b> = نبض نهاية المجهود − نبض بعد فترة من التوقف. الحاسبة تفصل بين الاتنين عشان ما يحصلش خلط.</p></GuidePart>
        <GuidePart title="امتى يكون الحساب غير صالح؟"><p>لا يمكن حساب الاحتياطي لو ما عندكش قيمة HRmax صالحة ونبض راحة مقاس، أو لو نبض الراحة مساوي أو أعلى من أقصى نبض المدخل. وهو قيمة تدريبية تعتمد على دقة المدخلات ولا تعتبر تقييمًا صحيًا منفردًا.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- D. THR ---------------- */
export function IntensitySlider({ s }: { s: Shared }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm text-mute">
        <label htmlFor="intensity">الشدة (Intensity)</label>
        <span className="text-lg font-bold text-fg" dir="ltr">{s.intensity}%</span>
      </div>
      <input id="intensity" type="range" min={0} max={100} step={1} value={s.intensity} onChange={(e) => s.setIntensity(Number(e.target.value))} className="w-full" dir="ltr" />
    </div>
  )
}

export function ThrTab({ s }: { s: Shared }) {
  const t = s.model.hrmax !== null ? targetHrMax(s.model.hrmax, s.intensity) : null
  return (
    <Panel title="Target Heart Rate (THR)" note="طريقة مبسطة تعتمد على HRmax فقط. لو عندك نبض راحة، قارنها بطريقة Karvonen التي تأخذ الاحتياطي في الاعتبار.">
      <Formula>Target HR = HRmax × (Intensity / 100)</Formula>
      <IntensitySlider s={s} />
      <div className="mt-4 max-w-xs">
        {s.model.hrmax === null ? needHrmax : <Stat label={`النبض المستهدف عند ${s.intensity}%`} value={t} />}
      </div>
      <Guide title="إزاي تحدد النبض المستهدف؟">
        <GuidePart title="إيه المقصود بـ Target Heart Rate؟"><p>النبض المستهدف هو <b>عدد ضربات القلب في الدقيقة</b> الذي يقابل مستوى شدة تختاره. هذه الحاسبة تستخدم طريقة <b>%HRmax</b>: نعبر عن الشدة كنسبة من أقصى نبض، من غير استخدام نبض الراحة.</p></GuidePart>
        <WorkedExample><p>عند HRmax = <b>{s.model.hrmax ?? 187}</b> وشدة <b>{s.intensity}%</b>:</p><code dir="ltr">{s.model.hrmax ?? 187} × ({s.intensity} / 100) = {t ?? Math.round(187 * s.intensity / 100)} BPM</code><p>{s.model.hrmax === null ? 'ده مثال تقريبي؛ أدخل العمر أو HRmax المقاس عشان تحصل على نتيجتك.' : 'هذه هي النتيجة بناءً على معادلة HRmax المختارة عندك.'}</p></WorkedExample>
        <GuidePart title="أختار نسبة كام؟"><p>بحسب American Heart Association، تُستخدم عادةً نسبة <b>50–70% من HRmax</b> للمجهود الهوائي المعتدل و<b>70–85%</b> للمجهود الأعلى شدة كدليل عام للبالغين. دي نطاقات إرشادية، مش حدود مناسبة لكل الأشخاص، خصوصًا عند تناول أدوية تؤثر على النبض أو وجود أمراض قلبية.</p></GuidePart>
        <GuidePart title="الفرق عن Karvonen"><p>عند اختيار 70% هنا، المقصود 70% من <b>HRmax نفسه</b>. لكن 70% في Karvonen تعني 70% من <b>احتياطي النبض</b> مضافًا إليه نبض الراحة؛ عشان كده النتيجتان مختلفتان ومش ممكن نفسر النسبتين على إنهما نفس الدرجة.</p><p>المصدر: <Source href="https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates">AHA Target Heart Rates</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- E. Karvonen ---------------- */
export function KarvonenTab({ s }: { s: Shared }) {
  const { model } = s
  const [from, setFrom] = useState('60')
  const [to, setTo] = useState('80')
  const f = parseNum(from)
  const t = parseNum(to)
  const rangeErr =
    from === '' || to === '' ? null
    : f === null || t === null || f < 0 || f > 100 || t < 0 || t > 100 ? 'الشدة لازم تكون بين 0 و100.'
    : f > t ? 'شدة البداية لازم تكون أقل من أو تساوي شدة النهاية.' : null

  const ready = model.hrmax !== null && model.rhr !== null && model.hrr !== null
  const rng = (fn: (p: number) => number | null) => (ready && !rangeErr && f !== null && t !== null ? [fn(f), fn(t)] : null)
  const kRange = rng((p) => karvonen(model.hrmax!, model.rhr!, p))
  const mRange = rng((p) => targetHrMax(model.hrmax!, p))

  return (
    <Panel
      title="Karvonen Formula"
      note={<>تعتمد على احتياطي النبض (HRR) فلا تُحسب بدون Resting HR. المصدر الأصلي: Karvonen, Kentala & Mustala, 1957. النِّسب الخاصة بـ%HRR و%HRmax ليست على نفس المقياس؛ لا تقارن رقم 70% في الطريقتين باعتباره نفس الحمل الفسيولوجي.</>}
    >
      <Formula>Target HR = Resting HR + [(HRmax − Resting HR) × Intensity]</Formula>
      {!ready ? (
        <Missing>{model.rhr === null ? 'معادلة Karvonen تحتاج Resting HR — اكتبه في المدخلات الأساسية.' : 'محتاج HRmax صالح علشان نحسب.'}</Missing>
      ) : (
        <>
          <h3 className="mb-2 font-bold">قيمة واحدة</h3>
          <IntensitySlider s={s} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Stat label="Karvonen" value={karvonen(model.hrmax!, model.rhr!, s.intensity)} />
            <Stat label="%HRmax (للمقارنة)" value={targetHrMax(model.hrmax!, s.intensity)} />
          </div>
          <h3 className="mb-2 mt-6 font-bold">نطاق شدة</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field id="k-from" label="من شدة" unit="%" value={from} onChange={setFrom} />
            <Field id="k-to" label="إلى شدة" unit="%" value={to} onChange={setTo} />
          </div>
          {rangeErr && <p role="alert" className="mt-2 text-sm text-z5">{rangeErr}</p>}
          {kRange && mRange && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Stat label="Karvonen" value={`${kRange[0]}–${kRange[1]}`} />
              <Stat label="%HRmax (للمقارنة)" value={`${mRange[0]}–${mRange[1]}`} />
            </div>
          )}
        </>
      )}
      <Guide title="معادلة Karvonen خطوة بخطوة">
        <GuidePart title="ليه بنحتاج نبض الراحة؟"><p>معادلة Karvonen تحدد النبض المستهدف باستخدام المجال المتاح بين الراحة والحد الأقصى؛ تبدأ من نبض الراحة ثم تضيف جزءًا من احتياطي النبض. بالتالي شخصان بنفس HRmax لكن نبض راحتهما مختلف لن يحصلَا بالضرورة على نفس Target HR عند نفس نسبة %HRR.</p></GuidePart>
        <WorkedExample><p>عند HRmax = <b>{model.hrmax ?? 187}</b> وRHR = <b>{model.rhr ?? 60}</b> وشدة <b>{s.intensity}% HRR</b>:</p><code dir="ltr">{model.rhr ?? 60} + [({model.hrmax ?? 187} − {model.rhr ?? 60}) × {s.intensity / 100}] = {ready ? karvonen(model.hrmax!, model.rhr!, s.intensity) : Math.round(60 + (187 - 60) * s.intensity / 100)} BPM</code><p>1) احسب الاحتياطي. 2) اضربه في النسبة المطلوبة. 3) أضف نبض الراحة. القيم فوق تتحول تلقائيًا إلى قيمك عند إدخال البيانات.</p></WorkedExample>
        <GuidePart title="نسبة الشدة هنا بتعني إيه؟"><p><b>60% HRR ليست 60% HRmax.</b> المعادلتان تستخدمان نقطتي بداية مختلفتين. لذلك لا تختار نسبة في واحدة وتفترض أنها ستعطي نفس معنى أو رقم النسبة في الأخرى. اختَر طريقة واحدة بشكل ثابت عند المتابعة والمقارنة بين الجلسات.</p></GuidePart>
        <GuidePart title="إمتى تكون مفيدة؟"><p>عند التخطيط لنطاقات التدريب الفردية مع وجود قياس موثوق لنبض الراحة وHRmax. وتظل النتيجة تقديرية إذا كانت قيمة HRmax من معادلة عمرية. الأساس التاريخي: <Source href="https://pubmed.ncbi.nlm.nih.gov/13470504/">Karvonen, Kentala & Mustala (1957)</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- F. Zones ---------------- */
export function ZoneChart({ zones, marker }: { zones: Zone[]; marker?: number | null }) {
  const lo = zones[0].low
  const hi = zones[4].high
  const span = hi - lo
  const pos = marker !== null && marker !== undefined && span > 0 ? Math.min(100, Math.max(0, ((marker - lo) / span) * 100)) : null
  return (
    <div dir="ltr" className="relative pt-5" role="img" aria-label="مخطط مناطق النبض">
      <div className="flex h-9 overflow-hidden rounded-lg">
        {zones.map((z) => (
          <div key={z.index} style={{ width: `${((z.high - z.low) / span) * 100}%`, background: ZONE_COLORS[z.index - 1] }} className="flex items-center justify-center text-xs font-bold text-ink">
            Z{z.index}
          </div>
        ))}
      </div>
      <div className="mt-1 flex text-[11px] text-mute">
        {zones.map((z) => (
          <div key={z.index} style={{ width: `${((z.high - z.low) / span) * 100}%` }}>{z.low}</div>
        ))}
        <span className="ms-auto">{hi}</span>
      </div>
      {pos !== null && (
        <div className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${pos}%` }}>
          <div className="text-[11px] font-bold text-pulse">{marker}</div>
          <div className="mx-auto h-[52px] w-0.5 bg-pulse" />
        </div>
      )}
    </div>
  )
}

export function useZones(s: Shared) {
  const nums = s.boundsStr.map((b) => parseNum(b))
  const bounds = nums.every((n): n is number => n !== null) ? (nums as number[]) : null
  const boundsErr = bounds === null ? 'كل الحدود لازم تكون أرقام.' : validateBounds(bounds)
  const zones = useMemo(
    () => (s.model.hrmax !== null && bounds && !boundsErr ? computeZones(s.zoneMethod, s.model.hrmax, s.model.rhr, bounds) : null),
    [s.model.hrmax, s.model.rhr, s.zoneMethod, bounds, boundsErr],
  )
  return { bounds: boundsErr ? null : bounds, boundsErr, zones }
}

export function ZoneMethodToggle({ s }: { s: Shared }) {
  const opts: [ZoneMethod, string][] = [['hrmax', '%HRmax'], ['hrr', '%HRR / Karvonen']]
  return (
    <div role="radiogroup" aria-label="طريقة حساب المناطق" className="inline-flex rounded-lg border border-line p-0.5">
      {opts.map(([k, l]) => (
        <button key={k} role="radio" aria-checked={s.zoneMethod === k} onClick={() => s.setZoneMethod(k)} dir="ltr" className={`rounded-md px-3 py-1.5 text-sm ${s.zoneMethod === k ? 'bg-pulse font-bold text-ink' : 'text-mute'}`}>{l}</button>
      ))}
    </div>
  )
}

export function ZonesTab({ s }: { s: Shared }) {
  const { zones, boundsErr } = useZones(s)
  const isDefault = s.boundsStr.join() === DEFAULT_BOUNDS.join()
  const needRhr = s.zoneMethod === 'hrr' && s.model.rhr === null
  return (
    <Panel
      title="Heart Rate Training Zones"
      note="تقسيم المناطق تدريبي وقابل للتخصيص، وليس حدودًا فسيولوجية ثابتة لكل شخص — تختلف الحدود والأسماء من منهج لآخر (نموذج 5 مناطق شائع، لكن هناك نماذج 3 و7 مناطق). عند الحدود المشتركة بين منطقتين تظهر نفس القيمة كنهاية لواحدة وبداية للتالية."
    >
      <ZoneMethodToggle s={s} />
      <p className="mt-2 text-xs text-mute" dir="ltr" style={{ textAlign: 'start' }}>
        {s.zoneMethod === 'hrmax' ? 'BPM = HRmax × %' : 'BPM = Resting HR + (HRmax − Resting HR) × %'}
      </p>
      <div className="mt-4">
        {s.model.hrmax === null ? needHrmax : needRhr ? <Missing>طريقة %HRR تحتاج Resting HR — اكتبه في المدخلات الأساسية.</Missing> : zones ? (
          <>
            <ZoneChart zones={zones} />
            <div dir="ltr" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {zones.map((z) => (
                <div key={z.index} dir="rtl" className="rounded-xl border border-line bg-panel2 p-3" style={{ borderTop: `4px solid ${ZONE_COLORS[z.index - 1]}` }}>
                  <div className="text-sm font-bold">{ZONE_NAMES[z.index - 1]}</div>
                  <div className="mt-1 text-xs text-mute" dir="ltr" style={{ textAlign: 'start' }}>{z.lowPct}% – {z.highPct}%</div>
                  <div className="mt-2 text-xl font-bold" dir="ltr" style={{ textAlign: 'start' }}>{z.low}–{z.high} <span className="text-xs font-normal text-mute">BPM</span></div>
                </div>
              ))}
            </div>
          </>
        ) : <Missing>صحّح حدود المناطق لعرض النتيجة.</Missing>}
      </div>

      <details className="mt-5 rounded-xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-bold">تعديل حدود المناطق يدويًا (%)</summary>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {s.boundsStr.map((b, i) => (
            <Field key={i} id={`b${i}`} label={i === 0 ? 'بداية Z1' : `نهاية Z${i}`} unit="%" value={b} onChange={(v) => s.setBoundsStr(s.boundsStr.map((x, j) => (j === i ? v : x)))} />
          ))}
        </div>
        {boundsErr && <p role="alert" className="mt-2 text-sm text-z5">{boundsErr}</p>}
        <button disabled={isDefault} onClick={() => s.setBoundsStr(DEFAULT_BOUNDS.map(String))} className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm enabled:hover:border-pulse disabled:opacity-40">رجوع للحدود الافتراضية</button>
      </details>
      <Guide title="إزاي تقرأ مناطق التدريب الخمس؟">
        <GuidePart title="معنى Training Zones"><p>المناطق تقسم نطاقًا من النبض إلى أجزاء لتسهيل تنظيم الحمل التدريبي ومتابعة الوقت داخل كل نطاق. التقسيم الافتراضي في الموقع <b>50–60–70–80–90–100%</b> هو نموذج تعليمي قابل للتعديل؛ <b>ليس معيارًا طبيًا ثابتًا، ولا يعني أن Zone 2 مثلًا نفس الشدة الفسيولوجية في كل نموذج</b>.</p></GuidePart>
        <GuidePart title="الفرق بين أسلوبَي الحساب"><p>في <b>%HRmax</b> نحسب الحد مباشرة من الحد الأقصى: HRmax × النسبة. في <b>%HRR</b> نحسبه من الراحة والاحتياطي: RHR + HRR × النسبة. لا تُستخدم نفس النسب لتصنيف الشدة بين الطريقتين بلا تمييز؛ فالنماذج المعيارية للشدة غالبًا تُعطي حدودًا مختلفة لكل طريقة.</p></GuidePart>
        <WorkedExample><p>لو HRmax = 187 BPM، فحد 70% بطريقة %HRmax يصبح <b>131 BPM</b> تقريبًا. أما لو RHR = 60 BPM، فحد 70% بطريقة %HRR يصبح <b>149 BPM</b> تقريبًا. اختر الطريقة أولًا ثم اعتمد حدودها الخاصة.</p><p>الحدود تظهر برقم BPM صحيح وقد يتكرر الرقم عند اتصال منطقتين نتيجة التقريب؛ الحد المشترك يُصنف في المنطقة التالية في حاسبة الشدة.</p></WorkedExample>
        <GuidePart title="هل المناطق الخمس تمثل عتبات اللاكتات أو التنفس؟"><p>مش بالضرورة. العتبات الفسيولوجية الفردية مثل VT1 وVT2 أو عتبة اللاكتات تحتاج بروتوكولات قياس مناسبة، ولا يمكن الجزم بمكانها من معادلة العمر وحدها. هذا التقسيم مناسب كمرجع تقريبي قابل للضبط، وليس بديلًا عن الاختبارات الميدانية أو المعملية.</p><p>للاطلاع على اختلاف نماذج تقسيم المناطق: <Source href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11946962/">INTERLIVE Network review</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- G. Intensity ---------------- */
export function IntensityTab({ s }: { s: Shared }) {
  const { model } = s
  const { bounds, zones } = useZones(s)
  const cur = parseNum(s.currentHr)
  const curErr = cur !== null && (cur < 30 || cur > 250) ? 'النبض الحالي لازم يكون بين 30 و250 BPM.' : undefined
  const ok = cur !== null && !curErr
  const pMax = ok && model.hrmax !== null ? percentHrMax(cur, model.hrmax) : null
  const pHrr = ok && model.hrmax !== null && model.rhr !== null ? percentHrr(cur, model.rhr, model.hrmax) : null
  const chosen = s.zoneMethod === 'hrmax' ? pMax : pHrr
  const pos = chosen !== null && bounds ? locateZone(chosen, bounds) : null

  return (
    <Panel
      title="Heart Rate Intensity Calculator"
      note="النسبتان تختلفان عادةً — عند النبض الأعلى من الراحة والأقل من الحد الأقصى تكون %HRR أصغر من %HRmax لنفس قراءة النبض. التنبيه يعتمد على الطريقة المختارة وعلى حدود المناطق الحالية."
    >
      <Formula>%HRmax = (Current HR / HRmax) × 100</Formula>
      <Formula>%HRR = [(Current HR − Resting HR) / (HRmax − Resting HR)] × 100</Formula>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Field id="cur" label="معدل النبض الحالي" unit="BPM" value={s.currentHr} onChange={s.setCurrentHr} error={curErr} />
        <div>
          <div className="mb-1 text-sm text-mute">المنطقة حسب طريقة</div>
          <ZoneMethodToggle s={s} />
        </div>
      </div>
      {model.hrmax === null ? needHrmax : !ok ? <Missing>اكتب النبض الحالي.</Missing> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="%HRmax" value={pMax} unit="%" />
            <Stat label="%HRR" value={pHrr} unit="%" sub={model.rhr === null ? 'محتاج Resting HR' : undefined} />
          </div>
          <div className="mt-4">
            {chosen === null ? (
              <Missing>الطريقة المختارة تحتاج Resting HR علشان تحدد المنطقة.</Missing>
            ) : !pos ? (
              <Missing>حدود المناطق غير صالحة — صحّحها من تبويب Training Zones.</Missing>
            ) : pos.kind === 'in' ? (
              <div className="rounded-xl p-4 font-bold text-ink" style={{ background: ZONE_COLORS[pos.zone - 1] }}>أنت الآن في {ZONE_NAMES[pos.zone - 1]}</div>
            ) : (
              <div role="alert" className="rounded-xl border border-z5 bg-z5/10 p-4 text-sm">
                {pos.kind === 'below' ? `الشدة (${chosen}%) أقل من بداية Zone 1 (${bounds![0]}%) — خارج نطاق المناطق المحددة.` : `الشدة (${chosen}%) أعلى من نهاية Zone 5 (${bounds![5]}%) — خارج نطاق المناطق المحددة. راجع قيمة HRmax أو صحة القياس.`}
              </div>
            )}
          </div>
          {zones && <div className="mt-4"><ZoneChart zones={zones} marker={cur} /></div>}
        </>
      )}
      <Guide title="تفسير شدة المجهود الحالية">
        <GuidePart title="نسبة %HRmax"><p>توضح كم تمثل قراءة نبضك الحالية من الحد الأقصى. مثلًا 150 BPM من أصل 187 BPM تساوي <b>80.2% HRmax</b>. الرقم وصف رياضي للمجهود بالنسبة للحد الأقصى المقدر أو المقاس.</p></GuidePart>
        <GuidePart title="نسبة %HRR"><p>توضح أين تقع القراءة بين نبض الراحة وأقصى نبض. عند HRmax = 187 وRHR = 60 وCurrent HR = 150، نحصل على <b>70.9% HRR</b>. عادةً، إذا كان النبض فوق الراحة وتحت أقصى نبض، ستكون <b>%HRR أقل من %HRmax لنفس القراءة</b> لأن خط الأساس مختلف.</p></GuidePart>
        <WorkedExample><p>حساب مباشر لنبض <b>{ok ? cur : 150} BPM</b>:</p><code dir="ltr">%HRmax = {ok && model.hrmax !== null ? `${cur} ÷ ${model.hrmax} × 100 = ${pMax}%` : '150 ÷ 187 × 100 = 80.2%'}</code><code dir="ltr">%HRR = {ok && pHrr !== null ? `(${cur} − ${model.rhr}) ÷ ${model.hrr} × 100 = ${pHrr}%` : '(150 − 60) ÷ (187 − 60) × 100 = 70.9%'}</code><p>المنطقة الملونة تعتمد على الطريقة التي تختارها وعلى حدودك الحالية من تبويب Training Zones.</p></WorkedExample>
        <GuidePart title="لو النتيجة خارج المناطق"><p>إذا كانت النسبة أقل من بداية أول منطقة أو أعلى من نهاية آخر منطقة، فالموقع سيعرض تنبيهًا حسابيًا فقط. هذا لا يعني تشخيصًا طبيًا. تأكد من قياس نبضك، وصحة HRmax ونبض الراحة، ومن توافق حدود المناطق مع طريقة حساب الشدة.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- H. Recovery ---------------- */
export function RecoveryTab({ s }: { s: Shared }) {
  const [r, setR] = useState(['', '', ''])
  const peak = parseNum(s.peakHr)
  const peakErr = peak !== null && (peak < 60 || peak > 250) ? 'نبض الذروة لازم يكون بين 60 و250 BPM.' : undefined
  const peakOk = peak !== null && !peakErr
  return (
    <Panel
      title="Heart Rate Recovery"
      note={<>هذا هو انخفاض النبض بعد التمرين — وليس Heart Rate Reserve. نتائج الاستشفاء تتأثر بنوع التمرين وطريقة التوقف (الوقوف أو الجلوس أو المشي) ولذلك لا نصنّفها "طبيعية" أو "غير طبيعية" بدون بروتوكول اختبار موثّق. للمرجع: <Source href="https://my.clevelandclinic.org/health/articles/23490-heart-rate-recovery">Cleveland Clinic</Source>. أي قلق صحي يُناقش مع الطبيب.</>}
    >
      <Formula>Recovery = Peak Exercise HR − HR at recovery time</Formula>
      <Field id="peak" label="نبض نهاية المجهود (Peak)" unit="BPM" value={s.peakHr} onChange={s.setPeakHr} error={peakErr} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((m, i) => {
          const v = parseNum(r[i])
          const bad = v !== null && (v < 30 || v > 250)
          const drop = peakOk && v !== null && !bad ? recoveryDrop(peak, v) : null
          return (
            <div key={m} className="space-y-2 rounded-xl border border-line p-3">
              <Field id={`rec${m}`} label={`النبض بعد ${m === 1 ? 'دقيقة' : m === 2 ? 'دقيقتين' : '3 دقائق'}`} unit="BPM" value={r[i]} onChange={(x) => setR(r.map((y, j) => (j === i ? x : y)))} error={bad ? '30–250 BPM' : undefined} />
              <Stat label={`Recovery ${m} min`} value={drop} sub={drop !== null && drop < 0 ? 'النبض أعلى من نبض الذروة — راجع القياس.' : undefined} />
            </div>
          )
        })}
      </div>
      {!peakOk && <div className="mt-3"><Missing>اكتب نبض نهاية المجهود أولًا.</Missing></div>}
      <Guide title="إزاي نفهم استشفاء معدل النبض؟">
        <GuidePart title="يعني إيه Heart Rate Recovery؟"><p>هو مقدار انخفاض ضربات القلب بعد انتهاء المجهود. بدل ما ننظر إلى نبض الراحة، نقارن نبض نهاية التمرين بالنبض بعد دقيقة أو دقيقتين أو ثلاث. كل قراءة لها فترة زمنية مختلفة ولا يصح التعامل معها كأنها مؤشر واحد مطابق.</p></GuidePart>
        <WorkedExample><p>لو نبض نهاية المجهود <b>{peakOk ? peak : 180} BPM</b> وبعد دقيقة أصبح <b>160 BPM</b>:</p><code dir="ltr">{peakOk ? peak : 180} − 160 = {(peakOk ? peak : 180) - 160} BPM</code><p>يعني حصل انخفاض بمقدار {(peakOk ? peak : 180) - 160} ضربة/دقيقة بعد 60 ثانية. لا تستنتج من قيمة منفردة وجود مشكلة أو عدمها.</p></WorkedExample>
        <GuidePart title="خطوات قياس متسقة"><p>سجل نبض نهاية <b>أشد جزء من المجهود</b> قبل التهدئة، ثم سجّل النبض بعد 1 و2 و3 دقائق حسب الحاجة. سجّل كذلك إذا كنت واقفًا أو جالسًا أو تمشي خلال الاستشفاء، ونوع المجهود، لأن طريقة التوقف تغير النتيجة. للمقارنة عبر الأيام حاول تثبيت نفس البروتوكول.</p></GuidePart>
        <GuidePart title="هل فيه رقم واحد طبيعي للجميع؟"><p>لا يمكن تقديم حكم طبي من رقم HR Recovery منفصل عن العمر والأدوية ونوع الاختبار وحالة الشخص وطريقة الاستشفاء. التقرير السريري يحتاج بروتوكولًا محددًا وتفسيرًا طبيًا عند اللزوم. المصدر: <Source href="https://my.clevelandclinic.org/health/articles/23490-heart-rate-recovery">Cleveland Clinic</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}

/* ---------------- I. Pulse ---------------- */
export function PulseTab() {
  const [beats, setBeats] = useState('')
  const [dur, setDur] = useState<'15' | '30' | '60' | 'custom'>('15')
  const [custom, setCustom] = useState('')
  const secs = dur === 'custom' ? parseNum(custom) : Number(dur)
  const b = parseNum(beats)
  const err = b !== null && (b < 0 || !Number.isInteger(b)) ? 'عدد النبضات لازم يكون رقمًا صحيحًا موجبًا.' : undefined
  const secErr = dur === 'custom' && secs !== null && (secs < 5 || secs > 300) ? 'المدة بين 5 و300 ثانية.' : undefined
  const bpm = b !== null && !err && secs !== null && !secErr ? pulseBpm(b, secs) : null
  const warn = bpm !== null && (bpm < 25 || bpm > 250)
  return (
    <Panel title="Pulse Rate Calculator" note="كلما طالت مدة العد قلّ أثر خطأ العدّ الواحد: خطأ نبضة في 15 ثانية = 4 BPM، وفي 60 ثانية = 1 BPM.">
      <Formula>BPM = (Number of Beats / Measurement Seconds) × 60</Formula>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="beats" label="عدد النبضات المحسوبة" value={beats} onChange={setBeats} error={err} />
        <div>
          <label htmlFor="dur" className="mb-1 block text-sm text-mute">مدة القياس</label>
          <select id="dur" value={dur} onChange={(e) => setDur(e.target.value as typeof dur)} className="w-full rounded-lg border border-line bg-panel2 px-3 py-2.5 text-lg">
            <option value="15">15 ثانية</option>
            <option value="30">30 ثانية</option>
            <option value="60">60 ثانية</option>
            <option value="custom">مدة مخصصة</option>
          </select>
        </div>
        {dur === 'custom' && <Field id="custom" label="المدة" unit="ثانية" value={custom} onChange={setCustom} error={secErr} />}
      </div>
      <div className="mt-4 max-w-xs"><Stat label="معدل النبض" value={bpm} /></div>
      {warn && <p role="alert" className="mt-3 text-sm text-z3">القيمة خارج نطاق التحقق التقريبي للأداة — تأكد من العدّ والمدة، ولا تعتمد عليها كتشخيص.</p>}
      <Guide title="حساب النبض من العدّ اليدوي">
        <GuidePart title="إزاي تحوّل عدد النبضات إلى BPM؟"><p><b>BPM</b> اختصار Beats Per Minute أي عدد ضربات القلب في الدقيقة. لو عدّيت نبضاتك خلال مدة أقل من دقيقة، اقسم العدد على الثواني ثم اضرب في 60. الموقع يسمح بـ15 أو 30 أو 60 ثانية أو مدة تحددها بنفسك.</p></GuidePart>
        <WorkedExample><p>إذا عددت <b>18 نبضة خلال 15 ثانية</b>:</p><code dir="ltr">(18 ÷ 15) × 60 = 72 BPM</code><p>{bpm !== null ? `بحسب مدخلاتك الحالية: ${b} نبضة خلال ${secs} ثانية = ${bpm} BPM.` : 'اكتب عدد النبضات والمدة بالأعلى لتحسب قراءتك الشخصية مباشرة.'}</p></WorkedExample>
        <GuidePart title="الفرق بين العد 15 و60 ثانية"><p>خطأ نبضة واحدة في 15 ثانية يغير النتيجة بـ<b>4 BPM</b>، لكن في 60 ثانية يغيرها بـ<b>1 BPM</b>. لذلك عدّ الدقيقة الكاملة غالبًا أفضل إذا كنت تريد قراءة أكثر استقرارًا، وخاصة إذا كان النبض غير منتظم؛ وإذا لاحظت عدم انتظام متكررًا فاطلب تقييمًا طبيًا.</p></GuidePart>
        <GuidePart title="طريقة القياس اليدوي"><p>استخدم السبابة والوسطى على الشريان في ناحية الإبهام من الرسغ، واضغط بخفة، ثم ابدأ العد بالساعة. لا تستخدم الإبهام لأنه قد يسبب التباسًا بنبضه. لا تضغط بقوة على الشرايين. المصدر: <Source href="https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979">Mayo Clinic</Source> · <Source href="https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates">AHA</Source>.</p></GuidePart>
      </Guide>
    </Panel>
  )
}
