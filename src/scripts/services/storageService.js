/**
 * Storage Service
 * Wrapper around localStorage with error handling
 */

export class StorageService {
  constructor() {
    this.available = this.checkAvailable();
  }

  checkAvailable() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('localStorage not available');
      return false;
    }
  }

  setItem(key, value) {
    if (!this.available) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  getItem(key) {
    if (!this.available) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Parse error:', error);
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key) {
    if (!this.available) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Remove error:', error);
    }
  }

  clear() {
    if (!this.available) return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Clear error:', error);
    }
  }
}

export const storageService = new StorageService();