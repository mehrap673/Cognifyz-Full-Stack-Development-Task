// Enhanced validation with password strength and more rules
const validators = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  validatePassword: (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // NEW: Calculate password strength score
  calculatePasswordStrength: (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
      isLong: password.length >= 12,
      hasMultipleSpecial: (password.match(/[@$!%*?&]/g) || []).length >= 2
    };

    if (checks.length) strength += 20;
    if (checks.hasLower) strength += 15;
    if (checks.hasUpper) strength += 15;
    if (checks.hasNumber) strength += 15;
    if (checks.hasSpecial) strength += 20;
    if (checks.isLong) strength += 10;
    if (checks.hasMultipleSpecial) strength += 5;

    return {
      score: strength,
      level: strength < 40 ? 'weak' : strength < 70 ? 'medium' : strength < 90 ? 'strong' : 'excellent',
      checks
    };
  },

  validateAge: (age) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
  },

  validateUsername: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  validateURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // NEW: Validate credit card (Luhn algorithm)
  validateCreditCard: (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  // NEW: Validate postal code
  validatePostalCode: (code, country) => {
    const patterns = {
      'India': /^[1-9][0-9]{5}$/,
      'USA': /^\d{5}(-\d{4})?$/,
      'UK': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
      'Canada': /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i
    };
    
    return patterns[country] ? patterns[country].test(code) : true;
  }
};

const validateRegistrationForm = (data) => {
  const errors = [];

  if (!data.username || !validators.validateUsername(data.username)) {
    errors.push('Username must be 3-20 characters (letters, numbers, underscore only)');
  }

  if (!data.email || !validators.validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || !validators.validatePassword(data.password)) {
    errors.push('Password must be 8+ chars with uppercase, lowercase, number, and special character');
  }

  // Enhanced password strength check
  if (data.password) {
    const strength = validators.calculatePasswordStrength(data.password);
    if (strength.level === 'weak') {
      errors.push('Password is too weak. Please use a stronger password');
    }
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!data.phone || !validators.validatePhone(data.phone)) {
    errors.push('Invalid Indian phone number (10 digits starting with 6-9)');
  }

  if (!data.age || !validators.validateAge(data.age)) {
    errors.push('Age must be between 18 and 100');
  }

  if (!data.gender) {
    errors.push('Gender is required');
  }

  if (!data.country) {
    errors.push('Country selection is required');
  }

  if (data.website && !validators.validateURL(data.website)) {
    errors.push('Invalid website URL');
  }

  // NEW: Postal code validation
  if (data.postalCode && !validators.validatePostalCode(data.postalCode, data.country)) {
    errors.push('Invalid postal code for selected country');
  }

  // NEW: Credit card validation (optional field)
  if (data.creditCard && !validators.validateCreditCard(data.creditCard)) {
    errors.push('Invalid credit card number');
  }

  if (!data.terms) {
    errors.push('You must accept terms and conditions');
  }

  return errors;
};

module.exports = { validators, validateRegistrationForm };
