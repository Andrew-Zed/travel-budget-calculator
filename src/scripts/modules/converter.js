/**
 * Currency Converter Module
 */

import { apiService } from '../services/apiService.js';
import { storageService } from '../services/storageService.js';
import { CONSTANTS } from '../config/constants.js';
import { formatCurrency, parseNumber } from '../utils/helpers.js';
import { Validators } from '../utils/validators.js';

export class CurrencyConverter {
  constructor() {
    this.elements = {};
    this.rates = {};
    this.lastUpdated = null;
    this.conversionHistory = [];
    this.favoriteCurrencies = [];
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadCurrencies();
    this.loadSavedPreferences();
    this.loadHistory();
    this.loadFavorites();
  }

  cacheElements() {
    this.elements = {
      fromAmount: document.getElementById('fromAmount'),
      fromCurrency: document.getElementById('fromCurrency'),
      toAmount: document.getElementById('toAmount'),
      toCurrency: document.getElementById('toCurrency'),
      swapBtn: document.getElementById('swapBtn'),
      exchangeRateInfo: document.getElementById('exchangeRateInfo'),
      lastUpdated: document.getElementById('lastUpdated'),
    };
  }

  setupEventListeners() {
    if (this.elements.fromAmount) {
      this.elements.fromAmount.addEventListener('input', () => this.convert());
    }
    if (this.elements.fromCurrency) {
      this.elements.fromCurrency.addEventListener('change', () => {
        this.convert();
        this.updateExchangeInfo();
      });
    }
    if (this.elements.toCurrency) {
      this.elements.toCurrency.addEventListener('change', () => {
        this.convert();
        this.updateExchangeInfo();
      });
    }
    if (this.elements.swapBtn) {
      this.elements.swapBtn.addEventListener('click', () => this.swap());
    }
  }

  async loadCurrencies() {
    try {
      const fromSelect = this.elements.fromCurrency;
      const toSelect = this.elements.toCurrency;

      // Clear existing options
      fromSelect.innerHTML = '';
      toSelect.innerHTML = '';

      // Get first currency rates to know available currencies
      const rates = await apiService.getExchangeRates('USD');
      const currencies = Object.keys(rates.rates || {});

      currencies.forEach(code => {
        const option1 = document.createElement('option');
        option1.value = code;
        option1.textContent = code;
        fromSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = code;
        option2.textContent = code;
        toSelect.appendChild(option2);
      });

      // Set defaults
      fromSelect.value = 'USD';
      toSelect.value = 'EUR';

      this.updateExchangeInfo();
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  }

  async convert() {
    try {
      const amount = parseNumber(this.elements.fromAmount.value);
      const fromCurrency = this.elements.fromCurrency.value;
      const toCurrency = this.elements.toCurrency.value;

      if (!Validators.isValidNumber(amount)) {
        this.elements.toAmount.value = '0.00';
        return;
      }

      if (fromCurrency === toCurrency) {
        this.elements.toAmount.value = amount.toFixed(2);
        return;
      }

      const rates = await apiService.getExchangeRates(fromCurrency);
      const rate = rates.rates?.[toCurrency];

      if (!rate) {
        console.error('Rate not found');
        return;
      }

      const converted = amount * rate;
      this.elements.toAmount.value = converted.toFixed(2);
      this.lastUpdated = new Date();

      // Save to history
      this.saveToHistory(amount, fromCurrency, converted, toCurrency, rate);

      // Save preference
      this.savePreference();
    } catch (error) {
      console.error('Conversion error:', error);
    }
  }

  async updateExchangeInfo() {
    try {
      const fromCurrency = this.elements.fromCurrency.value;
      const toCurrency = this.elements.toCurrency.value;

      if (fromCurrency === toCurrency) {
        this.elements.exchangeRateInfo.textContent = `1 ${fromCurrency} = 1.00 ${toCurrency}`;
        return;
      }

      const rates = await apiService.getExchangeRates(fromCurrency);
      const rate = rates.rates?.[toCurrency];

      if (rate) {
        this.elements.exchangeRateInfo.textContent = 
          `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        
        if (this.elements.lastUpdated) {
          const now = new Date();
          this.elements.lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
      }
    } catch (error) {
      console.error('Exchange info error:', error);
    }
  }

  swap() {
    const temp = this.elements.fromCurrency.value;
    this.elements.fromCurrency.value = this.elements.toCurrency.value;
    this.elements.toCurrency.value = temp;

    const tempAmount = this.elements.fromAmount.value;
    this.elements.fromAmount.value = this.elements.toAmount.value;
    this.elements.toAmount.value = tempAmount;

    this.convert();
    this.updateExchangeInfo();
  }

  savePreference() {
    const prefs = {
      fromCurrency: this.elements.fromCurrency.value,
      toCurrency: this.elements.toCurrency.value,
    };
    storageService.setItem(CONSTANTS.STORAGE_KEYS.PREFERENCES, prefs);
  }

  loadSavedPreferences() {
    const prefs = storageService.getItem(CONSTANTS.STORAGE_KEYS.PREFERENCES);
    if (prefs) {
      if (prefs.fromCurrency) this.elements.fromCurrency.value = prefs.fromCurrency;
      if (prefs.toCurrency) this.elements.toCurrency.value = prefs.toCurrency;
    }
  }

  saveToHistory(fromAmount, fromCurrency, toAmount, toCurrency, rate) {
    const historyItem = {
      id: Date.now(),
      fromAmount,
      fromCurrency,
      toAmount,
      toCurrency,
      rate,
      timestamp: new Date().toISOString()
    };

    this.conversionHistory.unshift(historyItem);
    // Keep only last 10 conversions
    if (this.conversionHistory.length > 10) {
      this.conversionHistory = this.conversionHistory.slice(0, 10);
    }

    storageService.setItem(CONSTANTS.STORAGE_KEYS.CONVERSION_HISTORY, this.conversionHistory);
  }

  loadHistory() {
    this.conversionHistory = storageService.getItem(CONSTANTS.STORAGE_KEYS.CONVERSION_HISTORY) || [];
  }

  loadFavorites() {
    this.favoriteCurrencies = storageService.getItem(CONSTANTS.STORAGE_KEYS.FAVORITE_CURRENCIES) || [];
  }

  saveFavorite(currency) {
    if (!this.favoriteCurrencies.includes(currency)) {
      this.favoriteCurrencies.push(currency);
      storageService.setItem(CONSTANTS.STORAGE_KEYS.FAVORITE_CURRENCIES, this.favoriteCurrencies);
    }
  }
}