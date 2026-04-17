import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import Avatar from '../components/Avatar'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyGroups() {
  const { profile } = useAuth()
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(null)
  const [members, setMembers] = useState([])
  const [feed, setFeed] = useState([])

  useEffect(() => {
    if (!profile) return
    supabase.from('group_members')
      .select('groups(*, group_members(athlete_id, profiles(*)))')
      .eq('athlete_id', profile.id)
      .then(({ data }) => {
        const gs = data?.map(r => r.groups).filter(Boolean) || []
        setGroups(gs)
      })
  }, [profile])

  async function openGroup(g) {
    setSelected(g)
    const allMembers = g.group_members?.map(gm => gm.profiles).filter(Boolean) || []
    setMembers(allMembers)
    const sharingIds = g.group_members
      ?.filter(gm => gm.profiles?.share_enabled && gm.athlete_id !== profile.id)
      .map(gm => gm.athlete_id) || []
    if (!sharingIds.length) { setFeed([]); return }
    const { data } = await supabase.from('splits')
      .select('*, profiles(*), workouts(title, date, location)')
      .in('athlete_id', sharingIds)
      .order('created_at', { ascending: false })
      .limit(40)
    setFeed(data || [])
  }

  if (selected) {
    return (
      <div>
        <button className="ghost sm" style={{ marginBottom: 20 }} onClick={() => setSelected(null)}>← All Groups</button>
        <div className="row" style={{ marginBottom: 20, gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: selected.color || '#3ecfff', flexShrink: 0 }} />
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
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}{m.id === profile.id ? ' (you)' : ''}</div>
                <div style={{ fontSize: 11, color: m.share_enabled ? '#4ade80' : '#4b5563', marginTop: 2 }}>
                  {m.share_enabled ? '● Sharing splits' : '○ Private'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lbl">Teammates' Shared Splits</div>
        <div style={{ marginTop: 8 }}>
          {feed.length === 0
            ? <div style={{ background: '#1c1f27', borderRadius: 10, padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>No shared splits yet from teammates.</div>
            : feed.map(sp => (
              <div key={sp.id} className="row" style={{ gap: 12, padding: '12px 14px', background: '#1c1f27', borderRadius: 8, marginBottom: 6 }}>
                <Avatar profile={sp.profiles} size={30} />
                <div style={{ flex: 1 }}>
                  <div><span style={{ fontWeight: 600 }}>{sp.profiles?.name}</span> <span className="muted">· {sp.workouts?.title}</span></div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{fmtDate(sp.workouts?.date)} · {sp.distance}</div>
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
      <div className="page-title">My Groups</div>
      <div className="page-sub">Click a group to see teammates' shared splits</div>
      {groups.length === 0 && <p className="empty">You haven't been added to any groups yet.</p>}
      <div className="grid2" style={{ gap: 14 }}>
        {groups.map(g => {
          const mb = g.group_members || []
          const sh = mb.filter(gm => gm.profiles?.share_enabled)
          return (
            <div key={g.id} className="card" style={{ cursor: 'pointer', transition: 'border-color .15s' }}
              onClick={() => openGroup(g)}
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
    </div>
  )
}
