/**
 * Mobile Enhancements for EduLLM Platform
 * Touch interactions, gestures, and mobile-specific features
 */

class MobileEnhancements {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window;
        this.swipeThreshold = 50; // Minimum distance for swipe
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    /**
     * Initialize mobile enhancements
     */
    initialize() {
        if (this.isMobile || this.isTouch) {
            this.setupSwipeGestures();
            this.setupTouchFeedback();
            this.setupPullToRefresh();
            this.optimizeForMobile();
            console.log('📱 Mobile enhancements enabled');
        }
    }

    /**
     * Detect if device is mobile
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    }

    /**
     * Setup swipe gestures for sidebar
     */
    setupSwipeGestures() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (!sidebar || !sidebarOverlay) return;

        // Swipe from left edge to open sidebar
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            // Check if horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Swipe from left edge to open
                if (this.touchStartX < 30 && deltaX > this.swipeThreshold) {
                    sidebar.classList.add('active');
                    sidebarOverlay.classList.add('active');
                }

                // Swipe right to close when sidebar is open
                if (sidebar.classList.contains('active') && deltaX < -this.swipeThreshold) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            }
        }, { passive: true });
    }

    /**
     * Add visual feedback for touch interactions
     */
    setupTouchFeedback() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.btn, .nav-link, .stat-card, .health-card');

        buttons.forEach(button => {
            button.addEventListener('touchstart', function(e) {
                this.style.transform = 'scale(0.98)';
                this.style.opacity = '0.9';
            }, { passive: true });

            button.addEventListener('touchend', function(e) {
                setTimeout(() => {
                    this.style.transform = '';
                    this.style.opacity = '';
                }, 150);
            }, { passive: true });
        });
    }

    /**
     * Setup pull-to-refresh (if supported)
     */
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;

            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 80 && window.scrollY === 0) {
                // Show refresh indicator
                document.body.style.transform = `translateY(${Math.min(pullDistance / 3, 40)}px)`;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (!pulling) return;

            const pullDistance = currentY - startY;

            if (pullDistance > 80 && window.scrollY === 0) {
                // Trigger refresh
                this.refreshPage();
            }

            // Reset
            document.body.style.transform = '';
            pulling = false;
            startY = 0;
            currentY = 0;
        }, { passive: true });
    }

    /**
     * Refresh page data
     */
    refreshPage() {
        // Refresh dashboard if available
        if (typeof dashboardManager !== 'undefined') {
            dashboardManager.refresh();
        }

        // Refresh database manager if available
        if (typeof dbManager !== 'undefined') {
            dbManager.refreshHealth();
            dbManager.refreshStats();
        }

        // Show feedback
        this.showToast('🔄 Refreshed');
    }

    /**
     * Mobile-specific optimizations
     */
    optimizeForMobile() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Optimize scroll performance
        if ('scrollBehavior' in document.documentElement.style) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }

        // Add active states to all interactive elements
        const interactiveElements = document.querySelectorAll('button, a, .clickable');
        interactiveElements.forEach(element => {
            element.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, duration = 2000) {
        // Create toast if it doesn't exist
        let toast = document.getElementById('mobile-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'mobile-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 24px;
                font-size: 14px;
                z-index: 10000;
                transition: transform 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.transform = 'translateX(-50%) translateY(0)';

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
        }, duration);
    }

    /**
     * Setup orientation change handling
     */
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalculate heights
                document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

                // Close sidebar on orientation change
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');

                if (sidebar && overlay) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            }, 100);
        });
    }

    /**
     * Prevent iOS Safari bounce effect
     */
    preventBounce() {
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            const element = e.target;
            const scrollable = element.closest('.scrollable');

            if (!scrollable) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Add viewport height variable for mobile browsers
     */
    setViewportHeight() {
        // Set CSS variable for viewport height (accounts for mobile browser chrome)
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    /**
     * Optimize images for mobile
     */
    optimizeImages() {
        if (!this.isMobile) return;

        const images = document.querySelectorAll('img[data-mobile-src]');
        images.forEach(img => {
            const mobileSrc = img.getAttribute('data-mobile-src');
            if (mobileSrc) {
                img.src = mobileSrc;
            }
        });
    }

    /**
     * Add keyboard safe area for iOS
     */
    handleKeyboard() {
        if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return;

        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }

    /**
     * Install as PWA prompt
     */
    setupPWA() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show install button
            const installBtn = document.getElementById('install-app-btn');
            if (installBtn) {
                installBtn.style.display = 'block';

                installBtn.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`PWA install ${outcome}`);
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    }
                });
            }
        });
    }

    /**
     * Get device info
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTouch: this.isTouch,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation ? screen.orientation.type : 'unknown',
            userAgent: navigator.userAgent
        };
    }

    /**
     * Log device info for debugging
     */
    logDeviceInfo() {
        const info = this.getDeviceInfo();
        console.log('📱 Device Info:', info);
    }
}

// Create global instance
const mobileEnhancements = new MobileEnhancements();

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mobileEnhancements.initialize();
        mobileEnhancements.setViewportHeight();
        mobileEnhancements.handleOrientationChange();
        mobileEnhancements.handleKeyboard();
        mobileEnhancements.logDeviceInfo();
    });
} else {
    mobileEnhancements.initialize();
    mobileEnhancements.setViewportHeight();
    mobileEnhancements.handleOrientationChange();
    mobileEnhancements.handleKeyboard();
    mobileEnhancements.logDeviceInfo();
}

console.log('📱 Mobile Enhancements loaded');
