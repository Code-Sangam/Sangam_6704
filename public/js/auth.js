// Authentication Pages JavaScript
(function() {
  'use strict';

  // Authentication controller
  const AuthPages = {
    // Configuration
    config: {
      passwordMinLength: 8,
      passwordRequirements: {
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
        number: /\d/,
        special: /[!@#$%^&*(),.?":{}|<>]/
      }
    },

    // Initialize authentication functionality
    init: function() {
      this.setupFormValidation();
      this.setupPasswordToggles();
      this.setupPasswordStrength();
      this.setupRoleFields();
      this.setupFormSubmission();
      console.log('🔐 Authentication pages initialized');
    },

    // Setup form validation
    setupFormValidation: function() {
      const forms = document.querySelectorAll('form[id$="-form"]');
      
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
          // Real-time validation on blur
          input.addEventListener('blur', () => {
            this.validateField(input);
          });
          
          // Clear errors on input
          input.addEventListener('input', () => {
            this.clearFieldError(input);
            
            // Special handling for password fields
            if (input.type === 'password') {
              this.handlePasswordInput(input);
            }
          });
        });
        
        // Form submission validation
        form.addEventListener('submit', (e) => {
          if (!this.validateForm(form)) {
            e.preventDefault();
          }
        });
      });
    },

    // Setup password toggle functionality
    setupPasswordToggles: function() {
      const toggleButtons = document.querySelectorAll('.password-toggle');
      
      toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const input = button.parentElement.querySelector('input');
          const icon = button.querySelector('i');
          
          if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
          }
        });
      });
    },

    // Setup password strength indicator
    setupPasswordStrength: function() {
      const passwordInputs = document.querySelectorAll('input[type="password"][name="password"]');
      
      passwordInputs.forEach(input => {
        input.addEventListener('input', () => {
          this.updatePasswordStrength(input);
          this.updatePasswordRequirements(input);
        });
      });
    },

    // Setup role-specific fields
    setupRoleFields: function() {
      const roleSelect = document.getElementById('role');
      
      if (roleSelect) {
        roleSelect.addEventListener('change', () => {
          this.toggleRoleFields(roleSelect.value);
        });
        
        // Initialize on page load
        if (roleSelect.value) {
          this.toggleRoleFields(roleSelect.value);
        }
      }
    },

    // Setup form submission handling
    setupFormSubmission: function() {
      const forms = document.querySelectorAll('form[id$="-form"]');
      
      forms.forEach(form => {
        form.addEventListener('submit', () => {
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            this.showLoadingState(submitBtn);
          }
        });
      });
    },

    // Validate individual field
    validateField: function(field) {
      const value = field.value.trim();
      const fieldName = field.name || field.id;
      
      // Clear previous errors
      this.clearFieldError(field);
      
      // Required field validation
      if (field.hasAttribute('required') && !value) {
        this.showFieldError(field, `${this.getFieldLabel(fieldName)} is required`);
        return false;
      }
      
      // Specific field validations
      switch (fieldName) {
        case 'email':
          return this.validateEmail(field);
        case 'password':
          return this.validatePassword(field);
        case 'confirmPassword':
          return this.validatePasswordConfirmation(field);
        case 'graduationYear':
          return this.validateGraduationYear(field);
        default:
          return true;
      }
    },

    // Validate entire form
    validateForm: function(form) {
      const inputs = form.querySelectorAll('input[required], select[required]');
      let isValid = true;
      
      inputs.forEach(input => {
        if (!this.validateField(input)) {
          isValid = false;
        }
      });
      
      // Check terms agreement if present
      const termsCheckbox = form.querySelector('input[name="agreeToTerms"]');
      if (termsCheckbox && !termsCheckbox.checked) {
        this.showFieldError(termsCheckbox, 'You must agree to the terms and conditions');
        isValid = false;
      }
      
      return isValid;
    },

    // Email validation
    validateEmail: function(field) {
      const email = field.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email) {
        this.showFieldError(field, 'Email is required');
        return false;
      } else if (!emailRegex.test(email)) {
        this.showFieldError(field, 'Please enter a valid email address');
        return false;
      }
      
      return true;
    },

    // Password validation
    validatePassword: function(field) {
      const password = field.value;
      
      if (!password) {
        this.showFieldError(field, 'Password is required');
        return false;
      } else if (password.length < this.config.passwordMinLength) {
        this.showFieldError(field, `Password must be at least ${this.config.passwordMinLength} characters long`);
        return false;
      }
      
      // Check if this is a registration form (stricter validation)
      if (field.closest('form').id === 'register-form' || field.closest('form').id === 'reset-form') {
        if (!this.isPasswordStrong(password)) {
          this.showFieldError(field, 'Password does not meet security requirements');
          return false;
        }
      }
      
      return true;
    },

    // Password confirmation validation
    validatePasswordConfirmation: function(field) {
      const password = document.querySelector('input[name="password"]').value;
      const confirmPassword = field.value;
      
      if (!confirmPassword) {
        this.showFieldError(field, 'Please confirm your password');
        return false;
      } else if (password !== confirmPassword) {
        this.showFieldError(field, 'Passwords do not match');
        return false;
      }
      
      return true;
    },

    // Graduation year validation
    validateGraduationYear: function(field) {
      const year = parseInt(field.value);
      const currentYear = new Date().getFullYear();
      
      if (field.value && (isNaN(year) || year < 1970 || year > currentYear + 10)) {
        this.showFieldError(field, 'Please enter a valid graduation year');
        return false;
      }
      
      return true;
    },

    // Check password strength
    isPasswordStrong: function(password) {
      const requirements = this.config.passwordRequirements;
      
      return password.length >= this.config.passwordMinLength &&
             requirements.uppercase.test(password) &&
             requirements.lowercase.test(password) &&
             requirements.number.test(password) &&
             requirements.special.test(password);
    },

    // Update password strength indicator
    updatePasswordStrength: function(input) {
      const strengthDiv = document.getElementById('password-strength');
      if (!strengthDiv) return;
      
      const password = input.value;
      
      if (!password) {
        strengthDiv.innerHTML = '';
        return;
      }
      
      let strength = 0;
      const requirements = this.config.passwordRequirements;
      
      // Calculate strength
      if (password.length >= this.config.passwordMinLength) strength++;
      if (requirements.uppercase.test(password)) strength++;
      if (requirements.lowercase.test(password)) strength++;
      if (requirements.number.test(password)) strength++;
      if (requirements.special.test(password)) strength++;
      
      const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
      const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];
      
      const level = Math.min(strength, 4);
      const strengthText = strengthLevels[level];
      const strengthColor = strengthColors[level];
      
      strengthDiv.innerHTML = `
        <div class="strength-bar">
          <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background-color: ${strengthColor};"></div>
        </div>
        <div class="strength-text" style="color: ${strengthColor};">
          Password Strength: ${strengthText}
        </div>
      `;
    },

    // Update password requirements checklist
    updatePasswordRequirements: function(input) {
      const password = input.value;
      const requirements = {
        length: password.length >= this.config.passwordMinLength,
        uppercase: this.config.passwordRequirements.uppercase.test(password),
        lowercase: this.config.passwordRequirements.lowercase.test(password),
        number: this.config.passwordRequirements.number.test(password),
        special: this.config.passwordRequirements.special.test(password)
      };
      
      Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (element) {
          const icon = element.querySelector('i');
          
          if (requirements[req]) {
            element.classList.add('met');
            icon.className = 'fas fa-check';
          } else {
            element.classList.remove('met');
            icon.className = 'fas fa-times';
          }
        }
      });
    },

    // Handle password input events
    handlePasswordInput: function(input) {
      // Update strength indicator
      this.updatePasswordStrength(input);
      
      // Update requirements checklist
      this.updatePasswordRequirements(input);
      
      // Check confirmation if it exists and has a value
      const confirmInput = document.querySelector('input[name="confirmPassword"]');
      if (confirmInput && confirmInput.value) {
        this.validatePasswordConfirmation(confirmInput);
      }
    },

    // Toggle role-specific fields
    toggleRoleFields: function(selectedRole) {
      const roleFields = document.querySelectorAll('.role-fields');
      
      // Hide all role fields
      roleFields.forEach(field => {
        field.style.display = 'none';
      });
      
      // Show selected role fields
      if (selectedRole) {
        const targetFields = document.getElementById(selectedRole + '-fields');
        if (targetFields) {
          targetFields.style.display = 'block';
        }
      }
    },

    // Show field error
    showFieldError: function(field, message) {
      this.clearFieldError(field);
      
      field.classList.add('error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      
      field.parentElement.appendChild(errorDiv);
    },

    // Clear field error
    clearFieldError: function(field) {
      field.classList.remove('error');
      
      const existingError = field.parentElement.querySelector('.field-error');
      if (existingError) {
        existingError.remove();
      }
    },

    // Show loading state on button
    showLoadingState: function(button) {
      const originalText = button.innerHTML;
      button.disabled = true;
      
      // Determine loading text based on button content
      let loadingText = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      
      if (button.textContent.includes('Sign In')) {
        loadingText = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
      } else if (button.textContent.includes('Create Account')) {
        loadingText = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
      } else if (button.textContent.includes('Send')) {
        loadingText = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      } else if (button.textContent.includes('Reset')) {
        loadingText = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
      }
      
      button.innerHTML = loadingText;
      
      // Reset button after timeout as fallback
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalText;
      }, 15000);
    },

    // Get field label for error messages
    getFieldLabel: function(fieldName) {
      const labels = {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Password Confirmation',
        role: 'Role',
        university: 'University',
        graduationYear: 'Graduation Year',
        company: 'Company',
        position: 'Position'
      };
      
      return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    },

    // Utility functions
    utils: {
      // Show temporary message
      showMessage: function(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} temp-message`;
        messageDiv.innerHTML = `
          <i class="fas fa-${AuthPages.getIcon(type)}"></i>
          ${message}
        `;
        
        // Insert at top of form or page
        const form = document.querySelector('form');
        const container = form || document.querySelector('.auth-card');
        
        if (container) {
          container.insertBefore(messageDiv, container.firstChild);
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          messageDiv.remove();
        }, 5000);
      }
    },

    // Get icon for message type
    getIcon: function(type) {
      const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
      };
      return icons[type] || 'info-circle';
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthPages.init());
  } else {
    AuthPages.init();
  }

  // Expose AuthPages object globally for debugging
  window.AuthPages = AuthPages;

})();