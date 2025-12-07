// AI: Component builder manages the cart of selected components, their configurations,
// and integrates with the compatibility checker to validate selections.

import { CompatibilityChecker } from './compatibility-checker.js';
import indexedDbDataProvider from './data-provider.js';

/**
 * Component builder class
 */
export class ComponentBuilder {
    constructor(dataProvider = indexedDbDataProvider) {
        this.dataProvider = dataProvider;
        this.compatibilityChecker = new CompatibilityChecker(dataProvider);
        this.cart = []; // Array of { componentId, config, component }
        this.selectedComponentId = null; // Currently selected component for configuration
    }

    /**
     * Initialize the builder
     * @returns {Promise<void>}
     */
    async initialize() {
        await this.compatibilityChecker.initialize();
    }

    /**
     * Add a component to the cart
     * @param {string} componentId
     * @param {Object} config - Initial configuration
     * @returns {Promise<Object>} - { success: boolean, errors: Array, warnings: Array }
     */
    async addComponent(componentId, config = {}) {
        // Get component details
        const component = await this.dataProvider.getComponentById(componentId);
        if (!component) {
            return {
                success: false,
                errors: [{ message: `Component ${componentId} not found` }],
                warnings: []
            };
        }

        // Check if already in cart
        if (this.cart.find(item => item.componentId === componentId)) {
            return {
                success: false,
                errors: [{ message: 'Component is already in the cart' }],
                warnings: []
            };
        }

        // Check compatibility
        const existingIds = this.cart.map(item => item.componentId);
        const canAdd = await this.compatibilityChecker.canAddComponent(componentId, existingIds);

        if (!canAdd.canAdd) {
            return {
                success: false,
                errors: canAdd.errors,
                warnings: canAdd.warnings
            };
        }

        // Initialize config with defaults from schema
        const initializedConfig = this.initializeConfig(component, config);

        // Add to cart
        this.cart.push({
            componentId,
            config: initializedConfig,
            component
        });

        return {
            success: true,
            errors: [],
            warnings: canAdd.warnings
        };
    }

    /**
     * Remove a component from the cart
     * @param {string} componentId
     */
    removeComponent(componentId) {
        this.cart = this.cart.filter(item => item.componentId !== componentId);
        if (this.selectedComponentId === componentId) {
            this.selectedComponentId = null;
        }
    }

    /**
     * Get all components in cart
     * @returns {Array}
     */
    getCart() {
        return this.cart.map(item => ({
            componentId: item.componentId,
            config: item.config,
            component: item.component
        }));
    }

    /**
     * Get cart component IDs
     * @returns {Array<string>}
     */
    getCartComponentIds() {
        return this.cart.map(item => item.componentId);
    }

    /**
     * Configure a component in the cart
     * @param {string} componentId
     * @param {Object} config - Updated configuration
     */
    configureComponent(componentId, config) {
        const cartItem = this.cart.find(item => item.componentId === componentId);
        if (cartItem) {
            cartItem.config = { ...cartItem.config, ...config };
        }
    }

    /**
     * Get configuration for a component
     * @param {string} componentId
     * @returns {Object|null}
     */
    getComponentConfig(componentId) {
        const cartItem = this.cart.find(item => item.componentId === componentId);
        return cartItem ? cartItem.config : null;
    }

    /**
     * Set selected component for configuration UI
     * @param {string} componentId
     */
    setSelectedComponent(componentId) {
        const cartItem = this.cart.find(item => item.componentId === componentId);
        if (cartItem) {
            this.selectedComponentId = componentId;
        }
    }

    /**
     * Get currently selected component
     * @returns {Object|null}
     */
    getSelectedComponent() {
        if (!this.selectedComponentId) {
            return null;
        }
        const cartItem = this.cart.find(item => item.componentId === this.selectedComponentId);
        return cartItem ? cartItem : null;
    }

    /**
     * Clear the cart
     */
    clearCart() {
        this.cart = [];
        this.selectedComponentId = null;
    }

    /**
     * Check compatibility of all components in cart
     * @returns {Promise<Object>} - { errors: Array, warnings: Array, info: Array }
     */
    async checkCompatibility() {
        const componentIds = this.getCartComponentIds();
        const errors = await this.compatibilityChecker.getErrors(componentIds);
        const warnings = await this.compatibilityChecker.getWarnings(componentIds);
        const info = await this.compatibilityChecker.getInfo(componentIds);

        return { errors, warnings, info };
    }

    /**
     * Initialize configuration with defaults from schema
     * @param {Object} component
     * @param {Object} userConfig
     * @returns {Object}
     */
    initializeConfig(component, userConfig) {
        const config = {};
        const schema = component.configSchema || {};

        // Apply defaults from schema
        for (const [key, schemaDef] of Object.entries(schema)) {
            if (userConfig.hasOwnProperty(key)) {
                config[key] = userConfig[key];
            } else if (schemaDef.default !== undefined) {
                config[key] = schemaDef.default;
            }
        }

        // Include any additional user config not in schema
        for (const [key, value] of Object.entries(userConfig)) {
            if (!config.hasOwnProperty(key)) {
                config[key] = value;
            }
        }

        return config;
    }

    /**
     * Generate solution output combining all components
     * @returns {Promise<Object>}
     */
    async generateSolution() {
        const componentIds = this.getCartComponentIds();
        const compatibility = await this.checkCompatibility();

        // Load all component details
        const components = [];
        for (const cartItem of this.cart) {
            const recipe = cartItem.component.recipeNodeId 
                ? await this.dataProvider.getRecipeForNode(cartItem.component.recipeNodeId)
                : null;
            
            components.push({
                component: cartItem.component,
                config: cartItem.config,
                recipe
            });
        }

        return {
            timestamp: new Date().toISOString(),
            components,
            compatibility,
            summary: {
                totalComponents: this.cart.length,
                categories: this.getCategories(),
                hasErrors: compatibility.errors.length > 0,
                hasWarnings: compatibility.warnings.length > 0
            }
        };
    }

    /**
     * Get unique categories from cart
     * @returns {Array<string>}
     */
    getCategories() {
        const categories = new Set();
        this.cart.forEach(item => {
            if (item.component && item.component.category) {
                categories.add(item.component.category);
            }
        });
        return Array.from(categories);
    }

    /**
     * Load components from a recipe (for recipe-to-component conversion)
     * @param {string} recipeNodeId
     * @returns {Promise<Array<string>>} - Array of component IDs
     */
    async loadComponentsFromRecipe(recipeNodeId) {
        // Find component(s) that map to this recipe
        const allComponents = await this.dataProvider.getAllComponents();
        const matchingComponents = allComponents.filter(
            comp => comp.recipeNodeId === recipeNodeId
        );

        // Add matching components to cart
        const componentIds = [];
        for (const component of matchingComponents) {
            const result = await this.addComponent(component.id);
            if (result.success) {
                componentIds.push(component.id);
            }
        }

        return componentIds;
    }

    /**
     * Export cart as JSON
     * @returns {Promise<Object>}
     */
    async exportCart() {
        const solution = await this.generateSolution();
        return {
            ...solution,
            cart: this.getCart()
        };
    }
}


















