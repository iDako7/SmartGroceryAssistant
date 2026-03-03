import React from 'react'
import { T } from '../constants/tokens'

interface TinyBtnProps {
  onClick?: () => void
  children: React.ReactNode
  title?: string
  'data-testid'?: string
}

export function TinyBtn({ onClick, children, title, 'data-testid': testId }: TinyBtnProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      title={title}
      style={{
        padding: 3, background: 'none', border: 'none', cursor: 'pointer',
        color: T.textTer, opacity: 0.7, display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
