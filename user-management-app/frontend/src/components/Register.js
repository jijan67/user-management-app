import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.register(name, email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogin = () => {
    navigate('/login');
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
            <h2>User Registration</h2>
          </Card.Header>
          <Card.Body className="p-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Enter your full name"
                />
              </Form.Group>
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
                  placeholder="Create a password"
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
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                  Register
                </Button>
              </motion.div>
              <div className="text-center">
                <span>Already have an account? </span>
                <Button 
                  variant="link" 
                  onClick={handleLogin}
                  className="p-0"
                >
                  Login here
                  <FontAwesomeIcon icon={faSignInAlt} className="ms-2" />
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Register;
