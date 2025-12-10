// Server-side validation module
const validators = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone format
    return phoneRegex.test(phone);
  },

  validatePassword: (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  validateAge: (age) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
  },

  validateUsername: (username) => {
    // 3-20 chars, alphanumeric and underscore only
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

  if (!data.terms) {
    errors.push('You must accept terms and conditions');
  }

  return errors;
};

module.exports = { validators, validateRegistrationForm };
