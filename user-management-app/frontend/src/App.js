import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import Register from './components/Register';
import UserList from './components/UserList';

const pageVariants = {
  initial: { opacity: 0, x: '-100%' },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: '100%' }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/login" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Login />
              </motion.div>
            } 
          />
          <Route 
            path="/register" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Register />
              </motion.div>
            } 
          />
          <Route 
            path="/users" 
            element={
              <PrivateRoute>
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <UserList />
                </motion.div>
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
