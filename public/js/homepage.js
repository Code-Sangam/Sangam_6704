// Homepage specific JavaScript functionality
(function() {
  'use strict';

  // Homepage controller
  const Homepage = {
    // Configuration
    config: {
      animationDuration: 2000,
      scrollThreshold: 0.1,
      counterSpeed: 50
    },

    // Initialize homepage functionality
    init: function() {
      this.setupScrollAnimations();
      this.setupCounterAnimations();
      this.setupParallaxEffects();
      this.setupInteractiveElements();
      console.log('🏠 Homepage initialized');
    },

    // Setup scroll-triggered animations
    setupScrollAnimations: function() {
      const observerOptions = {
        threshold: this.config.scrollThreshold,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            
            // Trigger counter animation for stats
            if (entry.target.classList.contains('stat-number')) {
              this.animateCounter(entry.target);
            }
          }
        });
      }, observerOptions);

      // Observe elements for animation
      const animateElements = document.querySelectorAll(
        '.feature-card, .step, .testimonial-card, .stat-item'
      );
      
      animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
      });
    },

    // Animate number counters
    setupCounterAnimations: function() {
      this.countersAnimated = new Set();
    },

    animateCounter: function(element) {
      if (this.countersAnimated.has(element)) return;
      this.countersAnimated.add(element);

      const text = element.textContent;
      const finalValue = parseInt(text.replace(/[^0-9]/g, ''));
      const suffix = text.replace(/[0-9]/g, '');
      
      if (isNaN(finalValue)) return;

      let currentValue = 0;
      const increment = finalValue / (this.config.animationDuration / this.config.counterSpeed);
      
      const updateCounter = () => {
        currentValue += increment;
        
        if (currentValue >= finalValue) {
          element.textContent = finalValue.toLocaleString() + suffix;
        } else {
          element.textContent = Math.floor(currentValue).toLocaleString() + suffix;
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    },

    // Setup parallax effects for hero section
    setupParallaxEffects: function() {
      const hero = document.querySelector('.hero');
      const heroBackground = document.querySelector('.hero-background');
      
      if (!hero || !heroBackground) return;

      let ticking = false;

      const updateParallax = () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        heroBackground.style.transform = `translateY(${rate}px)`;
        ticking = false;
      };

      const requestParallaxUpdate = () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      };

      // Only enable parallax on larger screens
      if (window.innerWidth > 768) {
        window.addEventListener('scroll', requestParallaxUpdate);
      }
    },

    // Setup interactive elements
    setupInteractiveElements: function() {
      this.setupFeatureCardHovers();
      this.setupCTAButtonEffects();
    },

    // Feature card hover effects
    setupFeatureCardHovers: function() {
      const featureCards = document.querySelectorAll('.feature-card');
      
      featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0) scale(1)';
        });
      });
    },

    // CTA button effects
    setupCTAButtonEffects: function() {
      const ctaButtons = document.querySelectorAll('.cta-actions .btn, .hero-actions .btn');
      
      ctaButtons.forEach(button => {
        // Hover effects
        button.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px)';
          this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = '';
        });
      });
    }
  };

  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .animate-on-scroll.animated {
      opacity: 1;
      transform: translateY(0);
    }
    
    .feature-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Stagger animation delays */
    .feature-card:nth-child(1) { transition-delay: 0.1s; }
    .feature-card:nth-child(2) { transition-delay: 0.2s; }
    .feature-card:nth-child(3) { transition-delay: 0.3s; }
    .feature-card:nth-child(4) { transition-delay: 0.4s; }
    .feature-card:nth-child(5) { transition-delay: 0.5s; }
    .feature-card:nth-child(6) { transition-delay: 0.6s; }
    
    .step:nth-child(1) { transition-delay: 0.1s; }
    .step:nth-child(2) { transition-delay: 0.2s; }
    .step:nth-child(3) { transition-delay: 0.3s; }
    .step:nth-child(4) { transition-delay: 0.4s; }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .animate-on-scroll,
      .feature-card {
        transition: none;
      }
      
      .animate-on-scroll {
        opacity: 1;
        transform: none;
      }
    }
  `;
  document.head.appendChild(style);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Homepage.init());
  } else {
    Homepage.init();
  }

  // Expose Homepage object globally for debugging
  window.Homepage = Homepage;

})();