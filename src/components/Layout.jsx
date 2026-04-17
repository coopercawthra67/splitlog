import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { useState } from 'react'
import WorkoutForm from './WorkoutForm'

export default function Layout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isCoach = profile?.role === 'coach'
  const [showForm, setShowForm] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const coachNav = [
    { to: '/dashboard', icon: '▪', label: 'Dashboard' },
    { to: '/workouts', icon: '📋', label: 'All Workouts' },
    { to: '/athletes', icon: '👥', label: 'Athletes' },
    { to: '/groups', icon: '🏟', label: 'Training Groups' },
    { to: '/search', icon: '🔍', label: 'Search & Filter' },
  ]
  const athleteNav = [
    { to: '/my-workouts', icon: '🏃', label: 'My Workouts' },
    { to: '/my-splits', icon: '⏱', label: 'My Splits' },
    { to: '/my-groups', icon: '🏟', label: 'My Groups' },
  ]
  const navItems = isCoach ? coachNav : athleteNav

  const initials = profile?.avatar_initials || profile?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??'
  const color = profile?.color || '#c8ff3e'

  return (
    <>
      <div className="sidebar">
        {/* Logo */}
        <div className="row" style={{ gap: 8, marginBottom: 20, paddingLeft: 4 }}>
          <div style={{ width: 30, height: 30, background: '#c8ff3e', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#c8ff3e', fontStyle: 'italic', letterSpacing: -.5 }}>SplitLog</span>
        </div>

        {/* User box */}
        <div style={{ background: '#1c1f27', border: '1px solid #2a2e3a', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="av" style={{ width: 32, height: 32, background: color + '22', color, fontSize: 11 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name}</div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>{isCoach ? 'Coach' : 'Athlete'}</div>
            </div>
          </div>
          <button className="ghost sm" style={{ width: '100%', fontSize: 11 }} onClick={signOut}>Sign out</button>
        </div>

        {/* Nav */}
        {navItems.map(n => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => 'navitem' + (isActive ? ' active' : '')}>
            <span style={{ fontSize: 14 }}>{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}

        {/* Coach action buttons */}
        {isCoach && (
          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn" style={{ width: '100%', fontSize: 13 }} onClick={() => setShowForm(true)}>+ Log Workout</button>
          </div>
        )}
      </div>

      <div className="main">
        <Outlet />
      </div>

      {showForm && <WorkoutForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); window.dispatchEvent(new Event('workouts-updated')) }} />}
    </>
  )
}
