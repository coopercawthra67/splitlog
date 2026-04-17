import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import WorkoutCard from '../components/WorkoutCard'
import WorkoutDetail from '../components/WorkoutDetail'

export default function Dashboard() {
  const [workouts, setWorkouts] = useState([])
  const [counts, setCounts] = useState({ workouts: 0, athletes: 0, groups: 0, month: 0 })
  const [selected, setSelected] = useState(null)

  async function load() {
    const [{ data: ws }, { data: aths }, { data: gs }] = await Promise.all([
      supabase.from('workouts').select('*, workout_athletes(athlete_id, profiles(*)), splits(*, profiles(*))').order('date', { ascending: false }).limit(5),
      supabase.from('profiles').select('id').eq('role', 'athlete'),
      supabase.from('groups').select('id'),
    ])
    const { data: allWs } = await supabase.from('workouts').select('id, date')
    const thisMonth = new Date().toISOString().slice(0, 7)
    setWorkouts(ws || [])
    setCounts({ workouts: allWs?.length || 0, athletes: aths?.length || 0, groups: gs?.length || 0, month: allWs?.filter(w => w.date?.startsWith(thisMonth)).length || 0 })
  }

  useEffect(() => { load(); window.addEventListener('workouts-updated', load); return () => window.removeEventListener('workouts-updated', load) }, [])

  const stats = [
    { l: 'Workouts', v: counts.workouts, c: '#c8ff3e' },
    { l: 'Athletes', v: counts.athletes, c: '#3ecfff' },
    { l: 'Groups', v: counts.groups, c: '#ffb347' },
    { l: 'This Month', v: counts.month, c: '#a78bfa' },
  ]

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Welcome back, Coach</div>

      <div className="grid4" style={{ marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.l} className="statcard">
            <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 34, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Recent Sessions</div>
      {workouts.length === 0 ? <p className="empty">No workouts logged yet. Hit "+ Log Workout" to get started.</p>
        : workouts.map(w => <WorkoutCard key={w.id} workout={w} onClick={() => setSelected(w)} />)}

      {selected && <WorkoutDetail workout={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
