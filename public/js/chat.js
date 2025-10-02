// Client-side Socket.io integration for real-time chat
class ChatClient {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.activeUsers = new Map();
    this.typingTimeouts = new Map();
    this.isConnected = false;
    
    this.init();
  }
  
  init() {
    // Initialize Socket.io connection
    this.socket = io({
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });
    
    this.setupEventListeners();
    this.setupSocketEvents();
  }
  
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.updateConnectionStatus(true);
      
      // Join chat if user is authenticated
      if (this.currentUser) {
        this.joinChat(this.currentUser);
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.updateConnectionStatus(false);
    });
  }
  
  setupSocketEvents() {
    // User presence events
    this.socket.on('user:online', (data) => {
      this.handleUserOnline(data);
    });
    
    this.socket.on('user:offline', (data) => {
      this.handleUserOffline(data);
    });
    
    // Message events
    this.socket.on('message:receive', (message) => {
      this.handleMessageReceive(message);
    });
    
    this.socket.on('message:sent', (message) => {
      this.handleMessageSent(message);
    });
    
    this.socket.on('message:read', (data) => {
      this.handleMessageRead(data);
    });
    
    // Typing events
    this.socket.on('typing:start', (data) => {
      this.handleTypingStart(data);
    });
    
    this.socket.on('typing:stop', (data) => {
      this.handleTypingStop(data);
    });
    
    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.showError(error.message || 'Connection error occurred');
    });
  }
  
  // Public methods for chat functionality
  joinChat(user) {
    this.currentUser = user;
    if (this.isConnected) {
      this.socket.emit('user:join', user);
    }
  }
  
  sendMessage(receiverId, content, messageType = 'text') {
    if (!this.isConnected) {
      this.showError('Not connected to chat server');
      return;
    }
    
    if (!receiverId || !content.trim()) {
      this.showError('Invalid message data');
      return;
    }
    
    this.socket.emit('message:send', {
      receiverId: receiverId,
      content: content.trim(),
      messageType: messageType
    });
  }
  
  startTyping(receiverId) {
    if (this.isConnected && receiverId) {
      this.socket.emit('typing:start', { receiverId });
    }
  }
  
  stopTyping(receiverId) {
    if (this.isConnected && receiverId) {
      this.socket.emit('typing:stop', { receiverId });
    }
  }
  
  markMessageAsRead(messageId, senderId) {
    if (this.isConnected && messageId && senderId) {
      this.socket.emit('message:read', { messageId, senderId });
    }
  }
  
  // Event handlers
  handleUserOnline(data) {
    this.activeUsers.set(data.userId, {
      ...data.user,
      isOnline: true,
      lastSeen: new Date()
    });
    
    this.updateUserStatus(data.userId, true);
    this.showNotification(`${data.user.firstName || 'User'} is now online`, 'info');
    this.dispatchCustomEvent('userOnline', data);
  }
  
  handleUserOffline(data) {
    if (this.activeUsers.has(data.userId)) {
      const user = this.activeUsers.get(data.userId);
      user.isOnline = false;
      user.lastSeen = new Date(data.lastSeen);
      this.activeUsers.set(data.userId, user);
    }
    
    this.updateUserStatus(data.userId, false);
    this.dispatchCustomEvent('userOffline', data);
  }
  
  handleMessageReceive(message) {
    this.dispatchCustomEvent('messageReceive', message);
    
    // Show notification for new message
    const activeChatUserId = this.getActiveChatUserId();
    if (activeChatUserId != message.senderId) {
      this.showMessageNotification(message);
    }
    
    // Auto-mark as read if chat is active with sender
    if (activeChatUserId && activeChatUserId == message.senderId) {
      setTimeout(() => {
        this.markMessageAsRead(message.id, message.senderId);
      }, 1000);
    } else {
      // Play notification sound
      this.playNotificationSound();
    }
  }
  
  handleMessageSent(message) {
    this.dispatchCustomEvent('messageSent', message);
  }
  
  handleMessageRead(data) {
    this.dispatchCustomEvent('messageRead', data);
  }
  
  handleTypingStart(data) {
    // Clear existing timeout for this user
    if (this.typingTimeouts.has(data.userId)) {
      clearTimeout(this.typingTimeouts.get(data.userId));
    }
    
    this.dispatchCustomEvent('typingStart', data);
    
    // Auto-stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      this.handleTypingStop({ userId: data.userId });
    }, 3000);
    
    this.typingTimeouts.set(data.userId, timeout);
  }
  
  handleTypingStop(data) {
    if (this.typingTimeouts.has(data.userId)) {
      clearTimeout(this.typingTimeouts.get(data.userId));
      this.typingTimeouts.delete(data.userId);
    }
    
    this.dispatchCustomEvent('typingStop', data);
  }
  
  // Utility methods
  updateConnectionStatus(isConnected) {
    const statusElement = document.querySelector('.connection-status');
    if (statusElement) {
      statusElement.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
      statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
    }
    
    // Enable/disable chat input
    const chatInput = document.querySelector('#messageInput');
    if (chatInput) {
      chatInput.disabled = !isConnected;
      chatInput.placeholder = isConnected ? 'Type a message...' : 'Connecting...';
    }
  }
  
  updateUserStatus(userId, isOnline) {
    const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
    userElements.forEach(element => {
      const statusIndicator = element.querySelector('.user-status');
      if (statusIndicator) {
        statusIndicator.className = `user-status ${isOnline ? 'online' : 'offline'}`;
      }
    });
  }
  
  getActiveChatUserId() {
    // Get active chat user ID from URL or data attribute
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    
    if (userIdFromUrl) return userIdFromUrl;
    
    const chatContainer = document.querySelector('.chat-container');
    return chatContainer ? chatContainer.dataset.activeUserId : null;
  }
  
  dispatchCustomEvent(eventName, data) {
    const event = new CustomEvent(`chat:${eventName}`, {
      detail: data,
      bubbles: true
    });
    document.dispatchEvent(event);
  }
  
  showError(message) {
    // Create or update error notification
    let errorElement = document.querySelector('.chat-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'chat-error alert alert-danger';
      const chatContainer = document.querySelector('.chat-container') || document.body;
      chatContainer.insertBefore(errorElement, chatContainer.firstChild);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `chat-notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="notification-icon icon-${type === 'info' ? 'info' : type === 'success' ? 'check' : 'alert'}"></i>
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;
    
    // Add to page
    const container = document.querySelector('.chat-container') || document.body;
    container.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 4000);
  }
  
  showMessageNotification(message) {
    // Check if browser notifications are supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      const senderName = message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Someone';
      const notification = new Notification(`New message from ${senderName}`, {
        body: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
        icon: message.sender?.profilePicture || '/images/default-avatar.png',
        tag: `chat-${message.senderId}`,
        requireInteraction: false
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Click to focus chat
      notification.onclick = () => {
        window.focus();
        if (message.senderId != this.getActiveChatUserId()) {
          window.location.href = `/chat/user/${message.senderId}`;
        }
        notification.close();
      };
    } else {
      // Fallback to in-app notification
      const senderName = message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Someone';
      this.showNotification(`New message from ${senderName}: ${message.content}`, 'info');
    }
  }
  
  playNotificationSound() {
    // Create and play notification sound
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback to system beep if audio fails
        console.log('🔔 New message received');
      });
    } catch (error) {
      console.log('🔔 New message received');
    }
  }
  
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification('Notifications enabled! You\'ll now receive message alerts.', 'success');
        }
      });
    }
  }
  
  // Public getters
  isUserOnline(userId) {
    const user = this.activeUsers.get(userId);
    return user ? user.isOnline : false;
  }
  
  getActiveUsers() {
    return Array.from(this.activeUsers.values()).filter(user => user.isOnline);
  }
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Initialize chat client when DOM is loaded
let chatClient = null;

document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on a chat page or if Socket.io is available
  if (typeof io !== 'undefined' && (window.location.pathname.includes('/chat') || document.querySelector('.chat-container'))) {
    chatClient = new ChatClient();
    
    // Make chat client globally available
    window.chatClient = chatClient;
    
    // Auto-join if user data is available
    if (window.currentUser) {
      chatClient.joinChat(window.currentUser);
      
      // Request notification permission
      chatClient.requestNotificationPermission();
    }
    
    // Initialize file upload functionality
    initializeFileUpload();
    
    // Initialize emoji functionality
    initializeEmojiPicker();
  }
});

// File Upload Functionality
function initializeFileUpload() {
  const fileAttachBtn = document.getElementById('fileAttachBtn');
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileUploadClose = document.getElementById('fileUploadClose');
  const fileCancelBtn = document.getElementById('fileCancelBtn');
  const fileInput = document.getElementById('fileInput');
  const fileBrowseBtn = document.getElementById('fileBrowseBtn');
  const fileDropZone = document.getElementById('fileDropZone');
  const fileUploadBtn = document.getElementById('fileUploadBtn');
  const filePreviewList = document.getElementById('filePreviewList');
  
  let selectedFiles = [];
  
  // Show file upload area
  fileAttachBtn?.addEventListener('click', () => {
    fileUploadArea.style.display = 'block';
  });
  
  // Hide file upload area
  const hideFileUpload = () => {
    fileUploadArea.style.display = 'none';
    selectedFiles = [];
    filePreviewList.innerHTML = '';
    fileUploadBtn.disabled = true;
  };
  
  fileUploadClose?.addEventListener('click', hideFileUpload);
  fileCancelBtn?.addEventListener('click', hideFileUpload);
  
  // File browse button
  fileBrowseBtn?.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File input change
  fileInput?.addEventListener('change', (e) => {
    handleFileSelection(Array.from(e.target.files));
  });
  
  // Drag and drop
  fileDropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('drag-over');
  });
  
  fileDropZone?.addEventListener('dragleave', () => {
    fileDropZone.classList.remove('drag-over');
  });
  
  fileDropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('drag-over');
    handleFileSelection(Array.from(e.dataTransfer.files));
  });
  
  // Handle file selection
  function handleFileSelection(files) {
    const validFiles = files.filter(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        chatClient?.showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'warning');
        return false;
      }
      
      // Check file type
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'];
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isAllowed) {
        chatClient?.showNotification(`File type "${file.type}" is not supported.`, 'warning');
        return false;
      }
      
      return true;
    });
    
    selectedFiles = [...selectedFiles, ...validFiles];
    renderFilePreview();
  }
  
  // Render file preview
  function renderFilePreview() {
    filePreviewList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-preview-item';
      
      const fileIcon = getFileIcon(file.type);
      const fileSize = formatFileSize(file.size);
      
      fileItem.innerHTML = `
        <div class="file-preview-icon">${fileIcon}</div>
        <div class="file-preview-info">
          <div class="file-preview-name">${file.name}</div>
          <div class="file-preview-size">${fileSize}</div>
        </div>
        <button type="button" class="file-preview-remove" onclick="removeFile(${index})">
          <i class="icon-x"></i>
        </button>
      `;
      
      filePreviewList.appendChild(fileItem);
    });
    
    fileUploadBtn.disabled = selectedFiles.length === 0;
  }
  
  // Remove file from selection
  window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    renderFilePreview();
  };
  
  // Upload files
  fileUploadBtn?.addEventListener('click', async () => {
    if (selectedFiles.length === 0 || !window.activeUserId) return;
    
    fileUploadBtn.disabled = true;
    fileUploadBtn.innerHTML = '<div class="spinner-small"></div> Uploading...';
    
    try {
      for (const file of selectedFiles) {
        await uploadFile(file);
      }
      
      chatClient?.showNotification('Files uploaded successfully!', 'success');
      hideFileUpload();
      
    } catch (error) {
      console.error('File upload error:', error);
      chatClient?.showNotification('Failed to upload files. Please try again.', 'error');
    } finally {
      fileUploadBtn.disabled = false;
      fileUploadBtn.innerHTML = 'Upload';
    }
  });
  
  // Upload single file
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', window.activeUserId);
    formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');
    
    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  }
  
  // Get file icon based on type
  function getFileIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.startsWith('text/')) return '📄';
    return '📎';
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Emoji Picker Functionality (Simple implementation)
function initializeEmojiPicker() {
  const emojiBtn = document.getElementById('emojiBtn');
  const messageInput = document.getElementById('messageInput');
  
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '😢', '😮', '😡', '🙏'];
  
  emojiBtn?.addEventListener('click', () => {
    // Simple emoji insertion - in a real app, you'd use a proper emoji picker
    const emoji = commonEmojis[Math.floor(Math.random() * commonEmojis.length)];
    if (messageInput) {
      const cursorPos = messageInput.selectionStart;
      const textBefore = messageInput.value.substring(0, cursorPos);
      const textAfter = messageInput.value.substring(cursorPos);
      messageInput.value = textBefore + emoji + textAfter;
      messageInput.focus();
      messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
      
      // Trigger input event to enable send button
      messageInput.dispatchEvent(new Event('input'));
    }
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatClient;
}