// AI: This is the core wizard engine. It manages state, navigation, and decision tree traversal.
// The engine is provider-agnostic - it works with any data provider implementation.

import indexedDbDataProvider from './data-provider.js';
import * as research from './research-service.js';
import { loadData } from './data-loader.js';

/**
 * Wizard engine class
 */
export class WizardEngine {
    constructor(dataProvider = indexedDbDataProvider) {
        this.dataProvider = dataProvider;
        this.currentNodeId = null;
        this.choiceHistory = []; // Array of { nodeId, optionId, optionLabel }
        this.mode = 'design'; // 'study' or 'design'
    }

    /**
     * Initialize wizard - load root node
     * @returns {Promise<void>}
     */
    async initialize() {
        const rootNode = await this.dataProvider.getRootNode();
        if (!rootNode) {
            throw new Error('Root node not found');
        }
        this.currentNodeId = rootNode.id;
        this.choiceHistory = [];
    }

    /**
     * Get current node
     * @returns {Promise<Object|null>}
     */
    async getCurrentNode() {
        if (!this.currentNodeId) {
            return null;
        }
        return await this.dataProvider.getNodeById(this.currentNodeId);
    }

    /**
     * Get options for current node
     * @returns {Promise<Array>}
     */
    async getCurrentOptions() {
        if (!this.currentNodeId) {
            return [];
        }
        
        let options = await this.dataProvider.getOptionsForNode(this.currentNodeId);
        
        // If no options, try to research and generate them
        if (options.length === 0) {
            try {
                const currentNode = await this.getCurrentNode();
                if (currentNode && currentNode.nodeType === 'question') {
                    options = await research.researchMissingOptions(this.currentNodeId, currentNode);
                    
                    if (options && options.length > 0) {
                        // Reload data to get the new options
                        await loadData();
                        options = await this.dataProvider.getOptionsForNode(this.currentNodeId);
                    }
                }
            } catch (researchError) {
                console.error('Research options error:', researchError);
                // Continue with empty options
            }
        }
        
        return options;
    }

    /**
     * Select an option and navigate to next node
     * @param {string} optionId
     * @returns {Promise<Object>} - { nextNode, isTerminal, recipe }
     */
    async selectOption(optionId) {
        if (!this.currentNodeId) {
            throw new Error('No current node');
        }

        const options = await this.getCurrentOptions();
        const selectedOption = options.find(opt => opt.id === optionId);

        if (!selectedOption) {
            // Provide more helpful error message
            const currentNode = await this.getCurrentNode();
            const availableOptionIds = options.map(opt => opt.id).join(', ');
            throw new Error(
                `Option "${optionId}" not found for node "${currentNode?.id || this.currentNodeId}" (${currentNode?.question || 'unknown question'}). ` +
                `Available options: ${availableOptionIds || 'none'}. ` +
                `This may indicate a data inconsistency. Try clearing the cache.`
            );
        }

        // Add to history
        this.choiceHistory.push({
            nodeId: this.currentNodeId,
            optionId: selectedOption.id,
            optionLabel: selectedOption.label,
        });

        // Get next node
        let nextNodeId = await this.dataProvider.getNextNodeId(
            this.currentNodeId,
            optionId
        );

        // If no path found, try to research and create one
        if (!nextNodeId) {
            try {
                const currentNode = await this.getCurrentNode();
                // Save current state before research
                const savedNodeId = this.currentNodeId;
                const savedHistory = [...this.choiceHistory];
                
                nextNodeId = await research.researchMissingPath(
                    this.currentNodeId,
                    optionId,
                    selectedOption
                );
                
                if (nextNodeId) {
                    // Reload data to get the new path
                    await loadData();
                    // Restore state
                    this.currentNodeId = savedNodeId;
                    this.choiceHistory = savedHistory;
                    // Get the path again
                    nextNodeId = await this.dataProvider.getNextNodeId(
                        this.currentNodeId,
                        optionId
                    );
                }
            } catch (researchError) {
                console.error('Research path error:', researchError);
                // Fall through to throw original error
            }
            
            if (!nextNodeId) {
                throw new Error(`No path found from node ${this.currentNodeId} with option ${optionId}. Research failed or was cancelled.`);
            }
        }

        const nextNode = await this.dataProvider.getNodeById(nextNodeId);
        if (!nextNode) {
            throw new Error(`Next node ${nextNodeId} not found`);
        }

        this.currentNodeId = nextNodeId;

        // Check if terminal
        const isTerminal = nextNode.nodeType === 'terminal';
        let recipe = null;

        if (isTerminal) {
            recipe = await this.dataProvider.getRecipeForNode(nextNodeId);
            
            // If no recipe, try to research and generate one
            if (!recipe) {
                try {
                    // Format choice history for context
                    const breadcrumbs = await this.getBreadcrumbs();
                    recipe = await research.researchRecipe(nextNodeId, nextNode, breadcrumbs);
                    
                    if (recipe) {
                        // Reload data to get the new recipe
                        await loadData();
                        recipe = await this.dataProvider.getRecipeForNode(nextNodeId);
                    }
                } catch (researchError) {
                    console.error('Research recipe error:', researchError);
                    // Continue without recipe
                }
            }
        }

        return {
            nextNode,
            isTerminal,
            recipe,
        };
    }

    /**
     * Go back to previous decision
     * @returns {Promise<Object|null>} - Previous node or null if at root
     */
    async goBack() {
        if (this.choiceHistory.length === 0) {
            return null; // Already at root
        }

        // Remove last choice from history and save remaining history
        this.choiceHistory.pop();
        const remainingHistory = [...this.choiceHistory];

        // Rebuild path from history
        await this.initialize();
        for (const choice of remainingHistory) {
            await this.selectOption(choice.optionId);
        }

        return await this.getCurrentNode();
    }

    /**
     * Reset wizard to root
     * @returns {Promise<void>}
     */
    async reset() {
        await this.initialize();
    }

    /**
     * Get breadcrumb path
     * @returns {Array} - Array of { nodeId, nodeQuestion, optionLabel }
     */
    async getBreadcrumbs() {
        const breadcrumbs = [];

        // Start from root
        const rootNode = await this.dataProvider.getRootNode();
        if (!rootNode) {
            return breadcrumbs;
        }

        breadcrumbs.push({
            nodeId: rootNode.id,
            nodeQuestion: rootNode.question || 'Root',
            optionLabel: null,
        });

        // Follow history and reconstruct path
        let currentNodeId = rootNode.id;
        for (const choice of this.choiceHistory) {
            // Add the option label to the previous node's breadcrumb
            const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
            if (lastBreadcrumb) {
                lastBreadcrumb.optionLabel = choice.optionLabel;
            }

            // Get the next node after this choice
            const nextNodeId = await this.dataProvider.getNextNodeId(
                choice.nodeId,
                choice.optionId
            );

            if (nextNodeId) {
                const nextNode = await this.dataProvider.getNodeById(nextNodeId);
                if (nextNode) {
                    breadcrumbs.push({
                        nodeId: nextNodeId,
                        nodeQuestion: nextNode.question || 'Node',
                        optionLabel: null,
                    });
                    currentNodeId = nextNodeId;
                }
            }
        }

        // Add current node if different (in case we're at a node not yet in history)
        if (this.currentNodeId && this.currentNodeId !== currentNodeId) {
            const currentNode = await this.getCurrentNode();
            if (currentNode) {
                breadcrumbs.push({
                    nodeId: this.currentNodeId,
                    nodeQuestion: currentNode.question || 'Current',
                    optionLabel: null,
                });
            }
        }

        return breadcrumbs;
    }

    /**
     * Set mode (study or design)
     * @param {string} mode
     */
    setMode(mode) {
        if (mode === 'study' || mode === 'design') {
            this.mode = mode;
        }
    }

    /**
     * Get current mode
     * @returns {string}
     */
    getMode() {
        return this.mode;
    }

    /**
     * Search nodes by text
     * @param {string} query
     * @returns {Promise<Array>}
     */
    async searchNodesByText(query) {
        return await this.dataProvider.searchNodesByText(query);
    }

    /**
     * Search nodes by tag
     * @param {string} tag
     * @returns {Promise<Array>}
     */
    async searchNodesByTag(tag) {
        return await this.dataProvider.searchNodesByTag(tag);
    }

    /**
     * Jump to a specific node (for search results)
     * @param {string} nodeId
     * @returns {Promise<Object>}
     */
    async jumpToNode(nodeId) {
        const node = await this.dataProvider.getNodeById(nodeId);
        if (!node) {
            throw new Error(`Node ${nodeId} not found`);
        }

        // Clear history when jumping
        this.choiceHistory = [];
        this.currentNodeId = nodeId;

        return node;
    }

    /**
     * Generate explanation of current path
     * @returns {Promise<string>}
     */
    async explainPath() {
        if (this.choiceHistory.length === 0) {
            return 'Start by selecting an option from the root question.';
        }

        const explanations = [];
        for (const choice of this.choiceHistory) {
            const node = await this.dataProvider.getNodeById(choice.nodeId);
            const options = await this.dataProvider.getOptionsForNode(choice.nodeId);
            const selectedOption = options.find(opt => opt.id === choice.optionId);

            if (selectedOption && selectedOption.whenToUse) {
                explanations.push(
                    `At "${node ? node.question : 'decision point'}", you chose "${choice.optionLabel}". ${selectedOption.whenToUse}`
                );
            } else {
                explanations.push(
                    `At "${node ? node.question : 'decision point'}", you chose "${choice.optionLabel}".`
                );
            }
        }

        return explanations.join(' ');
    }

    /**
     * Export current path and recipe as JSON
     * @returns {Promise<Object>}
     */
    async exportPath() {
        const currentNode = await this.getCurrentNode();
        const breadcrumbs = await this.getBreadcrumbs();
        const explanation = await this.explainPath();

        let recipe = null;
        if (currentNode && currentNode.nodeType === 'terminal') {
            recipe = await this.dataProvider.getRecipeForNode(this.currentNodeId);
        }

        return {
            timestamp: new Date().toISOString(),
            mode: this.mode,
            path: breadcrumbs,
            explanation,
            currentNode: currentNode,
            recipe,
        };
    }
}


