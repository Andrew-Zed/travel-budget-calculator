/**
 * Trip Management Module
 */

import { storageService } from '../services/storageService.js';
import { CONSTANTS } from '../config/constants.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';

export class TripManager {
  constructor() {
    this.elements = {};
    this.trips = [];
  }

  init() {
    this.cacheElements();
    this.loadTrips();
  }

  cacheElements() {
    this.elements = {
      tripsListContainer: document.getElementById('tripsListContainer'),
    };
  }

  loadTrips() {
    this.trips = storageService.getItem(CONSTANTS.STORAGE_KEYS.TRIPS) || [];
    this.displayTrips();
  }

  displayTrips() {
    if (this.trips.length === 0) {
      this.elements.tripsListContainer.innerHTML = 
        '<p class="text-secondary">No trips saved yet. Create one in the Budget tab!</p>';
      return;
    }

    this.elements.tripsListContainer.innerHTML = this.trips
      .map(trip => {
        const totalBudget = trip.destinations.reduce((sum, d) => sum + (d.budget || 0), 0) || trip.budget;
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        return `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${trip.name}</h3>
            </div>
            <div class="card-body">
              <div style="margin-bottom: 1rem;">
                <p class="card-text">
                  <strong>Duration:</strong> ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)} (${days} days)
                </p>
                <p class="card-text">
                  <strong>Total Budget:</strong> ${formatCurrency(totalBudget, trip.currency)}
                </p>
                <p class="card-text">
                  <strong>Destinations:</strong> ${trip.destinations.length > 0 ? trip.destinations.map(d => d.country + (d.city ? ` (${d.city})` : '')).join(', ') : 'Not specified'}
                </p>
              </div>

              ${trip.description ? `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; margin-bottom: 1rem;">
                  <p class="text-secondary">${trip.description}</p>
                </div>
              ` : ''}

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light); margin: 1rem 0;">
                <div>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Destinations</p>
                  <p style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${trip.destinations.length}</p>
                </div>
                <div>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Duration</p>
                  <p style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${days}d</p>
                </div>
                <div>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Budget</p>
                  <p style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">${trip.currency}</p>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-secondary" onclick="window.__app.tripManager.viewTrip('${trip.id}')">View</button>
              <button class="btn btn-danger" onclick="window.__app.tripManager.deleteTrip('${trip.id}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  viewTrip(tripId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (trip) {
      alert(`Trip: ${trip.name}\nBudget: ${formatCurrency(trip.budget, trip.currency)}\nDates: ${trip.startDate} to ${trip.endDate}`);
    }
  }

  deleteTrip(tripId) {
    if (confirm('Are you sure you want to delete this trip? This will also delete all associated expenses.')) {
      this.trips = this.trips.filter(t => t.id !== tripId);
      
      // Also delete associated expenses
      let expenses = storageService.getItem(CONSTANTS.STORAGE_KEYS.EXPENSES) || [];
      expenses = expenses.filter(e => e.tripId !== tripId);
      storageService.setItem(CONSTANTS.STORAGE_KEYS.EXPENSES, expenses);
      
      storageService.setItem(CONSTANTS.STORAGE_KEYS.TRIPS, this.trips);
      this.loadTrips();
    }
  }

  exportTrip(tripId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (trip) {
      const data = JSON.stringify(trip, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${trip.name.replace(/\s+/g, '_')}.json`;
      link.click();
    }
  }
}