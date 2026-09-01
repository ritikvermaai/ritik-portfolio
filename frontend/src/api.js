const json = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
};

export const api = {
  get: (url) => fetch(url, { credentials: 'include' }).then(json),
  send: (url, method, body) => fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(json),
  form: (url, method, form) => fetch(url, { method, credentials: 'include', body: form }).then(json)
};
