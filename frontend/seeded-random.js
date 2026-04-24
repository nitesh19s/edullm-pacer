/**
 * Seeded Pseudo-Random Number Generator
 *
 * Provides deterministic randomness for experiment reproducibility.
 * Uses Mulberry32 algorithm (fast, passes BigCrush test suite).
 *
 * @author EduLLM Research Platform
 * @version 1.0.0
 */

class SeededRandom {
    /**
     * @param {number} seed - Integer seed value
     */
    constructor(seed) {
        this.initialSeed = seed;
        this.state = seed;
        this.callCount = 0;
    }

    /**
     * Generate next random float in [0, 1)
     * Algorithm: Mulberry32
     * @returns {number}
     */
    next() {
        this.callCount++;
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Random integer in [min, max] inclusive
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    nextInt(min, max) {
        return min + Math.floor(this.next() * (max - min + 1));
    }

    /**
     * Random element from array
     * @param {array} arr
     * @returns {*}
     */
    choice(arr) {
        return arr[this.nextInt(0, arr.length - 1)];
    }

    /**
     * Shuffle array using Fisher-Yates with seeded random
     * @param {array} arr
     * @returns {array} New shuffled array
     */
    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Sample n elements without replacement
     * @param {array} arr
     * @param {number} n
     * @returns {array}
     */
    sample(arr, n) {
        return this.shuffle(arr).slice(0, Math.min(n, arr.length));
    }

    /**
     * Random float from normal distribution (Box-Muller)
     * @param {number} mean
     * @param {number} std
     * @returns {number}
     */
    nextGaussian(mean = 0, std = 1) {
        const u1 = this.next();
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z * std;
    }

    /**
     * Get serializable state for reproducibility
     * @returns {object}
     */
    getState() {
        return {
            seed: this.initialSeed,
            state: this.state,
            callCount: this.callCount
        };
    }

    /**
     * Restore from serialized state
     * @param {object} stateObj
     * @returns {SeededRandom}
     */
    static fromState(stateObj) {
        const rng = new SeededRandom(stateObj.seed);
        rng.state = stateObj.state;
        rng.callCount = stateObj.callCount;
        return rng;
    }

    /**
     * Create deterministic seed from string
     * @param {string} str
     * @returns {number}
     */
    static seedFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) || 1; // Ensure non-zero
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.state = this.initialSeed;
        this.callCount = 0;
    }
}

window.SeededRandom = SeededRandom;
console.log('✅ SeededRandom module loaded');
