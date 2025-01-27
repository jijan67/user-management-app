# User Management Application

## 🚀 Project Overview

This is a full-stack User Management Web Application built with modern web technologies, providing comprehensive user administration capabilities.

![Project Banner](project-banner.png)

## ✨ Features

- 🔐 Secure User Authentication
- 📋 User Management Dashboard
- 🚫 User Blocking/Unblocking
- 🗑️ User Deletion
- 🔍 User Filtering
- 📱 Responsive Design
- 🎨 Animated User Interface

## 🛠️ Technologies Used

### Frontend
- React.js
- React Bootstrap
- Framer Motion
- React Router
- Axios

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication

### Database
- MySQL with Unique Email Index

## 🌟 Key Functionalities

- User Registration
- User Login
- Bulk User Actions
- Real-time User Status Management
- Responsive Design
- Animated Interactions

## 📦 Prerequisites

- Node.js (v14+)
- npm or Yarn
- MySQL Database

## 🔧 Installation

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/jijan67/user-management-app.git
cd user-management-app/backend
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=user_management
JWT_SECRET=your_secret_key
PORT=5000
```

4. Start the server
```bash
npm start
```

### Frontend Setup

1. Navigate to frontend directory
```bash
cd ../frontend
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

## 🚀 Deployment

### Backend
- Recommended: Render, Heroku
- Configure environment variables
- Use `npm start` script

### Frontend
- Recommended: Netlify, Vercel
- Use `npm run build`
- Configure routing settings

## 🔒 Security Features

- JWT-based Authentication
- Unique Email Constraint
- Password Hashing
- Protected Routes
- User Status Management

## 📊 Database Schema

### Users Table
- `id`: Primary Key
- `name`: User's Full Name
- `email`: Unique User Email
- `password`: Hashed Password
- `status`: User Account Status
- `last_login`: Timestamp of Last Login
- `registration_time`: Account Creation Timestamp

## 🧪 Testing

### Run Tests
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

- Jijanur Rahman
- Email: jijanurrahman22@gmail.com
- Project Link: [GitHub Repository](https://github.com/jijan67/user-management-app)

## 🙏 Acknowledgements

- React.js Community
- Bootstrap
- Framer Motion
- Express.js
- MySQL

---
