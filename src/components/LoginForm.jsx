import { useState } from 'react'
import { supabase } from '../data/supabaseClient'
import styles from './LoginForm.module.css'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
    }
    // on success, onAuthStateChange fires in AuthGate and renders the app
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.heading}>Vic Rod Tasks</h1>
        <label className={styles.label}>
          Email
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
