import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldBase =
  'w-full min-h-12 rounded-xl border border-border bg-surface-2 px-4 text-base text-white placeholder:text-white/35 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] transition-shadow focus:border-gold-400 focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.5),0_0_0_3px_rgba(245,181,68,0.2)] focus:outline-none'

interface WrapperProps {
  label: string
  children: ReactNode
}

export function FieldWrapper({ label, children }: WrapperProps) {
  return (
    <label className="mb-3 block">
      <span className="font-condensed mb-1.5 block text-base font-bold tracking-wider text-gold-200/85 uppercase">{label}</span>
      {children}
    </label>
  )
}

export function Input({ label, className = '', ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label}>
      <input className={`${fieldBase} ${className}`} {...rest} />
    </FieldWrapper>
  )
}

export function Textarea({
  label,
  className = '',
  ...rest
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label}>
      <textarea className={`${fieldBase} min-h-24 py-3 ${className}`} {...rest} />
    </FieldWrapper>
  )
}

interface SelectOption {
  value: string
  label: string
}

export function Select({
  label,
  options,
  className = '',
  ...rest
}: { label: string; options: SelectOption[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper label={label}>
      <select className={`${fieldBase} ${className}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
