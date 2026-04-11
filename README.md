# 📚 Campus Study Group and Collaboration Platform

A full-stack web application for students to create/join study groups, chat in real-time, share files, and schedule study sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Tailwind CSS, Axios, React Router v6, Socket.IO client |
| Backend | Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt, Socket.IO |
| File Storage | Cloudinary |
| Real-time | Socket.IO |

---

## Folder Structure

```
campus-platform/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, Cloudinary, Socket.IO setup
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routers
│   │   ├── utils/         # JWT helpers
│   │   └── server.js      # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/    # Navbar, ChatBox, GroupCard, FileUpload, etc.
    │   ├── context/       # AuthContext (global state)
    │   ├── pages/         # Login, Register, Dashboard, GroupPage, AdminDashboard
    │   ├── services/      # Axios API client, Socket.IO client
    │   ├── App.jsx        # Routing
    │   └── main.jsx       # Entry point
    ├── .env.example
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

**.env values to fill:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/campus_platform
JWT_SECRET=any_random_secret_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

---

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Features

### Students
- Register / Login with JWT
- Create and join study groups
- Real-time group chat (Socket.IO)
- Upload and download notes/files
- Schedule and view study sessions
- View group members

### Admins
- View platform stats (users, groups, messages, sessions)
- Ban / unban users
- Delete inappropriate groups
- Remove inappropriate messages

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/groups | List public groups |
| POST | /api/groups | Create group |
| POST | /api/groups/:id/join | Join group |
| GET | /api/chat/:groupId | Get group messages |
| POST | /api/sessions | Schedule session |
| POST | /api/upload/group/:id | Upload file |
| GET | /api/admin/stats | Admin stats |
| GET | /api/admin/users | All users |

---

## Default Admin Account

To create an admin, register normally then update the role in MongoDB:

```js
// In MongoDB shell or Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| user:online | Client → Server | Mark user online |
| group:join | Client → Server | Join group room |
| group:leave | Client → Server | Leave group room |
| message:send | Client → Server | Send a message |
| message:receive | Server → Client | Receive a message |
| typing:start | Client → Server | Start typing |
| typing:stop | Client → Server | Stop typing |
| typing:update | Server → Client | Broadcast typing state |
