import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function Athletes() {
  const [athletes, setAthletes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('profiles').select('*, group_members(groups(*)), workout_athletes(workout_id), splits(id)').eq('role', 'athlete')
      .then(({ data }) => setAthletes(data || []))
  }, [])

  const COLORS = ['#3ecfff','#f472b6','#fb923c','#60a5fa','#a78bfa','#34d399','#fbbf24','#f87171']

  return (
    <div>
      <div className="page-title" style={{ marginBottom: 24 }}>Athletes</div>
      <div className="grid2" style={{ gap: 14 }}>
        {athletes.map((a, idx) => {
          const groups = a.group_members?.map(gm => gm.groups).filter(Boolean) || []
          const workoutCount = new Set(a.workout_athletes?.map(wa => wa.workout_id)).size
          const repCount = a.splits?.length || 0
          const color = a.color || COLORS[idx % COLORS.length]
          return (
            <div key={a.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/search?aid=${a.id}`)}>
              <div className="row" style={{ marginBottom: 14 }}>
                <Avatar profile={{ ...a, color }} size={44} />
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 5 }}>{a.name}</div>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 4 }}>
                    {groups.map(g => <span key={g.id} className="badge" style={{ background: (g.color || '#3ecfff') + '20', color: g.color || '#3ecfff', fontSize: 10 }}>{g.name}</span>)}
                  </div>
                </div>
              </div>
              <div className="grid2" style={{ gap: 8 }}>
                {[['Workouts', workoutCount], ['Total Reps', repCount]].map(([l, v]) => (
                  <div key={l} style={{ background: '#1c1f27', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 3, textTransform: 'uppercase' }}>{l}</div>
                    <div className="mono" style={{ fontSize: 24, color }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {athletes.length === 0 && <p className="empty">No athletes yet. Invite them via Supabase Auth.</p>}
    </div>
  )
}
