// Main JavaScript file for Sangam Alumni Network

// Global utilities and helper functions
window.SangamApp = {
  // Configuration
  config: {
    apiBaseUrl: '/api',
    socketUrl: window.location.origin,
    debounceDelay: 300,
    animationDuration: 300
  },
  
  // Utility functions
  utils: {
    // Debounce function for search and input handling
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // Format date for display
    formatDate: function(date) {
      const now = new Date();
      const inputDate = new Date(date);
      const diffTime = Math.abs(now - inputDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return inputDate.toLocaleDateString();
      }
    },
    
    // Format time for display
    formatTime: function(date) {
      return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // Validate email format
    isValidEmail: function(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    // Show loading state
    showLoading: function(element, text = 'Loading...') {
      if (element) {
        element.innerHTML = `
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>${text}</span>
          </div>
        `;
        element.classList.add('loading');
      }
    },
    
    // Hide loading state
    hideLoading: function(element, originalContent = '') {
      if (element) {
        element.innerHTML = originalContent;
        element.classList.remove('loading');
      }
    },
    
    // Copy text to clipboard
    copyToClipboard: function(text) {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve();
      }
    }
  },
  
  // API helper functions
  api: {
    // Generic API request function
    request: async function(url, options = {}) {
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      };
      
      const config = { ...defaultOptions, ...options };
      
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    
    // GET request
    get: function(endpoint) {
      return this.request(`${SangamApp.config.apiBaseUrl}${endpoint}`);
    },
    
    // POST request
    post: function(endpoint, data) {
      return this.request(`${SangamApp.config.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    // PUT request
    put: function(endpoint, data) {
      return this.request(`${SangamApp.config.apiBaseUrl}${endpoint}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    // DELETE request
    delete: function(endpoint) {
      return this.request(`${SangamApp.config.apiBaseUrl}${endpoint}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Notification system
  notifications: {
    show: function(message, type = 'info', duration = 5000) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-${this.getIcon(type)}"></i>
          <span class="notification-message">${message}</span>
          <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      
      // Add to page
      let container = document.getElementById('notification-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
      }
      
      container.appendChild(notification);
      
      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, duration);
      }
      
      return notification;
    },
    
    getIcon: function(type) {
      const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
      };
      return icons[type] || 'info-circle';
    },
    
    success: function(message, duration) {
      return this.show(message, 'success', duration);
    },
    
    error: function(message, duration) {
      return this.show(message, 'error', duration);
    },
    
    warning: function(message, duration) {
      return this.show(message, 'warning', duration);
    },
    
    info: function(message, duration) {
      return this.show(message, 'info', duration);
    }
  },
  
  // Form handling utilities
  forms: {
    // Serialize form data to object
    serialize: function(form) {
      const formData = new FormData(form);
      const data = {};
      
      for (let [key, value] of formData.entries()) {
        if (data[key]) {
          // Handle multiple values (checkboxes, etc.)
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      }
      
      return data;
    },
    
    // Validate form fields
    validate: function(form) {
      const errors = [];
      const requiredFields = form.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          errors.push(`${field.name || field.id} is required`);
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
        
        // Email validation
        if (field.type === 'email' && field.value && !SangamApp.utils.isValidEmail(field.value)) {
          errors.push('Please enter a valid email address');
          field.classList.add('error');
        }
      });
      
      return errors;
    },
    
    // Clear form errors
    clearErrors: function(form) {
      const errorFields = form.querySelectorAll('.error');
      errorFields.forEach(field => field.classList.remove('error'));
      
      const errorMessages = form.querySelectorAll('.error-message');
      errorMessages.forEach(message => message.remove());
    }
  }
};

// DOM Ready functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize global functionality
  initializeGlobalFeatures();
  
  // Initialize page-specific functionality
  initializePageFeatures();
});

// Initialize global features that work on all pages
function initializeGlobalFeatures() {
  // Flash message auto-hide
  const flashMessage = document.getElementById('flash-message');
  if (flashMessage) {
    setTimeout(() => {
      flashMessage.style.opacity = '0';
      setTimeout(() => flashMessage.remove(), 300);
    }, 5000);
  }
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Form submission handling
  document.querySelectorAll('form[data-ajax="true"]').forEach(form => {
    form.addEventListener('submit', handleAjaxForm);
  });
  
  // Image lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Initialize page-specific features
function initializePageFeatures() {
  const currentPage = document.body.dataset.page;
  
  switch (currentPage) {
    case 'home':
      initializeHomePage();
      break;
    case 'login':
    case 'register':
      initializeAuthPages();
      break;
    case 'profile':
      initializeProfilePage();
      break;
    case 'chat':
      initializeChatPage();
      break;
    case 'settings':
      initializeSettingsPage();
      break;
  }
}

// Home page specific functionality
function initializeHomePage() {
  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-slide-up');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.feature-card, .testimonial-card, .step').forEach(el => {
    observer.observe(el);
  });
}

// Authentication pages functionality
function initializeAuthPages() {
  // Real-time form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(this);
      });
      
      input.addEventListener('input', function() {
        if (this.classList.contains('error')) {
          validateField(this);
        }
      });
    });
  });
}

// Profile page functionality
function initializeProfilePage() {
  // Profile image upload preview
  const imageInput = document.getElementById('profile-image');
  const imagePreview = document.getElementById('image-preview');
  
  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Chat page functionality
function initializeChatPage() {
  // This will be expanded in the chat implementation task
  console.log('Chat page initialized');
}

// Settings page functionality
function initializeSettingsPage() {
  // Settings form handling
  const settingsForms = document.querySelectorAll('.settings-form');
  settingsForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      handleSettingsForm(this);
    });
  });
}

// Helper functions
function closeAlert() {
  const alert = document.getElementById('flash-message');
  if (alert) {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 300);
  }
}

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';
  
  // Required field validation
  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'This field is required';
  }
  
  // Email validation
  if (field.type === 'email' && value && !SangamApp.utils.isValidEmail(value)) {
    isValid = false;
    errorMessage = 'Please enter a valid email address';
  }
  
  // Password validation
  if (field.type === 'password' && field.name === 'password' && value.length < 8) {
    isValid = false;
    errorMessage = 'Password must be at least 8 characters long';
  }
  
  // Confirm password validation
  if (field.name === 'confirmPassword') {
    const passwordField = document.querySelector('input[name="password"]');
    if (passwordField && value !== passwordField.value) {
      isValid = false;
      errorMessage = 'Passwords do not match';
    }
  }
  
  // Update field appearance
  if (isValid) {
    field.classList.remove('error');
    field.classList.add('valid');
  } else {
    field.classList.remove('valid');
    field.classList.add('error');
  }
  
  // Show/hide error message
  let errorElement = field.parentElement.querySelector('.error-message');
  if (!isValid && errorMessage) {
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = errorMessage;
  } else if (errorElement) {
    errorElement.remove();
  }
  
  return isValid;
}

function handleAjaxForm(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  // Validate form
  const errors = SangamApp.forms.validate(form);
  if (errors.length > 0) {
    SangamApp.notifications.error(errors[0]);
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  // Serialize form data
  const formData = SangamApp.forms.serialize(form);
  
  // Submit form
  fetch(form.action, {
    method: form.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'An error occurred');
      });
    }
    return response.json();
  })
  .then(data => {
    SangamApp.notifications.success(data.message || 'Success!');
    
    // Handle redirect if specified
    if (data.redirect) {
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 1000);
    }
  })
  .catch(error => {
    SangamApp.notifications.error(error.message);
  })
  .finally(() => {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  });
}

function handleSettingsForm(form) {
  const formData = SangamApp.forms.serialize(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  SangamApp.api.put('/settings', formData)
    .then(data => {
      SangamApp.notifications.success('Settings updated successfully');
    })
    .catch(error => {
      SangamApp.notifications.error(error.message);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Export for use in other scripts
window.closeAlert = closeAlert;/
/ Navigation and Layout Functions
window.SangamApp.navigation = {
  // Initialize navigation functionality
  init: function() {
    this.setupMobileMenu();
    this.setupDropdowns();
    this.setupScrollEffects();
    this.setupAlerts();
  },

  // Mobile menu toggle functionality
  setupMobileMenu: function() {
    const navbarToggle = document.getElementById('navbar-toggle');
    const navbarMenu = document.getElementById('navbar-menu');
    
    if (navbarToggle && navbarMenu) {
      navbarToggle.addEventListener('click', function() {
        navbarMenu.classList.toggle('active');
        navbarToggle.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navbarMenu.classList.contains('active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });

      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
        if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
          navbarMenu.classList.remove('active');
          navbarToggle.classList.remove('active');
          document.body.style.overflow = '';
        }
      });

      // Close menu when clicking on nav links
      const navLinks = navbarMenu.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', function() {
          navbarMenu.classList.remove('active');
          navbarToggle.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }
  },

  // Dropdown menu functionality
  setupDropdowns: function() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (toggle && menu) {
        toggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Close other dropdowns
          dropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              otherDropdown.querySelector('.dropdown-menu')?.classList.remove('active');
            }
          });
          
          // Toggle current dropdown
          menu.classList.toggle('active');
        });
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
          dropdown.querySelector('.dropdown-menu')?.classList.remove('active');
        }
      });
    });
  },

  // Scroll effects for navbar and back-to-top button
  setupScrollEffects: function() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Add/remove scrolled class for navbar styling
      if (scrollTop > 50) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
      
      // Hide/show navbar on scroll (optional)
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        navbar?.classList.add('navbar-hidden');
      } else {
        navbar?.classList.remove('navbar-hidden');
      }
      
      lastScrollTop = scrollTop;
    });
  },

  // Alert message functionality
  setupAlerts: function() {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
      const closeBtn = alert.querySelector('.alert-close');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          alert.style.animation = 'slideOutUp 0.3s ease-out forwards';
          setTimeout(() => {
            alert.remove();
          }, 300);
        });
      }
      
      // Auto-dismiss alerts after 5 seconds
      setTimeout(() => {
        if (alert.parentNode) {
          alert.style.animation = 'slideOutUp 0.3s ease-out forwards';
          setTimeout(() => {
            alert.remove();
          }, 300);
        }
      }, 5000);
    });
  }
};

// Form handling utilities
window.SangamApp.forms = {
  // Initialize form functionality
  init: function() {
    this.setupFormValidation();
    this.setupFormSubmission();
  },

  // Client-side form validation
  setupFormValidation: function() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        input.addEventListener('blur', function() {
          this.validateField(input);
        }.bind(this));
        
        input.addEventListener('input', function() {
          this.clearFieldError(input);
        }.bind(this));
      });
      
      form.addEventListener('submit', function(e) {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      }.bind(this));
    });
  },

  // Validate individual field
  validateField: function(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    let isValid = true;
    let message = '';

    // Clear previous errors
    this.clearFieldError(field);

    // Required field validation
    if (required && !value) {
      isValid = false;
      message = 'This field is required';
    }

    // Email validation
    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (type === 'password' && value) {
      if (value.length < 8) {
        isValid = false;
        message = 'Password must be at least 8 characters long';
      }
    }

    // Show error if validation failed
    if (!isValid) {
      this.showFieldError(field, message);
    }

    return isValid;
  },

  // Validate entire form
  validateForm: function(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  },

  // Show field error
  showFieldError: function(field, message) {
    field.classList.add('error');
    
    let errorElement = field.parentNode.querySelector('.field-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
  },

  // Clear field error
  clearFieldError: function(field) {
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  },

  // Setup AJAX form submission
  setupFormSubmission: function() {
    const ajaxForms = document.querySelectorAll('form[data-ajax]');
    
    ajaxForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        this.submitFormAjax(form);
      }.bind(this));
    });
  },

  // Submit form via AJAX
  submitFormAjax: function(form) {
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Loading...';
    }

    fetch(form.action, {
      method: form.method || 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showMessage(data.message || 'Success!', 'success');
        if (data.redirect) {
          setTimeout(() => {
            window.location.href = data.redirect;
          }, 1000);
        }
      } else {
        this.showMessage(data.message || 'An error occurred', 'error');
      }
    })
    .catch(error => {
      console.error('Form submission error:', error);
      this.showMessage('An error occurred. Please try again.', 'error');
    })
    .finally(() => {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  },

  // Show message to user
  showMessage: function(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
      <button class="alert-close">&times;</button>
    `;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild);
    } else {
      document.body.insertBefore(alertDiv, document.body.firstChild);
    }
    
    // Setup close functionality
    const closeBtn = alertDiv.querySelector('.alert-close');
    closeBtn.addEventListener('click', function() {
      alertDiv.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
};

// Global helper functions
window.closeAlert = function() {
  const alert = document.getElementById('flash-message');
  if (alert) {
    alert.style.animation = 'slideOutUp 0.3s ease-out forwards';
    setTimeout(() => {
      alert.remove();
    }, 300);
  }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.SangamApp.navigation.init();
  window.SangamApp.forms.init();
  
  console.log('🚀 Sangam Alumni Network initialized');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  .navbar-hidden {
    transform: translateY(-100%);
  }
  
  .navbar.scrolled {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
  
  .field-error {
    color: var(--error-color);
    font-size: var(--text-sm);
    margin-top: 0.25rem;
  }
  
  .error {
    border-color: var(--error-color) !important;
  }
`;
document.head.appendChild(style);