import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert, Card, Spinner, Form, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, 
  faLock, 
  faUnlock, 
  faTrash, 
  faFilter 
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.getUserList(token);
        
        // Ensure response.data is an array
        const userData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.users || []);
        
        setUsers(userData);
        setFilteredUsers(userData);
        setLoading(false);
      } catch (err) {
        console.error('User fetch error:', err);
        setError('Failed to fetch users: ' + (err.response?.data?.message || err.message));
        setLoading(false);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    // Defensive filtering with fallback
    const filtered = (users || []).filter(user => {
      if (!user) return false;
      const nameMatch = user.name && user.name.toLowerCase().includes(filterQuery.toLowerCase());
      const emailMatch = user.email && user.email.toLowerCase().includes(filterQuery.toLowerCase());
      return nameMatch || emailMatch;
    });
    setFilteredUsers(filtered);
  }, [filterQuery, users]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSelectAll = (e) => {
    setSelectedUsers(e.target.checked ? (filteredUsers || []).map(user => user.id) : []);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = async (action) => {
    const token = localStorage.getItem('token');
    try {
      await api.bulkAction(token, selectedUsers, action);
      
      if (action === 'block' || action === 'delete') {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (selectedUsers.includes(currentUser.id)) {
          handleLogout();
          return;
        }
      }

      const response = await api.getUserList(token);
      const userData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.users || []);
      
      setUsers(userData);
      setFilteredUsers(userData);
      setSelectedUsers([]);
    } catch (err) {
      console.error(`Bulk action error:`, err);
      setError(`Failed to ${action} users: ` + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' 
      ? 'badge bg-success' 
      : 'badge bg-danger';
  };

  return (
    <Container 
      fluid 
      className="p-4" 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f0f2f5' 
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <Card.Header 
            className="d-flex justify-content-between align-items-center py-3"
            style={{ 
              backgroundColor: '#3b5998', 
              color: 'white' 
            }}
          >
            <h2 className="m-0">User Management</h2>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="light" 
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                Logout
              </Button>
            </motion.div>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="mb-3 align-items-center">
              <Col md={6} className="d-flex gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="warning" 
                    onClick={() => handleBulkAction('block')}
                    disabled={selectedUsers.length === 0}
                  >
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Block
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="success" 
                    onClick={() => handleBulkAction('unblock')}
                    disabled={selectedUsers.length === 0}
                  >
                    <FontAwesomeIcon icon={faUnlock} className="me-2" />
                    Unblock
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="danger"
                    onClick={() => handleBulkAction('delete')}
                    disabled={selectedUsers.length === 0}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                    Delete
                  </Button>
                </motion.div>
              </Col>
              <Col md={6} className="text-end">
                <Form.Group>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter users" 
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-100"
                  />
                </Form.Group>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <AnimatePresence>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length === filteredUsers.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Registration Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {(filteredUsers || []).map(user => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={getStatusBadgeClass(user.status)}>
                              {user.status}
                            </span>
                          </td>
                          <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                          <td>{new Date(user.registration_time).toLocaleString()}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </Table>
              </AnimatePresence>
            )}
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
};

export default UserList;
