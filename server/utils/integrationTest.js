// Integration Test Utilities
const { User, Profile, Message, Session } = require('../models');
const bcrypt = require('bcrypt');

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.testUsers = [];
  }
  
  async runAllTests() {
    console.log('🧪 Starting Integration Tests...\n');
    
    try {
      // Test database connectivity
      await this.testDatabaseConnection();
      
      // Test user authentication flow
      await this.testAuthenticationFlow();
      
      // Test profile management
      await this.testProfileManagement();
      
      // Test chat functionality
      await this.testChatFunctionality();
      
      // Test settings management
      await this.testSettingsManagement();
      
      // Clean up test data
      await this.cleanup();
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      await this.cleanup();
    }
  }
  
  async testDatabaseConnection() {
    console.log('📊 Testing database connection...');
    
    try {
      const { sequelize } = require('../config/database');
      await sequelize.authenticate();
      this.addResult('Database Connection', true, 'Successfully connected to database');
    } catch (error) {
      this.addResult('Database Connection', false, error.message);
      throw error;
    }
  }
  
  async testAuthenticationFlow() {
    console.log('🔐 Testing authentication flow...');
    
    try {
      // Create test user
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      
      const user = await User.create({
        email: testEmail,
        passwordHash: hashedPassword,
        role: 'student'
      });
      
      this.testUsers.push(user.id);
      this.addResult('User Creation', true, 'User created successfully');
      
      // Test password validation
      const isValidPassword = await bcrypt.compare(testPassword, user.passwordHash);
      this.addResult('Password Validation', isValidPassword, 
        isValidPassword ? 'Password validation works' : 'Password validation failed');
      
      // Test user lookup
      const foundUser = await User.findByPk(user.id);
      this.addResult('User Lookup', !!foundUser, 
        foundUser ? 'User lookup successful' : 'User lookup failed');
      
    } catch (error) {
      this.addResult('Authentication Flow', false, error.message);
    }
  }
  
  async testProfileManagement() {
    console.log('👤 Testing profile management...');
    
    try {
      if (this.testUsers.length === 0) {
        throw new Error('No test users available');
      }
      
      const userId = this.testUsers[0];
      
      // Create profile
      const profile = await Profile.create({
        userId: userId,
        firstName: 'Test',
        lastName: 'User',
        bio: 'This is a test user profile',
        university: 'Test University',
        major: 'Computer Science',
        graduationYear: 2024
      });
      
      this.addResult('Profile Creation', true, 'Profile created successfully');
      
      // Test profile update
      await profile.update({
        bio: 'Updated test user profile',
        company: 'Test Company',
        position: 'Software Engineer'
      });
      
      this.addResult('Profile Update', true, 'Profile updated successfully');
      
      // Test profile retrieval with user
      const userWithProfile = await User.findByPk(userId, {
        include: [{
          model: Profile,
          as: 'profile'
        }]
      });
      
      const hasProfile = userWithProfile && userWithProfile.profile;
      this.addResult('Profile Association', hasProfile, 
        hasProfile ? 'User-Profile association works' : 'User-Profile association failed');
      
    } catch (error) {
      this.addResult('Profile Management', false, error.message);
    }
  }
  
  async testChatFunctionality() {
    console.log('💬 Testing chat functionality...');
    
    try {
      // Create second test user for chat
      const testEmail2 = `test2-${Date.now()}@example.com`;
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      
      const user2 = await User.create({
        email: testEmail2,
        passwordHash: hashedPassword,
        role: 'alumni'
      });
      
      this.testUsers.push(user2.id);
      
      // Create profiles for both users
      await Profile.create({
        userId: user2.id,
        firstName: 'Test',
        lastName: 'Alumni',
        bio: 'Test alumni profile',
        company: 'Alumni Company'
      });
      
      // Test message creation
      const message = await Message.create({
        senderId: this.testUsers[0],
        receiverId: this.testUsers[1],
        content: 'Hello, this is a test message!',
        messageType: 'text'
      });
      
      this.addResult('Message Creation', true, 'Message created successfully');
      
      // Test message retrieval with associations
      const messageWithUsers = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            include: [{ model: Profile, attributes: ['firstName', 'lastName'] }]
          },
          {
            model: User,
            as: 'receiver',
            include: [{ model: Profile, attributes: ['firstName', 'lastName'] }]
          }
        ]
      });
      
      const hasAssociations = messageWithUsers && 
                             messageWithUsers.sender && 
                             messageWithUsers.receiver;
      
      this.addResult('Message Associations', hasAssociations, 
        hasAssociations ? 'Message associations work' : 'Message associations failed');
      
      // Test message read status
      await message.update({ readAt: new Date() });
      this.addResult('Message Read Status', true, 'Message read status updated');
      
    } catch (error) {
      this.addResult('Chat Functionality', false, error.message);
    }
  }
  
  async testSettingsManagement() {
    console.log('⚙️ Testing settings management...');
    
    try {
      if (this.testUsers.length === 0) {
        throw new Error('No test users available');
      }
      
      const userId = this.testUsers[0];
      
      // Test session creation (simulated)
      const sessionData = {
        userId: userId,
        data: JSON.stringify({
          userAgent: 'Test User Agent',
          ip: '127.0.0.1',
          location: 'Test Location'
        }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
      // Note: Session model might need adjustment based on actual schema
      try {
        const session = await Session.create({
          sid: `test-session-${Date.now()}`,
          ...sessionData
        });
        this.addResult('Session Management', true, 'Session created successfully');
      } catch (sessionError) {
        // Session model might have different structure
        this.addResult('Session Management', false, 'Session model needs adjustment');
      }
      
      // Test user preferences (stored in profile)
      const profile = await Profile.findOne({ where: { userId } });
      if (profile) {
        await profile.update({
          privacySettings: JSON.stringify({
            profileVisibility: 'public',
            messageNotifications: true,
            emailNotifications: true
          })
        });
        this.addResult('User Preferences', true, 'User preferences saved');
      }
      
    } catch (error) {
      this.addResult('Settings Management', false, error.message);
    }
  }
  
  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test messages
      await Message.destroy({
        where: {
          [require('sequelize').Op.or]: [
            { senderId: { [require('sequelize').Op.in]: this.testUsers } },
            { receiverId: { [require('sequelize').Op.in]: this.testUsers } }
          ]
        }
      });
      
      // Delete test profiles
      await Profile.destroy({
        where: {
          userId: { [require('sequelize').Op.in]: this.testUsers }
        }
      });
      
      // Delete test users
      await User.destroy({
        where: {
          id: { [require('sequelize').Op.in]: this.testUsers }
        }
      });
      
      // Delete test sessions
      await Session.destroy({
        where: {
          sid: { [require('sequelize').Op.like]: 'test-session-%' }
        }
      }).catch(() => {
        // Ignore session cleanup errors
      });
      
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      console.error('⚠️ Cleanup warning:', error.message);
    }
  }
  
  addResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed,
      message
    });
  }
  
  printResults() {
    console.log('\n📋 Integration Test Results:');
    console.log('=' .repeat(50));
    
    let passedCount = 0;
    let totalCount = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}: ${result.message}`);
      if (result.passed) passedCount++;
    });
    
    console.log('=' .repeat(50));
    console.log(`Results: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All integration tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Please review the results above.');
    }
  }
}

module.exports = IntegrationTester;