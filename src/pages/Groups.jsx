import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(null)
  const [sharedSplits, setSharedSplits] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [allAthletes, setAllAthletes] = useState([])
  const [selMembers, setSelMembers] = useState([])

  async function load() {
    const { data } = await supabase.from('groups').select('*, group_members(athlete_id, profiles(*))')
    setGroups(data || [])
    supabase.from('profiles').select('*').eq('role', 'athlete').then(({ data }) => setAllAthletes(data || []))
  }

  useEffect(() => { load() }, [])

  async function openGroup(g) {
    setSelected(g)
    const memberIds = g.group_members?.map(gm => gm.athlete_id) || []
    const sharingIds = g.group_members?.filter(gm => gm.profiles?.share_enabled).map(gm => gm.athlete_id) || []
    if (!sharingIds.length) { setSharedSplits([]); return }
    const { data } = await supabase.from('splits').select('*, profiles(*), workouts(title, date)').in('athlete_id', sharingIds).order('created_at', { ascending: false }).limit(40)
    setSharedSplits(data || [])
  }

  async function createGroup() {
    if (!newName.trim()) return
    const { data: g } = await supabase.from('groups').insert({ name: newName, description: newDesc, color: '#3ecfff' }).select().single()
    if (g && selMembers.length) {
      await supabase.from('group_members').insert(selMembers.map(id => ({ group_id: g.id, athlete_id: id })))
    }
    setNewName(''); setNewDesc(''); setSelMembers([]); setShowCreate(false); load()
  }

  if (selected) {
    const members = selected.group_members?.map(gm => gm.profiles).filter(Boolean) || []
    return (
      <div>
        <button className="ghost sm" style={{ marginBottom: 20 }} onClick={() => setSelected(null)}>← All Groups</button>
        <div className="row" style={{ marginBottom: 20, gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: selected.color || '#3ecfff' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{selected.name}</div>
            <div className="muted">{selected.description}</div>
          </div>
        </div>
        <div className="lbl">Members ({members.length})</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 24, marginTop: 8 }}>
          {members.map(m => (
            <div key={m.id} className="row" style={{ gap: 10, background: '#1c1f27', borderRadius: 10, padding: '10px 16px', border: `1px solid ${m.share_enabled ? (m.color || '#3ecfff') + '50' : '#2a2e3a'}` }}>
              <Avatar profile={m} size={30} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: m.share_enabled ? '#4ade80' : '#4b5563', marginTop: 2 }}>{m.share_enabled ? '● Sharing' : '○ Private'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="lbl">Shared Splits Feed</div>
        <div style={{ marginTop: 8 }}>
          {sharedSplits.length === 0
            ? <div style={{ background: '#1c1f27', borderRadius: 10, padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>No shared splits yet.</div>
            : sharedSplits.map(sp => (
              <div key={sp.id} className="row" style={{ gap: 12, padding: '12px 14px', background: '#1c1f27', borderRadius: 8, marginBottom: 6 }}>
                <Avatar profile={sp.profiles} size={30} />
                <div style={{ flex: 1 }}>
                  <div><span style={{ fontWeight: 600 }}>{sp.profiles?.name}</span> <span className="muted">· {sp.workouts?.title}</span></div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{sp.workouts?.date} · {sp.distance}</div>
                </div>
                <div className="mono" style={{ fontSize: 18, color: sp.profiles?.color || '#c8ff3e' }}>{sp.time}</div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div><div className="page-title">Training Groups</div><div className="page-sub" style={{ marginBottom: 0 }}>Click a group to see shared splits</div></div>
        <button className="btn" onClick={() => setShowCreate(true)}>+ New Group</button>
      </div>

      <div className="grid2" style={{ gap: 14 }}>
        {groups.map(g => {
          const mb = g.group_members || []
          const sh = mb.filter(gm => gm.profiles?.share_enabled)
          return (
            <div key={g.id} className="card" style={{ cursor: 'pointer', transition: 'border-color .15s' }} onClick={() => openGroup(g)}
              onMouseOver={e => e.currentTarget.style.borderColor = g.color || '#3ecfff'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#2a2e3a'}>
              <div className="row" style={{ marginBottom: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: g.color || '#3ecfff', flexShrink: 0 }} />
                <div style={{ marginLeft: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{g.name}</div>
                  <div className="muted" style={{ marginTop: 2 }}>{g.description}</div>
                </div>
              </div>
              <div className="row" style={{ gap: 4, marginBottom: 12 }}>
                {mb.map(gm => gm.profiles && <Avatar key={gm.athlete_id} profile={gm.profiles} size={30} />)}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="badge bb">{mb.length} athlete{mb.length !== 1 ? 's' : ''}</span>
                <span className="badge bg">{sh.length} sharing</span>
              </div>
            </div>
          )
        })}
      </div>
      {groups.length === 0 && <p className="empty">No groups yet.</p>}

      {showCreate && (
        <div className="overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>New Group</span>
              <button className="ghost sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}><label className="lbl">Group Name</label><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Sprint Group" /></div>
            <div style={{ marginBottom: 16 }}><label className="lbl">Description</label><input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="100m–400m specialists" /></div>
            <div style={{ marginBottom: 18 }}>
              <label className="lbl">Add Athletes</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {allAthletes.map(a => {
                  const on = selMembers.includes(a.id)
                  return (
                    <div key={a.id} onClick={() => setSelMembers(p => on ? p.filter(x => x !== a.id) : [...p, a.id])} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${on ? '#3ecfff' : '#2a2e3a'}`, background: on ? '#0d1f2b' : 'transparent' }}>
                      <span style={{ fontSize: 13, color: on ? '#3ecfff' : '#9ca3af' }}>{a.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button className="ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn" onClick={createGroup}>Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
