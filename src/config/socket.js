import Message from '../models/Message.model.js';

// Map of userId -> { socketId, username, avatar }
const onlineUsers = new Map();

// Map of callId -> { callerId, receiverId, status }
const activeCalls = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online - store user details
    socket.on('user:online', (userData) => {
      const { userId, username, avatar } = userData;
      onlineUsers.set(userId, { socketId: socket.id, username, avatar });
      
      // Broadcast updated online users list
      const usersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        userId: id,
        username: data.username,
        avatar: data.avatar,
        isOnline: true,
      }));
      
      io.emit('users:online', usersList);
      console.log(`✅ User online: ${userId} (${username})`);
    });

    // ========================= CALL SIGNALING =========================

    // Initiate call
    socket.on('call:initiate', (data) => {
      const { callerId, callerName, callerAvatar, receiverId } = data;
      const receiverSocket = onlineUsers.get(receiverId)?.socketId;
      
      if (receiverSocket) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;
        activeCalls.set(callId, { 
          callerId, 
          receiverId, 
          status: 'ringing',
          callType: data.callType || 'video', // 'video' or 'audio'
        });
        
        // Send incoming call notification to receiver
        io.to(receiverSocket).emit('call:incoming', {
          callId,
          callerId,
          callerName,
          callerAvatar,
          callType: data.callType || 'video',
        });
        
        console.log(`📞 Call initiated from ${callerName} to ${receiverId}`);
      } else {
        socket.emit('call:error', { message: 'User not available' });
      }
    });

    // Accept call
    socket.on('call:accept', (data) => {
      const { callId, receiverId } = data;
      const callData = activeCalls.get(callId);
      
      if (callData) {
        callData.status = 'accepted';
        const callerSocket = onlineUsers.get(callData.callerId)?.socketId;
        
        if (callerSocket) {
          io.to(callerSocket).emit('call:accepted', { callId, receiverId });
        }
        console.log(`✅ Call accepted: ${callId}`);
      }
    });

    // Reject call
    socket.on('call:reject', (data) => {
      const { callId } = data;
      const callData = activeCalls.get(callId);
      
      if (callData) {
        const callerSocket = onlineUsers.get(callData.callerId)?.socketId;
        if (callerSocket) {
          io.to(callerSocket).emit('call:rejected', { callId });
        }
        activeCalls.delete(callId);
        console.log(`❌ Call rejected: ${callId}`);
      }
    });

    // WebRTC Offer
    socket.on('webrtc:offer', (data) => {
      const { callId, offer, senderId, receiverId } = data;
      const receiverSocket = onlineUsers.get(receiverId)?.socketId;
      
      if (receiverSocket) {
        io.to(receiverSocket).emit('webrtc:offer', { callId, offer, senderId });
      }
    });

    // WebRTC Answer
    socket.on('webrtc:answer', (data) => {
      const { callId, answer, senderId, receiverId } = data;
      const receiverSocket = onlineUsers.get(receiverId)?.socketId;
      
      if (receiverSocket) {
        io.to(receiverSocket).emit('webrtc:answer', { callId, answer, senderId });
      }
    });

    // ICE Candidate
    socket.on('webrtc:ice-candidate', (data) => {
      const { callId, candidate, senderId, receiverId } = data;
      const receiverSocket = onlineUsers.get(receiverId)?.socketId;
      
      if (receiverSocket) {
        io.to(receiverSocket).emit('webrtc:ice-candidate', { callId, candidate, senderId });
      }
    });

    // End call
    socket.on('call:end', (data) => {
      const { callId, otherUserId } = data;
      const otherUserSocket = onlineUsers.get(otherUserId)?.socketId;
      
      if (otherUserSocket) {
        io.to(otherUserSocket).emit('call:ended', { callId });
      }
      
      activeCalls.delete(callId);
      console.log(`🔚 Call ended: ${callId}`);
    });

    // ========================= GROUP CALL SIGNALING =========================

    // Initiate group call
    socket.on('group:call:initiate', (data) => {
      const { groupId, callId, callerId, callerName, callerAvatar, callType } = data;
      
      console.log('📡 RECEIVED group:call:initiate:', { groupId, callerName });
      console.log('📤 EMITTING group:call:incoming to room:', groupId);
      
      // Broadcast to all users in the group (except the caller)
      socket.to(groupId).emit('group:call:incoming', {
        callId,
        groupId,
        callerId,
        callerName,
        callerAvatar,
        callType: callType || 'video',
      });
      
      console.log(`✅ Group call initiated in ${groupId} by ${callerName}`);
    });

    // ========================= GROUP CHAT =========================

    // Join a group room
    socket.on('group:join', (groupId) => {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group room: ${groupId}`);
    });

    // Leave a group room
    socket.on('group:leave', (groupId) => {
      socket.leave(groupId);
    });

    // Send message to group
    socket.on('message:send', async (data) => {
      try {
        const { groupId, senderId, senderName, content } = data;

        // Save message to DB
        const message = await Message.create({
          group: groupId,
          sender: senderId,
          content,
        });

        // Broadcast to all in the group room
        io.to(groupId).emit('message:receive', {
          _id: message._id,
          group: groupId,
          sender: { _id: senderId, name: senderName },
          content,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ groupId, userName }) => {
      socket.to(groupId).emit('typing:update', { userName, isTyping: true });
    });

    socket.on('typing:stop', ({ groupId, userName }) => {
      socket.to(groupId).emit('typing:update', { userName, isTyping: false });
    });

    // Disconnect
    socket.on('disconnect', () => {
      let disconnectedUserId = null;
      for (const [userId, userData] of onlineUsers.entries()) {
        if (userData.socketId === socket.id) {
          onlineUsers.delete(userId);
          disconnectedUserId = userId;
          break;
        }
      }
      
      // Broadcast updated online users list
      const usersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        userId: id,
        username: data.username,
        avatar: data.avatar,
        isOnline: true,
      }));
      
      io.emit('users:online', usersList);
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${disconnectedUserId})`);
    });
  });
};
