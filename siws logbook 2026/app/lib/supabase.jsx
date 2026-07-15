import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../pages/config'
// ─── SUPABASE CLIENT (lightweight, no SDK needed) ──────────

const TOKEN_KEY = 'siwes_auth_token'
const REFRESH_KEY = 'siwes_refresh_token'

// ─── LIGHTWEIGHT SUPABASE CLIENT (no SDK needed) ────────────
export const supabase = {
  _url: SUPABASE_URL,
  _key: SUPABASE_ANON_KEY,
  // Restore the token from localStorage on module load, so a page refresh
  // doesn't wipe out an active session.
  _token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  _refreshToken: typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null,

  _persistSession(accessToken, refreshToken) {
    this._token = accessToken || null
    this._refreshToken = refreshToken || null
    if (typeof window === 'undefined') return
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
    else localStorage.removeItem(TOKEN_KEY)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    else localStorage.removeItem(REFRESH_KEY)
  },

  _clearSession() {
    this._token = null
    this._refreshToken = null
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },

  async _req(path, opts = {}) {
    const headers = {
      'Content-Type': 'application/json',
      apikey: this._key,
      Authorization: `Bearer ${this._token || this._key}`,
      Prefer: 'return=representation',
      ...opts.headers,
    }
    const res = await fetch(`${this._url}${path}`, { ...opts, headers })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const message =
        data?.error_description || data?.message || data?.msg || data?.error || 'Request failed'
      const err = new Error(message)
      err.status = res.status
      err.raw = data
      throw err
    }
    return data
  },

  auth: {
    // Always resolves to { data: { user, session }, error }. Never throws.
    async signUp({ email, password, options }) {
      try {
        const result = await supabase._req('/auth/v1/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, data: options?.data }),
        })
        if (result.access_token) {
          supabase._persistSession(result.access_token, result.refresh_token)
        }
        const user = result.user || (result.id ? result : null)
        return { data: { user, session: result }, error: null }
      } catch (err) {
        return { data: { user: null, session: null }, error: err }
      }
    },

    async signIn({ email, password }) {
      try {
        const result = await supabase._req('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        if (result.access_token) {
          supabase._persistSession(result.access_token, result.refresh_token)
        }
        const user = result.user || null
        return { data: { user, session: result }, error: null }
      } catch (err) {
        return { data: { user: null, session: null }, error: err }
      }
    },

    // Attempts to restore a session using the stored refresh token.
    // Returns { data: { user }, error } — used on app startup.
    async getSession() {
      if (!supabase._token) return { data: { user: null }, error: null }

      // Try the current access token first — fetch the user it belongs to.
      try {
        const result = await supabase._req('/auth/v1/user', { method: 'GET' })
        return { data: { user: result }, error: null }
      } catch (err) {
        // Access token likely expired — try refreshing it.
        if (supabase._refreshToken) {
          try {
            const refreshed = await supabase._req('/auth/v1/token?grant_type=refresh_token', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: supabase._refreshToken }),
            })
            if (refreshed.access_token) {
              supabase._persistSession(refreshed.access_token, refreshed.refresh_token)
              return { data: { user: refreshed.user || null }, error: null }
            }
          } catch (refreshErr) {
            supabase._clearSession()
            return { data: { user: null }, error: refreshErr }
          }
        }
        supabase._clearSession()
        return { data: { user: null }, error: err }
      }
    },

    async signOut() {
      try {
        await supabase._req('/auth/v1/logout', { method: 'POST' })
      } catch {
        // Server-side logout failing shouldn't block local sign-out
      }
      supabase._clearSession()
      return { error: null }
    },

    getUser() {
      if (!supabase._token) return { data: { user: null } }
      try {
        const payload = JSON.parse(atob(supabase._token.split('.')[1]))
        return { data: { user: { id: payload.sub, email: payload.email } } }
      } catch {
        return { data: { user: null } }
      }
    },
  },

  from(table) {
    return new QueryBuilder(this, table)
  },

  storage: {
    from(bucket) {
      return {
        async upload(path, file) {
          const res = await fetch(
            `${supabase._url}/storage/v1/object/${bucket}/${path}`,
            {
              method: 'POST',
              headers: {
                apikey: supabase._key,
                Authorization: `Bearer ${supabase._token || supabase._key}`,
                'Content-Type': file.type || 'application/octet-stream',
                'x-upsert': 'false',
              },
              body: file,
            }
          )
          const data = await res.json().catch(() => null)
          return { data, error: res.ok ? null : (data || { message: 'Upload failed' }) }
        },

        getPublicUrl(path) {
          return {
            data: {
              publicUrl: `${supabase._url}/storage/v1/object/public/${bucket}/${path}`,
            },
          }
        },
      }
    },
  },
}

// ─── QUERY BUILDER ───────────────────────────────────────────
class QueryBuilder {
  constructor(client, table) {
    this._client = client
    this._table = table
    this._filters = []
    this._selects = '*'
    this._order = null
    this._limit = null
  }

  select(cols = '*') { this._selects = cols; return this }
  eq(col, val)       { this._filters.push(`${col}=eq.${encodeURIComponent(val)}`); return this }
  neq(col, val)      { this._filters.push(`${col}=neq.${encodeURIComponent(val)}`); return this }
  gte(col, val)      { this._filters.push(`${col}=gte.${encodeURIComponent(val)}`); return this }
  lte(col, val)      { this._filters.push(`${col}=lte.${encodeURIComponent(val)}`); return this }
  order(col, { ascending = true } = {}) { this._order = `${col}.${ascending ? 'asc' : 'desc'}`; return this }
  limit(n)           { this._limit = n; return this }

  async then(resolve) {
    try {
      let qs = `select=${this._selects}`
      this._filters.forEach(f => (qs += `&${f}`))
      if (this._order) qs += `&order=${this._order}`
      if (this._limit) qs += `&limit=${this._limit}`
      const data = await this._client._req(`/rest/v1/${this._table}?${qs}`)
      resolve({ data, error: null })
    } catch (e) {
      resolve({ data: null, error: e })
    }
  }

  async insert(row) {
    try {
      const data = await this._client._req(`/rest/v1/${this._table}`, {
        method: 'POST',
        body: JSON.stringify(Array.isArray(row) ? row : [row]),
      })
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }

  async update(row) {
    try {
      const qs = this._filters.join('&')
      const data = await this._client._req(`/rest/v1/${this._table}?${qs}`, {
        method: 'PATCH',
        body: JSON.stringify(row),
      })
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }

  async delete() {
    try {
      const qs = this._filters.join('&')
      const data = await this._client._req(`/rest/v1/${this._table}?${qs}`, {
        method: 'DELETE',
      })
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }
}