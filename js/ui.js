// AI: UI rendering functions. These handle the visual presentation of nodes, options, and recipes.
// Mode-aware rendering is handled here.

import { generateCodeSnippets, calculateCosts, calculateDeploymentTime, getPrerequisites, getTroubleshootingTips } from './recipe-interactive.js';
import { generateArchitectureDiagram, generateResourceTree } from './diagram-generator.js';

/**
 * AI Gateway feature definitions organized by category with hierarchical structure
 */
const AI_GATEWAY_FEATURES = {
    policies: {
        label: "Policies",
        subCategories: {
            tokenLimits: {
                label: "Token Limits",
                description: "Control token consumption and prevent excessive usage",
                recipeStep: 3,
                features: [
                    {
                        id: "token-limits-request",
                        label: "Request Token Limits",
                        description: "Limit tokens per request (per-request, per-minute, per-hour, per-day)",
                        configOptions: ["per-request", "per-minute", "per-hour", "per-day"]
                    },
                    {
                        id: "token-limits-response",
                        label: "Response Token Limits",
                        description: "Control output sizes by limiting response tokens"
                    },
                    {
                        id: "token-limits-total",
                        label: "Total Token Limits",
                        description: "Daily, weekly, monthly, and yearly token quotas",
                        configOptions: ["daily", "weekly", "monthly", "yearly"]
                    },
                    {
                        id: "token-limits-precalc",
                        label: "Pre-calculation",
                        description: "Estimate token counts before sending to LLM"
                    },
                    {
                        id: "token-limits-per-consumer",
                        label: "Per-Consumer Limits",
                        description: "Token limits per user, subscription, or API",
                        configOptions: ["per-user", "per-subscription", "per-api", "per-provider"]
                    },
                    {
                        id: "token-limits-counter-key",
                        label: "Counter Key Options",
                        description: "Track limits by subscription-id, IP address, or custom expression",
                        configOptions: ["subscription-id", "ip-address", "custom-expression"]
                    }
                ]
            },
            contentSafety: {
                label: "Content Safety",
                description: "Protect against harmful content and data exposure",
                recipeStep: 4,
                features: [
                    {
                        id: "content-safety-prompt-injection",
                        label: "Prompt Injection Protection",
                        description: "Pattern matching and behavioral analysis to detect prompt injection attacks"
                    },
                    {
                        id: "content-safety-moderation",
                        label: "Content Moderation",
                        description: "Filter content by categories: violence, hate, self-harm, sexual content",
                        configOptions: ["violence", "hate", "self-harm", "sexual-content"]
                    },
                    {
                        id: "content-safety-pii",
                        label: "PII Detection & Masking",
                        description: "Detect and mask SSN, credit cards, emails, phone numbers",
                        configOptions: ["ssn", "credit-cards", "emails", "phone-numbers"]
                    },
                    {
                        id: "content-safety-custom-filters",
                        label: "Custom Content Filters",
                        description: "Define custom content filtering rules"
                    }
                ]
            },
            semanticCaching: {
                label: "Semantic Caching",
                description: "Reduce costs by caching similar queries",
                recipeStep: 5,
                features: [
                    {
                        id: "semantic-caching-basic",
                        label: "Semantic Caching",
                        description: "Embedding-based similarity matching for query caching"
                    },
                    {
                        id: "semantic-caching-threshold",
                        label: "Similarity Threshold",
                        description: "Configure similarity threshold (0.0-1.0) for cache matching",
                        configOptions: { type: "range", min: 0.0, max: 1.0, default: 0.8 }
                    },
                    {
                        id: "semantic-caching-provider",
                        label: "Cache Provider",
                        description: "Select cache provider: Azure Managed Redis or external Redis",
                        configOptions: ["azure-managed-redis", "external-redis"]
                    },
                    {
                        id: "semantic-caching-invalidation",
                        label: "Cache Invalidation",
                        description: "Configure cache invalidation strategies"
                    },
                    {
                        id: "semantic-caching-cost-opt",
                        label: "Cost Optimization",
                        description: "Enable cost reduction through intelligent caching (30-70% reduction)"
                    }
                ]
            },
            rateLimiting: {
                label: "Rate Limiting",
                description: "Control request rates and costs",
                recipeStep: 6,
                features: [
                    {
                        id: "rate-limiting-token-based",
                        label: "Token-Based Rate Limiting",
                        description: "TPM, TPH, TPD limits based on token consumption",
                        configOptions: ["tpm", "tph", "tpd"]
                    },
                    {
                        id: "rate-limiting-request-based",
                        label: "Request-Based Rate Limiting",
                        description: "Traditional request rate limiting (requests per second/minute)"
                    },
                    {
                        id: "rate-limiting-cost-based",
                        label: "Cost-Based Budget Enforcement",
                        description: "Automatic throttling based on cost budgets"
                    },
                    {
                        id: "rate-limiting-scope",
                        label: "Rate Limit Scope",
                        description: "Apply limits per-user, per-subscription, per-API, or per-provider",
                        configOptions: ["per-user", "per-subscription", "per-api", "per-provider"]
                    }
                ]
            },
            scalability: {
                label: "Scalability Policies",
                description: "Scale and balance load across backends",
                features: [
                    {
                        id: "load-balancing",
                        label: "Load Balancing",
                        description: "Distribute requests across multiple backends",
                        configOptions: ["round-robin", "weighted", "priority-based", "session-aware"]
                    },
                    {
                        id: "circuit-breaker",
                        label: "Circuit Breaker",
                        description: "Protect against backend failures with dynamic trip conditions",
                        configOptions: ["dynamic-trip", "retry-after-header", "health-monitoring"]
                    },
                    {
                        id: "backend-pool",
                        label: "Backend Pool Management",
                        description: "Manage pools of backend services with PTU optimization"
                    },
                    {
                        id: "paygo-fallback",
                        label: "Pay-as-You-Go Fallback",
                        description: "Fallback to pay-as-you-go when PTU limits are reached"
                    }
                ]
            },
            security: {
                label: "Security Policies",
                description: "Authentication, authorization, and access control",
                features: [
                    {
                        id: "auth-oauth",
                        label: "OAuth Authentication",
                        description: "OAuth 2.0 and OpenID Connect authentication"
                    },
                    {
                        id: "auth-api-key",
                        label: "API Key Authentication",
                        description: "API key-based authentication"
                    },
                    {
                        id: "auth-certificate",
                        label: "Certificate Authentication",
                        description: "Client certificate authentication"
                    },
                    {
                        id: "auth-managed-identity",
                        label: "Managed Identity",
                        description: "Azure Managed Identity for service-to-service auth"
                    },
                    {
                        id: "auth-credential-manager",
                        label: "Credential Manager",
                        description: "Centralized credential management"
                    },
                    {
                        id: "authz-rbac",
                        label: "Role-Based Access Control",
                        description: "RBAC for fine-grained authorization"
                    },
                    {
                        id: "authz-policy-based",
                        label: "Policy-Based Access",
                        description: "Custom authorization policies"
                    },
                    {
                        id: "ip-filtering",
                        label: "IP Filtering & Whitelisting",
                        description: "Restrict access by IP address or IP ranges"
                    },
                    {
                        id: "cors",
                        label: "CORS Policies",
                        description: "Cross-Origin Resource Sharing configuration"
                    }
                ]
            },
            transformation: {
                label: "Transformation Policies",
                description: "Modify requests and responses",
                features: [
                    {
                        id: "transform-request",
                        label: "Request Transformation",
                        description: "Modify request headers, body, or query parameters"
                    },
                    {
                        id: "transform-response",
                        label: "Response Transformation",
                        description: "Modify response headers, body, or status codes"
                    },
                    {
                        id: "transform-headers",
                        label: "Header Manipulation",
                        description: "Add, remove, or modify HTTP headers"
                    },
                    {
                        id: "transform-query",
                        label: "Query Parameter Transformation",
                        description: "Modify URL query parameters"
                    },
                    {
                        id: "transform-body",
                        label: "Body Transformation",
                        description: "Transform request/response body content"
                    }
                ]
            },
            resilience: {
                label: "Resilience Policies",
                description: "Handle failures and ensure reliability",
                features: [
                    {
                        id: "retry-policy",
                        label: "Retry Policies",
                        description: "Automatic retry with exponential backoff or fixed intervals",
                        configOptions: ["exponential-backoff", "fixed-interval"]
                    },
                    {
                        id: "timeout-policy",
                        label: "Timeout Policies",
                        description: "Configure request and backend timeouts"
                    },
                    {
                        id: "fallback-policy",
                        label: "Fallback Policies",
                        description: "Fallback responses when backends fail"
                    },
                    {
                        id: "health-check",
                        label: "Health Check Policies",
                        description: "Monitor backend health and route accordingly"
                    }
                ]
            }
        }
    },
    integration: {
        label: "LLM Provider Integration",
        subCategories: {
            providers: {
                label: "LLM Providers",
                description: "Connect to language model providers",
                recipeStep: 2,
                features: [
                    {
                        id: "azure-openai",
                        label: "Azure OpenAI",
                        description: "Integrate with Azure OpenAI services",
                        subFeatures: [
                            { id: "azure-openai-gpt4", label: "GPT-4" },
                            { id: "azure-openai-gpt35", label: "GPT-3.5-turbo" },
                            { id: "azure-openai-gpt4o", label: "GPT-4o" },
                            { id: "azure-openai-embeddings", label: "Embeddings" }
                        ]
                    },
                    {
                        id: "openai",
                        label: "OpenAI",
                        description: "Integrate with OpenAI API",
                        subFeatures: [
                            { id: "openai-gpt4", label: "GPT-4" },
                            { id: "openai-gpt35", label: "GPT-3.5-turbo" },
                            { id: "openai-gpt4o", label: "GPT-4o" },
                            { id: "openai-embeddings", label: "Embeddings" }
                        ]
                    },
                    {
                        id: "microsoft-foundry",
                        label: "Microsoft Foundry",
                        description: "Integrate with Microsoft Foundry platform"
                    },
                    {
                        id: "custom-llm",
                        label: "Custom LLM Providers",
                        description: "Support for custom LLM provider endpoints with custom authentication"
                    },
                    {
                        id: "self-hosted",
                        label: "Self-hosted Models",
                        description: "Support for self-hosted models (Ollama, vLLM)",
                        subFeatures: [
                            { id: "self-hosted-ollama", label: "Ollama" },
                            { id: "self-hosted-vllm", label: "vLLM" }
                        ]
                    }
                ]
            },
            routing: {
                label: "Provider Routing",
                description: "Advanced routing and fallback",
                features: [
                    {
                        id: "multi-provider-routing",
                        label: "Multi-Provider Routing",
                        description: "Route requests across multiple LLM providers"
                    },
                    {
                        id: "fallback-provider",
                        label: "Fallback Provider",
                        description: "Configure fallback provider when primary fails"
                    },
                    {
                        id: "provider-specific-auth",
                        label: "Provider-Specific Authentication",
                        description: "Configure authentication per provider"
                    },
                    {
                        id: "custom-endpoints",
                        label: "Custom Endpoint Configuration",
                        description: "Define custom endpoints for providers"
                    }
                ]
            },
            apiTypes: {
                label: "API Types",
                description: "Supported API operation types",
                features: [
                    {
                        id: "api-chat-completions",
                        label: "Chat Completions",
                        description: "Chat completion API support"
                    },
                    {
                        id: "api-embeddings",
                        label: "Embeddings",
                        description: "Text embedding API support"
                    },
                    {
                        id: "api-image-generation",
                        label: "Image Generation",
                        description: "Image generation API support (DALL-E, etc.)"
                    },
                    {
                        id: "api-audio-transcription",
                        label: "Audio Transcription",
                        description: "Audio transcription API support"
                    },
                    {
                        id: "api-function-calling",
                        label: "Function Calling",
                        description: "Function calling/tool use API support"
                    }
                ]
            }
        }
    },
    monitoring: {
        label: "Monitoring & Analytics",
        description: "Observability and metrics",
        features: [
            {
                id: "llm-metrics",
                label: "LLM Metrics Emission",
                description: "Track token usage, latency, and costs with llm-emit-token-metric policy",
                recipeStep: 6,
                configOptions: ["token-usage", "latency", "costs", "custom-dimensions"]
            },
            {
                id: "custom-metrics",
                label: "Custom Metrics",
                description: "Define and track custom metrics",
                configOptions: ["client-ip", "api-id", "subscription-id", "user-id", "custom"]
            },
            {
                id: "alerting",
                label: "Alerting Configuration",
                description: "Set up alerts for token limits, costs, errors, and performance"
            },
            {
                id: "dashboards",
                label: "Dashboard Setup",
                description: "Configure custom dashboards for monitoring"
            },
            {
                id: "log-aggregation",
                label: "Log Aggregation",
                description: "Aggregate logs from prompt logging, completion logging, and token tracking"
            },
            {
                id: "performance-monitoring",
                label: "Performance Monitoring",
                description: "Monitor API performance with Azure Monitor and Application Insights"
            },
            {
                id: "cost-tracking",
                label: "Cost Tracking & Reporting",
                description: "Track and report on LLM API costs"
            }
        ]
    },
    advanced: {
        label: "Advanced Features",
        subCategories: {
            mcp: {
                label: "Model Context Protocol (MCP)",
                description: "MCP support for AI agent integration",
                features: [
                    {
                        id: "mcp-support",
                        label: "MCP Support",
                        description: "Model Context Protocol support for AI agent tool discovery and invocation"
                    },
                    {
                        id: "mcp-tool-discovery",
                        label: "Tool Discovery Configuration",
                        description: "Configure how REST APIs are exposed as tools for AI agents"
                    },
                    {
                        id: "mcp-tool-invocation",
                        label: "Tool Invocation Settings",
                        description: "Configure tool invocation with authentication and context"
                    },
                    {
                        id: "mcp-context-awareness",
                        label: "Context Awareness",
                        description: "Maintain context across tool invocations"
                    },
                    {
                        id: "mcp-external-servers",
                        label: "External MCP Server Integration",
                        description: "Integrate with external MCP-compliant servers"
                    },
                    {
                        id: "mcp-endpoints",
                        label: "MCP Endpoint Configuration",
                        description: "Configure MCP endpoints for tools, resources, and prompts"
                    }
                ]
            },
            realtime: {
                label: "Real-time API Support",
                description: "WebSocket and streaming support",
                recipeStep: 7,
                features: [
                    {
                        id: "realtime-api",
                        label: "Real-time API Support",
                        description: "WebSocket support for real-time APIs like GPT-4o Realtime API"
                    },
                    {
                        id: "realtime-websocket",
                        label: "WebSocket Configuration",
                        description: "Configure WebSocket connections and protocols"
                    },
                    {
                        id: "realtime-streaming",
                        label: "Streaming Support",
                        description: "Support for streaming responses from LLM providers"
                    },
                    {
                        id: "realtime-token-limits",
                        label: "Real-time Token Limits",
                        description: "Apply token limit policies to real-time/streaming APIs"
                    },
                    {
                        id: "realtime-connection-mgmt",
                        label: "Connection Management",
                        description: "Manage WebSocket connections and lifecycle"
                    }
                ]
            }
        }
    }
};

/**
 * Render feature selection form for AI Gateway features with hierarchical structure
 * @param {Object} node
 * @param {Function} onFeatureSubmit
 */
export function renderFeatureSelection(node, onFeatureSubmit) {
    const questionTextEl = document.getElementById('questionText');
    const descriptionEl = document.getElementById('description');
    const optionsGridEl = document.getElementById('optionsGrid');

    if (!questionTextEl || !optionsGridEl) {
        console.error('Required elements not found for feature selection');
        return;
    }

    questionTextEl.textContent = node.question || 'Select Features';
    descriptionEl.textContent = node.description || '';

    // Clear options grid and apply full-width layout
    optionsGridEl.innerHTML = '';
    optionsGridEl.style.display = 'block';
    optionsGridEl.style.maxWidth = '100%';
    optionsGridEl.style.width = '100%';

    // Create form container with improved styling
    const form = document.createElement('form');
    form.id = 'featureSelectionForm';
    form.className = 'feature-selection-form';
    form.setAttribute('role', 'form');
    form.setAttribute('aria-label', 'AI Gateway Feature Selection');
    form.style.display = 'grid';
    form.style.gridTemplateColumns = 'repeat(auto-fit, minmax(600px, 1fr))';
    form.style.gap = '24px';
    form.style.width = '100%';
    form.style.maxWidth = '1400px';
    form.style.margin = '0 auto';

    // Render each category
    Object.entries(AI_GATEWAY_FEATURES).forEach(([categoryKey, category]) => {
        const categoryDiv = createCategorySection(categoryKey, category, form);
        form.appendChild(categoryDiv);
    });

    // Submit button section - full width
    const submitDiv = document.createElement('div');
    submitDiv.className = 'feature-submit-section';
    submitDiv.style.display = 'flex';
    submitDiv.style.justifyContent = 'space-between';
    submitDiv.style.alignItems = 'center';
    submitDiv.style.marginTop = '32px';
    submitDiv.style.paddingTop = '24px';
    submitDiv.style.borderTop = '2px solid #e0e0e0';
    submitDiv.style.gridColumn = '1 / -1';

    // Selection summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'selection-summary';
    summaryDiv.style.fontSize = '14px';
    summaryDiv.style.color = '#666';
    summaryDiv.setAttribute('role', 'status');
    summaryDiv.setAttribute('aria-live', 'polite');
    summaryDiv.id = 'featureSelectionSummary';
    summaryDiv.textContent = 'No features selected';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Continue to Recipe';
    submitBtn.className = 'feature-submit-btn';
    submitBtn.setAttribute('aria-label', 'Continue to recipe with selected features');
    submitBtn.style.padding = '14px 32px';
    submitBtn.style.fontSize = '16px';
    submitBtn.style.background = '#0078d4';
    submitBtn.style.color = 'white';
    submitBtn.style.border = 'none';
    submitBtn.style.borderRadius = '6px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.fontWeight = '600';
    submitBtn.style.transition = 'all 0.2s ease';
    submitBtn.style.boxShadow = '0 2px 4px rgba(0, 120, 212, 0.2)';
    submitBtn.style.minWidth = '180px';

    submitBtn.onmouseover = () => {
        submitBtn.style.background = '#106ebe';
        submitBtn.style.boxShadow = '0 4px 8px rgba(0, 120, 212, 0.3)';
        submitBtn.style.transform = 'translateY(-1px)';
    };
    submitBtn.onmouseout = () => {
        submitBtn.style.background = '#0078d4';
        submitBtn.style.boxShadow = '0 2px 4px rgba(0, 120, 212, 0.2)';
        submitBtn.style.transform = 'translateY(0)';
    };
    submitBtn.onfocus = () => {
        submitBtn.style.outline = '2px solid #0078d4';
        submitBtn.style.outlineOffset = '2px';
    };
    submitBtn.onblur = () => {
        submitBtn.style.outline = 'none';
    };

    submitDiv.appendChild(summaryDiv);
    submitDiv.appendChild(submitBtn);
    form.appendChild(submitDiv);

    // Update summary when checkboxes change
    const updateSummary = () => {
        const selectedCount = form.querySelectorAll('input[type="checkbox"][name="features"]:checked').length;
        if (selectedCount === 0) {
            summaryDiv.textContent = 'No features selected';
            summaryDiv.style.color = '#666';
        } else {
            summaryDiv.textContent = `${selectedCount} feature${selectedCount === 1 ? '' : 's'} selected`;
            summaryDiv.style.color = '#0078d4';
            summaryDiv.style.fontWeight = '600';
        }
    };

    // Add change listener to all checkboxes
    form.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' && e.target.name === 'features') {
            updateSummary();
        }
    });

    // Form submission
    form.onsubmit = (e) => {
        e.preventDefault();
        
        // Collect all selected features (main features and sub-features)
        const selectedFeatures = Array.from(form.querySelectorAll('input[type="checkbox"][name="features"]:checked'))
            .map(cb => cb.value);
        
        // Collect configuration options
        const configOptions = {};
        form.querySelectorAll('input[type="checkbox"][name="config"]:checked').forEach(cb => {
            const [featureId, option] = cb.value.split(':');
            if (!configOptions[featureId]) {
                configOptions[featureId] = [];
            }
            configOptions[featureId].push(option);
        });
        
        // Collect range inputs (thresholds, etc.)
        form.querySelectorAll('input[type="range"][data-config-type]').forEach(range => {
            const featureId = range.getAttribute('data-feature');
            const configType = range.getAttribute('data-config-type');
            if (!configOptions[featureId]) {
                configOptions[featureId] = {};
            }
            configOptions[featureId][configType] = parseFloat(range.value);
        });
        
        if (selectedFeatures.length === 0) {
            // Better error handling with accessible alert
            const errorMsg = document.createElement('div');
            errorMsg.className = 'feature-error';
            errorMsg.setAttribute('role', 'alert');
            errorMsg.style.cssText = 'background: #fef0f0; color: #d13438; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; border-left: 4px solid #d13438;';
            errorMsg.textContent = 'Please select at least one feature to continue.';
            form.insertBefore(errorMsg, form.firstChild);
            setTimeout(() => errorMsg.remove(), 5000);
            return;
        }

        // Store selected features and configurations
        const featureData = {
            features: selectedFeatures,
            config: configOptions
        };
        sessionStorage.setItem('apim-ai-gateway-selected-features', JSON.stringify(featureData));
        
        // Call submit handler with feature array (for backward compatibility)
        if (onFeatureSubmit) {
            onFeatureSubmit(selectedFeatures);
        }
    };

    optionsGridEl.appendChild(form);
    updateSummary(); // Initial summary update
}

/**
 * Create a category section with hierarchical structure
 */
function createCategorySection(categoryKey, category, form) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'feature-category';
    categoryDiv.setAttribute('role', 'region');
    categoryDiv.setAttribute('aria-labelledby', `category-${categoryKey}`);
    categoryDiv.style.border = '1px solid #e1e1e1';
    categoryDiv.style.borderRadius = '12px';
    categoryDiv.style.padding = '24px';
    categoryDiv.style.background = 'white';
    categoryDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    categoryDiv.style.transition = 'box-shadow 0.2s ease';
    categoryDiv.style.height = 'fit-content';
    categoryDiv.style.maxHeight = '90vh';
    categoryDiv.style.overflowY = 'auto';

    categoryDiv.onmouseenter = () => {
        categoryDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
    };
    categoryDiv.onmouseleave = () => {
        categoryDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    };

    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.style.marginBottom = '20px';
    categoryHeader.style.paddingBottom = '16px';
    categoryHeader.style.borderBottom = '2px solid #f0f0f0';

    const categoryTitle = document.createElement('h3');
    categoryTitle.id = `category-${categoryKey}`;
    categoryTitle.textContent = category.label;
    categoryTitle.style.margin = '0 0 8px 0';
    categoryTitle.style.fontSize = '20px';
    categoryTitle.style.color = '#1a1a1a';
    categoryTitle.style.fontWeight = '700';
    categoryTitle.style.letterSpacing = '-0.02em';
    categoryHeader.appendChild(categoryTitle);

    if (category.description) {
        const categoryDesc = document.createElement('p');
        categoryDesc.textContent = category.description;
        categoryDesc.style.margin = '0';
        categoryDesc.style.fontSize = '14px';
        categoryDesc.style.color = '#666';
        categoryDesc.style.lineHeight = '1.5';
        categoryHeader.appendChild(categoryDesc);
    }

    categoryDiv.appendChild(categoryHeader);

    // Check if category has subCategories or direct features
    if (category.subCategories) {
        // Render sub-categories
        Object.entries(category.subCategories).forEach(([subCatKey, subCategory]) => {
            const subCatDiv = createSubCategorySection(categoryKey, subCatKey, subCategory, categoryDiv);
            categoryDiv.appendChild(subCatDiv);
        });
    } else if (category.features) {
        // Render direct features (for monitoring category)
        const featuresList = document.createElement('div');
        featuresList.style.display = 'grid';
        featuresList.style.gap = '12px';
        featuresList.style.marginTop = '15px';

        category.features.forEach(feature => {
            const featureItem = createFeatureItem(categoryKey, feature, featuresList);
            featuresList.appendChild(featureItem);
        });

        categoryDiv.appendChild(featuresList);
    }

    return categoryDiv;
}

/**
 * Create a sub-category section
 */
function createSubCategorySection(categoryKey, subCatKey, subCategory, parentDiv) {
    const subCatDiv = document.createElement('div');
    subCatDiv.className = 'feature-subcategory';
    subCatDiv.setAttribute('role', 'group');
    subCatDiv.setAttribute('aria-labelledby', `subcategory-${subCatKey}`);
    subCatDiv.style.marginTop = '20px';
    subCatDiv.style.padding = '18px';
    subCatDiv.style.background = '#fafbfc';
    subCatDiv.style.borderRadius = '8px';
    subCatDiv.style.border = '1px solid #e8e8e8';
    subCatDiv.style.transition = 'all 0.2s ease';

    // Sub-category header with expand/collapse
    const subCatHeader = document.createElement('button');
    subCatHeader.type = 'button';
    subCatHeader.setAttribute('aria-expanded', 'true');
    subCatHeader.setAttribute('aria-controls', `subcategory-features-${subCatKey}`);
    subCatHeader.style.display = 'flex';
    subCatHeader.style.justifyContent = 'space-between';
    subCatHeader.style.alignItems = 'center';
    subCatHeader.style.cursor = 'pointer';
    subCatHeader.style.marginBottom = '12px';
    subCatHeader.style.padding = '0';
    subCatHeader.style.background = 'none';
    subCatHeader.style.border = 'none';
    subCatHeader.style.width = '100%';
    subCatHeader.style.textAlign = 'left';
    subCatHeader.style.fontFamily = 'inherit';

    const headerContent = document.createElement('div');
    headerContent.style.display = 'flex';
    headerContent.style.alignItems = 'center';
    headerContent.style.gap = '12px';
    headerContent.style.flex = '1';

    const expandIcon = document.createElement('span');
    expandIcon.setAttribute('aria-hidden', 'true');
    expandIcon.textContent = '▼';
    expandIcon.style.fontSize = '10px';
    expandIcon.style.color = '#0078d4';
    expandIcon.style.transition = 'transform 0.3s ease';
    expandIcon.style.flexShrink = '0';
    expandIcon.style.width = '16px';
    expandIcon.style.textAlign = 'center';

    const subCatTitle = document.createElement('h4');
    subCatTitle.id = `subcategory-${subCatKey}`;
    subCatTitle.textContent = subCategory.label;
    subCatTitle.style.margin = '0';
    subCatTitle.style.fontSize = '16px';
    subCatTitle.style.color = '#0078d4';
    subCatTitle.style.fontWeight = '600';
    subCatTitle.style.letterSpacing = '-0.01em';

    headerContent.appendChild(expandIcon);
    headerContent.appendChild(subCatTitle);
    subCatHeader.appendChild(headerContent);

    const subCatDesc = document.createElement('p');
    if (subCategory.description) {
        subCatDesc.textContent = subCategory.description;
        subCatDesc.style.margin = '0 0 12px 28px';
        subCatDesc.style.fontSize = '13px';
        subCatDesc.style.color = '#666';
        subCatDesc.style.lineHeight = '1.5';
    }

    const featuresContainer = document.createElement('div');
    featuresContainer.id = `subcategory-features-${subCatKey}`;
    featuresContainer.className = 'subcategory-features';
    featuresContainer.style.display = 'grid';
    featuresContainer.style.gap = '10px';
    featuresContainer.style.marginTop = '12px';

    // Toggle expand/collapse with keyboard support
    let isExpanded = true;
    const toggleExpand = () => {
        isExpanded = !isExpanded;
        featuresContainer.style.display = isExpanded ? 'grid' : 'none';
        subCatDesc.style.display = isExpanded ? 'block' : 'none';
        expandIcon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        subCatHeader.setAttribute('aria-expanded', isExpanded.toString());
    };

    subCatHeader.onclick = (e) => {
        e.preventDefault();
        toggleExpand();
    };
    subCatHeader.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
        }
    };

    subCatDiv.appendChild(subCatHeader);
    if (subCategory.description) {
        subCatDiv.appendChild(subCatDesc);
    }
    subCatDiv.appendChild(featuresContainer);

    // Render features in sub-category
    if (subCategory.features) {
        subCategory.features.forEach(feature => {
            const featureItem = createFeatureItem(categoryKey, feature, featuresContainer, subCatKey);
            featuresContainer.appendChild(featureItem);
        });
    }

    return subCatDiv;
}

/**
 * Create a feature item with checkbox and optional sub-features/config
 */
function createFeatureItem(categoryKey, feature, container, subCatKey = null) {
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    featureItem.setAttribute('role', 'group');
    featureItem.style.display = 'flex';
    featureItem.style.alignItems = 'flex-start';
    featureItem.style.padding = '14px 16px';
    featureItem.style.background = 'white';
    featureItem.style.borderRadius = '8px';
    featureItem.style.border = '2px solid #e8e8e8';
    featureItem.style.transition = 'all 0.2s ease';
    featureItem.style.marginBottom = '10px';
    featureItem.style.position = 'relative';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `feature-${feature.id}`;
    checkbox.name = 'features';
    checkbox.value = feature.id;
    checkbox.setAttribute('data-category', categoryKey);
    checkbox.setAttribute('aria-label', feature.label);
    if (subCatKey) {
        checkbox.setAttribute('data-subcategory', subCatKey);
    }
    checkbox.style.marginRight = '14px';
    checkbox.style.marginTop = '3px';
    checkbox.style.cursor = 'pointer';
    checkbox.style.flexShrink = '0';
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.accentColor = '#0078d4';
    
    // Improve checkbox focus
    checkbox.onfocus = () => {
        featureItem.style.outline = '2px solid #0078d4';
        featureItem.style.outlineOffset = '2px';
    };
    checkbox.onblur = () => {
        featureItem.style.outline = 'none';
    };

    const labelContainer = document.createElement('div');
    labelContainer.style.flex = '1';
    labelContainer.style.minWidth = '0';

    const label = document.createElement('label');
    label.htmlFor = `feature-${feature.id}`;
    label.style.cursor = 'pointer';
    label.style.display = 'flex';
    label.style.flexDirection = 'column';
    label.style.width = '100%';
    label.style.flex = '1';
    label.style.minWidth = '0';

    const featureLabel = document.createElement('div');
    featureLabel.textContent = feature.label;
    featureLabel.style.fontWeight = '600';
    featureLabel.style.marginBottom = '6px';
    featureLabel.style.color = '#1a1a1a';
    featureLabel.style.fontSize = '15px';
    featureLabel.style.lineHeight = '1.4';

    const featureDesc = document.createElement('div');
    featureDesc.textContent = feature.description;
    featureDesc.style.fontSize = '13px';
    featureDesc.style.color = '#666';
    featureDesc.style.lineHeight = '1.5';

    label.appendChild(featureLabel);
    label.appendChild(featureDesc);
    labelContainer.appendChild(label);

    // Add sub-features if present
    if (feature.subFeatures && feature.subFeatures.length > 0) {
        const subFeaturesDiv = document.createElement('div');
        subFeaturesDiv.className = 'sub-features';
        subFeaturesDiv.setAttribute('role', 'group');
        subFeaturesDiv.setAttribute('aria-label', 'Sub-features');
        subFeaturesDiv.style.marginTop = '12px';
        subFeaturesDiv.style.paddingLeft = '20px';
        subFeaturesDiv.style.borderLeft = '3px solid #e8e8e8';
        subFeaturesDiv.style.display = 'none'; // Hidden by default, shown when parent is checked

        feature.subFeatures.forEach(subFeature => {
            const subFeatureItem = document.createElement('div');
            subFeatureItem.style.display = 'flex';
            subFeatureItem.style.alignItems = 'center';
            subFeatureItem.style.marginTop = '8px';
            subFeatureItem.style.padding = '8px';
            subFeatureItem.style.borderRadius = '4px';
            subFeatureItem.style.transition = 'background 0.2s ease';

            subFeatureItem.onmouseenter = () => {
                subFeatureItem.style.background = '#f5f5f5';
            };
            subFeatureItem.onmouseleave = () => {
                subFeatureItem.style.background = 'transparent';
            };

            const subCheckbox = document.createElement('input');
            subCheckbox.type = 'checkbox';
            subCheckbox.id = `feature-${subFeature.id}`;
            subCheckbox.name = 'features';
            subCheckbox.value = subFeature.id;
            subCheckbox.setAttribute('data-category', categoryKey);
            subCheckbox.setAttribute('data-parent', feature.id);
            subCheckbox.setAttribute('aria-label', subFeature.label);
            subCheckbox.style.marginRight = '10px';
            subCheckbox.style.cursor = 'pointer';
            subCheckbox.style.width = '16px';
            subCheckbox.style.height = '16px';
            subCheckbox.style.accentColor = '#0078d4';

            const subLabel = document.createElement('label');
            subLabel.htmlFor = `feature-${subFeature.id}`;
            subLabel.textContent = subFeature.label;
            subLabel.style.fontSize = '13px';
            subLabel.style.color = '#555';
            subLabel.style.cursor = 'pointer';
            subLabel.style.fontWeight = '500';

            subFeatureItem.appendChild(subCheckbox);
            subFeatureItem.appendChild(subLabel);
            subFeaturesDiv.appendChild(subFeatureItem);
        });

        // Show/hide sub-features when parent is checked
        checkbox.onchange = () => {
            updateFeatureItemStyle(featureItem, checkbox.checked);
            subFeaturesDiv.style.display = checkbox.checked ? 'block' : 'none';
        };

        labelContainer.appendChild(subFeaturesDiv);
    }

    // Add configuration options if present
    if (feature.configOptions) {
        const configDiv = document.createElement('div');
        configDiv.className = 'feature-config';
        configDiv.setAttribute('role', 'group');
        configDiv.setAttribute('aria-label', 'Configuration options');
        configDiv.style.marginTop = '12px';
        configDiv.style.padding = '12px';
        configDiv.style.paddingLeft = '20px';
        configDiv.style.borderLeft = '3px solid #0078d4';
        configDiv.style.background = '#f8f9fa';
        configDiv.style.borderRadius = '6px';
        configDiv.style.display = 'none'; // Hidden by default, shown when feature is checked

        if (Array.isArray(feature.configOptions)) {
            const configTitle = document.createElement('div');
            configTitle.textContent = 'Configuration Options:';
            configTitle.style.fontSize = '12px';
            configTitle.style.fontWeight = '600';
            configTitle.style.color = '#555';
            configTitle.style.marginBottom = '8px';
            configDiv.appendChild(configTitle);

            feature.configOptions.forEach(option => {
                const optionDiv = document.createElement('div');
                optionDiv.style.display = 'flex';
                optionDiv.style.alignItems = 'center';
                optionDiv.style.marginTop = '6px';
                optionDiv.style.padding = '4px 0';

                const optionCheckbox = document.createElement('input');
                optionCheckbox.type = 'checkbox';
                optionCheckbox.id = `config-${feature.id}-${option}`;
                optionCheckbox.name = 'config';
                optionCheckbox.value = `${feature.id}:${option}`;
                optionCheckbox.setAttribute('data-feature', feature.id);
                optionCheckbox.setAttribute('aria-label', option.replace(/-/g, ' '));
                optionCheckbox.style.marginRight = '10px';
                optionCheckbox.style.cursor = 'pointer';
                optionCheckbox.style.width = '16px';
                optionCheckbox.style.height = '16px';
                optionCheckbox.style.accentColor = '#0078d4';

                const optionLabel = document.createElement('label');
                optionLabel.htmlFor = `config-${feature.id}-${option}`;
                optionLabel.textContent = option.replace(/-/g, ' ');
                optionLabel.style.fontSize = '12px';
                optionLabel.style.color = '#666';
                optionLabel.style.cursor = 'pointer';
                optionLabel.style.textTransform = 'capitalize';

                optionDiv.appendChild(optionCheckbox);
                optionDiv.appendChild(optionLabel);
                configDiv.appendChild(optionDiv);
            });
        } else if (feature.configOptions.type === 'range') {
            // Range input for similarity threshold
            const rangeDiv = document.createElement('div');
            rangeDiv.style.marginTop = '6px';

            const rangeLabel = document.createElement('label');
            rangeLabel.htmlFor = `range-${feature.id}`;
            rangeLabel.textContent = `Similarity Threshold: `;
            rangeLabel.style.fontSize = '12px';
            rangeLabel.style.fontWeight = '600';
            rangeLabel.style.color = '#555';
            rangeLabel.style.marginRight = '12px';
            rangeLabel.style.display = 'inline-block';

            const rangeContainer = document.createElement('div');
            rangeContainer.style.display = 'flex';
            rangeContainer.style.alignItems = 'center';
            rangeContainer.style.gap = '12px';
            rangeContainer.style.marginTop = '8px';

            const rangeInput = document.createElement('input');
            rangeInput.type = 'range';
            rangeInput.id = `range-${feature.id}`;
            rangeInput.min = feature.configOptions.min || 0;
            rangeInput.max = feature.configOptions.max || 1;
            rangeInput.step = '0.1';
            rangeInput.value = feature.configOptions.default || 0.8;
            rangeInput.setAttribute('data-feature', feature.id);
            rangeInput.setAttribute('data-config-type', 'threshold');
            rangeInput.setAttribute('aria-label', 'Similarity threshold');
            rangeInput.style.width = '200px';
            rangeInput.style.cursor = 'pointer';

            const rangeValue = document.createElement('span');
            rangeValue.textContent = rangeInput.value;
            rangeValue.style.fontSize = '14px';
            rangeValue.style.color = '#0078d4';
            rangeValue.style.fontWeight = '700';
            rangeValue.style.minWidth = '40px';
            rangeValue.setAttribute('aria-live', 'polite');

            rangeInput.oninput = () => {
                rangeValue.textContent = rangeInput.value;
            };

            rangeContainer.appendChild(rangeInput);
            rangeContainer.appendChild(rangeValue);
            rangeDiv.appendChild(rangeLabel);
            rangeDiv.appendChild(rangeContainer);
            configDiv.appendChild(rangeDiv);
        }

        // Update checkbox handler to show/hide config
        const originalHandler = checkbox.onchange;
        checkbox.onchange = () => {
            if (originalHandler) originalHandler();
            updateFeatureItemStyle(featureItem, checkbox.checked);
            configDiv.style.display = checkbox.checked ? 'block' : 'none';
        };

        labelContainer.appendChild(configDiv);
    } else if (!feature.subFeatures) {
        // Only set handler if no sub-features (they have their own handler)
        checkbox.onchange = () => {
            updateFeatureItemStyle(featureItem, checkbox.checked);
        };
    }

    featureItem.appendChild(checkbox);
    featureItem.appendChild(labelContainer);

    return featureItem;
}

/**
 * Update select all button text based on checkbox states
 */
function updateSelectAllButton(button, categoryDiv, categoryKey) {
    const checkboxes = categoryDiv.querySelectorAll(`input[type="checkbox"][data-category="${categoryKey}"]`);
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalCount = checkboxes.length;
    
    if (checkedCount === 0) {
        button.textContent = 'Select All';
    } else if (checkedCount === totalCount) {
        button.textContent = 'Deselect All';
    } else {
        button.textContent = `Select All (${checkedCount}/${totalCount})`;
    }
}

/**
 * Update feature item style based on selection
 */
function updateFeatureItemStyle(item, isChecked) {
    if (isChecked) {
        item.style.borderColor = '#0078d4';
        item.style.background = '#f0f7ff';
        item.style.boxShadow = '0 2px 8px rgba(0, 120, 212, 0.15)';
    } else {
        item.style.borderColor = '#e8e8e8';
        item.style.background = 'white';
        item.style.boxShadow = 'none';
    }
}

/**
 * Render a node (question and options)
 * @param {Object} node
 * @param {Array} options
 * @param {Function} onOptionSelect
 * @param {string} mode
 */
export function renderNode(node, options, onOptionSelect, mode) {
    const questionTextEl = document.getElementById('questionText');
    const descriptionEl = document.getElementById('description');
    const optionsGridEl = document.getElementById('optionsGrid');

    if (!questionTextEl) {
        console.error('questionText element not found');
        return;
    }

    // Debug logging
    console.log('[ui.renderNode] Rendering:', {
        nodeId: node?.id,
        question: node?.question,
        optionsCount: options?.length || 0,
        mode
    });

    questionTextEl.textContent = node.question || 'Question';
    descriptionEl.textContent = node.description || '';

    // Render improve button for question-type nodes
    renderImproveButton(node);

    // Clear options
    optionsGridEl.innerHTML = '';

    // Ensure options is an array
    const optionsArray = Array.isArray(options) ? options : [];
    
    if (optionsArray.length === 0) {
        console.warn('[ui.renderNode] No options to render!');
    }

    // Render each option
    optionsArray.forEach(option => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.onclick = () => onOptionSelect(option.id);

        const label = document.createElement('div');
        label.className = 'option-label';
        label.textContent = option.label;

        const description = document.createElement('div');
        description.className = 'option-description';
        description.textContent = option.description || '';

        card.appendChild(label);
        card.appendChild(description);

        // In study mode, show pros/cons
        if (mode === 'study') {
            if (option.pros && option.pros.length > 0) {
                const prosDiv = document.createElement('div');
                prosDiv.className = 'pros-cons pros';
                prosDiv.innerHTML = `<strong>Pros:</strong> ${option.pros.join(', ')}`;
                card.appendChild(prosDiv);
            }

            if (option.cons && option.cons.length > 0) {
                const consDiv = document.createElement('div');
                consDiv.className = 'pros-cons cons';
                consDiv.innerHTML = `<strong>Cons:</strong> ${option.cons.join(', ')}`;
                card.appendChild(consDiv);
            }

            if (option.whenToUse) {
                const whenToUse = document.createElement('div');
                whenToUse.className = 'pros-cons';
                whenToUse.style.marginTop = '8px';
                whenToUse.style.fontSize = '12px';
                whenToUse.innerHTML = `<strong>When to use:</strong> ${option.whenToUse}`;
                card.appendChild(whenToUse);
            }
        }

        optionsGridEl.appendChild(card);
    });
}

/**
 * Render interactive recipe (terminal node) with enhanced features
 * @param {Object} recipe
 * @param {string} mode
 * @param {string} explanation
 */
export function renderRecipe(recipe, mode, explanation) {
    // Use interactive recipe renderer for better UX
    renderInteractiveRecipe(recipe, mode, explanation);
}

/**
 * Render interactive recipe with expandable steps, code snippets, diagrams, etc.
 * @param {Object} recipe
 * @param {string} mode
 * @param {string} explanation
 */
async function renderInteractiveRecipe(recipe, mode, explanation) {
    const nodeDisplayEl = document.getElementById('nodeDisplay');
    const recipeDisplayEl = document.getElementById('recipeDisplay');
    const recipeTitleEl = document.getElementById('recipeTitle');
    const recipeStepsEl = document.getElementById('recipeSteps');
    const explainPathEl = document.getElementById('explainPath');

    // Hide node display, show recipe
    nodeDisplayEl.style.display = 'none';
    recipeDisplayEl.style.display = 'block';

    // Hide recipe export display when rendering new recipe
    const recipeExportDisplay = document.getElementById('recipeExportDisplay');
    if (recipeExportDisplay) {
        recipeExportDisplay.style.display = 'none';
    }

    recipeTitleEl.textContent = recipe.title || 'Recipe';

    // Show explanation
    if (explanation) {
        explainPathEl.textContent = explanation;
        explainPathEl.style.display = 'block';
    } else {
        explainPathEl.style.display = 'none';
    }

    // Get selected features from sessionStorage
    let selectedFeatures = [];
    try {
        const featuresStr = sessionStorage.getItem('selectedFeatures');
        if (featuresStr) {
            const featuresData = JSON.parse(featuresStr);
            selectedFeatures = Array.isArray(featuresData) ? featuresData : 
                             (featuresData.features || []);
        }
    } catch (e) {
        console.warn('Could not parse selected features:', e);
    }

    // Clear steps container
    recipeStepsEl.innerHTML = '';

    // Create interactive recipe container
    const interactiveContainer = document.createElement('div');
    interactiveContainer.className = 'interactive-recipe-container';

    // Progress tracker
    const progressTracker = createProgressTracker(recipe);
    interactiveContainer.appendChild(progressTracker);

    // Cost and time estimates
    const estimatesSection = createEstimatesSection(recipe, selectedFeatures);
    interactiveContainer.appendChild(estimatesSection);

    // Prerequisites section
    const prerequisitesSection = createPrerequisitesSection(recipe, selectedFeatures);
    interactiveContainer.appendChild(prerequisitesSection);

    // Architecture diagram
    const diagramSection = createDiagramSection(recipe, selectedFeatures);
    interactiveContainer.appendChild(diagramSection);

    // Resource tree
    const resourceTreeSection = createResourceTreeSection(recipe, selectedFeatures);
    interactiveContainer.appendChild(resourceTreeSection);

    // Interactive steps
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'interactive-steps-container';
    stepsContainer.id = 'interactiveStepsContainer';

    if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach((step, index) => {
            const stepElement = createInteractiveStep(step, recipe, selectedFeatures, index);
            stepsContainer.appendChild(stepElement);
        });
    }

    interactiveContainer.appendChild(stepsContainer);

    // Troubleshooting section
    const troubleshootingSection = createTroubleshootingSection(recipe);
    interactiveContainer.appendChild(troubleshootingSection);

    // Mode-specific content
    if (mode === 'study') {
        // Show exam objectives, skill level, etc.
        if (recipe.skillLevel) {
            const skillLevel = document.createElement('div');
            skillLevel.style.marginTop = '15px';
            skillLevel.style.padding = '10px';
            skillLevel.style.background = '#f0f0f0';
            skillLevel.style.borderRadius = '4px';
            skillLevel.innerHTML = `<strong>Skill Level:</strong> ${recipe.skillLevel}`;
            recipeStepsEl.appendChild(skillLevel);
        }
    } else {
        // Design mode: show IaC hints, resource list
        if (recipe.bicepOutline) {
            const iacDiv = document.createElement('div');
            iacDiv.style.marginTop = '15px';
            iacDiv.style.padding = '10px';
            iacDiv.style.background = '#e8f4f8';
            iacDiv.style.borderRadius = '4px';
            iacDiv.innerHTML = `<strong>Infrastructure Resources:</strong> ${recipe.bicepOutline.resources?.join(', ') || 'N/A'}`;
            recipeStepsEl.appendChild(iacDiv);
        }
    }

    // Show configuration options if available
    if (recipe.configSchema && Object.keys(recipe.configSchema).length > 0) {
        const configDiv = document.createElement('div');
        configDiv.style.marginTop = '20px';
        configDiv.style.padding = '15px';
        configDiv.style.background = '#fff';
        configDiv.style.border = '1px solid #ddd';
        configDiv.style.borderRadius = '4px';

        const configTitle = document.createElement('h3');
        configTitle.textContent = 'Configuration Options';
        configTitle.style.marginTop = '0';
        configTitle.style.marginBottom = '15px';
        configDiv.appendChild(configTitle);

        const configDesc = document.createElement('p');
        configDesc.textContent = `This recipe supports ${Object.keys(recipe.configSchema).length} configuration options.`;
        configDesc.style.marginBottom = '15px';
        configDesc.style.color = '#666';
        configDiv.appendChild(configDesc);

        const optionsList = document.createElement('div');
        optionsList.style.display = 'grid';
        optionsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        optionsList.style.gap = '10px';

        Object.entries(recipe.configSchema).slice(0, 20).forEach(([key, schema]) => {
            const optionItem = document.createElement('div');
            optionItem.style.padding = '8px';
            optionItem.style.background = '#f9f9f9';
            optionItem.style.borderRadius = '3px';
            optionItem.style.fontSize = '0.9em';

            const optionLabel = document.createElement('div');
            optionLabel.style.fontWeight = 'bold';
            optionLabel.textContent = schema.label || key;
            optionItem.appendChild(optionLabel);

            if (schema.description) {
                const optionDesc = document.createElement('div');
                optionDesc.style.fontSize = '0.85em';
                optionDesc.style.color = '#666';
                optionDesc.style.marginTop = '3px';
                optionDesc.textContent = schema.description;
                optionItem.appendChild(optionDesc);
            }

            const optionType = document.createElement('div');
            optionType.style.fontSize = '0.8em';
            optionType.style.color = '#999';
            optionType.style.marginTop = '3px';
            optionType.textContent = `Type: ${schema.type}${schema.default !== undefined ? ` | Default: ${schema.default}` : ''}`;
            optionItem.appendChild(optionType);

            optionsList.appendChild(optionItem);
        });

        configDiv.appendChild(optionsList);

        if (Object.keys(recipe.configSchema).length > 20) {
            const moreText = document.createElement('p');
            moreText.style.marginTop = '10px';
            moreText.style.fontSize = '0.9em';
            moreText.style.color = '#666';
            moreText.textContent = `... and ${Object.keys(recipe.configSchema).length - 20} more configuration options`;
            configDiv.appendChild(moreText);
        }

        recipeStepsEl.appendChild(configDiv);
    }

    // Show links
    if (recipe.links && recipe.links.length > 0) {
        const linksDiv = document.createElement('div');
        linksDiv.style.marginTop = '15px';
        linksDiv.style.padding = '10px';
        linksDiv.style.background = '#f9f9f9';
        linksDiv.style.borderRadius = '4px';

        const linksTitle = document.createElement('strong');
        linksTitle.textContent = 'References: ';
        linksDiv.appendChild(linksTitle);

        recipe.links.forEach((link, index) => {
            const linkEl = document.createElement('a');
            linkEl.href = link.url;
            linkEl.target = '_blank';
            linkEl.textContent = link.label;
            linkEl.style.marginLeft = index > 0 ? '10px' : '5px';
            linksDiv.appendChild(linkEl);
        });

        recipeStepsEl.appendChild(linksDiv);
    }

    recipeStepsEl.appendChild(interactiveContainer);
}

/**
 * Create progress tracker component
 */
function createProgressTracker(recipe) {
    const tracker = document.createElement('div');
    tracker.className = 'progress-tracker';
    
    const header = document.createElement('div');
    header.className = 'progress-header';
    header.innerHTML = '<h3>Deployment Progress</h3>';
    tracker.appendChild(header);

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar-container';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.id = 'progressFill';
    progressFill.style.width = '0%';
    progressBar.appendChild(progressFill);
    tracker.appendChild(progressBar);

    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.id = 'progressText';
    progressText.textContent = '0% Complete';
    tracker.appendChild(progressText);

    const stepsList = document.createElement('div');
    stepsList.className = 'progress-steps-list';
    
    if (recipe.steps && recipe.steps.length > 0) {
        recipe.steps.forEach((step, index) => {
            const stepItem = document.createElement('div');
            stepItem.className = 'progress-step-item';
            stepItem.dataset.stepNumber = step.number || index + 1;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `step-checkbox-${step.number || index + 1}`;
            checkbox.className = 'step-checkbox';
            checkbox.addEventListener('change', () => updateProgress(recipe));
            
            // Load saved state
            const savedState = sessionStorage.getItem(`step-${step.number || index + 1}-completed`);
            if (savedState === 'true') {
                checkbox.checked = true;
            }
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = `Step ${step.number || index + 1}: ${step.title || ''}`;
            
            stepItem.appendChild(checkbox);
            stepItem.appendChild(label);
            stepsList.appendChild(stepItem);
        });
    }
    
    tracker.appendChild(stepsList);
    
    // Update progress on load
    setTimeout(() => updateProgress(recipe), 100);
    
    return tracker;
}

/**
 * Update progress tracker
 */
function updateProgress(recipe) {
    if (!recipe.steps) return;
    
    const totalSteps = recipe.steps.length;
    let completedSteps = 0;
    
    recipe.steps.forEach((step, index) => {
        const checkbox = document.getElementById(`step-checkbox-${step.number || index + 1}`);
        if (checkbox && checkbox.checked) {
            completedSteps++;
            sessionStorage.setItem(`step-${step.number || index + 1}-completed`, 'true');
        } else {
            sessionStorage.removeItem(`step-${step.number || index + 1}-completed`);
        }
    });
    
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${percentage}% Complete (${completedSteps}/${totalSteps} steps)`;
    }
}

/**
 * Create estimates section (costs and time)
 */
function createEstimatesSection(recipe, selectedFeatures) {
    const section = document.createElement('div');
    section.className = 'estimates-section';
    
    const header = document.createElement('h3');
    header.textContent = 'Estimated Costs & Deployment Time';
    section.appendChild(header);

    const estimatesGrid = document.createElement('div');
    estimatesGrid.className = 'estimates-grid';

    // Costs
    const costs = calculateCosts(recipe, selectedFeatures);
    const costCard = document.createElement('div');
    costCard.className = 'estimate-card';
    costCard.innerHTML = `
        <h4>Monthly Costs</h4>
        <div class="cost-range">
            <span class="cost-min">$${costs.monthly.min}</span>
            <span class="cost-separator">-</span>
            <span class="cost-max">$${costs.monthly.max}</span>
        </div>
        <div class="cost-breakdown">
            ${costs.monthly.breakdown.map(item => `
                <div class="cost-item">
                    <span class="cost-item-name">${item.name}</span>
                    <span class="cost-item-range">$${item.min} - $${item.max}</span>
                </div>
            `).join('')}
        </div>
        <a href="https://azure.microsoft.com/pricing/calculator/" target="_blank" class="pricing-link">
            Azure Pricing Calculator →
        </a>
    `;
    estimatesGrid.appendChild(costCard);

    // Time
    const time = calculateDeploymentTime(recipe, selectedFeatures);
    const timeCard = document.createElement('div');
    timeCard.className = 'estimate-card';
    timeCard.innerHTML = `
        <h4>Deployment Time</h4>
        <div class="time-range">
            <span class="time-min">${time.total.min}</span>
            <span class="time-separator">-</span>
            <span class="time-max">${time.total.max}</span>
            <span class="time-unit">${time.total.unit}</span>
        </div>
        <div class="time-breakdown">
            <div class="time-quick">Quick setup: ${time.quickSetup} ${time.total.unit}</div>
            <div class="time-full">Full configuration: ${time.fullConfig} ${time.total.unit}</div>
        </div>
    `;
    estimatesGrid.appendChild(timeCard);

    section.appendChild(estimatesGrid);
    return section;
}

/**
 * Create prerequisites section
 */
function createPrerequisitesSection(recipe, selectedFeatures) {
    const section = document.createElement('div');
    section.className = 'prerequisites-section';
    
    const header = document.createElement('h3');
    header.textContent = 'Prerequisites';
    section.appendChild(header);

    const prerequisites = getPrerequisites(recipe, selectedFeatures);
    const checklist = document.createElement('div');
    checklist.className = 'prerequisites-checklist';

    prerequisites.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'prerequisite-category';
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = category.category;
        categoryDiv.appendChild(categoryTitle);

        const itemsList = document.createElement('ul');
        category.items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            itemsList.appendChild(li);
        });
        categoryDiv.appendChild(itemsList);
        checklist.appendChild(categoryDiv);
    });

    section.appendChild(checklist);
    return section;
}

/**
 * Create diagram section
 */
function createDiagramSection(recipe, selectedFeatures) {
    const section = document.createElement('div');
    section.className = 'diagram-section';
    
    const header = document.createElement('h3');
    header.textContent = 'Architecture Diagram';
    section.appendChild(header);

    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'diagram-container';
    diagramContainer.id = 'architectureDiagram';
    
    // Generate Mermaid diagram
    const mermaidCode = generateArchitectureDiagram(recipe, selectedFeatures);
    
    // Create pre element for Mermaid (will be rendered by Mermaid.js if available)
    const diagramPre = document.createElement('pre');
    diagramPre.className = 'mermaid';
    diagramPre.textContent = mermaidCode;
    diagramContainer.appendChild(diagramPre);

    // Fallback message if Mermaid not loaded
    const fallbackMsg = document.createElement('div');
    fallbackMsg.className = 'diagram-fallback';
    fallbackMsg.style.display = 'none';
    fallbackMsg.innerHTML = '<p>Diagram rendering requires Mermaid.js. <a href="https://mermaid.js.org/" target="_blank">Learn more</a></p>';
    diagramContainer.appendChild(fallbackMsg);

    section.appendChild(diagramContainer);
    return section;
}

/**
 * Create resource tree section
 */
function createResourceTreeSection(recipe, selectedFeatures) {
    const section = document.createElement('div');
    section.className = 'resource-tree-section';
    
    const header = document.createElement('h3');
    header.textContent = 'Azure Resources';
    section.appendChild(header);

    const treeContainer = document.createElement('div');
    treeContainer.className = 'resource-tree-container';
    treeContainer.id = 'resourceTree';

    const resources = generateResourceTree(recipe, selectedFeatures);
    renderResourceTree(resources, treeContainer);

    section.appendChild(treeContainer);
    return section;
}

/**
 * Render resource tree recursively
 */
function renderResourceTree(resources, container) {
    resources.forEach(resource => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';
        
        const resourceHeader = document.createElement('div');
        resourceHeader.className = 'resource-header';
        
        const expandIcon = document.createElement('span');
        expandIcon.className = 'resource-expand-icon';
        expandIcon.textContent = resource.children && resource.children.length > 0 ? '▶' : '';
        expandIcon.addEventListener('click', () => toggleResourceChildren(resourceItem));
        
        const resourceName = document.createElement('span');
        resourceName.className = 'resource-name';
        resourceName.textContent = resource.name;
        
        const resourceType = document.createElement('span');
        resourceType.className = 'resource-type';
        resourceType.textContent = resource.type || '';
        
        resourceHeader.appendChild(expandIcon);
        resourceHeader.appendChild(resourceName);
        resourceHeader.appendChild(resourceType);
        resourceItem.appendChild(resourceHeader);

        if (resource.children && resource.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'resource-children';
            childrenContainer.style.display = 'none';
            renderResourceTree(resource.children, childrenContainer);
            resourceItem.appendChild(childrenContainer);
        }

        container.appendChild(resourceItem);
    });
}

/**
 * Toggle resource children visibility
 */
function toggleResourceChildren(resourceItem) {
    const children = resourceItem.querySelector('.resource-children');
    const icon = resourceItem.querySelector('.resource-expand-icon');
    
    if (children) {
        const isVisible = children.style.display !== 'none';
        children.style.display = isVisible ? 'none' : 'block';
        icon.textContent = isVisible ? '▶' : '▼';
    }
}

/**
 * Create interactive step element
 */
function createInteractiveStep(step, recipe, selectedFeatures, index) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'interactive-step';
    stepDiv.dataset.stepNumber = step.number || index + 1;

    const stepHeader = document.createElement('div');
    stepHeader.className = 'step-header';
    
    const stepNumber = document.createElement('span');
    stepNumber.className = 'step-number';
    stepNumber.textContent = step.number || index + 1;
    
    const stepTitle = document.createElement('h4');
    stepTitle.className = 'step-title';
    stepTitle.textContent = step.title || '';
    
    const stepTime = document.createElement('span');
    stepTime.className = 'step-time';
    const timeEstimate = calculateDeploymentTime(recipe, selectedFeatures);
    const stepTimeData = timeEstimate.steps.find(s => s.step === (step.number || index + 1));
    if (stepTimeData) {
        stepTime.textContent = `${stepTimeData.min}-${stepTimeData.max} ${stepTimeData.unit}`;
    }
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'step-toggle-btn';
    toggleBtn.textContent = 'Show Details';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.addEventListener('click', () => toggleStepDetails(stepDiv, toggleBtn));
    
    stepHeader.appendChild(stepNumber);
    stepHeader.appendChild(stepTitle);
    stepHeader.appendChild(stepTime);
    stepHeader.appendChild(toggleBtn);
    
    const stepContent = document.createElement('div');
    stepContent.className = 'step-content';
    stepContent.style.display = 'none';
    
    const stepDescription = document.createElement('div');
    stepDescription.className = 'step-description';
    stepDescription.textContent = step.description || '';
    stepContent.appendChild(stepDescription);
    
    // Code snippets
    const codeSnippets = generateCodeSnippets(step, recipe, selectedFeatures);
    if (codeSnippets.azureCli || codeSnippets.powershell || codeSnippets.bicep) {
        const codeSection = createCodeSnippetsSection(step, codeSnippets);
        stepContent.appendChild(codeSection);
    }
    
    stepDiv.appendChild(stepHeader);
    stepDiv.appendChild(stepContent);
    
    return stepDiv;
}

/**
 * Create code snippets section with tabs
 */
function createCodeSnippetsSection(step, snippets) {
    const codeSection = document.createElement('div');
    codeSection.className = 'code-snippets-section';
    
    const codeHeader = document.createElement('h5');
    codeHeader.textContent = 'Code Snippets';
    codeSection.appendChild(codeHeader);
    
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'code-tabs';
    
    const tabsContent = document.createElement('div');
    tabsContent.className = 'code-tabs-content';
    
    const tabButtons = [];
    const tabPanels = [];
    
    // Azure CLI tab
    if (snippets.azureCli) {
        const { tab, panel } = createCodeTab('Azure CLI', snippets.azureCli, 'bash');
        tabButtons.push(tab);
        tabPanels.push(panel);
        if (tabButtons.length === 1) {
            tab.classList.add('active');
            panel.style.display = 'block';
        }
    }
    
    // PowerShell tab
    if (snippets.powershell) {
        const { tab, panel } = createCodeTab('PowerShell', snippets.powershell, 'powershell');
        tabButtons.push(tab);
        tabPanels.push(panel);
    }
    
    // Bicep tab
    if (snippets.bicep) {
        const { tab, panel } = createCodeTab('Bicep', snippets.bicep, 'bicep');
        tabButtons.push(tab);
        tabPanels.push(panel);
    }
    
    // REST API tab
    if (snippets.restApi) {
        const { tab, panel } = createCodeTab('REST API', snippets.restApi, 'json');
        tabButtons.push(tab);
        tabPanels.push(panel);
    }
    
    tabButtons.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabButtons.forEach(t => t.classList.remove('active'));
            tabPanels.forEach(p => p.style.display = 'none');
            tab.classList.add('active');
            tabPanels[index].style.display = 'block';
        });
        tabsContainer.appendChild(tab);
    });
    
    tabPanels.forEach(panel => tabsContent.appendChild(panel));
    
    codeSection.appendChild(tabsContainer);
    codeSection.appendChild(tabsContent);
    
    return codeSection;
}

/**
 * Create a code tab
 */
function createCodeTab(label, code, language) {
    const tab = document.createElement('button');
    tab.className = 'code-tab';
    tab.textContent = label;
    
    const panel = document.createElement('div');
    panel.className = 'code-tab-panel';
    
    const codeBlock = document.createElement('pre');
    codeBlock.className = `language-${language}`;
    const codeElement = document.createElement('code');
    codeElement.textContent = code;
    codeBlock.appendChild(codeElement);
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => copyToClipboard(code));
    
    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'code-wrapper';
    codeWrapper.appendChild(codeBlock);
    codeWrapper.appendChild(copyBtn);
    
    panel.appendChild(codeWrapper);
    
    return { tab, panel };
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        // Show feedback
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = 'Copied to clipboard!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

/**
 * Toggle step details visibility
 */
function toggleStepDetails(stepDiv, toggleBtn) {
    const content = stepDiv.querySelector('.step-content');
    const isExpanded = content.style.display !== 'none';
    
    content.style.display = isExpanded ? 'none' : 'block';
    toggleBtn.textContent = isExpanded ? 'Show Details' : 'Hide Details';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
}

/**
 * Create troubleshooting section
 */
function createTroubleshootingSection(recipe) {
    const section = document.createElement('div');
    section.className = 'troubleshooting-section';
    
    const header = document.createElement('h3');
    header.textContent = 'Troubleshooting';
    section.appendChild(header);

    const tips = getTroubleshootingTips(recipe);
    const tipsList = document.createElement('div');
    tipsList.className = 'troubleshooting-tips';

    tips.forEach(tip => {
        const tipItem = document.createElement('div');
        tipItem.className = 'troubleshooting-tip';
        
        const issueTitle = document.createElement('h4');
        issueTitle.textContent = tip.issue;
        tipItem.appendChild(issueTitle);
        
        const solutionsList = document.createElement('ul');
        tip.solutions.forEach(solution => {
            const li = document.createElement('li');
            li.textContent = solution;
            solutionsList.appendChild(li);
        });
        tipItem.appendChild(solutionsList);
        tipsList.appendChild(tipItem);
    });

    section.appendChild(tipsList);
    return section;
}

/**
 * Render breadcrumbs
 * @param {Array} breadcrumbs
 * @param {Function} onBreadcrumbClick
 */
export function renderBreadcrumbs(breadcrumbs, onBreadcrumbClick) {
    const breadcrumbsEl = document.getElementById('breadcrumbs');
    breadcrumbsEl.innerHTML = '';

    breadcrumbs.forEach((crumb, index) => {
        const crumbEl = document.createElement('div');
        crumbEl.className = 'breadcrumb';
        crumbEl.textContent = crumb.nodeQuestion || 'Node';
        crumbEl.onclick = () => onBreadcrumbClick(crumb.nodeId);

        breadcrumbsEl.appendChild(crumbEl);

        if (crumb.optionLabel) {
            const arrow = document.createElement('span');
            arrow.textContent = ' → ';
            arrow.style.margin = '0 5px';
            breadcrumbsEl.appendChild(arrow);

            const optionEl = document.createElement('div');
            optionEl.className = 'breadcrumb';
            optionEl.textContent = crumb.optionLabel;
            optionEl.style.background = '#d0e8f0';
            breadcrumbsEl.appendChild(optionEl);
        }

        if (index < breadcrumbs.length - 1) {
            const arrow = document.createElement('span');
            arrow.textContent = ' → ';
            arrow.style.margin = '0 5px';
            breadcrumbsEl.appendChild(arrow);
        }
    });
}

/**
 * Show loading state
 */
export function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('wizardContent').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

/**
 * Hide loading state
 */
export function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('wizardContent').style.display = 'block';
}

/**
 * Show error message
 * @param {string} message
 */
export function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

/**
 * Hide error message
 */
export function hideError() {
    document.getElementById('error').style.display = 'none';
}

/**
 * Show or hide the improve button and emit a request event when clicked.
 * This lets other modules listen for improvement requests without UI needing their logic.
 */
function renderImproveButton(node) {
    const button = document.getElementById('improveButton');
    if (!button) {
        return;
    }

    const isQuestionNode = node && node.nodeType !== 'terminal';
    const hasNodeId = !!node?.id;

    if (isQuestionNode && hasNodeId) {
        button.classList.remove('hidden');
        button.onclick = () => {
            const evt = new CustomEvent('improveNodeRequest', {
                detail: { nodeId: node.id }
            });
            window.dispatchEvent(evt);
        };
    } else {
        button.classList.add('hidden');
        button.onclick = null;
    }
}
