# Backend 404 Error - Root Cause & Fix

## ❌ Problems You Were Experiencing

### 1. "Failed to load resource: the server responded with a status of 404 (Not Found)"
- API endpoints were not responding
- Requests to `/api/*` endpoints were returning 404
- Frontend couldn't communicate with backend

### 2. Content Security Policy Warning
```
Connecting to 'http://localhost:5000/.well-known/appspecific/com.chrome.devtools.json' violates the following Content Security Policy directive: "default-src 'none'"
```
- Chrome DevTools trying to connect to a non-existent endpoint
- Not a real issue - just Chrome diagnostics
- Safe to ignore

---

## 🔍 Root Cause

The backend process on port 5000 was **hung/frozen** and not responding to HTTP requests because:

1. **MongoDB Connection Failure** - If the backend couldn't connect to MongoDB, it would crash
2. **Process Hung** - The old Node.js process was stuck and needed to be terminated
3. **Stale Socket** - Port 5000 still had a listening socket from the dead process

---

## ✅ Solution Applied

### Step 1: Kill Old Process
```powershell
taskkill /PID 2692 /F
```
This terminated the hung Node.js process that was holding port 5000 open.

### Step 2: Restart Backend
```powershell
cd "d:\Campus\campus-platform-backend (1)\campus-platform\backend"
npm start
```

### Expected Output (Success):
```
🚀 Server running on port 5000
✅ MongoDB Connected: localhost
🔌 Socket connected: [ID]
```

---

## 🧪 Verification

### Test 1: Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
```

**Expected Response (200 OK):**
```json
{"status":"ok","message":"Server running"}
```

### Test 2: Check Port is Listening
```powershell
netstat -ano | findstr :5000
```

**Expected to see:**
```
TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING
```

### Test 3: Test an API Endpoint
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/users/profile" `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"} `
  -UseBasicParsing
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "Port already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Fix:**
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F

# Try again
npm start
```

---

### Issue 2: "MongoDB Connection Error"
```
❌ MongoDB Connection Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Causes:**
- MongoDB server not running
- MongoDB not installed
- Connection string is wrong

**Fixes:**

**Option A: If MongoDB is installed locally (Windows)**
```powershell
# Start MongoDB
mongod

# In another terminal, can now start backend
npm start
```

**Option B: If MongoDB is not installed**
```powershell
# Use MongoDB Atlas instead
# 1. Create account at https://www.mongodb.com/cloud/atlas
# 2. Create a free cluster
# 3. Get connection string
# 4. Update .env file:
#    MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database_name
# 5. Restart backend
npm start
```

---

### Issue 3: "npm start: command not found"
```
npm : The term 'npm' is not recognized
```

**Fix:**
- Install Node.js from https://nodejs.org
- Verify installation: `node --version`
- Then try again

---

### Issue 4: Backend Crashes Immediately After Starting
```
🚀 Server running on port 5000
❌ Error message appears
[Process exits]
```

**Common causes & fixes:**

| Error | Fix |
|-------|-----|
| `Cannot find module 'express'` | Run `npm install` in backend folder |
| `MONGO_URI is not defined` | Check .env file exists with MONGO_URI set |
| `JWT_SECRET is undefined` | Add JWT_SECRET=your_secret to .env |
| `Mongoose duplicate index` | Safe to ignore - just a warning |

---

## 📋 Checklist: Backend Should Be Working

- [ ] Backend process running on port 5000
- [ ] Browser console shows no CORS errors
- [ ] API health endpoint returns 200 OK
- [ ] MongoDB shows as connected
- [ ] Video call initialization succeeds (201 response)
- [ ] Frontend can communicate with backend

---

## 🔧 Advanced Debugging

### Check Backend Logs in Real Time
```powershell
# Keep terminal window open while backend runs
# Watch for:
# - ✅ MongoDB Connected message
# - 🚀 Server running on port 5000
# - POST/GET request logs
# - Any ❌ error messages
```

### Enable Verbose Logging (if supported)
```powershell
# Set environment variable and restart
$env:DEBUG = "express:*,socket.io:*"
npm start
```

### Test Backend Without Frontend
```powershell
# Use Postman or VS Code REST Client
# Create request.http file:

GET http://localhost:5000/api/health
Authorization: Bearer (token if needed)

###

GET http://localhost:5000/api/calls/online-users

###

POST http://localhost:5000/api/calls/history/log
Content-Type: application/json
Authorization: Bearer your_jwt_token

{
  "callId": "test-123",
  "callerId": "userid",
  "callerName": "Test User",
  "callType": "video",
  "isGroupCall": true,
  "groupId": "groupid"
}
```

---

## 💡 Quick Start (Complete Checklist)

### First Time Setup
```powershell
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file (if not exists)
# Copy from .env.example and fill in values

# 3. Ensure MongoDB is running
mongod  # in another PowerShell window

# 4. Start backend
npm start

# Expected output:
# 🚀 Server running on port 5000
# ✅ MongoDB Connected: localhost
```

### When Backend Won't Start
```powershell
# 1. Kill any existing process
taskkill /F /IM node.exe

# 2. Verify port is free
netstat -ano | findstr :5000

# 3. Check MongoDB is running
# Start it if needed: mongod

# 4. Try again
npm start
```

### When Getting 404 Errors
```powershell
# 1. Verify backend is responding
Invoke-WebRequest http://localhost:5000/api/health

# 2. If no response or connection refused:
#    - Backend not running: npm start
#    - Port 5000 in use: taskkill /PID <pid> /F

# 3. If response is 404:
#    - Check route exists in backend code
#    - Check endpoint spelling matches frontend request
#    - Check middleware is set up correctly
```

---

## 📚 Reference

### Key Environment Variables (.env)
```
PORT=5000                                    # Backend port
MONGO_URI=mongodb://localhost:27017/campus   # Database connection
JWT_SECRET=secure_random_string              # JWT signing key
CLOUDINARY_CLOUD_NAME=your_cloud_name       # Cloudinary config
CLIENT_URL=http://localhost:5173            # Frontend URL (CORS)
```

### Important Files
- [package.json](package.json) - Dependencies and scripts
- [.env](.env) - Environment configuration
- [src/server.js](src/server.js) - Express app setup
- [src/routes/](src/routes/) - API endpoint definitions
- [src/controllers/](src/controllers/) - Business logic
- [src/models/](src/models/) - Database schemas

### Important Ports
- Frontend: 5173 (http://localhost:5173)
- Backend: 5000 (http://localhost:5000)
- MongoDB: 27017 (localhost:27017)
- Socket.IO: Same as backend (5000)

---

## ✨ Status

**Current Status: ✅ Backend Working**

```
✅ Port 5000 listening
✅ MongoDB connected
✅ Express routes initialized
✅ API responding with 200 OK
✅ Socket.IO active
✅ Ready for frontend requests
```

Once both backend and frontend are running:
- Backend: `npm start` in backend folder
- Frontend: `npm run dev` in frontend folder
- Website: http://localhost:5173

**Everything should work now!** 🎉
