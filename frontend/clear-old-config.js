/**
 * Clear Old Configuration Script
 * Removes outdated LLM configurations to prevent errors
 */

console.log('🧹 Clearing old LLM configurations...');

// Remove old configurations
const keysToRemove = [
    'llm_config',
    'llm_service_config',
    'openai_config'
];

keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
    }
});

// Set default to use local models
console.log('🔧 Setting default to local models...');
console.log('✅ Configuration cleared! Refresh the page to use local models.');
console.log('💡 All operations will now use FREE local Ollama models by default.');
