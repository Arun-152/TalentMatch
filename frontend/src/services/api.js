/**
 * Frontend Service Layer (API Wrapper)
 * 
 * DESIGN DECISION:
 * Why isolate all Axios calls into dedicated service files instead of calling them directly in React components?
 * 1. Separation of Concerns: Components should only care about rendering UI and managing local state.
 * 2. Centralized Configuration: Base URLs, headers, and interceptors (like the one below) are defined in one place.
 * 3. Consistent Error Handling: The interceptor normalizes wildly different API error structures into a single format.
 * 4. Easier Testing: We can easily mock `api.js` or `resumeService.js` in Jest without needing a network mocking library.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for centralized error normalization
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Normalize API errors here so the UI components have a consistent shape
    const normalizedError = {
      message: 'An unexpected error occurred.',
      status: error.response?.status || 500,
      details: null,
    };

    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        normalizedError.message = error.response.data;
      } else if (error.response.data.detail) {
        normalizedError.message = error.response.data.detail;
      } else {
        // DRF usually returns validation errors as object keyed by field name
        normalizedError.message = 'Validation Error';
        normalizedError.details = error.response.data;
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
