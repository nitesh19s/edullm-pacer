/**
 * Contrast Manager for EduLLM Platform
 * Manages color contrast levels for accessibility and user preference
 */

class ContrastManager {
    constructor() {
        this.currentContrast = 'normal';
        this.supportedContrasts = ['normal', 'high', 'low', 'custom'];
        this.storageKey = 'edullm_contrast';

        // Bind methods
        this.changeContrast = this.changeContrast.bind(this);
        this.applyContrast = this.applyContrast.bind(this);
    }

    /**
     * Initialize contrast manager
     */
    initialize() {
        // Load saved contrast preference
        this.loadContrastPreference();

        // Apply initial contrast
        this.applyContrast();

        // Setup contrast selector if it exists
        this.setupContrastSelector();

        console.log('🎨 Contrast Manager initialized:', this.currentContrast);
    }

    /**
     * Load contrast preference from localStorage
     */
    loadContrastPreference() {
        const savedContrast = localStorage.getItem(this.storageKey);

        if (savedContrast && this.supportedContrasts.includes(savedContrast)) {
            this.currentContrast = savedContrast;
        }
    }

    /**
     * Save contrast preference to localStorage
     */
    saveContrastPreference() {
        localStorage.setItem(this.storageKey, this.currentContrast);
    }

    /**
     * Change contrast mode
     * @param {string} contrast - The contrast mode ('normal', 'high', 'low', 'custom')
     */
    changeContrast(contrast) {
        if (!this.supportedContrasts.includes(contrast)) {
            console.warn(`Unsupported contrast mode: ${contrast}`);
            return;
        }

        this.currentContrast = contrast;
        this.saveContrastPreference();
        this.applyContrast();

        // Dispatch custom event for other components to listen
        const event = new CustomEvent('contrastChanged', {
            detail: { contrast: this.currentContrast }
        });
        document.dispatchEvent(event);

        console.log(`✅ Contrast changed to: ${contrast}`);
    }

    /**
     * Apply contrast to the page
     */
    applyContrast() {
        // Remove all contrast classes
        this.supportedContrasts.forEach(contrast => {
            document.documentElement.classList.remove(`contrast-${contrast}`);
        });

        // Add current contrast class
        if (this.currentContrast !== 'normal') {
            document.documentElement.classList.add(`contrast-${this.currentContrast}`);
        }

        // Update selector if it exists
        this.updateContrastSelector();
    }

    /**
     * Setup contrast selector dropdown
     */
    setupContrastSelector() {
        const selector = document.getElementById('contrastSelect');

        if (selector) {
            // Set current value
            selector.value = this.currentContrast;

            // Add change event listener
            selector.addEventListener('change', (e) => {
                this.changeContrast(e.target.value);
            });
        }
    }

    /**
     * Update contrast selector to reflect current contrast
     */
    updateContrastSelector() {
        const selector = document.getElementById('contrastSelect');

        if (selector) {
            selector.value = this.currentContrast;
        }
    }

    /**
     * Get current contrast mode
     * @returns {string} Current contrast mode
     */
    getCurrentContrast() {
        return this.currentContrast;
    }

    /**
     * Toggle between normal and high contrast
     * Useful for keyboard shortcuts
     */
    toggleHighContrast() {
        const newContrast = this.currentContrast === 'high' ? 'normal' : 'high';
        this.changeContrast(newContrast);
    }

    /**
     * Get contrast information
     * @returns {object} Contrast information
     */
    getContrastInfo() {
        return {
            current: this.currentContrast,
            supported: this.supportedContrasts,
            descriptions: {
                normal: 'Standard colors and contrast',
                high: 'High contrast with bold colors for better visibility',
                low: 'Reduced contrast for easier viewing',
                custom: 'User-defined custom contrast settings'
            }
        };
    }

    /**
     * Set custom contrast values
     * @param {object} settings - Custom contrast settings
     */
    setCustomContrast(settings) {
        const root = document.documentElement;

        if (settings.foreground) {
            root.style.setProperty('--custom-foreground', settings.foreground);
        }
        if (settings.background) {
            root.style.setProperty('--custom-background', settings.background);
        }
        if (settings.accent) {
            root.style.setProperty('--custom-accent', settings.accent);
        }
        if (settings.border) {
            root.style.setProperty('--custom-border', settings.border);
        }

        this.changeContrast('custom');
    }

    /**
     * Reset to normal contrast
     */
    reset() {
        this.changeContrast('normal');
    }

    /**
     * Check if high contrast mode is active
     * @returns {boolean} True if high contrast is active
     */
    isHighContrast() {
        return this.currentContrast === 'high';
    }

    /**
     * Enable accessibility features based on contrast
     */
    applyAccessibilityEnhancements() {
        const body = document.body;

        if (this.currentContrast === 'high') {
            // Add focus indicators
            body.classList.add('enhanced-focus');
            // Increase cursor visibility
            body.style.cursor = 'default';
        } else {
            body.classList.remove('enhanced-focus');
            body.style.cursor = '';
        }
    }

    /**
     * Get contrast ratio between two colors
     * @param {string} color1 - First color (hex)
     * @param {string} color2 - Second color (hex)
     * @returns {number} Contrast ratio
     */
    getContrastRatio(color1, color2) {
        // Simplified contrast ratio calculation
        // For full WCAG compliance, use a proper library
        const getLuminance = (hex) => {
            const rgb = parseInt(hex.slice(1), 16);
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = (rgb >> 0) & 0xff;

            const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Check if contrast meets WCAG AA standards
     * @param {string} foreground - Foreground color (hex)
     * @param {string} background - Background color (hex)
     * @param {string} level - 'normal' or 'large' text
     * @returns {boolean} True if meets standards
     */
    meetsWCAG(foreground, background, level = 'normal') {
        const ratio = this.getContrastRatio(foreground, background);
        const requiredRatio = level === 'large' ? 3 : 4.5;
        return ratio >= requiredRatio;
    }
}

// Create global instance
const contrastManager = new ContrastManager();

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        contrastManager.initialize();
    });
} else {
    contrastManager.initialize();
}

// Keyboard shortcut: Ctrl + Shift + C to toggle high contrast
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        contrastManager.toggleHighContrast();

        // Show notification
        const mode = contrastManager.getCurrentContrast();
        console.log(`🎨 Contrast mode: ${mode} (Ctrl+Shift+C)`);
    }
});

console.log('🎨 Contrast Manager loaded');
