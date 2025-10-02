// Interactive Components JavaScript for Sangam Alumni Network
(function() {
  'use strict';

  // Main Components Controller
  const Components = {
    // Initialize all components
    init: function() {
      this.initModals();
      this.initDropdowns();
      this.initTabs();
      this.initAccordions();
      this.initTooltips();
      this.initToasts();
      this.initFormComponents();
      this.initImageGallery();
      this.initInfiniteScroll();
      this.initContextMenu();
      console.log('🎛️ Interactive components initialized');
    },

    // Modal functionality
    initModals: function() {
      const modalTriggers = document.querySelectorAll('[data-modal-target]');
      const modalCloses = document.querySelectorAll('[data-modal-close]');
      const modalOverlays = document.querySelectorAll('.modal-overlay');

      modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = trigger.getAttribute('data-modal-target');
          const modal = document.getElementById(targetId);
          if (modal) {
            this.openModal(modal);
          }
        });
      });

      modalCloses.forEach(close => {
        close.addEventListener('click', () => {
          const modal = close.closest('.modal-overlay');
          if (modal) {
            this.closeModal(modal);
          }
        });
      });

      modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this.closeModal(overlay);
          }
        });
      });

      // Close modal on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const activeModal = document.querySelector('.modal-overlay.active');
          if (activeModal) {
            this.closeModal(activeModal);
          }
        }
      });
    },

    openModal: function(modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus management
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    },

    closeModal: function(modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    },

    // Dropdown functionality
    initDropdowns: function() {
      const dropdowns = document.querySelectorAll('.dropdown');

      dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');

        if (trigger && menu) {
          trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close other dropdowns
            this.closeAllDropdowns();
            
            // Toggle current dropdown
            menu.classList.toggle('active');
          });
        }
      });

      // Close dropdowns when clicking outside
      document.addEventListener('click', () => {
        this.closeAllDropdowns();
      });
    },

    closeAllDropdowns: function() {
      const activeDropdowns = document.querySelectorAll('.dropdown-menu.active');
      activeDropdowns.forEach(menu => {
        menu.classList.remove('active');
      });
    },

    // Tab functionality
    initTabs: function() {
      const tabContainers = document.querySelectorAll('.tabs');

      tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanels = container.querySelectorAll('.tab-panel');

        tabButtons.forEach((button, index) => {
          button.addEventListener('click', () => {
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            if (tabPanels[index]) {
              tabPanels[index].classList.add('active');
            }
          });
        });
      });
    },

    // Accordion functionality
    initAccordions: function() {
      const accordionHeaders = document.querySelectorAll('.accordion-header');

      accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const accordionItem = header.closest('.accordion-item');
          const isActive = accordionItem.classList.contains('active');

          // Close all accordion items in the same container
          const container = accordionItem.closest('.accordion');
          if (container) {
            const allItems = container.querySelectorAll('.accordion-item');
            allItems.forEach(item => {
              item.classList.remove('active');
            });
          }

          // Toggle current item
          if (!isActive) {
            accordionItem.classList.add('active');
          }
        });
      });
    },

    // Tooltip functionality
    initTooltips: function() {
      const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

      tooltipTriggers.forEach(trigger => {
        const tooltipText = trigger.getAttribute('data-tooltip');
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-content';
        tooltip.textContent = tooltipText;
        trigger.appendChild(tooltip);
        trigger.classList.add('tooltip-trigger');

        // Position tooltip
        trigger.addEventListener('mouseenter', () => {
          this.positionTooltip(trigger, tooltip);
        });
      });
    },

    positionTooltip: function(trigger, tooltip) {
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // Default position (top)
      let top = -tooltipRect.height - 10;
      let left = (triggerRect.width - tooltipRect.width) / 2;

      // Adjust if tooltip goes off screen
      if (triggerRect.top + top < 0) {
        // Position below instead
        top = triggerRect.height + 10;
        tooltip.style.bottom = 'auto';
        tooltip.style.top = '125%';
      }

      tooltip.style.left = `${left}px`;
    },

    // Toast notification system
    initToasts: function() {
      // Create toast container if it doesn't exist
      if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
      }
    },

    showToast: function(message, type = 'info', duration = 5000) {
      const container = document.querySelector('.toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      };

      toast.innerHTML = `
        <div class="toast-icon">
          <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
          <i class="fas fa-times"></i>
        </button>
      `;

      // Add close functionality
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        this.removeToast(toast);
      });

      // Add to container and show
      container.appendChild(toast);
      
      // Trigger animation
      setTimeout(() => {
        toast.classList.add('active');
      }, 10);

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(toast);
        }, duration);
      }

      return toast;
    },

    removeToast: function(toast) {
      toast.classList.remove('active');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    },

    // Form component enhancements
    initFormComponents: function() {
      this.initTagInputs();
      this.initPasswordToggles();
      this.initFileInputs();
      this.initSearchInputs();
      this.initAutoComplete();
      this.initFormWizard();
      this.initFloatingLabels();
    },

    // Tag input functionality
    initTagInputs: function() {
      const tagContainers = document.querySelectorAll('.tag-input-container');

      tagContainers.forEach(container => {
        const input = container.querySelector('.tag-input');
        const hiddenInput = container.querySelector('input[type="hidden"]');

        if (input) {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const value = input.value.trim();
              if (value) {
                this.addTag(container, value);
                input.value = '';
                this.updateHiddenInput(container, hiddenInput);
              }
            } else if (e.key === 'Backspace' && input.value === '') {
              const lastTag = container.querySelector('.tag-item:last-of-type');
              if (lastTag) {
                this.removeTag(lastTag);
                this.updateHiddenInput(container, hiddenInput);
              }
            }
          });
        }
      });
    },

    addTag: function(container, value) {
      const tagItem = document.createElement('div');
      tagItem.className = 'tag-item';
      tagItem.innerHTML = `
        <span>${value}</span>
        <button type="button" class="tag-remove">
          <i class="fas fa-times"></i>
        </button>
      `;

      const removeBtn = tagItem.querySelector('.tag-remove');
      removeBtn.addEventListener('click', () => {
        this.removeTag(tagItem);
        const hiddenInput = container.querySelector('input[type="hidden"]');
        this.updateHiddenInput(container, hiddenInput);
      });

      const input = container.querySelector('.tag-input');
      container.insertBefore(tagItem, input);
    },

    removeTag: function(tagItem) {
      tagItem.remove();
    },

    updateHiddenInput: function(container, hiddenInput) {
      if (hiddenInput) {
        const tags = Array.from(container.querySelectorAll('.tag-item span'))
          .map(span => span.textContent);
        hiddenInput.value = JSON.stringify(tags);
      }
    },

    // Password toggle functionality
    initPasswordToggles: function() {
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

    // File input enhancements
    initFileInputs: function() {
      const fileInputs = document.querySelectorAll('.file-input');

      fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
          const label = input.nextElementSibling;
          const files = e.target.files;

          if (files.length > 0) {
            const fileNames = Array.from(files).map(file => file.name).join(', ');
            label.textContent = fileNames;
          } else {
            label.textContent = 'Choose files...';
          }
        });
      });
    },

    // Search input functionality
    initSearchInputs: function() {
      const searchContainers = document.querySelectorAll('.search-input-container');

      searchContainers.forEach(container => {
        const input = container.querySelector('.search-input');
        const clearBtn = container.querySelector('.search-clear');

        if (input && clearBtn) {
          input.addEventListener('input', () => {
            clearBtn.style.display = input.value ? 'block' : 'none';
          });

          clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            input.focus();
          });
        }
      });
    },

    // Auto-complete functionality
    initAutoComplete: function() {
      const autoCompletes = document.querySelectorAll('.autocomplete-container');

      autoCompletes.forEach(container => {
        const input = container.querySelector('input');
        const dropdown = container.querySelector('.autocomplete-dropdown');

        if (input && dropdown) {
          let currentIndex = -1;

          input.addEventListener('input', () => {
            const value = input.value.trim();
            if (value.length > 0) {
              this.showAutoCompleteResults(container, value);
            } else {
              dropdown.classList.remove('active');
            }
          });

          input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              currentIndex = Math.min(currentIndex + 1, items.length - 1);
              this.highlightAutoCompleteItem(items, currentIndex);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              currentIndex = Math.max(currentIndex - 1, -1);
              this.highlightAutoCompleteItem(items, currentIndex);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (currentIndex >= 0 && items[currentIndex]) {
                items[currentIndex].click();
              }
            } else if (e.key === 'Escape') {
              dropdown.classList.remove('active');
              currentIndex = -1;
            }
          });

          // Close dropdown when clicking outside
          document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
              dropdown.classList.remove('active');
              currentIndex = -1;
            }
          });
        }
      });
    },

    showAutoCompleteResults: function(container, query) {
      // This would typically fetch results from an API
      // For now, we'll just show the dropdown
      const dropdown = container.querySelector('.autocomplete-dropdown');
      dropdown.classList.add('active');
    },

    highlightAutoCompleteItem: function(items, index) {
      items.forEach((item, i) => {
        item.classList.toggle('highlighted', i === index);
      });
    },

    // Form wizard functionality
    initFormWizard: function() {
      const wizards = document.querySelectorAll('.form-wizard');

      wizards.forEach(wizard => {
        const steps = wizard.querySelectorAll('.form-wizard-step');
        const nextBtns = wizard.querySelectorAll('[data-wizard-next]');
        const prevBtns = wizard.querySelectorAll('[data-wizard-prev]');
        let currentStep = 0;

        nextBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
              steps[currentStep].classList.remove('active');
              currentStep++;
              steps[currentStep].classList.add('active');
              this.updateWizardProgress(wizard, currentStep, steps.length);
            }
          });
        });

        prevBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            if (currentStep > 0) {
              steps[currentStep].classList.remove('active');
              currentStep--;
              steps[currentStep].classList.add('active');
              this.updateWizardProgress(wizard, currentStep, steps.length);
            }
          });
        });

        // Initialize first step
        if (steps.length > 0) {
          steps[0].classList.add('active');
          this.updateWizardProgress(wizard, 0, steps.length);
        }
      });
    },

    updateWizardProgress: function(wizard, currentStep, totalSteps) {
      const progressBar = wizard.querySelector('.form-progress-fill');
      if (progressBar) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
      }

      const stepIndicators = wizard.querySelectorAll('.form-step');
      stepIndicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentStep);
        indicator.classList.toggle('completed', index < currentStep);
      });
    },

    // Floating labels
    initFloatingLabels: function() {
      const floatingInputs = document.querySelectorAll('.floating-label-input');

      floatingInputs.forEach(input => {
        // Check initial state
        this.updateFloatingLabel(input);

        input.addEventListener('focus', () => {
          this.updateFloatingLabel(input);
        });

        input.addEventListener('blur', () => {
          this.updateFloatingLabel(input);
        });

        input.addEventListener('input', () => {
          this.updateFloatingLabel(input);
        });
      });
    },

    updateFloatingLabel: function(input) {
      const label = input.nextElementSibling;
      if (label && label.classList.contains('floating-label')) {
        const hasValue = input.value.trim() !== '';
        const isFocused = document.activeElement === input;
        
        if (hasValue || isFocused) {
          label.classList.add('active');
        } else {
          label.classList.remove('active');
        }
      }
    },

    // Image gallery functionality
    initImageGallery: function() {
      const galleries = document.querySelectorAll('.image-gallery');

      galleries.forEach(gallery => {
        const items = gallery.querySelectorAll('.image-gallery-item');

        items.forEach((item, index) => {
          item.addEventListener('click', () => {
            this.openLightbox(gallery, index);
          });
        });
      });
    },

    openLightbox: function(gallery, startIndex) {
      const images = gallery.querySelectorAll('.image-gallery-img');
      let currentIndex = startIndex;

      // Create lightbox
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox-overlay';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <img class="lightbox-image" src="${images[currentIndex].src}" alt="">
          <button class="lightbox-close">
            <i class="fas fa-times"></i>
          </button>
          ${images.length > 1 ? `
            <button class="lightbox-nav lightbox-prev">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="lightbox-nav lightbox-next">
              <i class="fas fa-chevron-right"></i>
            </button>
          ` : ''}
        </div>
      `;

      document.body.appendChild(lightbox);

      // Show lightbox
      setTimeout(() => {
        lightbox.classList.add('active');
      }, 10);

      // Event listeners
      const closeBtn = lightbox.querySelector('.lightbox-close');
      const prevBtn = lightbox.querySelector('.lightbox-prev');
      const nextBtn = lightbox.querySelector('.lightbox-next');
      const lightboxImage = lightbox.querySelector('.lightbox-image');

      closeBtn.addEventListener('click', () => {
        this.closeLightbox(lightbox);
      });

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
          lightboxImage.src = images[currentIndex].src;
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
          lightboxImage.src = images[currentIndex].src;
        });
      }

      // Close on overlay click
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
          this.closeLightbox(lightbox);
        }
      });

      // Keyboard navigation
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          this.closeLightbox(lightbox);
        } else if (e.key === 'ArrowLeft' && prevBtn) {
          prevBtn.click();
        } else if (e.key === 'ArrowRight' && nextBtn) {
          nextBtn.click();
        }
      };

      document.addEventListener('keydown', handleKeydown);
      lightbox.handleKeydown = handleKeydown;
    },

    closeLightbox: function(lightbox) {
      lightbox.classList.remove('active');
      document.removeEventListener('keydown', lightbox.handleKeydown);
      setTimeout(() => {
        if (lightbox.parentNode) {
          lightbox.parentNode.removeChild(lightbox);
        }
      }, 300);
    },

    // Infinite scroll functionality
    initInfiniteScroll: function() {
      const containers = document.querySelectorAll('[data-infinite-scroll]');

      containers.forEach(container => {
        const loader = container.querySelector('.infinite-scroll-loader');
        let loading = false;

        const handleScroll = () => {
          if (loading) return;

          const containerRect = container.getBoundingClientRect();
          const loaderRect = loader.getBoundingClientRect();

          if (loaderRect.top <= window.innerHeight + 100) {
            loading = true;
            this.loadMoreContent(container).then(() => {
              loading = false;
            });
          }
        };

        window.addEventListener('scroll', handleScroll);
        container.addEventListener('scroll', handleScroll);
      });
    },

    loadMoreContent: function(container) {
      // This would typically make an API call
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate loading more content
          resolve();
        }, 1000);
      });
    },

    // Context menu functionality
    initContextMenu: function() {
      const contextMenuTriggers = document.querySelectorAll('[data-context-menu]');

      contextMenuTriggers.forEach(trigger => {
        trigger.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          const menuId = trigger.getAttribute('data-context-menu');
          const menu = document.getElementById(menuId);
          
          if (menu) {
            this.showContextMenu(menu, e.clientX, e.clientY);
          }
        });
      });

      // Close context menu on click outside
      document.addEventListener('click', () => {
        const activeMenus = document.querySelectorAll('.context-menu.active');
        activeMenus.forEach(menu => {
          menu.classList.remove('active');
        });
      });
    },

    showContextMenu: function(menu, x, y) {
      // Close other context menus
      const activeMenus = document.querySelectorAll('.context-menu.active');
      activeMenus.forEach(m => m.classList.remove('active'));

      // Position and show menu
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menu.classList.add('active');

      // Adjust position if menu goes off screen
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Components.init());
  } else {
    Components.init();
  }

  // Expose Components object globally
  window.Components = Components;

})();