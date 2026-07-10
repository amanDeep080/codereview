import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
})

// attach JWT to every request once logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
}

export const projectApi = {
  uploadFile: (projectName, file) => {
    const form = new FormData()
    form.append('projectName', projectName)
    form.append('file', file)
    return api.post('/projects/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  submitSnippet: (projectName, codeSnippet) =>
    api.post('/projects/snippet', { projectName, codeSnippet }),
  list: () => api.get('/projects')
}

export const reviewApi = {
  get: (id) => api.get(`/reviews/${id}`),
  list: () => api.get('/reviews'),
  delete: (id) => api.delete(`/reviews/${id}`)
}

export default api
