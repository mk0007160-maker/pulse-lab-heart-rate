import type { ReactNode } from 'react'

export const ZONE_COLORS = ['#5bc0eb', '#4ade80', '#facc15', '#fb923c', '#ef4444'] as const
export const ZONE_NAMES = ['Zone 1 · بداية المجال', 'Zone 2 · منخفضة نسبيًا', 'Zone 3 · وسط المجال', 'Zone 4 · مرتفعة نسبيًا', 'Zone 5 · أعلى المجال'] as const

export function Field(props: {
  label: string
  unit?: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  optional?: boolean
  placeholder?: string
  id: string
}) {
  const { label, unit, value, onChange, error, hint, optional, placeholder, id } = props
  return (
    <div className="field-block">
      <label htmlFor={id} className="field-label">
        <span>{label}</span>
        {optional && <span className="optional-pill">اختياري</span>}
      </label>
      <div className="field-wrap">
        <input
          id={id}
          type="text"
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`number-field ${error ? 'field-error' : ''} ${unit ? 'with-unit' : ''}`}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
      {error ? <p id={`${id}-err`} role="alert" className="field-message field-danger">{error}</p> : hint ? <p id={`${id}-hint`} className="field-message">{hint}</p> : null}
    </div>
  )
}

export function Panel({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="calculator-panel">
      <div className="section-head">
        <span className="section-indicator" aria-hidden>⌁</span>
        <h2>{title}</h2>
      </div>
      <div className="calculator-content">{children}</div>
      {note && <div className="panel-note"><span aria-hidden className="note-symbol">i</span><div>{note}</div></div>}
    </section>
  )
}

export function Stat({ label, value, unit = 'BPM', sub }: { label: string; value: string | number | null; unit?: string; sub?: string }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value" dir="ltr">
        {value === null ? <span className="stat-empty">—</span> : <><span>{value}</span><span className="stat-unit">{unit}</span></>}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function Missing({ children }: { children: ReactNode }) {
  return <div className="missing-state"><span aria-hidden>◌</span><p>{children}</p></div>
}

export function Formula({ children }: { children: ReactNode }) {
  return <div className="formula-box"><span className="formula-label">المعادلة</span><code dir="ltr">{children}</code></div>
}

export function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="source-link">{children} <span aria-hidden>↗</span></a>
}

export function Guide({ title = 'الشرح العلمي بالتفصيل', children }: { title?: string; children: ReactNode }) {
  return (
    <section className="guide" aria-label={title}>
      <div className="guide-heading"><span className="guide-icon" aria-hidden>?</span><div><p className="guide-eyebrow">LEARN THE SCIENCE</p><h3>{title}</h3></div></div>
      <div className="guide-body">{children}</div>
    </section>
  )
}

export function GuidePart({ title, children }: { title: string; children: ReactNode }) {
  return <div className="guide-part"><h4>{title}</h4><div className="guide-prose">{children}</div></div>
}

export function WorkedExample({ title = 'مثال بالأرقام', children }: { title?: string; children: ReactNode }) {
  return <div className="example-box"><div className="example-heading">{title}</div><div>{children}</div></div>
}
