/**
 * Language Manager for EduLLM Platform
 * Handles language switching between English, Hindi, and Bilingual modes
 */

class LanguageManager {
    constructor() {
        this.currentLanguage = 'en'; // Default to English
        this.supportedLanguages = ['en', 'hi', 'bilingual'];
        this.translations = translations; // From translations.js

        // Load saved language preference
        this.loadLanguagePreference();
    }

    /**
     * Initialize language manager
     */
    initialize() {
        // Set up language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = this.currentLanguage;
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }

        // Apply current language
        this.applyLanguage();

        console.log(`🌐 Language Manager initialized: ${this.currentLanguage}`);
    }

    /**
     * Load language preference from localStorage
     */
    loadLanguagePreference() {
        const saved = localStorage.getItem('edullm_language');
        if (saved && this.supportedLanguages.includes(saved)) {
            this.currentLanguage = saved;
        }
    }

    /**
     * Save language preference to localStorage
     */
    saveLanguagePreference() {
        localStorage.setItem('edullm_language', this.currentLanguage);
    }

    /**
     * Change language
     */
    changeLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.error('Unsupported language:', lang);
            return;
        }

        this.currentLanguage = lang;
        this.saveLanguagePreference();
        this.applyLanguage();

        console.log(`🌐 Language changed to: ${lang}`);
    }

    /**
     * Get translation text
     */
    getText(path, context = null) {
        const keys = path.split('.');
        let value = this.translations;

        // Navigate through the translation object
        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                console.warn(`Translation not found: ${path}`);
                return path;
            }
        }

        // Return appropriate language
        if (this.currentLanguage === 'bilingual') {
            // Return both English and Hindi
            return `${value.en} / ${value.hi}`;
        } else {
            return value[this.currentLanguage] || value.en;
        }
    }

    /**
     * Apply language to all elements with data-i18n attribute
     */
    applyLanguage() {
        // Find all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.getText(key);

            // Check if it's an input placeholder
            if (element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });

        // Handle elements with data-i18n-title attribute (for title/tooltip)
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const text = this.getText(key);
            element.title = text;
        });

        // Handle elements with data-i18n-placeholder attribute
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const text = this.getText(key);
            element.placeholder = text;
        });

        // Update document language attribute
        document.documentElement.lang = this.currentLanguage === 'bilingual' ? 'en' : this.currentLanguage;

        console.log(`✅ Language changed to: ${this.currentLanguage}`);
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Check if current language is bilingual
     */
    isBilingual() {
        return this.currentLanguage === 'bilingual';
    }

    /**
     * Format number according to language
     */
    formatNumber(num) {
        if (this.currentLanguage === 'hi' || this.currentLanguage === 'bilingual') {
            // Use Indian number formatting
            return num.toLocaleString('en-IN');
        } else {
            return num.toLocaleString('en-US');
        }
    }

    /**
     * Format date according to language
     */
    formatDate(date) {
        const d = new Date(date);

        if (this.currentLanguage === 'hi') {
            return d.toLocaleDateString('hi-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (this.currentLanguage === 'bilingual') {
            const en = d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            return en; // Use English for dates in bilingual mode
        } else {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * Format time according to language
     */
    formatTime(date) {
        const d = new Date(date);

        if (this.currentLanguage === 'hi') {
            return d.toLocaleTimeString('hi-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    /**
     * Add translation to element
     */
    translateElement(element, key) {
        element.setAttribute('data-i18n', key);
        element.textContent = this.getText(key);
    }

    /**
     * Dynamically set translation
     */
    setTranslation(element, key) {
        const text = this.getText(key);
        element.textContent = text;
        return text;
    }

    /**
     * Get language direction (LTR/RTL)
     */
    getDirection() {
        // Hindi is LTR, but if we support Arabic/Urdu in future, this would be useful
        return 'ltr';
    }
}

// Create global instance
const languageManager = new LanguageManager();

// Auto-initialize on DOM load if not already done
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        languageManager.initialize();
        // Re-apply after a short delay to ensure all elements are loaded
        setTimeout(() => languageManager.applyLanguage(), 500);
    });
} else {
    // DOM already loaded
    languageManager.initialize();
    // Re-apply after a short delay to ensure all elements are loaded
    setTimeout(() => languageManager.applyLanguage(), 500);
}

// Make it globally accessible
window.languageManager = languageManager;

console.log('🌐 Language Manager loaded');
