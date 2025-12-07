/**
 * AI Enrichment for Azure Resource Offerings
 * 
 * Uses OpenAI to automatically generate descriptions, features, use cases,
 * pros/cons, and other content for Azure service offerings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load OpenAI API key from browser config
let OPENAI_API_KEY = null;

try {
    const configPath = path.join(__dirname, '..', 'js', 'config.js');
    if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const match = configContent.match(/OPENAI_API_KEY:\s*['"]([^'"]+)['"]/);
        if (match) {
            OPENAI_API_KEY = match[1];
        }
    }
} catch (error) {
    // Ignore errors, will check for key later
}

// Also check environment variable
if (!OPENAI_API_KEY) {
    OPENAI_API_KEY = process.env.OPENAI_API_KEY;
}

/**
 * Check if AI enrichment is available
 */
export function isAiEnrichmentAvailable() {
    return OPENAI_API_KEY && OPENAI_API_KEY.length > 0;
}

/**
 * Enrich an offering with AI-generated content
 */
export async function enrichOffering(offering, serviceName) {
    if (!isAiEnrichmentAvailable()) {
        console.log('  ⚠ AI enrichment skipped: No OpenAI API key found');
        return offering;
    }

    console.log(`  🤖 Enriching ${offering.skuName} with AI...`);

    try {
        // Build the prompt
        const prompt = buildPrompt(offering, serviceName);

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an Azure cloud architecture expert. Provide clear, accurate, and practical information about Azure services.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`  ❌ OpenAI API error: ${response.status} - ${error}`);
            return offering;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the response
        const enriched = parseAiResponse(content);

        // Merge with existing offering
        const result = {
            ...offering,
            description: enriched.description || offering.description,
            purpose: enriched.purpose || offering.purpose,
            features: enriched.features && enriched.features.length > 0 ? enriched.features : offering.features,
            capabilities: enriched.capabilities && enriched.capabilities.length > 0 ? enriched.capabilities : offering.capabilities,
            limitations: enriched.limitations && enriched.limitations.length > 0 ? enriched.limitations : offering.limitations,
            useCases: enriched.useCases && enriched.useCases.length > 0 ? enriched.useCases : offering.useCases
        };

        console.log(`  ✓ Enrichment completed for ${offering.skuName}`);
        return result;

    } catch (error) {
        console.error(`  ❌ Error enriching ${offering.skuName}:`, error.message);
        return offering;
    }
}

/**
 * Build prompt for OpenAI
 */
function buildPrompt(offering, serviceName) {
    const attributesStr = offering.attributes ? JSON.stringify(offering.attributes, null, 2) : 'N/A';
    
    return `
I need detailed information about an Azure service offering:

Service: ${serviceName}
SKU/Tier: ${offering.skuName}
Category: ${offering.category || 'N/A'}
Current Description: ${offering.description || 'N/A'}
Pricing Model: ${offering.pricingModel || 'N/A'}
SLA: ${offering.sla || 'N/A'}

Technical Attributes:
${attributesStr}

Please provide:

1. DESCRIPTION (1-2 sentences): A clear, concise description of what this tier offers and who it's for.

2. PURPOSE (1 sentence): When should someone choose this tier?

3. FEATURES (5-7 bullet points): Key features and capabilities of this tier.

4. CAPABILITIES (3-5 bullet points): Technical capabilities and limits.

5. LIMITATIONS (3-5 bullet points): What are the constraints or things it can't do?

6. USE CASES (3-4 bullet points): Specific scenarios where this tier is the best choice.

Format your response exactly like this:

DESCRIPTION:
[your description here]

PURPOSE:
[your purpose here]

FEATURES:
- [feature 1]
- [feature 2]
...

CAPABILITIES:
- [capability 1]
- [capability 2]
...

LIMITATIONS:
- [limitation 1]
- [limitation 2]
...

USE CASES:
- [use case 1]
- [use case 2]
...
`.trim();
}

/**
 * Parse AI response into structured data
 */
function parseAiResponse(content) {
    const result = {
        description: null,
        purpose: null,
        features: [],
        capabilities: [],
        limitations: [],
        useCases: []
    };

    try {
        // Extract description
        const descMatch = content.match(/DESCRIPTION:\s*\n([^\n]+(?:\n(?!(?:PURPOSE|FEATURES|CAPABILITIES|LIMITATIONS|USE CASES):)[^\n]+)*)/i);
        if (descMatch) {
            result.description = descMatch[1].trim();
        }

        // Extract purpose
        const purposeMatch = content.match(/PURPOSE:\s*\n([^\n]+(?:\n(?!(?:DESCRIPTION|FEATURES|CAPABILITIES|LIMITATIONS|USE CASES):)[^\n]+)*)/i);
        if (purposeMatch) {
            result.purpose = purposeMatch[1].trim();
        }

        // Extract features
        const featuresMatch = content.match(/FEATURES:\s*\n((?:[-•]\s*[^\n]+\n?)+)/i);
        if (featuresMatch) {
            result.features = featuresMatch[1]
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-•]\s*/, '').trim());
        }

        // Extract capabilities
        const capabilitiesMatch = content.match(/CAPABILITIES:\s*\n((?:[-•]\s*[^\n]+\n?)+)/i);
        if (capabilitiesMatch) {
            result.capabilities = capabilitiesMatch[1]
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-•]\s*/, '').trim());
        }

        // Extract limitations
        const limitationsMatch = content.match(/LIMITATIONS:\s*\n((?:[-•]\s*[^\n]+\n?)+)/i);
        if (limitationsMatch) {
            result.limitations = limitationsMatch[1]
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-•]\s*/, '').trim());
        }

        // Extract use cases
        const useCasesMatch = content.match(/USE CASES:\s*\n((?:[-•]\s*[^\n]+\n?)+)/i);
        if (useCasesMatch) {
            result.useCases = useCasesMatch[1]
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-•]\s*/, '').trim());
        }

    } catch (error) {
        console.error('Error parsing AI response:', error);
    }

    return result;
}

/**
 * Enrich multiple offerings in batch
 */
export async function enrichOfferings(offerings, serviceName, options = {}) {
    if (!isAiEnrichmentAvailable()) {
        console.log('\n⚠ AI enrichment not available: OpenAI API key not configured');
        console.log('To enable AI enrichment:');
        console.log('1. Set OPENAI_API_KEY in your .env file, or');
        console.log('2. Configure the API key via the browser UI\n');
        return offerings;
    }

    const { delayMs = 1000, maxConcurrent = 3 } = options;
    const enriched = [];

    console.log(`\n🤖 AI Enrichment enabled for ${serviceName}`);
    console.log(`Processing ${offerings.length} offerings...\n`);

    // Process in batches to avoid rate limits
    for (let i = 0; i < offerings.length; i += maxConcurrent) {
        const batch = offerings.slice(i, i + maxConcurrent);
        
        const promises = batch.map(offering => 
            enrichOffering(offering, serviceName)
        );

        const results = await Promise.all(promises);
        enriched.push(...results);

        // Delay between batches
        if (i + maxConcurrent < offerings.length) {
            console.log(`  ⏳ Waiting ${delayMs}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    console.log(`\n✓ AI enrichment completed for ${enriched.length} offerings\n`);
    return enriched;
}

/**
 * Test AI enrichment with a sample offering
 */
export async function testEnrichment() {
    const sampleOffering = {
        skuName: 'Premium',
        category: 'dedicated',
        description: 'High-performance tier',
        pricingModel: 'per-unit',
        sla: '99.95%',
        attributes: {
            vnetIntegration: true,
            maxMemoryMB: 14336,
            durableFunctionsSupport: true
        }
    };

    console.log('Testing AI enrichment with sample offering...\n');
    console.log('Sample:', JSON.stringify(sampleOffering, null, 2));
    console.log('\n---\n');

    const enriched = await enrichOffering(sampleOffering, 'Azure Functions');

    console.log('\nEnriched:', JSON.stringify(enriched, null, 2));
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
    testEnrichment().catch(console.error);
}









