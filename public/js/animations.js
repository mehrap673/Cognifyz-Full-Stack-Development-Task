// Scroll Reveal Animation
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach(el => observer.observe(el));
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  }
});

// Counter Animation
const animateCounter = (element, target, duration = 2000) => {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.target);
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.counter').forEach(counter => {
    counterObserver.observe(counter);
  });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Form Input Animation
document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('.form-control-enhanced');
  
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      if (!input.value) {
        input.parentElement.classList.remove('focused');
      }
    });
  });
});

// === TASK 4: DYNAMIC DOM MANIPULATION ===

// Dynamic Form Field Management
class DynamicFormManager {
  constructor() {
    this.fieldCount = 0;
    this.init();
  }

  init() {
    // Add event listeners when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      this.attachEventListeners();
    });
  }

  attachEventListeners() {
    // Dynamic field addition
    const addFieldBtn = document.getElementById('addDynamicField');
    if (addFieldBtn) {
      addFieldBtn.addEventListener('click', () => this.addField());
    }

    // Real-time character counter
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
      this.addCharacterCounter(textarea);
    });

    // Dynamic country-based fields
    const countrySelect = document.querySelector('select[name="country"]');
    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => this.updateCountryFields(e.target.value));
    }

    // Password strength meter with real-time feedback
    const passwordInput = document.querySelector('input[name="password"]');
    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
    }

    // Credit card formatting
    const cardInput = document.querySelector('input[name="creditCard"]');
    if (cardInput) {
      cardInput.addEventListener('input', (e) => this.formatCreditCard(e.target));
    }
  }

  addField() {
    this.fieldCount++;
    const container = document.getElementById('dynamicFieldsContainer');
    if (!container) return;

    const fieldHtml = `
      <div class="dynamic-field mb-3 animate-fade-in" id="field-${this.fieldCount}">
        <div class="row">
          <div class="col-10">
            <input type="text" name="skill[]" class="form-control form-control-enhanced" 
                   placeholder="Enter skill #${this.fieldCount}">
          </div>
          <div class="col-2">
            <button type="button" class="btn btn-danger w-100" onclick="formManager.removeField(${this.fieldCount})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', fieldHtml);
  }

  removeField(id) {
    const field = document.getElementById(`field-${id}`);
    if (field) {
      field.classList.add('animate-fade-out');
      setTimeout(() => field.remove(), 300);
    }
  }

  addCharacterCounter(textarea) {
    const maxLength = textarea.getAttribute('maxlength');
    const counter = document.createElement('div');
    counter.className = 'character-counter text-muted small mt-1';
    counter.textContent = `0 / ${maxLength}`;
    textarea.parentElement.appendChild(counter);

    textarea.addEventListener('input', () => {
      const length = textarea.value.length;
      counter.textContent = `${length} / ${maxLength}`;
      counter.style.color = length > maxLength * 0.9 ? '#e74c3c' : '#6c757d';
    });
  }

  updateCountryFields(country) {
    const postalCodeContainer = document.getElementById('postalCodeContainer');
    if (!postalCodeContainer) return;

    const labels = {
      'India': 'PIN Code',
      'USA': 'ZIP Code',
      'UK': 'Postal Code',
      'Canada': 'Postal Code'
    };

    const placeholders = {
      'India': '400001',
      'USA': '12345',
      'UK': 'SW1A 1AA',
      'Canada': 'K1A 0B1'
    };

    const label = postalCodeContainer.querySelector('label');
    const input = postalCodeContainer.querySelector('input');

    if (label) label.textContent = labels[country] || 'Postal Code';
    if (input) input.placeholder = placeholders[country] || 'Enter code';
  }

  updatePasswordStrength(password) {
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    const requirementsList = document.getElementById('passwordRequirements');

    if (!strengthBar) return;

    // Calculate strength
    let strength = 0;
    const requirements = {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    Object.values(requirements).forEach(met => { if (met) strength += 20; });

    // Update progress bar
    strengthBar.style.width = strength + '%';
    strengthBar.className = 'progress-bar progress-bar-animated';

    if (strength < 40) {
      strengthBar.classList.add('bg-danger');
      if (strengthText) strengthText.textContent = 'Weak';
    } else if (strength < 80) {
      strengthBar.classList.add('bg-warning');
      if (strengthText) strengthText.textContent = 'Medium';
    } else {
      strengthBar.classList.add('bg-success');
      if (strengthText) strengthText.textContent = 'Strong';
    }

    // Update requirements list
    if (requirementsList) {
      requirementsList.innerHTML = `
        <li class="${requirements.length ? 'text-success' : 'text-muted'}">
          ${requirements.length ? '✓' : '○'} At least 8 characters
        </li>
        <li class="${requirements.lower ? 'text-success' : 'text-muted'}">
          ${requirements.lower ? '✓' : '○'} Lowercase letter
        </li>
        <li class="${requirements.upper ? 'text-success' : 'text-muted'}">
          ${requirements.upper ? '✓' : '○'} Uppercase letter
        </li>
        <li class="${requirements.number ? 'text-success' : 'text-muted'}">
          ${requirements.number ? '✓' : '○'} Number
        </li>
        <li class="${requirements.special ? 'text-success' : 'text-muted'}">
          ${requirements.special ? '✓' : '○'} Special character (@$!%*?&)
        </li>
      `;
    }
  }

  formatCreditCard(input) {
    let value = input.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;

    // Detect card type
    const cardType = this.detectCardType(value);
    const cardIcon = document.getElementById('cardTypeIcon');
    if (cardIcon) {
      cardIcon.textContent = cardType;
    }
  }

  detectCardType(number) {
    if (/^4/.test(number)) return '💳 Visa';
    if (/^5[1-5]/.test(number)) return '💳 Mastercard';
    if (/^3[47]/.test(number)) return '💳 Amex';
    return '💳 Card';
  }
}

// Initialize form manager
const formManager = new DynamicFormManager();

// === CLIENT-SIDE ROUTING ===
class ClientRouter {
  constructor() {
    this.routes = {};
    this.init();
  }

  init() {
    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('DOMContentLoaded', () => {
      this.setupLinks();
      this.handleRoute();
    });
  }

  setupLinks() {
    document.querySelectorAll('a[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.getAttribute('href');
        this.navigate(path);
      });
    });
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname;
    console.log('Navigating to:', path);
    
    // Smooth transition effect
    document.body.style.opacity = '0';
    setTimeout(() => {
      document.body.style.opacity = '1';
    }, 100);
  }
}

// Initialize router
const router = new ClientRouter();
