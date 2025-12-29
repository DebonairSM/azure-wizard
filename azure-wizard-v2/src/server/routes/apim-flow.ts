import { Router, Request, Response } from 'express';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type FlowAnswers = {
  environment?: 'dev' | 'test' | 'prod';
  requireVnet?: boolean;
  requireMultiRegion?: boolean;
  requireSelfHostedGateway?: boolean;
  requireAiGateway?: boolean;
  requireSla?: boolean;
};

type SkuCapability = {
  skuKey: string; // file-derived key (e.g., consumption, developer, basic, standard, premium)
  name: string;
  tier: string;
  version?: string;
  vnetSupport?: boolean;
  multiRegion?: boolean;
  selfHostedGateway?: boolean;
  aiGateway?: boolean;
  productionReady?: boolean;
  sla?: string;
  description?: string;
};

type SkuEvaluation = {
  sku: SkuCapability;
  eligible: boolean;
  gaps: string[];
  reasons: string[];
  rank: number;
};

type RequirementRule = {
  id: keyof FlowAnswers;
  label: string;
  capabilityField: keyof SkuCapability;
};

function getApimWizardPath(): string {
  // dist/server/routes -> dist/wizards/apim at runtime
  return join(__dirname, '..', '..', 'wizards', 'apim');
}

function readJsonFile(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadSkuCapabilities(): SkuCapability[] {
  const apimPath = getApimWizardPath();
  const skusDir = join(apimPath, '06-skus');
  if (!existsSync(skusDir) || !statSync(skusDir).isDirectory()) return [];

  const files = readdirSync(skusDir).filter(f => f.endsWith('.json'));
  const results: SkuCapability[] = [];

  for (const file of files) {
    const skuKey = file.replace(/\.json$/, '');
    const full = join(skusDir, file);
    const parsed = readJsonFile(full);

    // Current sku JSON structure: { id, name, skus: [ { ... } ] }
    const first = Array.isArray(parsed?.skus) ? parsed.skus[0] : null;
    if (!first) continue;

    results.push({
      skuKey,
      name: String(first.name ?? parsed.name ?? skuKey),
      tier: String(first.tier ?? first.skuTier ?? ''),
      version: first.version ? String(first.version) : undefined,
      vnetSupport: Boolean(first.vnetSupport),
      multiRegion: Boolean(first.multiRegion),
      selfHostedGateway: Boolean(first.selfHostedGateway),
      aiGateway: Boolean(first.aiGateway),
      productionReady: Boolean(first.productionReady),
      sla: first.sla ? String(first.sla) : undefined,
      description: first.description ? String(first.description) : undefined
    });
  }

  return results;
}

function loadPolicyPacks(): Record<string, any> {
  const apimPath = getApimWizardPath();
  const packsDir = join(apimPath, '_policy-packs');
  if (!existsSync(packsDir) || !statSync(packsDir).isDirectory()) return {};

  const files = readdirSync(packsDir).filter(f => f.endsWith('.json'));
  const packs: Record<string, any> = {};
  for (const file of files) {
    const full = join(packsDir, file);
    const pack = readJsonFile(full);
    const id = String(pack.id ?? file.replace(/\.json$/, ''));
    packs[id] = pack;
  }
  return packs;
}

function loadRequirementRules(): RequirementRule[] {
  const apimPath = getApimWizardPath();
  const rulesFile = join(apimPath, '_rules', 'sku-requirements.json');
  if (!existsSync(rulesFile)) return [];

  const parsed = readJsonFile(rulesFile);
  const reqs = Array.isArray(parsed?.requirements) ? parsed.requirements : [];

  const rules: RequirementRule[] = [];
  for (const r of reqs) {
    const id = String(r.id || '') as keyof FlowAnswers;
    const label = String(r.label || id);
    const capabilityField = String(r.capabilityField || '') as keyof SkuCapability;
    if (!id || !capabilityField) continue;
    rules.push({ id, label, capabilityField });
  }
  return rules;
}

function baseRankForSkuKey(skuKey: string): number {
  // Lower is better (more cost-efficient) when requirements are met
  const map: Record<string, number> = {
    consumption: 10,
    developer: 20,
    basic: 30,
    standard: 40,
    premium: 50
  };
  return map[skuKey] ?? 100;
}

function evaluateSku(answers: FlowAnswers, sku: SkuCapability, rules: RequirementRule[]): SkuEvaluation {
  const gaps: string[] = [];
  const reasons: string[] = [];

  for (const rule of rules) {
    const required = Boolean((answers as any)[rule.id]);
    if (!required) continue;
    const supported = Boolean((sku as any)[rule.capabilityField]);
    if (!supported) gaps.push(rule.label);
    if (supported) reasons.push(`Meets requirement: ${rule.label}`);
  }

  if (answers.environment === 'prod') {
    if (!sku.productionReady) gaps.push('Requires production-ready SKU');
    if (answers.requireSla && (!sku.sla || sku.sla.trim().length === 0)) gaps.push('Requires published SLA');
  }

  if (gaps.length === 0) {
    if (reasons.length === 0) reasons.push('Meets selected requirements');
  }

  const eligible = gaps.length === 0;
  const rank = baseRankForSkuKey(sku.skuKey);

  return { sku, eligible, gaps, reasons, rank };
}

function recommendDeploymentModel(answers: FlowAnswers): string {
  if (answers.requireSelfHostedGateway) return 'Hybrid with self-hosted gateway';
  if (answers.requireVnet) return 'Public gateway, private backends';
  return 'Public gateway, public backends';
}

function selectPolicyPackIds(answers: FlowAnswers): string[] {
  const packIds: string[] = ['baseline-security', 'baseline-observability'];
  if (answers.requireAiGateway) packIds.push('ai-gateway-baseline');
  if (answers.requireVnet || answers.requireSelfHostedGateway) {
    packIds.push('private-backend');
  } else {
    packIds.push('public-api');
  }
  return packIds;
}

function buildChecklist(answers: FlowAnswers): string[] {
  const items: string[] = [
    'Confirm naming, tagging, and environment strategy.',
    'Define API onboarding workflow (OpenAPI import, CI/CD, versioning approach).',
    'Define logging/metrics targets and data handling constraints.'
  ];

  if (answers.requireVnet) {
    items.push('Define VNet, routing, and DNS requirements for inbound and outbound connectivity.');
  }
  if (answers.requireSelfHostedGateway) {
    items.push('Define self-hosted gateway placement, update strategy, and monitoring.');
  }
  if (answers.requireAiGateway) {
    items.push('Define token governance, metric collection, and safety/caching approach for LLM APIs.');
  }

  return items;
}

function checklistToMarkdown(items: string[]): string {
  return items.map(i => `- [ ] ${i}`).join('\n');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderTemplate(template: string, values: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, rawKey: string) => {
    const key = String(rawKey).trim();
    const v = values[key];
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return escapeXml(String(v));
  });
}

function loadPolicyByCategoryAndId(category: string, id: string): any | null {
  const apimPath = getApimWizardPath();
  const policyFile = join(apimPath, '08-policies', category, `${id}.json`);
  if (!existsSync(policyFile)) return null;
  return readJsonFile(policyFile);
}

function resolvePolicyConfig(policy: any, packDefaults: Record<string, any>): Record<string, any> {
  const resolved: Record<string, any> = {};
  const params = policy?.parameters && typeof policy.parameters === 'object' ? policy.parameters : {};
  for (const [key, def] of Object.entries(params)) {
    const d = def as any;
    if (packDefaults && packDefaults[key] !== undefined) {
      resolved[key] = packDefaults[key];
    } else if (d && d.default !== undefined) {
      resolved[key] = d.default;
    }
  }
  // include any pack defaults not present in parameter defs
  for (const [k, v] of Object.entries(packDefaults || {})) {
    if (resolved[k] === undefined) resolved[k] = v;
  }
  return resolved;
}

function buildPolicyBundleXml(resolvedPolicies: Array<{ policy: any; config: Record<string, any> }>): string {
  const inbound: string[] = [];
  const outbound: string[] = [];
  const onError: string[] = [];

  for (const item of resolvedPolicies) {
    const xmlTemplate = item.policy?.xmlTemplate || item.policy?.xml_template || {};
    if (xmlTemplate.inbound) inbound.push(renderTemplate(String(xmlTemplate.inbound), item.config));
    if (xmlTemplate.outbound) outbound.push(renderTemplate(String(xmlTemplate.outbound), item.config));
    if (xmlTemplate['on-error']) onError.push(renderTemplate(String(xmlTemplate['on-error']), item.config));
    if (xmlTemplate.onError) onError.push(renderTemplate(String(xmlTemplate.onError), item.config));
  }

  const indent = (lines: string[]) => lines.map(l => `    ${l}`).join('\n');

  return [
    '<policies>',
    '  <inbound>',
    '    <base />',
    inbound.length ? indent(inbound) : '    <!-- no inbound policies selected -->',
    '  </inbound>',
    '  <backend>',
    '    <base />',
    '  </backend>',
    '  <outbound>',
    '    <base />',
    outbound.length ? indent(outbound) : '    <!-- no outbound policies selected -->',
    '  </outbound>',
    '  <on-error>',
    '    <base />',
    onError.length ? indent(onError) : '    <!-- no on-error policies selected -->',
    '  </on-error>',
    '</policies>',
    ''
  ].join('\n');
}

export const apimFlowRoutes = Router();

apimFlowRoutes.post('/flow/evaluate', (req: Request, res: Response) => {
  try {
    const answers = (req.body || {}) as FlowAnswers;
    const skus = loadSkuCapabilities();
    const rules = loadRequirementRules();

    const evaluated = skus.map(s => evaluateSku(answers, s, rules));
    const eligible = evaluated.filter(e => e.eligible).sort((a, b) => a.rank - b.rank);
    const recommended = eligible.length > 0 ? eligible[0] : null;

    const packs = loadPolicyPacks();
    const selectedPackIds = selectPolicyPackIds(answers);
    const selectedPacks = selectedPackIds
      .map(id => packs[id])
      .filter(Boolean);

    const warnings: string[] = [];

    // Resolve policies referenced by packs
    const resolvedPolicies: Array<{
      packId: string;
      category: string;
      id: string;
      policy: any;
      config: Record<string, any>;
    }> = [];

    for (const pack of selectedPacks) {
      const packId = String(pack.id ?? '');
      const policies = Array.isArray(pack.policies) ? pack.policies : [];
      for (const p of policies) {
        const policyId = String(p.id ?? '');
        const category = String(p.category ?? '');
        if (!policyId || !category) {
          warnings.push(`Policy pack '${packId}' contains an invalid policy reference.`);
          continue;
        }

        const policy = loadPolicyByCategoryAndId(category, policyId);
        if (!policy) {
          warnings.push(`Missing policy template: 08-policies/${category}/${policyId}.json`);
          continue;
        }

        const defaults = p.defaults && typeof p.defaults === 'object' ? p.defaults : {};
        const config = resolvePolicyConfig(policy, defaults);
        resolvedPolicies.push({ packId, category, id: policyId, policy, config });
      }
    }

    const policyXml = buildPolicyBundleXml(
      resolvedPolicies.map(r => ({ policy: r.policy, config: r.config }))
    );

    const responseBody = {
      input: answers,
      deploymentModel: recommendDeploymentModel(answers),
      recommendedSku: recommended
        ? {
            skuKey: recommended.sku.skuKey,
            name: recommended.sku.name,
            tier: recommended.sku.tier,
            version: recommended.sku.version,
            sla: recommended.sku.sla,
            reasons: recommended.reasons
          }
        : null,
      skuEvaluations: evaluated
        .sort((a, b) => a.rank - b.rank)
        .map(e => ({
          skuKey: e.sku.skuKey,
          name: e.sku.name,
          tier: e.sku.tier,
          eligible: e.eligible,
          gaps: e.gaps,
          reasons: e.reasons,
          capabilities: {
            vnetSupport: e.sku.vnetSupport,
            multiRegion: e.sku.multiRegion,
            selfHostedGateway: e.sku.selfHostedGateway,
            aiGateway: e.sku.aiGateway,
            productionReady: e.sku.productionReady
          }
        })),
      policyPackIds: selectedPackIds,
      policyPacks: selectedPacks,
      checklist: buildChecklist(answers),
      exports: {
        checklistMarkdown: checklistToMarkdown(buildChecklist(answers)),
        policyXml,
        resolvedPolicies: resolvedPolicies.map(r => ({
          packId: r.packId,
          category: r.category,
          id: r.id,
          name: r.policy?.name,
          documentation: r.policy?.documentation,
          config: r.config
        }))
      },
      warnings
    };

    return res.json(responseBody);
  } catch (error) {
    console.error('Error evaluating APIM flow:', error);
    return res.status(500).json({ error: 'Failed to evaluate APIM flow' });
  }
});


