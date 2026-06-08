import { supabase } from './supabase'

// ── Profile ──────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Log entries ───────────────────────────────────────────────

export async function addEntry({ amount_mg, logged_at, reason, tag, note }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('log_entries')
    .insert({ user_id: user.id, amount_mg, logged_at, reason, tag, note })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('log_entries').delete().eq('id', id)
  if (error) throw error
}

export async function getTodayEntries(userId) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', start.toISOString())
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRecentEntries(userId, limit = 50) {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ── 30-day daily totals (calls DB function) ───────────────────

export async function getDailyTotals(userId, days = 30) {
  const { data, error } = await supabase.rpc('daily_totals', {
    target_user_id: userId,
    days,
  })
  if (error) throw error
  return data // [{ day: '2025-05-01', total_mg: 1400 }, ...]
}

// ── Tag analysis ──────────────────────────────────────────────

export async function getTagStats(userId) {
  const { data, error } = await supabase
    .from('log_entries')
    .select('tag, amount_mg, logged_at')
    .eq('user_id', userId)
    .not('tag', 'is', null)
    .gte('logged_at', new Date(Date.now() - 90 * 86400000).toISOString())
  if (error) throw error

  // group by tag → avg daily contribution
  const byTag = {}
  data.forEach(({ tag, amount_mg }) => {
    if (!byTag[tag]) byTag[tag] = { tag, total: 0, count: 0 }
    byTag[tag].total += amount_mg
    byTag[tag].count += 1
  })
  return Object.values(byTag)
    .map(t => ({ ...t, avg: +(t.total / t.count).toFixed(1) }))
    .sort((a, b) => b.avg - a.avg)
}
