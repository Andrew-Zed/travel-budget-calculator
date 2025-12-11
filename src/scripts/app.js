/**
 * Main Application Entry Point
 */

import { CurrencyConverter } from './modules/converter.js';
import { DestinationExplorer } from './modules/explorer.js';
import { BudgetCalculator } from './modules/budget.js';
import { ExpenseTracker } from './modules/tracker.js';
import { TripManager } from './modules/tripManager.js';
import { CONSTANTS } from './config/constants.js';

class Application {
  constructor() {
    this.elements = {};
    this.converter = new CurrencyConverter();
    this.explorer = new DestinationExplorer();
    this.budgetCalc = new BudgetCalculator();
    this.expenseTracker = new ExpenseTracker();
    this.tripManager = new TripManager();
  }

  async init() {
    try {
      console.log(`Initializing ${CONSTANTS.APP_NAME} v${CONSTANTS.VERSION}`);

      this.cacheElements();
      this.setupNavigation();
      this.initializeModules();
      this.showSection('converter');

      console.log('✓ Application initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError(error.message);
    }
  }

  cacheElements() {
    this.elements = {
      app: document.getElementById('app'),
      appContent: document.getElementById('appContent'),
      navMenu: document.getElementById('navMenu'),
      hamburger: document.getElementById('hamburger'),
      sections: document.querySelectorAll('.section'),
      navLinks: document.querySelectorAll('.nav-link'),
    };
  }

  setupNavigation() {
    // Mobile menu toggle
    if (this.elements.hamburger) {
      this.elements.hamburger.addEventListener('click', () => {
        this.elements.navMenu.classList.toggle('active');
        this.elements.hamburger.classList.toggle('active');
      });
    }

    // Section navigation
    this.elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        
        // Close mobile menu
        this.elements.navMenu.classList.remove('active');
        this.elements.hamburger.classList.remove('active');
        
        this.showSection(sectionId);
      });
    });
  }

  initializeModules() {
    this.converter.init();
    this.explorer.init();
    this.budgetCalc.init();
    this.expenseTracker.init();
    this.tripManager.init();
  }

  showSection(sectionId) {
    // Hide all sections
    this.elements.sections.forEach(section => {
      section.classList.remove('active');
      section.classList.add('hidden');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.remove('hidden');
      section.classList.add('active');
    }

    // Update nav links
    this.elements.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === sectionId) {
        link.classList.add('active');
      }
    });
  }

  showError(message) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorState && errorMessage) {
      errorMessage.textContent = message;
      errorState.classList.remove('hidden');
      this.elements.appContent?.classList.add('hidden');
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init();
    window.__app = app;
  });
} else {
  const app = new Application();
  app.init();
  window.__app = app;
}