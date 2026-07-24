import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { token } = req.query
  if (token !== process.env.KEEPALIVE_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
