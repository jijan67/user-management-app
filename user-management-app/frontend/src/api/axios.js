import axios from 'axios';

// Determine API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://user-management-app-zk5i.onrender.com/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging and error handling
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Axios Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Axios Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });

    // Detailed error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      switch (error.response.status) {
        case 400:
          console.warn('Bad Request:', error.response.data);
          break;
        case 401:
          console.warn('Unauthorized:', error.response.data);
          break;
        case 403:
          console.warn('Forbidden:', error.response.data);
          break;
        case 404:
          console.warn('Not Found:', error.response.data);
          break;
        case 500:
          console.error('Server Error:', error.response.data);
          break;
        default:
          console.warn('Unhandled Error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No Response Received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
