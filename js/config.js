// AI: Configuration loader
// Can be used to load API key from a config file or environment
// For browser apps, prefer using localStorage via the UI

/**
 * Initialize config from various sources
 */
export function initializeConfig() {
    // Check if config is available in window (can be set via script tag)
    if (window.OPENAI_API_KEY) {
        localStorage.setItem('OPENAI_API_KEY', window.OPENAI_API_KEY);
    }
    
    // Note: .env files cannot be read directly in browser
    // Use one of these methods:
    // 1. Set via UI (API Key button)
    // 2. Set window.OPENAI_API_KEY in a script tag before loading
    // 3. Create a config.js file that exports the key (not committed to git)
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
    initializeConfig();
}


















