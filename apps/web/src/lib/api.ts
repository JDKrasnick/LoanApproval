const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5004'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export const api = {
  // Applications
  createApplication: (body: unknown) =>
    request('/applications', { method: 'POST', body: JSON.stringify(body) }),

  listApplications: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/applications${qs}`)
  },

  getApplication: (id: string) => request(`/applications/${id}`),

  updateStatus: (id: string, status: string) =>
    request(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Decisions
  evaluate: (id: string) =>
    request(`/decisions/evaluate/${id}`, { method: 'POST' }),

  getDecision: (id: string) => request(`/decisions/${id}`),

  explainDecision: (id: string) =>
    request(`/decisions/explain/${id}`, { method: 'POST' }),

  // Documents
  listDocuments: (applicationId: string) =>
    request(`/documents/${applicationId}`),

  uploadDocument: (formData: FormData) =>
    fetch(`${BASE}/documents/upload`, { method: 'POST', body: formData }).then(r => r.json()),

  // ML
  scoreApplication: (id: string) =>
    request(`/ml/score/${id}`, { method: 'POST' }),

  // LLM
  extractDocument: (documentId: string) =>
    request(`/llm/extract/${documentId}`, { method: 'POST' }),

  // Audit
  getAuditLog: (id: string) => request(`/audit/${id}`),
}
