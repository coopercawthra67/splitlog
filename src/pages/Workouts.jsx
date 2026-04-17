import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import WorkoutCard from '../components/WorkoutCard'
import WorkoutDetail from '../components/WorkoutDetail'
import WorkoutForm from '../components/WorkoutForm'

export default function Workouts() {
  const [workouts, setWorkouts] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const { data } = await supabase.from('workouts').select('*, workout_athletes(athlete_id, profiles(*)), splits(*, profiles(*))').order('date', { ascending: false })
    setWorkouts(data || [])
  }

  useEffect(() => { load(); window.addEventListener('workouts-updated', load); return () => window.removeEventListener('workouts-updated', load) }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="page-title">All Workouts</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>{workouts.length} sessions</div>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Log Workout</button>
      </div>

      {workouts.length === 0 ? <p className="empty">No workouts yet.</p>
        : workouts.map(w => <WorkoutCard key={w.id} workout={w} onClick={() => setSelected(w)} />)}

      {selected && <WorkoutDetail workout={selected} onClose={() => setSelected(null)} />}
      {showForm && <WorkoutForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
