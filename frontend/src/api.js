const API_BASE_URL =
  import.meta.env.VITE_API_URL || '';

let csrfToken = null;
let csrfPromise = null;

const needsCsrf = (url) => /^\/admin\//i.test(url) && !/^\/admin\/login$/i.test(url);

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = fetch(makeUrl('/admin/api/csrf'), { credentials: 'include' })
      .then(json)
      .then(data => { csrfToken = data.token; return csrfToken; })
      .finally(() => { csrfPromise = null; });
  }
  return csrfPromise;
};

const makeUrl = (url) => {
  // Keep external URLs unchanged
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;

  return `${API_BASE_URL}${path}`;
};

const json = async (res) => {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(
      data.message ||
      data.error ||
      `Request failed (${res.status})`
    );
    error.status = res.status;
    error.retryAfter = Number(data.retryAfter || res.headers.get('Retry-After') || 0);
    error.retryAfterMs = Number(res.headers.get('X-Login-Retry-After-Ms') || error.retryAfter * 1000 || 0);
    error.locked = Boolean(data.locked || res.status === 429);
    throw error;
  }

  return data;
};

export const api = {
  get: (url) =>
    fetch(makeUrl(url), {
      credentials: 'include',
    }).then(json),

  send: async (url, method, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (needsCsrf(url) && !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())) headers['X-CSRF-Token'] = await getCsrfToken();
    let response = await fetch(makeUrl(url), { method, credentials: 'include', headers, body: JSON.stringify(body) });
    if (response.status === 403 && needsCsrf(url)) {
      csrfToken = null;
      headers['X-CSRF-Token'] = await getCsrfToken();
      response = await fetch(makeUrl(url), { method, credentials: 'include', headers, body: JSON.stringify(body) });
    }
    return json(response);
  },

  form: async (url, method, form) => {
    const headers = {};
    if (needsCsrf(url) && !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())) headers['X-CSRF-Token'] = await getCsrfToken();
    let response = await fetch(makeUrl(url), { method, credentials: 'include', headers, body: form });
    if (response.status === 403 && needsCsrf(url)) {
      csrfToken = null;
      headers['X-CSRF-Token'] = await getCsrfToken();
      response = await fetch(makeUrl(url), { method, credentials: 'include', headers, body: form });
    }
    return json(response);
  },
};