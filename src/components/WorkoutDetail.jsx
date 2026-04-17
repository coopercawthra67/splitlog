import React from 'react'
import Avatar from './Avatar'
import { useAuth } from '../App'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function weatherIcon(w) {
  const l = (w || '').toLowerCase()
  if (l.includes('rain')) return '🌧'
  if (l.includes('cloud') || l.includes('over')) return '☁️'
  if (l.includes('sun')) return '☀️'
  if (l.includes('snow')) return '❄️'
  return '🌤'
}
function bestIdx(reps) {
  let min = Infinity, idx = 0
  reps.forEach((r, i) => {
    const v = parseFloat((r.time || '').replace(':', '.')) || Infinity
    if (v < min) { min = v; idx = i }
  })
  return idx
}

export default function WorkoutDetail({ workout, onClose }) {
  const { profile } = useAuth()
  const isCoach = profile?.role === 'coach'

  // Group splits by athlete
  const splitsByAthlete = {}
  const athleteProfiles = {}
  ;(workout.splits || []).forEach(sp => {
    if (!splitsByAthlete[sp.athlete_id]) splitsByAthlete[sp.athlete_id] = []
    splitsByAthlete[sp.athlete_id].push(sp)
    if (sp.profiles) athleteProfiles[sp.athlete_id] = sp.profiles
  })
  // Sort each athlete's splits by rep_number
  Object.values(splitsByAthlete).forEach(arr => arr.sort((a, b) => a.rep_number - b.rep_number))

  const athleteIds = Object.keys(splitsByAthlete).filter(aid => isCoach || aid === profile?.id)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{workout.title}</div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="badge ba">{workout.type}</span>
              <span className="muted">{fmtDate(workout.date)}</span>
              {workout.time_of_day && <span className="muted">· {workout.time_of_day}</span>}
              <span style={{ fontSize: 16 }}>{weatherIcon(workout.weather)}</span>
              {workout.weather && <span className="muted">{workout.weather}</span>}
            </div>
          </div>
          <button className="ghost sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="grid2" style={{ marginBottom: 18 }}>
          {[['Location', workout.location || '—'], ['Surface', workout.surface || '—']].map(([k, v]) => (
            <div key={k} style={{ background: '#1c1f27', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 3, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontSize: 14 }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="lbl" style={{ marginBottom: 12 }}>Athletes & Splits</div>
        {athleteIds.length === 0 && <p className="muted">No splits recorded.</p>}
        {athleteIds.map(aid => {
          const reps = splitsByAthlete[aid]
          const u = athleteProfiles[aid]
          const best = bestIdx(reps)
          return (
            <div key={aid} style={{ marginBottom: 18 }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <Avatar profile={u} size={30} />
                <span style={{ fontWeight: 600, marginLeft: 8 }}>{u?.name || '?'}</span>
                <span className="badge bb" style={{ marginLeft: 'auto' }}>{reps.length} reps</span>
              </div>
              <div style={{ background: '#1c1f27', borderRadius: 8, overflow: 'hidden' }}>
                {reps.map((r, i) => (
                  <div key={r.id} className="splitrow">
                    <span style={{ flex: 1, fontSize: 13, color: '#6b7280' }}>Rep {r.rep_number} · {r.distance}</span>
                    <span className="mono" style={{ fontSize: 16, color: i === best ? '#c8ff3e' : '#e8e6e0' }}>{r.time}</span>
                    {i === best && <span style={{ marginLeft: 8, fontSize: 10, color: '#c8ff3e', fontWeight: 700 }}>BEST</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {isCoach && workout.coach_notes && (
          <div style={{ background: '#0d1a00', border: '1px solid #1a2600', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#4b7a00', marginBottom: 6 }}>🔒 Coach Notes (Private)</div>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>{workout.coach_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
