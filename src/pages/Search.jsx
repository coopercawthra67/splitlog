import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import WorkoutCard from '../components/WorkoutCard'
import WorkoutDetail from '../components/WorkoutDetail'
import Avatar from '../components/Avatar'

const WTYPES = ['Track', 'Road', 'Trail', 'Grass', 'Indoor', 'Cross Country']

export default function Search() {
  const [searchParams] = useSearchParams()
  const [athletes, setAthletes] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [selected, setSelected] = useState(null)
  const [showSplitSearch, setShowSplitSearch] = useState(false)
  const [splitQuery, setSplitQuery] = useState('')
  const [splitResults, setSplitResults] = useState([])

  const [aid, setAid] = useState(searchParams.get('aid') || '')
  const [type, setType] = useState('')
  const [loc, setLoc] = useState('')
  const [df, setDf] = useState('')
  const [dt, setDt] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { supabase.from('profiles').select('*').eq('role', 'athlete').then(({ data }) => setAthletes(data || [])) }, [])

  useEffect(() => {
    async function run() {
      let query = supabase.from('workouts').select('*, workout_athletes(athlete_id, profiles(*)), splits(*, profiles(*))').order('date', { ascending: false })
      if (df) query = query.gte('date', df)
      if (dt) query = query.lte('date', dt)
      if (type) query = query.eq('type', type)
      if (loc) query = query.ilike('location', `%${loc}%`)
      if (q) query = query.ilike('title', `%${q}%`)
      const { data } = await query
      let filtered = data || []
      if (aid) filtered = filtered.filter(w => w.workout_athletes?.some(wa => wa.athlete_id === aid))
      setWorkouts(filtered)
    }
    run()
  }, [aid, type, loc, df, dt, q])

  async function searchSplits(val) {
    setSplitQuery(val)
    if (!val.trim()) { setSplitResults([]); return }
    const { data } = await supabase.from('splits').select('*, profiles(*), workouts(title, date, location)').or(`time.ilike.%${val}%,distance.ilike.%${val}%`).limit(40)
    setSplitResults(data || [])
  }

  return (
    <div>
      <div className="page-title">Search & Filter</div>
      <div className="page-sub">Find workouts by any field</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid2" style={{ marginBottom: 12 }}>
          <div>
            <label className="lbl">Athlete</label>
            <select value={aid} onChange={e => setAid(e.target.value)}>
              <option value="">All athletes</option>
              {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="">All types</option>
              {WTYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="lbl">Location</label><input value={loc} onChange={e => setLoc(e.target.value)} placeholder="Location…" /></div>
          <div><label className="lbl">Date From</label><input type="date" value={df} onChange={e => setDf(e.target.value)} /></div>
          <div><label className="lbl">Date To</label><input type="date" value={dt} onChange={e => setDt(e.target.value)} /></div>
          <div><label className="lbl">Keyword</label><input value={q} onChange={e => setQ(e.target.value)} placeholder="Workout title…" /></div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="ghost sm" onClick={() => { setAid(''); setType(''); setLoc(''); setDf(''); setDt(''); setQ('') }}>Clear all</button>
          <button className="ghost sm" onClick={() => setShowSplitSearch(true)}>⚡ Search split times</button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>{workouts.length} result{workouts.length !== 1 ? 's' : ''}</div>
      {workouts.map(w => <WorkoutCard key={w.id} workout={w} onClick={() => setSelected(w)} />)}
      {workouts.length === 0 && <p className="empty">No workouts match your filters.</p>}

      {selected && <WorkoutDetail workout={selected} onClose={() => setSelected(null)} />}

      {showSplitSearch && (
        <div className="overlay" onClick={() => setShowSplitSearch(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#c8ff3e', fontStyle: 'italic' }}>Split Search</div>
                <div className="muted" style={{ marginTop: 3 }}>Find any split across all sessions</div>
              </div>
              <button className="ghost sm" onClick={() => setShowSplitSearch(false)}>✕ Close</button>
            </div>
            <input autoFocus value={splitQuery} onChange={e => searchSplits(e.target.value)} placeholder="Type a time (e.g. 54.9) or distance (400m, Mile 1)…" style={{ marginBottom: 14 }} />
            {splitResults.length === 0 && splitQuery && <p style={{ color: '#6b7280', textAlign: 'center', padding: 24, fontSize: 14 }}>No splits found.</p>}
            {!splitQuery && <p style={{ color: '#4b5563', textAlign: 'center', padding: 40, fontSize: 14 }}>Type above to search…</p>}
            {splitResults.map(sp => (
              <div key={sp.id} className="row" style={{ padding: '11px 0', borderBottom: '1px solid #1c1f27', gap: 12 }}>
                <Avatar profile={sp.profiles} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sp.profiles?.name}</div>
                  <div className="muted" style={{ marginTop: 2 }}>{sp.workouts?.title} · {sp.workouts?.date} · {sp.workouts?.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 17, color: sp.profiles?.color || '#c8ff3e' }}>{sp.time}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{sp.distance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
