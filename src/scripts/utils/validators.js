/**
 * Input Validators
 */

export class Validators {
  static isValidNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }

  static isValidCurrency(code) {
    return /^[A-Z]{3}$/.test(code);
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  static isValidCountry(country) {
    return country && country.trim().length > 0;
  }

  static isNotEmpty(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }
}