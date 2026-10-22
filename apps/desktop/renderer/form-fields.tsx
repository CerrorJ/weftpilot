import { useId } from 'react'

interface TextFieldProps {
  label: string
  name: string
  value?: string
  multiline?: boolean
  optional?: boolean
  placeholder?: string
}
export const TextField = ({
  label,
  name,
  value,
  multiline,
  optional,
  placeholder,
}: TextFieldProps) => {
  const labelId = useId()
  return (
    <label>
      <span id={labelId}>{label}</span>
      {multiline ? (
        <textarea
          aria-labelledby={labelId}
          name={name}
          defaultValue={value}
          required={!optional}
          rows={3}
          maxLength={20000}
        />
      ) : (
        <input
          aria-labelledby={labelId}
          name={name}
          defaultValue={value}
          required={!optional}
          placeholder={placeholder}
          maxLength={200}
        />
      )}
    </label>
  )
}
export const formText = (form: FormData, name: string) => String(form.get(name) ?? '').trim()
