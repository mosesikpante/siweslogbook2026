import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../pages/config'
// ─── SUPABASE CLIENT (lightweight, no SDK needed) ──────────
const supabase = {
  _url: SUPABASE_URL,
  _key: SUPABASE_ANON_KEY,
  _token: null,


  async _req(path, opts = {}) {
    const headers = {
      "Content-Type": "application/json",
      "apikey": this._key,
      "Authorization": `Bearer ${this._token || this._key}`,
      "Prefer": "return=representation",
      ...opts.headers,
    };
    const res = await fetch(`${this._url}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || data?.error_description || "Request failed");
    return data;
  },

  auth: {
    _parent: null,
    async signUp({ email, password, options }) {
      const data = await supabase._req("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, data: options?.data }),
      });
      if (data.access_token) supabase._token = data.access_token;
      return { data, error: null };
    },
    async signIn({ email, password }) {
      const data = await supabase._req("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.access_token) supabase._token = data.access_token;
      return { data, error: null };
    },
    async signOut() {
      await supabase._req("/auth/v1/logout", { method: "POST" });
      supabase._token = null;
    },
    getUser() {
      if (!supabase._token) return { data: { user: null } };
      try {
        const payload = JSON.parse(atob(supabase._token.split(".")[1]));
        return { data: { user: { id: payload.sub, email: payload.email } } };
      } catch { return { data: { user: null } }; }
    },
  },

  from(table) {
    return new QueryBuilder(this, table);
  },

  storage: {
    from(bucket) {
      return {
        async upload(path, file) {
          const form = new FormData();
          form.append("", file);
          const res = await fetch(`${supabase._url}/storage/v1/object/${bucket}/${path}`, {
            method: "POST",
            headers: { "apikey": supabase._key, "Authorization": `Bearer ${supabase._token || supabase._key}` },
            body: form,
          });
          const data = await res.json();
            return { data, error: res.ok ? null : data };
        },
        getPublicUrl(path) {
          return { data: { publicUrl: `${supabase._url}/storage/v1/object/public/${bucket}/${path}` } };
        },
      };
    },
  },
};
export class QueryBuilder {
  constructor(client, table) {
    this._client = client;
    this._table = table;
    this._filters = [];
    this._selects = "*";
    this._order = null;
    this._limit = null;
  }
  select(cols = "*") { this._selects = cols; return this; }
  eq(col, val) { this._filters.push(`${col}=eq.${encodeURIComponent(val)}`); return this; }
  neq(col, val) { this._filters.push(`${col}=neq.${encodeURIComponent(val)}`); return this; }
  gte(col, val) { this._filters.push(`${col}=gte.${encodeURIComponent(val)}`); return this; }
  lte(col, val) { this._filters.push(`${col}=lte.${encodeURIComponent(val)}`); return this; }
  order(col, { ascending = true } = {}) { this._order = `${col}.${ascending ? "asc" : "desc"}`; return this; }
  limit(n) { this._limit = n; return this; }
  async then(resolve, reject) {
    try {
      let qs = `select=${this._selects}`;
      this._filters.forEach(f => qs += `&${f}`);
      if (this._order) qs += `&order=${this._order}`;
      if (this._limit) qs += `&limit=${this._limit}`;
      const data = await this._client._req(`/rest/v1/${this._table}?${qs}`);
      resolve({ data, error: null });
    } catch (e) { resolve({ data: null, error: e }); }
  }
  async insert(row) {
    try {
      const data = await this._client._req(`/rest/v1/${this._table}`, {
        method: "POST",
        body: JSON.stringify(Array.isArray(row) ? row : [row]),
      });
      return { data, error: null };
    } catch (e) { return { data: null, error: e }; }
  }
  async update(row) {
    try {
      let qs = this._filters.join("&");
      const data = await this._client._req(`/rest/v1/${this._table}?${qs}`, {
        method: "PATCH",
        body: JSON.stringify(row),
      });
      return { data, error: null };
    } catch (e) { return { data: null, error: e }; }
  }
  async delete() {
    try {
      let qs = this._filters.join("&");
      const data = await this._client._req(`/rest/v1/${this._table}?${qs}`, { method: "DELETE" });
      return { data, error: null };
    } catch (e) { return { data: null, error: e }; }
  }
}

export {supabase};