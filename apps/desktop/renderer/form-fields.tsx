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
  return (
    <label>
      {label}
      {multiline ? (
        <textarea
          name={name}
          defaultValue={value}
          required={!optional}
          rows={3}
          maxLength={20000}
        />
      ) : (
        <input
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
