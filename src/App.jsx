import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './styles.css'

import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workouts from './pages/Workouts.jsx'
import Athletes from './pages/Athletes.jsx'
import Groups from './pages/Groups.jsx'
import Search from './pages/Search.jsx'
import MyWorkouts from './pages/MyWorkouts.jsx'
import MySplits from './pages/MySplits.jsx'
import MyGroups from './pages/MyGroups.jsx'

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  if (session === undefined) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>Loading…</div>
  }

  const isCoach = profile?.role === 'coach'

  return (
    <AuthContext.Provider value={{ session, profile, setProfile, refetchProfile: () => fetchProfile(session?.user?.id) }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to={isCoach ? '/dashboard' : '/my-workouts'} />} />
          {session && profile ? (
            <Route element={<Layout />}>
              {isCoach ? (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/workouts" element={<Workouts />} />
                  <Route path="/athletes" element={<Athletes />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              ) : (
                <>
                  <Route path="/my-workouts" element={<MyWorkouts />} />
                  <Route path="/my-splits" element={<MySplits />} />
                  <Route path="/my-groups" element={<MyGroups />} />
                  <Route path="*" element={<Navigate to="/my-workouts" />} />
                </>
              )}
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
