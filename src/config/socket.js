import Message from '../models/Message.model.js';

// Map of userId -> socketId for tracking online users
const onlineUsers = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

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
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
