import { T } from '../constants/tokens'

interface RoundCheckboxProps {
  checked: boolean
  onChange: () => void
  size?: number
}

export function RoundCheckbox({ checked, onChange, size = 22 }: RoundCheckboxProps) {
  return (
    <label
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: checked ? `2px solid ${T.green}` : '2px solid #D0D0D0',
        background: checked ? T.green : 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s ease',
        boxSizing: 'border-box',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      {checked && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </label>
  )
}
