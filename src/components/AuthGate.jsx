import React, { useState, useEffect } from 'react'
import { supabase } from '../data/supabaseClient'
import { LoginForm } from './LoginForm'

export function AuthGate({ children }) {
  // undefined = still checking session, null = signed out, object = signed in
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <LoginForm />
  // Inject userId so App doesn't need to re-read from the Supabase client
  return React.cloneElement(children, { userId: session.user.id })
}
