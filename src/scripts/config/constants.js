/**
 * Application Constants
 */

export const CONSTANTS = {
    APP_NAME: 'Travel Budget Calculator',
    VERSION: '1.0.0',

    STORAGE_KEYS: {
        TRIPS: 'tbc_trips',
        EXPENSES: 'tbc_expenses',
        PREFERENCES: 'tbc_preferences',
        CONVERSION_HISTORY: 'tbc_conversion_history',
        FAVORITE_CURRENCIES: 'tbc_favorite_currencies',
        USER_SETTINGS: 'tbc_user_settings',
    },

    CURRENCIES: [
        'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
        'INR', 'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'NOK', 'SEK',
        'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'TRY', 'KRW', 'THB'
    ],

    EXPENSE_CATEGORIES: {
        ACCOMMODATION: { id: 'accommodation', name: 'Accommodation', color: '#3498db', icon: '🏨' },
        FOOD: { id: 'food', name: 'Food & Dining', color: '#e74c3c', icon: '🍽️' },
        TRANSPORT: { id: 'transport', name: 'Transportation', color: '#f39c12', icon: '✈️' },
        ACTIVITIES: { id: 'activities', name: 'Activities', color: '#9b59b6', icon: '🎭' },
        SHOPPING: { id: 'shopping', name: 'Shopping', color: '#e91e63', icon: '🛍️' },
        MISC: { id: 'misc', name: 'Miscellaneous', color: '#95a5a6', icon: '📦' },
    },

    REGIONS: [
        'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'
    ],
};