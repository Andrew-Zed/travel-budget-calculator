/**
 * Destination Explorer Module
 */

import { apiService } from '../services/apiService.js';
import { getCountryFlag, debounce } from '../utils/helpers.js';

export class DestinationExplorer {
  constructor() {
    this.elements = {};
    this.countries = [];
    this.filtered = [];
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadCountries();
  }

  cacheElements() {
    this.elements = {
      searchInput: document.getElementById('countrySearch'),
      regionFilter: document.getElementById('regionFilter'),
      countriesGrid: document.getElementById('countriesGrid'),
      countryModal: document.getElementById('countryModal'),
      modalBody: document.getElementById('modalBody'),
      modalClose: document.getElementById('modalClose'),
    };
  }

  setupEventListeners() {
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener(
        'input',
        debounce(() => this.filterCountries(), 300)
      );
    }
    if (this.elements.regionFilter) {
      this.elements.regionFilter.addEventListener('change', () => this.filterCountries());
    }
    if (this.elements.modalClose) {
      this.elements.modalClose.addEventListener('click', () => this.closeModal());
    }
    if (this.elements.countryModal) {
      this.elements.countryModal.addEventListener('click', (e) => {
        if (e.target === this.elements.countryModal) this.closeModal();
      });
    }
  }

  async loadCountries() {
    try {
      this.elements.countriesGrid.innerHTML = '<p>Loading countries...</p>';
      this.countries = await apiService.getAllCountries();
      this.filtered = [...this.countries];
      this.displayCountries();
    } catch (error) {
      console.error('Error loading countries:', error);
      this.elements.countriesGrid.innerHTML =
        '<p style="color: red;">Failed to load countries</p>';
    }
  }

  async filterCountries() {
    const search = this.elements.searchInput.value.toLowerCase();
    const region = this.elements.regionFilter.value;

    try {
      // If a region is selected, fetch countries by region from API
      if (region && !search) {
        this.elements.countriesGrid.innerHTML = '<p>Loading countries...</p>';
        this.countries = await apiService.getCountriesByRegion(region);
        this.filtered = [...this.countries];
      }
      // If no region selected and no search, load all countries
      else if (!region && !search) {
        this.elements.countriesGrid.innerHTML = '<p>Loading countries...</p>';
        this.countries = await apiService.getAllCountries();
        this.filtered = [...this.countries];
      }
      // If search is active, filter the current countries list
      else {
        // If region is selected but search is also active, ensure we have the right base data
        if (region && this.countries.length > 0 && this.countries[0].region !== region) {
          this.countries = await apiService.getCountriesByRegion(region);
        } else if (!region && this.countries.length > 0 && this.countries.length < 50) {
          // If "All Regions" is selected but we have filtered data, reload all
          this.countries = await apiService.getAllCountries();
        }

        this.filtered = this.countries.filter(country => {
          const matchesSearch = !search ||
            country.name.common.toLowerCase().includes(search) ||
            country.name.official.toLowerCase().includes(search);

          return matchesSearch;
        });
      }

      this.displayCountries();
    } catch (error) {
      console.error('Error filtering countries:', error);
      this.elements.countriesGrid.innerHTML =
        '<p style="color: red;">Failed to load countries</p>';
    }
  }

  displayCountries() {
    if (this.filtered.length === 0) {
      this.elements.countriesGrid.innerHTML = '<p>No countries found</p>';
      return;
    }

    this.elements.countriesGrid.innerHTML = this.filtered
      .slice(0, 50)
      .map(country => `
        <div class="country-card" data-code="${country.cca2}">
          <div class="country-card-image">
            ${getCountryFlag(country.cca2)}
          </div>
          <div class="country-card-body">
            <h3 class="country-card-title">${country.name.common}</h3>
            <div class="country-card-info">
              <p>Region: ${country.region}</p>
              <p>Capital: ${country.capital?.[0] || 'N/A'}</p>
              <p>Population: ${(country.population / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
      `)
      .join('');

    // Add click listeners
    this.elements.countriesGrid.querySelectorAll('.country-card').forEach(card => {
      card.addEventListener('click', () => {
        const code = card.dataset.code;
        const country = this.countries.find(c => c.cca2 === code);
        this.showModal(country);
      });
    });
  }

  async showModal(country) {
    if (!country) return;

    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const currencies = country.currencies ?
      Object.values(country.currencies).map(c => c.name).join(', ') : 'N/A';
    const timezones = country.timezones ? country.timezones.slice(0, 3).join(', ') : 'N/A';

    // Show loading state
    this.elements.modalBody.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2>${getCountryFlag(country.cca2)} ${country.name.common}</h2>
        <p>Loading destination photos...</p>
      </div>
    `;

    // Show modal
    this.elements.countryModal.classList.remove('hidden');

    // Fetch photos
    let photos = [];
    try {
      photos = await apiService.getDestinationPhotos(country.name.common, 6);
    } catch (error) {
      console.error('Error loading photos:', error);
    }

    // Update modal content
    this.elements.modalBody.innerHTML = `
      <div style="padding: 2rem;">
        <h2 style="text-align: center; margin-bottom: 1rem;">
          ${getCountryFlag(country.cca2)} ${country.name.common}
        </h2>

        ${photos.length > 0 ? `
          <div class="photo-gallery" style="margin-bottom: 2rem;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
              ${photos.map(photo => `
                <div class="gallery-item" style="position: relative; overflow: hidden; border-radius: 8px; aspect-ratio: 16/9;">
                  <img
                    src="${photo.urls?.small || ''}"
                    alt="${photo.alt_description || country.name.common}"
                    style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
                    onmouseover="this.style.transform='scale(1.1)'"
                    onmouseout="this.style.transform='scale(1)'"
                  />
                </div>
              `).join('')}
            </div>
            <p style="font-size: 0.75rem; color: #666; margin-top: 0.5rem; text-align: center;">
              Photos from <a href="https://unsplash.com" target="_blank" style="color: #667eea;">Unsplash</a>
            </p>
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
          <div>
            <strong>Official Name:</strong>
            <p>${country.name.official}</p>
          </div>
          <div>
            <strong>Capital:</strong>
            <p>${country.capital?.[0] || 'N/A'}</p>
          </div>
          <div>
            <strong>Region:</strong>
            <p>${country.region} ${country.subregion ? `(${country.subregion})` : ''}</p>
          </div>
          <div>
            <strong>Area:</strong>
            <p>${(country.area / 1000).toFixed(0)} km²</p>
          </div>
          <div>
            <strong>Population:</strong>
            <p>${(country.population / 1000000).toFixed(1)} million</p>
          </div>
          <div>
            <strong>Languages:</strong>
            <p>${languages}</p>
          </div>
          <div style="grid-column: 1 / -1;">
            <strong>Currencies:</strong>
            <p>${currencies}</p>
          </div>
          <div style="grid-column: 1 / -1;">
            <strong>Timezones:</strong>
            <p>${timezones}</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 1.5rem;">
          <button class="btn btn-primary" id="countryModalCloseBtn">
            Close
          </button>
        </div>
      </div>
    `;

    // Add event listener to the close button
    const closeBtn = document.getElementById('countryModalCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
  }

  closeModal() {
    this.elements.countryModal.classList.add('hidden');
  }
}