/**
 * API Service
 * Centralized API calls with caching and error handling
 */

export class APIService {
  constructor() {
    this.cache = new Map();
    this.activeRequests = new Map();
    this.config = {
      exchangeRateAPI: 'https://api.exchangerate-api.com/v4/latest',
      countriesAPI: 'https://restcountries.com/v3.1',
      unsplashAPI: 'https://api.unsplash.com',
      // Read from environment variable (Vite automatically loads from .env)
      unsplashAccessKey: 'your_unsplash_access_key_here' || '',
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      timeout: 10000 // 10 seconds
    };
  }

  /**
   * Fetch wrapper with timeout and error handling
   */
  async fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Get cached data or fetch fresh
   */
  async getCachedOrFetch(key, fetchFn, duration = this.config.cacheDuration) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < duration) {
      return cached.data;
    }

    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key);
    }

    const request = fetchFn()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.activeRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.activeRequests.delete(key);
        if (cached?.data) {
          console.warn(`Using cached data for ${key}`);
          return cached.data;
        }
        throw error;
      });

    this.activeRequests.set(key, request);
    return request;
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `rates_${baseCurrency}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetch(`${this.config.exchangeRateAPI}/${baseCurrency}`),
      5 * 60 * 1000
    );
  }

  /**
   * Get all countries
   */
  async getAllCountries() {
    const cacheKey = 'all_countries';
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetch(`${this.config.countriesAPI}/all`),
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Get country by name
   */
  async getCountryByName(name) {
    if (!name || name.length < 2) return [];
    const cacheKey = `country_${name.toLowerCase()}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetch(`${this.config.countriesAPI}/name/${name}`),
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Get countries by region
   */
  async getCountriesByRegion(region) {
    const cacheKey = `region_${region.toLowerCase()}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetch(`${this.config.countriesAPI}/region/${region}`),
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Get destination photos from Unsplash
   */
  async getDestinationPhotos(countryName, count = 6) {
    // Check if API key is configured
    if (!this.config.unsplashAccessKey) {
      console.warn('Unsplash API key not configured. Add VITE_UNSPLASH_ACCESS_KEY to .env file.');
      return []; // Return empty array if no API key
    }

    const cacheKey = `photos_${countryName.toLowerCase()}`;
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const url = `${this.config.unsplashAPI}/search/photos?query=${encodeURIComponent(countryName + ' travel')}&per_page=${count}&orientation=landscape`;
        const response = await this.fetch(url, {
          headers: {
            'Authorization': `Client-ID ${this.config.unsplashAccessKey}`
          }
        });
        return response.results || [];
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Get currency exchange rate history (mock for now - can integrate real API later)
   */
  async getExchangeRateHistory(baseCurrency, targetCurrency, days = 30) {
    const cacheKey = `history_${baseCurrency}_${targetCurrency}_${days}`;
    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        // Mock historical data - in production, use a real API
        const currentRate = await this.getExchangeRates(baseCurrency);
        const rate = currentRate.rates?.[targetCurrency] || 1;

        // Generate mock historical data
        const history = [];
        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
          history.push({
            date: date.toISOString().split('T')[0],
            rate: rate * (1 + variance)
          });
        }
        return history;
      },
      60 * 60 * 1000 // 1 hour cache
    );
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const apiService = new APIService();