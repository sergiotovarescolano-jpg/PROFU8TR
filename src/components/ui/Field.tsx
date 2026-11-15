import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldBase =
  'w-full min-h-12 rounded-xl border border-flare-400/25 bg-[#19080a]/80 px-4 text-base text-white placeholder:text-white/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] transition-[border-color,box-shadow] duration-200 focus:border-ice-400 focus:shadow-[inset_0_0_14px_-4px_rgba(64,220,255,0.6),0_0_18px_-4px_rgba(64,220,255,0.75)] focus:outline-none'

interface WrapperProps {
  label: string
  children: ReactNode
}

export function FieldWrapper({ label, children }: WrapperProps) {
  return (
    <label className="mb-3 block">
      <span className="field-label">{label}</span>
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
