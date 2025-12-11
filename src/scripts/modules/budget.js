/**
 * Budget Calculator Module
 */

import { storageService } from '../services/storageService.js';
import { CONSTANTS } from '../config/constants.js';
import { generateId, formatCurrency } from '../utils/helpers.js';

export class BudgetCalculator {
  constructor() {
    this.elements = {};
    this.trips = [];
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadTrips();
  }

  cacheElements() {
    this.elements = {
      addTripBtn: document.getElementById('addTripBtn'),
      tripSearch: document.getElementById('tripSearch'),
      tripsContainer: document.getElementById('tripsContainer'),
      tripModal: document.getElementById('tripModal'),
      tripModalBody: document.getElementById('tripModalBody'),
      tripModalClose: document.getElementById('tripModalClose'),
    };
  }

  setupEventListeners() {
    if (this.elements.addTripBtn) {
      this.elements.addTripBtn.addEventListener('click', () => this.openNewTripForm());
    }
    if (this.elements.tripSearch) {
      this.elements.tripSearch.addEventListener('input', () => this.filterTrips());
    }
    if (this.elements.tripModalClose) {
      this.elements.tripModalClose.addEventListener('click', () => this.closeModal());
    }
  }

  loadTrips() {
    this.trips = storageService.getItem(CONSTANTS.STORAGE_KEYS.TRIPS) || [];
    this.displayTrips();
  }

  displayTrips() {
    if (this.trips.length === 0) {
      this.elements.tripsContainer.innerHTML =
        '<p class="text-secondary">No trips yet. Create one to get started!</p>';
      return;
    }

    this.elements.tripsContainer.innerHTML = this.trips
      .map(trip => {
        const destinationsBudget = trip.destinations.reduce((sum, d) => sum + (d.budget || 0), 0);
        const totalBudget = destinationsBudget > 0 ? destinationsBudget : (trip.budget || 0);
        const dates = `${trip.startDate} - ${trip.endDate}`;

        return `
          <div class="trip-card fade-in">
            <div class="trip-header">
              <h3 class="trip-title">${trip.name}</h3>
              <div class="trip-controls">
                <button class="btn btn-sm btn-secondary" onclick="window.__app.budgetCalc.viewTripDetails('${trip.id}')">
                  📊 Details
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.__app.budgetCalc.deleteTrip('${trip.id}')">
                  🗑️ Delete
                </button>
              </div>
            </div>
            <p class="trip-dates">📅 ${dates}</p>
            ${trip.destinations.length > 0 ? `
              <div style="margin: 1rem 0;">
                <strong>Destinations:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                  ${trip.destinations.map(d => `
                    <span style="background: var(--bg-secondary); padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem;">
                      ${d.country} (${formatCurrency(d.budget || 0, trip.currency)})
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div class="trip-stats">
              <div class="stat">
                <div class="stat-value">${trip.destinations.length}</div>
                <div class="stat-label">Destinations</div>
              </div>
              <div class="stat">
                <div class="stat-value">${formatCurrency(totalBudget, trip.currency)}</div>
                <div class="stat-label">Total Budget</div>
              </div>
              <div class="stat">
                <div class="stat-value">${Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))} days</div>
                <div class="stat-label">Duration</div>
              </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="window.__app.budgetCalc.addDestination('${trip.id}')">
              ➕ Add Destination
            </button>
          </div>
        `;
      })
      .join('');
  }

  filterTrips() {
    const search = this.elements.tripSearch.value.toLowerCase();
    const filtered = this.trips.filter(trip =>
      trip.name.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
      this.elements.tripsContainer.innerHTML = '<p class="text-secondary">No trips found</p>';
      return;
    }

    this.elements.tripsContainer.innerHTML = filtered
      .map(trip => {
        const destinationsBudget = trip.destinations.reduce((sum, d) => sum + (d.budget || 0), 0);
        const totalBudget = destinationsBudget > 0 ? destinationsBudget : (trip.budget || 0);
        const dates = `${trip.startDate} - ${trip.endDate}`;

        return `
          <div class="trip-card">
            <div class="trip-header">
              <h3 class="trip-title">${trip.name}</h3>
            </div>
            <p class="trip-dates">${dates}</p>
            <div class="trip-stats">
              <div class="stat">
                <div class="stat-value">${trip.destinations.length}</div>
                <div class="stat-label">Destinations</div>
              </div>
              <div class="stat">
                <div class="stat-value">${formatCurrency(totalBudget, trip.currency)}</div>
                <div class="stat-label">Total Budget</div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  openNewTripForm() {
    this.elements.tripModalBody.innerHTML = `
      <div style="padding: 2rem;">
        <h2>Create New Trip</h2>
        <form id="tripForm" style="margin-top: 1.5rem;">
          <div class="form-group">
            <label for="tripName">Trip Name</label>
            <input type="text" id="tripName" class="input-lg" placeholder="e.g., Summer Europe 2025" required>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label for="tripStart">Start Date</label>
              <input type="date" id="tripStart" class="input-lg" required>
            </div>
            <div class="form-group">
              <label for="tripEnd">End Date</label>
              <input type="date" id="tripEnd" class="input-lg" required>
            </div>
          </div>

          <div class="form-group">
            <label for="tripBudget">Total Budget</label>
            <input type="number" id="tripBudget" class="input-lg" placeholder="0.00" step="0.01" required>
          </div>

          <div class="form-group">
            <label for="tripCurrency">Currency</label>
            <select id="tripCurrency" class="input-lg" required>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div class="form-group">
            <label for="tripDescription">Description (Optional)</label>
            <textarea id="tripDescription" class="input-lg" placeholder="Add notes about your trip..."></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('tripModal').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Trip</button>
          </div>
        </form>
      </div>
    `;

    this.elements.tripModal.classList.remove('hidden');

    const form = document.getElementById('tripForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleTripSubmit(e));
    }
  }

  handleTripSubmit(e) {
    e.preventDefault();

    const trip = {
      id: generateId(),
      name: document.getElementById('tripName').value,
      startDate: document.getElementById('tripStart').value,
      endDate: document.getElementById('tripEnd').value,
      budget: parseFloat(document.getElementById('tripBudget').value),
      currency: document.getElementById('tripCurrency').value,
      description: document.getElementById('tripDescription').value,
      destinations: [],
      createdAt: new Date().toISOString(),
    };

    this.trips.push(trip);
    this.saveTrips();
    this.displayTrips();
    this.closeModal();
  }

  deleteTrip(tripId) {
    if (confirm('Are you sure you want to delete this trip?')) {
      this.trips = this.trips.filter(t => t.id !== tripId);
      this.saveTrips();
      this.displayTrips();
    }
  }

  saveTrips() {
    storageService.setItem(CONSTANTS.STORAGE_KEYS.TRIPS, this.trips);
    // Notify other modules to refresh
    this.notifyOtherModules();
  }

  notifyOtherModules() {
    // Refresh trip manager if it exists
    if (window.__app?.tripManager) {
      window.__app.tripManager.loadTrips();
    }
    // Refresh expense tracker if it exists
    if (window.__app?.expenseTracker) {
      window.__app.expenseTracker.loadData();
    }
  }

  closeModal() {
    this.elements.tripModal.classList.add('hidden');
  }

  addDestination(tripId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return;

    this.elements.tripModalBody.innerHTML = `
      <div style="padding: 2rem;">
        <h2>Add Destination to ${trip.name}</h2>
        <form id="destinationForm" style="margin-top: 1.5rem;">
          <div class="form-group">
            <label for="destCountry">Country</label>
            <input type="text" id="destCountry" class="input-lg" placeholder="e.g., France" required>
          </div>

          <div class="form-group">
            <label for="destCity">City (Optional)</label>
            <input type="text" id="destCity" class="input-lg" placeholder="e.g., Paris">
          </div>

          <div class="form-group">
            <label for="destBudget">Budget for this destination</label>
            <input type="number" id="destBudget" class="input-lg" placeholder="0.00" step="0.01" required>
          </div>

          <div class="form-group">
            <label for="destDays">Number of days</label>
            <input type="number" id="destDays" class="input-lg" placeholder="0" min="1" required>
          </div>

          <div class="form-group">
            <label for="destNotes">Notes (Optional)</label>
            <textarea id="destNotes" class="input-lg" placeholder="Add notes about this destination..."></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('tripModal').classList.add('hidden')">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Destination</button>
          </div>
        </form>
      </div>
    `;

    this.elements.tripModal.classList.remove('hidden');

    const form = document.getElementById('destinationForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const destination = {
          id: generateId(),
          country: document.getElementById('destCountry').value,
          city: document.getElementById('destCity').value,
          budget: parseFloat(document.getElementById('destBudget').value),
          days: parseInt(document.getElementById('destDays').value),
          notes: document.getElementById('destNotes').value,
        };

        trip.destinations.push(destination);
        this.saveTrips();
        this.displayTrips();
        this.closeModal();
      });
    }
  }

  viewTripDetails(tripId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return;

    const destinationsBudget = trip.destinations.reduce((sum, d) => sum + (d.budget || 0), 0);
    const totalBudget = destinationsBudget > 0 ? destinationsBudget : (trip.budget || 0);
    const totalDays = trip.destinations.reduce((sum, d) => sum + (d.days || 0), 0);

    this.elements.tripModalBody.innerHTML = `
      <div style="padding: 2rem;">
        <h2>${trip.name}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${trip.description || 'No description'}</p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
          <div class="stat" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
            <div class="stat-value">${formatCurrency(totalBudget, trip.currency)}</div>
            <div class="stat-label">Total Budget</div>
          </div>
          <div class="stat" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
            <div class="stat-value">${trip.destinations.length}</div>
            <div class="stat-label">Destinations</div>
          </div>
          <div class="stat" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
            <div class="stat-value">${totalDays || 'N/A'}</div>
            <div class="stat-label">Total Days</div>
          </div>
        </div>

        ${trip.destinations.length > 0 ? `
          <h3 style="margin-bottom: 1rem;">Destinations Breakdown</h3>
          <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
            ${trip.destinations.map(dest => `
              <div style="background: white; border: 2px solid var(--border-light); border-radius: 8px; padding: 1rem; transition: all 0.3s ease;"
                   onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateX(4px)'"
                   onmouseout="this.style.borderColor='var(--border-light)'; this.style.transform='translateX(0)'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">
                      ${dest.country}${dest.city ? ` - ${dest.city}` : ''}
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.875rem;">
                      <div>💰 Budget: <strong>${formatCurrency(dest.budget, trip.currency)}</strong></div>
                      <div>📅 Days: <strong>${dest.days}</strong></div>
                      <div style="grid-column: 1 / -1;">💵 Per Day: <strong>${formatCurrency(dest.budget / dest.days, trip.currency)}</strong></div>
                    </div>
                    ${dest.notes ? `<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">📝 ${dest.notes}</p>` : ''}
                  </div>
                  <button class="btn btn-sm btn-danger" onclick="window.__app.budgetCalc.removeDestination('${trip.id}', '${dest.id}')" style="margin-left: 1rem;">
                    🗑️
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No destinations added yet.</p>'}

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
          <button class="btn btn-secondary" onclick="window.__app.budgetCalc.addDestination('${trip.id}')">
            ➕ Add Destination
          </button>
          <button class="btn btn-success" onclick="window.__app.budgetCalc.shareTripPlan('${trip.id}')">
            📤 Share Plan
          </button>
          <button class="btn btn-primary" onclick="document.getElementById('tripModal').classList.add('hidden')">
            Close
          </button>
        </div>
      </div>
    `;

    this.elements.tripModal.classList.remove('hidden');
  }

  shareTripPlan(tripId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return;

    const destinationsBudget = trip.destinations.reduce((sum, d) => sum + (d.budget || 0), 0);
    const totalBudget = destinationsBudget > 0 ? destinationsBudget : (trip.budget || 0);
    const totalDays = trip.destinations.reduce((sum, d) => sum + (d.days || 0), 0);

    // Generate shareable text
    const shareText = `
🌍 ${trip.name}
📅 ${trip.startDate} to ${trip.endDate}
💰 Total Budget: ${formatCurrency(totalBudget, trip.currency)}
📍 ${trip.destinations.length} Destination(s)
${trip.destinations.length > 0 ? '\n🗺️ Destinations:\n' + trip.destinations.map(d =>
  `  • ${d.country}${d.city ? ` (${d.city})` : ''}: ${formatCurrency(d.budget, trip.currency)} for ${d.days} days`
).join('\n') : ''}

${trip.description ? '\n📝 ' + trip.description : ''}

Created with Travel Budget Calculator
    `.trim();

    // Show share modal
    this.elements.tripModalBody.innerHTML = `
      <div style="padding: 2rem;">
        <h2>📤 Share Trip Plan: ${trip.name}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Copy and share your trip plan with friends and family!</p>

        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">
${shareText}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <button class="btn btn-secondary" onclick="window.__app.budgetCalc.viewTripDetails('${trip.id}')">
            ← Back
          </button>
          <button class="btn btn-primary" onclick="window.__app.budgetCalc.copyToClipboard(\`${shareText.replace(/`/g, '\\`')}\`)">
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    `;
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Trip plan copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('❌ Failed to copy. Please try again.');
    });
  }

  removeDestination(tripId, destId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return;

    if (confirm('Remove this destination?')) {
      trip.destinations = trip.destinations.filter(d => d.id !== destId);
      this.saveTrips();
      this.viewTripDetails(tripId); // Refresh the modal
    }
  }
}