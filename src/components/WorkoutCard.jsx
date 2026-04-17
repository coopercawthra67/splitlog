import React from 'react'
import Avatar from './Avatar'

function weatherIcon(w) {
  const l = (w || '').toLowerCase()
  if (l.includes('rain')) return '🌧'
  if (l.includes('cloud') || l.includes('over')) return '☁️'
  if (l.includes('sun')) return '☀️'
  if (l.includes('snow')) return '❄️'
  return '🌤'
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WorkoutCard({ workout, onClick }) {
  const athletes = workout.workout_athletes?.map(wa => wa.profiles) || []
  return (
    <div className="wcard" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{workout.title}</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 7 }}>
            <span className="badge ba">{workout.type}</span>
            <span className="muted">{fmtDate(workout.date)}</span>
            {workout.time_of_day && <span className="muted">· {workout.time_of_day}</span>}
            <span className="muted">· {workout.location || '—'}</span>
            <span style={{ fontSize: 15 }}>{weatherIcon(workout.weather)}</span>
            {workout.weather && <span className="muted">{workout.weather}</span>}
          </div>
        </div>
        <div className="row" style={{ gap: 4, flexShrink: 0, marginLeft: 12 }}>
          {athletes.map(a => a && <Avatar key={a.id} profile={a} size={28} />)}
        </div>
      </div>
    </div>
  )
}
