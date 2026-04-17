import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import WorkoutDetail from '../components/WorkoutDetail'
import Avatar from '../components/Avatar'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function weatherIcon(w) {
  const l = (w || '').toLowerCase()
  if (l.includes('rain')) return '🌧'
  if (l.includes('cloud') || l.includes('over')) return '☁️'
  if (l.includes('sun')) return '☀️'
  return '🌤'
}

export default function MyWorkouts() {
  const { profile, refetchProfile } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('workout_athletes').select('workouts(*, splits(*, profiles(*)), workout_athletes(athlete_id, profiles(*)))').eq('athlete_id', profile.id)
      .then(({ data }) => {
        const ws = data?.map(r => r.workouts).filter(Boolean).sort((a, b) => b.date?.localeCompare(a.date)) || []
        setWorkouts(ws)
      })
  }, [profile])

  async function toggleShare() {
    const newVal = !profile.share_enabled
    await supabase.from('profiles').update({ share_enabled: newVal }).eq('id', profile.id)
    refetchProfile()
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 20, gap: 14 }}>
        <Avatar profile={profile} size={50} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, fontStyle: 'italic', letterSpacing: -.5 }}>{profile?.name}</div>
          <div className="muted" style={{ marginTop: 2 }}>{workouts.length} workouts logged</div>
        </div>
      </div>

      <div style={{ background: '#0d1a00', border: '1px solid #1a2600', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#c8ff3e', marginBottom: 3 }}>Share splits with group</div>
          <div style={{ fontSize: 12, color: '#4b7a00' }}>Teammates can see your splits in the group feed</div>
        </div>
        <div className={`toggle ${profile?.share_enabled ? 'on' : 'off'}`} onClick={toggleShare} />
      </div>

      {workouts.length === 0 && <p className="empty">No workouts yet. Your coach will add you to sessions.</p>}
      {workouts.map(w => {
        const mySplits = w.splits?.filter(s => s.athlete_id === profile?.id).slice(0, 4) || []
        return (
          <div key={w.id} className="wcard" onClick={() => setSelected(w)}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{w.title}</div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 7, marginBottom: mySplits.length ? 10 : 0 }}>
              <span className="badge ba">{w.type}</span>
              <span className="muted">{fmtDate(w.date)}</span>
              <span className="muted">· {w.location || '—'}</span>
              <span style={{ fontSize: 15 }}>{weatherIcon(w.weather)}</span>
            </div>
            {mySplits.length > 0 && (
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {mySplits.map(r => (
                  <span key={r.id} className="mono" style={{ fontSize: 11, background: '#1c1f27', padding: '3px 8px', borderRadius: 6, color: '#c8ff3e' }}>{r.distance} {r.time}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {selected && <WorkoutDetail workout={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
