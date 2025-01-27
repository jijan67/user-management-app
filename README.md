# User Management Application

## Project Overview
A full-stack user management application with authentication, user listing, and admin controls.

## Technologies Used
- Frontend: React.js
- Backend: Node.js, Express
- Database: MySQL
- Authentication: JWT

## Local Setup

### Prerequisites
- Node.js (v16+)
- npm
- MySQL

### Backend Setup
1. Navigate to backend directory
```bash
cd user-management-app/backend
npm install
```

2. Create `.env` file with:
```
MYSQL_HOST=localhost
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=user_management
JWT_SECRET=your_secret_key
PORT=5000
```

3. Start backend
```bash
npm start
```

### Frontend Setup
1. Navigate to frontend directory
```bash
cd user-management-app/frontend
npm install
```

2. Create `.env` file with:
```
REACT_APP_API_URL=http://localhost:5000
```

3. Start frontend
```bash
npm start
```

## Deployment
Deployed on Render with:
- Backend: Node.js Web Service
- Frontend: Static Site
- Database: PostgreSQL

## Features
- User Registration
- User Login
- JWT Authentication
- User Listing
- Admin Controls

## License
MIT License
