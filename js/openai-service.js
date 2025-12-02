// AI: OpenAI API client using gpt-4o-mini for cost-effective research
// Handles API calls and structured prompt formatting

/**
 * Get OpenAI API key from config
 * Checks localStorage first, then window config
 * @returns {string|null}
 */
function getApiKey() {
    // Check localStorage (user can set via UI)
    const storedKey = localStorage.getItem('OPENAI_API_KEY');
    if (storedKey) {
        return storedKey;
    }
    
    // Check window config (can be set via script tag in HTML)
    if (window.OPENAI_API_KEY) {
        return window.OPENAI_API_KEY;
    }
    
    return null;
}

/**
 * Call OpenAI API
 * @param {string} prompt - User prompt
 * @param {string} systemMessage - System message
 * @param {string} model - Model name (default: gpt-4o-mini)
 * @returns {Promise<Object>} - API response
 */
export async function callOpenAI(prompt, systemMessage = '', model = 'gpt-4o-mini') {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in localStorage or window.OPENAI_API_KEY');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Research an Azure topic and return structured information
 * @param {string} topic - Topic to research
 * @param {Object} context - Additional context (current node, choices, etc.)
 * @returns {Promise<Object>} - Structured research results
 */
export async function researchAzureTopic(topic, context = {}) {
    const systemMessage = `You are an Azure architecture expert. Provide accurate, structured information about Azure services and solutions. 
Format your responses as JSON when possible. Focus on practical implementation details, best practices, and decision-making guidance.`;

    const prompt = `Research the Azure topic: "${topic}"

Context: ${JSON.stringify(context, null, 2)}

Provide structured information about this Azure topic including:
1. Key concepts and use cases
2. Related Azure services
3. Decision factors (pros/cons)
4. Implementation considerations
5. Links to official documentation

Format as JSON with this structure:
{
  "summary": "Brief summary",
  "keyConcepts": ["concept1", "concept2"],
  "relatedServices": ["service1", "service2"],
  "pros": ["pro1", "pro2"],
  "cons": ["con1", "con2"],
  "useCases": ["use case 1", "use case 2"],
  "documentationLinks": [{"label": "link name", "url": "https://..."}]
}`;

    const response = await callOpenAI(prompt, systemMessage);
    
    // Try to parse as JSON, fallback to text
    try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, response];
        return JSON.parse(jsonMatch[1] || response);
    } catch (e) {
        // Return as text if not valid JSON
        return { summary: response, raw: true };
    }
}

/**
 * Generate a recipe for a terminal node
 * @param {Object} nodeInfo - Node information
 * @param {Array} choices - User's choice history
 * @returns {Promise<Object>} - Recipe object matching JSON schema
 */
export async function generateRecipe(nodeInfo, choices = []) {
    const systemMessage = `You are an Azure implementation expert. Generate step-by-step recipes for Azure solutions.
Recipes should be practical, actionable, and follow Azure best practices.`;

    const choiceContext = choices.map(c => `${c.nodeQuestion}: ${c.optionLabel}`).join(' → ');
    
    const prompt = `Generate a detailed Azure implementation recipe for:
Node: ${nodeInfo.question || nodeInfo.id}
Description: ${nodeInfo.description || 'N/A'}
Path taken: ${choiceContext || 'Root'}

Create a recipe with:
1. Title (concise, descriptive)
2. Steps (numbered, with title and description for each)
3. Infrastructure resources (Azure services needed)
4. Links to official documentation
5. Skill level (beginner/intermediate/advanced)

Format as JSON matching this structure:
{
  "title": "Recipe Title",
  "steps": [
    {
      "number": 1,
      "title": "Step title",
      "description": "Detailed step description"
    }
  ],
  "bicepOutline": {
    "resources": ["Microsoft.ServiceBus/namespaces", "Microsoft.Storage/storageAccounts"]
  },
  "links": [
    {"label": "Documentation", "url": "https://..."}
  ],
  "skillLevel": "intermediate"
}`;

    const response = await callOpenAI(prompt, systemMessage);
    
    try {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, response];
        const recipe = JSON.parse(jsonMatch[1] || response);
        
        // Ensure required fields
        if (!recipe.title) recipe.title = nodeInfo.question || 'Azure Recipe';
        if (!recipe.steps) recipe.steps = [];
        if (!recipe.links) recipe.links = [];
        
        return recipe;
    } catch (e) {
        // Fallback recipe structure
        return {
            title: nodeInfo.question || 'Azure Recipe',
            steps: [
                {
                    number: 1,
                    title: 'Setup',
                    description: response.substring(0, 500)
                }
            ],
            links: [],
            skillLevel: 'intermediate'
        };
    }
}

/**
 * Generate node options based on a question
 * @param {string} nodeQuestion - The question to generate options for
 * @param {Object} context - Additional context
 * @returns {Promise<Array>} - Array of option objects
 */
export async function generateNodeOptions(nodeQuestion, context = {}) {
    const systemMessage = `You are an Azure architecture expert. Generate decision tree options for Azure solution design.
Options should be clear, mutually exclusive where possible, and include pros/cons.`;

    const prompt = `Generate 3-5 decision options for this Azure question: "${nodeQuestion}"

Context: ${JSON.stringify(context, null, 2)}

For each option, provide:
- Label (short, clear)
- Description (1-2 sentences)
- Pros (array of advantages)
- Cons (array of disadvantages)
- When to use (brief guidance)

Format as JSON array:
[
  {
    "label": "Option Name",
    "description": "Option description",
    "pros": ["pro1", "pro2"],
    "cons": ["con1", "con2"],
    "whenToUse": "When this option is appropriate"
  }
]`;

    const response = await callOpenAI(prompt, systemMessage);
    
    try {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, response];
        const options = JSON.parse(jsonMatch[1] || response);
        
        // Ensure it's an array
        return Array.isArray(options) ? options : [options];
    } catch (e) {
        // Fallback: return empty array
        console.error('Failed to parse options:', e);
        return [];
    }
}

/**
 * Generate a new node based on search query
 * @param {string} query - Search query
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} - Node object matching JSON schema
 */
export async function generateNodeFromQuery(query, context = {}) {
    const systemMessage = `You are an Azure architecture expert. Create decision tree nodes for Azure solutions.`;

    const prompt = `Create a decision tree node for the Azure topic: "${query}"

Context: ${JSON.stringify(context, null, 2)}

Generate a node with:
- Question (clear, decision-focused)
- Description (brief context)
- Tags (relevant Azure categories)
- Node type (usually "question" unless it's a terminal)

Format as JSON:
{
  "question": "What type of [topic]?",
  "description": "Description of the decision point",
  "nodeType": "question",
  "tags": ["tag1", "tag2"],
  "azObjectives": [],
  "roleFocus": []
}`;

    const response = await callOpenAI(prompt, systemMessage);
    
    try {
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, response];
        const node = JSON.parse(jsonMatch[1] || response);
        
        // Generate ID from question
        if (!node.id) {
            node.id = query.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') + '-node';
        }
        
        return node;
    } catch (e) {
        // Fallback node
        return {
            id: query.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-node',
            question: `About ${query}`,
            description: `Information about ${query}`,
            nodeType: 'question',
            tags: ['research'],
            azObjectives: [],
            roleFocus: []
        };
    }
}

/**
 * Improve node options by adding missing Azure services and enriching existing ones
 * @param {string} nodeId - Node ID
 * @param {Object} nodeInfo - Node information
 * @param {Array} currentOptions - Current options for this node
 * @returns {Promise<Object>} - { newOptions: [], enrichedOptions: [] }
 */
export async function improveNodeOptions(nodeId, nodeInfo, currentOptions) {
    const systemMessage = `You are an Azure architecture expert. Analyze Azure service categories and provide comprehensive, detailed option information.
Your goal is to identify ALL relevant Azure services in a category and provide detailed pros/cons, use cases, and guidance.`;

    // Extract service names from current options
    const currentServiceNames = currentOptions.map(opt => opt.label.toLowerCase());
    
    // Prepare current options for the prompt
    const currentOptionsSummary = currentOptions.map(opt => ({
        label: opt.label,
        description: opt.description || '',
        pros: opt.pros || [],
        cons: opt.cons || [],
        whenToUse: opt.whenToUse || ''
    }));
    
    // JSON structure example as a regular string to avoid template literal parsing issues
    const jsonExample = '{\n' +
        '  "newOptions": [\n' +
        '    {\n' +
        '      "label": "Service Name",\n' +
        '      "description": "Detailed 1-2 sentence description",\n' +
        '      "pros": ["advantage1", "advantage2", "advantage3"],\n' +
        '      "cons": ["disadvantage1", "disadvantage2"],\n' +
        '      "whenToUse": "Detailed guidance on when to use this service",\n' +
        '      "whenNotToUse": "Guidance on when NOT to use this service"\n' +
        '    }\n' +
        '  ],\n' +
        '  "enrichedOptions": [\n' +
        '    {\n' +
        '      "label": "Existing Service Name (must match exactly)",\n' +
        '      "description": "Enhanced description",\n' +
        '      "pros": ["expanded", "pros", "list"],\n' +
        '      "cons": ["expanded", "cons", "list"],\n' +
        '      "whenToUse": "Enhanced when to use guidance",\n' +
        '      "whenNotToUse": "New when not to use guidance"\n' +
        '    }\n' +
        '  ]\n' +
        '}';
    
    // Check if this is an APIM-related node
    const isApimNode = nodeInfo.tags?.some(tag => 
        tag.toLowerCase().includes('apim') || 
        tag.toLowerCase().includes('api management') ||
        tag.toLowerCase().includes('api-management')
    ) || nodeInfo.question?.toLowerCase().includes('api management');
    
    const apimContext = isApimNode ? `

IMPORTANT FOR API MANAGEMENT:
- Azure API Management now has V2 tiers (Basic v2, Standard v2, Premium v2) in addition to classic tiers
- V2 tiers offer: faster deployment (minutes vs hours), simplified networking, quick scaling
- V2 tier key features:
  * Basic v2: Development/testing with SLA (99.95%), scales to 10 units, no VNet support
  * Standard v2: Production-ready with VNet integration for backend access, private endpoints, scales to 10 units
  * Premium v2: Enterprise features with full VNet injection, availability zones, workspaces, scales to 30 units
- V2 tiers currently lack: multi-region deployment, self-hosted gateway, migration from classic, multiple custom domains
- Networking differences: 
  * Standard v2 has VNet integration (outbound to backends)
  * Premium v2 has VNet injection (complete isolation)
  * Classic Premium has VNet injection but requires manual route tables
- Analytics: V2 uses Azure Monitor dashboard instead of built-in analytics
- When suggesting APIM options, consider BOTH classic (v1) and V2 tiers based on requirements
- Reference: https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview` : '';
    
    const prompt = `Analyze this Azure decision node and improve its options:

Node Question: "${nodeInfo.question}"
Node Description: "${nodeInfo.description || 'N/A'}"
Node Tags: ${JSON.stringify(nodeInfo.tags || [])}

Current Options:
${JSON.stringify(currentOptionsSummary, null, 2)}

Your tasks:
1. Research ALL Azure services relevant to this category/question
2. Identify which services are MISSING from the current options
3. Generate comprehensive new options for missing services
4. Enrich existing options with MORE DETAILED information (expand pros/cons, add whenNotToUse, improve descriptions)

For example, if this is about messaging services, you should consider:
- Service Bus (may already exist)
- Event Grid (may already exist)
- Storage Queues
- Event Hubs
- Notification Hubs
- Azure Relay
- And any other relevant messaging/communication services${apimContext}

Return a JSON object with this structure:
${jsonExample}

IMPORTANT:
- For enrichedOptions, the "label" must EXACTLY match an existing option label
- Provide comprehensive pros/cons lists (at least 3-4 items each)
- Be specific and practical in your guidance
- Focus on Azure services that are actually available and relevant`;

    const response = await callOpenAI(prompt, systemMessage, 'gpt-4o-mini');
    
    try {
        // Extract JSON from markdown code blocks if present
        let jsonText = response;
        
        // Try to extract from code block
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            jsonText = codeBlockMatch[1].trim();
        }
        
        // Parse the JSON
        const result = JSON.parse(jsonText);
        
        // Ensure structure is correct
        if (!result.newOptions) result.newOptions = [];
        if (!result.enrichedOptions) result.enrichedOptions = [];
        
        // Ensure arrays
        result.newOptions = Array.isArray(result.newOptions) ? result.newOptions : [];
        result.enrichedOptions = Array.isArray(result.enrichedOptions) ? result.enrichedOptions : [];
        
        return result;
    } catch (e) {
        console.error('Failed to parse improveNodeOptions response:', e);
        console.error('Response was:', response.substring(0, 500));
        // Return empty result on error
        return {
            newOptions: [],
            enrichedOptions: []
        };
    }
}
