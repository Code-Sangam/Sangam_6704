// Traditional HTML/CSS/JS Chat Interface Components
class ChatInterface {
  constructor() {
    this.currentUserId = null;
    this.activeUserId = null;
    this.messages = new Map();
    this.users = new Map();
    this.isInitialized = false;
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    // Get current user data
    this.currentUserId = window.currentUser?.id;
    this.activeUserId = window.activeUserId;
    
    if (!this.currentUserId) {
      console.error('No current user found');
      return;
    }
    
    this.setupEventListeners();
    this.loadInitialData();
    this.isInitialized = true;
  }
  
  setupEventListeners() {
    // Message form submission
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
      messageForm.addEventListener('submit', (e) => this.handleMessageSubmit(e));
    }
    
    // Message input for typing indicators
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      let typingTimer;
      let isTyping = false;
      
      messageInput.addEventListener('input', () => {
        if (!isTyping && this.activeUserId && window.chatClient) {
          isTyping = true;
          window.chatClient.startTyping(this.activeUserId);
        }
        
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          if (isTyping && this.activeUserId && window.chatClient) {
            isTyping = false;
            window.chatClient.stopTyping(this.activeUserId);
          }
        }, 1000);
        
        // Enable/disable send button
        this.updateSendButton();
      });
      
      // Handle Enter key
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleMessageSubmit(e);
        }
      });
    }
    
    // User search
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
      userSearch.addEventListener('input', (e) => this.handleUserSearch(e));
    }
    
    // Refresh button
    const refreshButton = document.getElementById('refreshChat');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshChat());
    }
    
    // Chat event listeners
    document.addEventListener('chat:messageReceive', (e) => this.handleMessageReceive(e));
    document.addEventListener('chat:messageSent', (e) => this.handleMessageSent(e));
    document.addEventListener('chat:userOnline', (e) => this.handleUserOnline(e));
    document.addEventListener('chat:userOffline', (e) => this.handleUserOffline(e));
    document.addEventListener('chat:typingStart', (e) => this.handleTypingStart(e));
    document.addEventListener('chat:typingStop', (e) => this.handleTypingStop(e));
    document.addEventListener('chat:messageRead', (e) => this.handleMessageRead(e));
  }
  
  async loadInitialData() {
    try {
      // Load user contacts
      await this.loadUserContacts();
      
      // Load messages if active chat
      if (this.activeUserId) {
        await this.loadChatMessages(this.activeUserId);
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load chat data');
    }
  }
  
  async loadUserContacts() {
    try {
      const response = await fetch('/api/users/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      
      const contacts = await response.json();
      this.renderUserList(contacts);
      
    } catch (error) {
      console.error('Error loading contacts:', error);
     