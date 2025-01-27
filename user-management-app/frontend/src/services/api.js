import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  register: (name, email, password) => {
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);

    return api.post('/api/auth/register', formData, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      }
    });
  },
  
  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);

    return api.post('/api/auth/login', formData, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      }
    });
  },
  
  getUserList: (token) => {
    return api.get('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      transformResponse: [function (data) {
        try {
          const parsed = JSON.parse(data);
          // Handle different possible response structures
          return parsed.users || parsed.data || parsed;
        } catch (e) {
          console.error('Error parsing user list response:', e);
          return [];
        }
      }]
    });
  },
  
  bulkAction: (token, userIds, action) => api.post('/api/users/bulk-action', 
    { userIds, action },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  ),
};
