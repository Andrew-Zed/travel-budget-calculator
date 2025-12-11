/**
 * Expense Tracker Module
 */

import { storageService } from '../services/storageService.js';
import { CONSTANTS } from '../config/constants.js';
import { formatCurrency, generateId } from '../utils/helpers.js';

export class ExpenseTracker {
  constructor() {
    this.elements = {};
    this.trips = [];
    this.expenses = [];
    this.selectedTripId = null;
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadData();
  }

  cacheElements() {
    this.elements = {
      tripSelector: document.getElementById('tripSelector'),
      trackerContent: document.getElementById('trackerContent'),
    };
  }

  setupEventListeners() {
    if (this.elements.tripSelector) {
      this.elements.tripSelector.addEventListener('change', (e) => {
        this.selectedTripId = e.target.value;
        this.displayExpenseForm();
        this.displayExpenses();
      });
    }
  }

  loadData() {
    this.trips = storageService.getItem(CONSTANTS.STORAGE_KEYS.TRIPS) || [];
    this.expenses = storageService.getItem(CONSTANTS.STORAGE_KEYS.EXPENSES) || [];
    this.populateTripSelector();
  }

  populateTripSelector() {
    this.elements.tripSelector.innerHTML = '<option value="">Select a trip...</option>';
    
    this.trips.forEach(trip => {
      const option = document.createElement('option');
      option.value = trip.id;
      option.textContent = trip.name;
      this.elements.tripSelector.appendChild(option);
    });
  }

  displayExpenseForm() {
    if (!this.selectedTripId) {
      this.elements.trackerContent.innerHTML = '<p class="text-secondary">Select a trip to track expenses</p>';
      return;
    }

    const trip = this.trips.find(t => t.id === this.selectedTripId);

    this.elements.trackerContent.innerHTML = `
      <div class="expense-form">
        <h3>Add Expense</h3>
        <form id="expenseForm">
          <div class="expense-form-grid">
            <div class="form-group">
              <label for="expAmount">Amount</label>
              <input type="number" id="expAmount" class="input-lg" placeholder="0.00" step="0.01" required>
            </div>
            <div class="form-group">
              <label for="expCategory">Category</label>
              <select id="expCategory" class="input-lg" required>
                ${Object.values(CONSTANTS.EXPENSE_CATEGORIES).map(cat => 
                  `<option value="${cat.id}">${cat.name}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="expDescription">Description</label>
              <input type="text" id="expDescription" class="input-lg" placeholder="What did you buy?">
            </div>
            <div class="form-group">
              <label for="expDate">Date</label>
              <input type="date" id="expDate" class="input-lg" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Add Expense</button>
        </form>
      </div>

      <div id="expensesListContainer"></div>
    `;

    const form = document.getElementById('expenseForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
    }

    this.displayExpenses();
  }

  displayExpenses() {
    if (!this.selectedTripId) return;

    const tripExpenses = this.expenses.filter(e => e.tripId === this.selectedTripId);
    const container = document.getElementById('expensesListContainer');

    if (!container) return;

    if (tripExpenses.length === 0) {
      container.innerHTML = '<p class="text-secondary">No expenses yet</p>';
      return;
    }

    // Calculate by category
    const byCategory = {};
    let total = 0;

    tripExpenses.forEach(expense => {
      const cat = CONSTANTS.EXPENSE_CATEGORIES[expense.category.toUpperCase()];
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = { amount: 0, icon: cat.icon, color: cat.color };
      }
      byCategory[expense.category].amount += expense.amount;
      total += expense.amount;
    });

    const trip = this.trips.find(t => t.id === this.selectedTripId);

    container.innerHTML = `
      <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1.5rem;">📊 Expense Breakdown by Category</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
          ${Object.entries(byCategory).map(([cat, data]) => {
            const percentage = ((data.amount / total) * 100).toFixed(1);
            const catInfo = Object.values(CONSTANTS.EXPENSE_CATEGORIES).find(c => c.id === cat);
            return `
              <div class="scale-hover" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, ${data.color}15, ${data.color}05); border: 2px solid ${data.color}; border-radius: 0.5rem; transition: all 0.3s ease;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${data.icon}</div>
                <p style="font-size: 0.875rem; color: #7f8c8d; margin-bottom: 0.5rem;">${catInfo?.name}</p>
                <p style="font-weight: bold; font-size: 1.25rem; color: ${data.color}; margin-bottom: 0.5rem;">${formatCurrency(data.amount, trip.currency)}</p>
                <p style="font-size: 0.75rem; color: #7f8c8d; margin-bottom: 0.5rem;">${percentage}% of total</p>
                <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="background: ${data.color}; height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="expense-list">
        <div style="padding: 1rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 0.75rem 0.75rem 0 0;">
          <h4 style="margin: 0;">Expenses (${tripExpenses.length})</h4>
        </div>
        ${tripExpenses.map(expense => {
          const cat = CONSTANTS.EXPENSE_CATEGORIES[expense.category.toUpperCase()];
          return `
            <div class="expense-item">
              <div class="expense-info">
                <div style="display: inline-block; padding: 0.25rem 0.5rem; background-color: ${cat.color}; color: white; border-radius: 0.25rem; font-size: 0.75rem; font-weight: bold; margin-bottom: 0.5rem;">
                  ${cat.icon} ${cat.name}
                </div>
                <p class="expense-description">${expense.description || 'No description'}</p>
                <p class="expense-date">${expense.date}</p>
              </div>
              <div class="expense-amount">${formatCurrency(expense.amount, trip.currency)}</div>
              <button class="btn btn-sm btn-danger" onclick="window.__app.expenseTracker.deleteExpense('${expense.id}')">Delete</button>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 0.75rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="font-size: 0.875rem; color: #7f8c8d; margin-bottom: 0.5rem;">Total Expenses</p>
        <p style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${formatCurrency(total, trip.currency)}</p>
      </div>
    `;
  }

  handleExpenseSubmit(e) {
    e.preventDefault();

    const expense = {
      id: generateId(),
      tripId: this.selectedTripId,
      amount: parseFloat(document.getElementById('expAmount').value),
      category: document.getElementById('expCategory').value,
      description: document.getElementById('expDescription').value,
      date: document.getElementById('expDate').value,
      createdAt: new Date().toISOString(),
    };

    this.expenses.push(expense);
    storageService.setItem(CONSTANTS.STORAGE_KEYS.EXPENSES, this.expenses);
    
    document.getElementById('expenseForm').reset();
    this.displayExpenses();
  }

  deleteExpense(expenseId) {
    if (confirm('Delete this expense?')) {
      this.expenses = this.expenses.filter(e => e.id !== expenseId);
      storageService.setItem(CONSTANTS.STORAGE_KEYS.EXPENSES, this.expenses);
      this.displayExpenses();
    }
  }
}