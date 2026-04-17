import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import Avatar from './Avatar'

const WTYPES = ['Track', 'Road', 'Trail', 'Grass', 'Indoor', 'Cross Country']
const SURFS = ['Rubber', 'Asphalt', 'Grass', 'Gravel', 'Trail', 'Turf', 'Dirt']

export default function WorkoutForm({ onClose, onSaved, editWorkout }) {
  const { profile } = useAuth()
  const [athletes, setAthletes] = useState([])
  const [title, setTitle] = useState(editWorkout?.title || '')
  const [type, setType] = useState(editWorkout?.type || 'Track')
  const [date, setDate] = useState(editWorkout?.date || new Date().toISOString().slice(0, 10))
  const [timeOfDay, setTimeOfDay] = useState(editWorkout?.time_of_day || '')
  const [location, setLocation] = useState(editWorkout?.location || '')
  const [surface, setSurface] = useState(editWorkout?.surface || 'Rubber')
  const [weather, setWeather] = useState(editWorkout?.weather || '')
  const [notes, setNotes] = useState(editWorkout?.coach_notes || '')
  const [selIds, setSelIds] = useState(editWorkout?.workout_athletes?.map(wa => wa.athlete_id) || [])
  const [splits, setSplits] = useState({}) // { athleteId: [{dist, time}] }
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug] = useState(false)
  const [saving, setSaving] = useState(false)
  const titleRef = useRef()

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'athlete').then(({ data }) => setAthletes(data || []))
  }, [])

  // Title autocomplete
  useEffect(() => {
    if (title.length < 3) { setSuggestions([]); setShowSug(false); return }
    supabase.from('workouts').select('id,title,type,location,surface').ilike('title', `%${title}%`).limit(5)
      .then(({ data }) => { setSuggestions(data || []); setShowSug((data || []).length > 0) })
  }, [title])

  function toggleAthlete(id) {
    setSelIds(prev => {
      if (prev.includes(id)) {
        setSplits(s => { const n = { ...s }; delete n[id]; return n })
        return prev.filter(x => x !== id)
      }
      setSplits(s => ({ ...s, [id]: [{ dist: '', time: '' }] }))
      return [...prev, id]
    })
  }

  function addRep(aid) { setSplits(s => ({ ...s, [aid]: [...s[aid], { dist: '', time: '' }] })) }
  function removeRep(aid, i) { setSplits(s => ({ ...s, [aid]: s[aid].filter((_, j) => j !== i) })) }
  function setRep(aid, i, field, val) {
    setSplits(s => ({ ...s, [aid]: s[aid].map((r, j) => j === i ? { ...r, [field]: val } : r) }))
  }

  function fillFrom(w) {
    setTitle(w.title); setType(w.type || 'Track')
    setLocation(w.location || ''); setSurface(w.surface || 'Rubber')
    setShowSug(false)
  }

  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      let workoutId = editWorkout?.id
      if (editWorkout) {
        await supabase.from('workouts').update({ title, type, date, time_of_day: timeOfDay, location, surface, weather, coach_notes: notes }).eq('id', workoutId)
        await supabase.from('workout_athletes').delete().eq('workout_id', workoutId)
        await supabase.from('splits').delete().eq('workout_id', workoutId)
      } else {
        const { data } = await supabase.from('workouts').insert({ title, type, date, time_of_day: timeOfDay, location, surface, weather, coach_notes: notes, coach_id: profile.id }).select().single()
        workoutId = data.id
      }
      // Insert workout_athletes
      if (selIds.length) {
        await supabase.from('workout_athletes').insert(selIds.map(aid => ({ workout_id: workoutId, athlete_id: aid })))
      }
      // Insert splits
      const splitRows = []
      selIds.forEach(aid => {
        ;(splits[aid] || []).forEach((r, i) => {
          if (r.dist || r.time) splitRows.push({ workout_id: workoutId, athlete_id: aid, rep_number: i + 1, distance: r.dist, time: r.time })
        })
      })
      if (splitRows.length) await supabase.from('splits').insert(splitRows)
      onSaved()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#c8ff3e', fontStyle: 'italic' }}>{editWorkout ? 'Edit' : 'Log'} Workout</span>
          <button className="ghost sm" onClick={onClose}>✕ Close</button>
        </div>

        <div className="grid2" style={{ marginBottom: 16 }}>
          {/* Title full width */}
          <div style={{ gridColumn: '1/-1', position: 'relative' }}>
            <label className="lbl">Workout Title</label>
            <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 400m Repeat Intervals" />
            {showSug && (
              <div className="ac-drop">
                <div style={{ padding: '7px 12px', fontSize: 11, color: '#c8ff3e', borderBottom: '1px solid #2a2e3a' }}>✨ Auto-fill from past workout</div>
                {suggestions.map(s => (
                  <div key={s.id} className="ac-item" onClick={() => fillFrom(s)}>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.location}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div><label className="lbl">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label className="lbl">Time</label><input value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} placeholder="3:30 PM" /></div>
          <div><label className="lbl">Type</label><select value={type} onChange={e => setType(e.target.value)}>{WTYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="lbl">Surface</label><select value={surface} onChange={e => setSurface(e.target.value)}>{SURFS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="lbl">Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Track, trail…" /></div>
          <div><label className="lbl">Weather</label><input value={weather} onChange={e => setWeather(e.target.value)} placeholder="Sunny 72°F" /></div>
        </div>

        {/* Athletes */}
        <div style={{ marginBottom: 16 }}>
          <label className="lbl">Athletes</label>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {athletes.map(a => {
              const on = selIds.includes(a.id)
              const color = a.color || '#c8ff3e'
              return (
                <div key={a.id} onClick={() => toggleAthlete(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${on ? color : '#2a2e3a'}`, background: on ? color + '18' : 'transparent', transition: 'all .15s' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 13, color: on ? color : '#9ca3af' }}>{a.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Splits per athlete */}
        {selIds.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label className="lbl">Splits / Reps</label>
            {selIds.map(aid => {
              const a = athletes.find(x => x.id === aid)
              const reps = splits[aid] || []
              return (
                <div key={aid} style={{ background: '#0d0f13', border: '1px solid #1c1f27', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div className="row" style={{ marginBottom: 10 }}>
                    <Avatar profile={a} size={26} />
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{a?.name}</span>
                  </div>
                  {reps.map((r, i) => (
                    <div key={i} className="row" style={{ gap: 8, marginBottom: 6 }}>
                      <input value={r.dist} onChange={e => setRep(aid, i, 'dist', e.target.value)} placeholder="400m" style={{ width: 110, flexShrink: 0 }} />
                      <input value={r.time} onChange={e => setRep(aid, i, 'time', e.target.value)} placeholder="58.4" style={{ fontFamily: 'monospace' }} />
                      <button onClick={() => removeRep(aid, i)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: 22, padding: '0 4px', cursor: 'pointer', flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                  <button className="ghost sm" style={{ marginTop: 4 }} onClick={() => addRep(aid)}>+ Add Rep</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Coach notes */}
        <div style={{ marginBottom: 18 }}>
          <label className="lbl">🔒 Coach Notes <span style={{ color: '#4b5563', fontWeight: 400, fontSize: 11 }}>(private — athletes never see this)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What would you change next time? Observations…" style={{ minHeight: 80 }} />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save} disabled={!title.trim() || saving}>{saving ? 'Saving…' : 'Save Workout'}</button>
        </div>
      </div>
    </div>
  )
}
