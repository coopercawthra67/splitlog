import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import WorkoutDetail from '../components/WorkoutDetail'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MySplits() {
  const { profile } = useAuth()
  const [splits, setSplits] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('splits')
      .select('*, workouts(*, splits(*, profiles(*)), workout_athletes(athlete_id, profiles(*)))')
      .eq('athlete_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSplits(data || []))
  }, [profile])

  async function openWorkout(sp) {
    setSelected(sp.workouts)
  }

  return (
    <div>
      <div className="page-title">My Splits</div>
      <div className="page-sub">{splits.length} recorded splits</div>

      {splits.length === 0 && <p className="empty">No splits recorded yet.</p>}
      {splits.map(sp => (
        <div key={sp.id} className="wcard" style={{ display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => openWorkout(sp)}>
          <div className="mono" style={{ fontSize: 20, color: '#c8ff3e', minWidth: 90 }}>{sp.time}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{sp.distance}</div>
            <div className="muted" style={{ marginTop: 2 }}>{sp.workouts?.title} · {fmtDate(sp.workouts?.date)}</div>
          </div>
          <span className="badge ba">{sp.workouts?.type}</span>
        </div>
      ))}

      {selected && <WorkoutDetail workout={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
