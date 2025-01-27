import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      const response = await api.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/users');
    } catch (err) {
      console.error('Login error:', err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        const errorDetails = err.response.data;
        setError(errorDetails.details || errorDetails.message || 'Login failed');
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <Container 
      className="d-flex justify-content-center align-items-center" 
      style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          className="shadow-lg" 
          style={{ 
            width: '400px', 
            borderRadius: '15px', 
            overflow: 'hidden' 
          }}
        >
          <Card.Header 
            className="text-center py-4" 
            style={{ 
              backgroundColor: '#3b5998', 
              color: 'white' 
            }}
          >
            <h2>User Login</h2>
          </Card.Header>
          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="Enter your email"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                />
              </Form.Group>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3"
                >
                  <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                  Login
                </Button>
              </motion.div>
              <div className="text-center">
                <span>Don't have an account? </span>
                <Button 
                  variant="link" 
                  onClick={handleRegister}
                  className="p-0"
                >
                  Register here
                  <FontAwesomeIcon icon={faUserPlus} className="ms-2" />
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Login;
