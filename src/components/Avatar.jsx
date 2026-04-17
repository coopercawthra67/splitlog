import React from 'react'

export default function Avatar({ profile, size = 36 }) {
  if (!profile) return <div className="av" style={{ width: size, height: size, background: '#2a2e3a', color: '#6b7280', fontSize: size * 0.35 }}>?</div>
  const initials = profile.avatar_initials || profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const color = profile.color || '#c8ff3e'
  return (
    <div className="av" style={{ width: size, height: size, background: color + '22', color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}
