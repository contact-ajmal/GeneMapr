import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred'
      throw new Error(message)
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.')
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

export default apiClient
