import { getBuiltinSolverCatalog } from "./builtin-solvers.js";
import { buildBindingParameterSeed } from "./binding-parameter-seeds.js";
import { getExternalSolverManifestCatalog, listExternalSolverManifests } from "./external-solver-manifests.js";
import { getNativeSolverReadinessCatalog } from "./native-solver-readiness.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const GROQ_RESPONSES_URL = "https://api.groq.com/openai/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

const MODEL_ALIASES = {
  groq: {
    "gpt 120oss": "openai/gpt-oss-120b",
    "gpt-120oss": "openai/gpt-oss-120b",
    "gpt_120oss": "openai/gpt-oss-120b",
    "gpt oss 120b": "openai/gpt-oss-120b",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    "openai/gpt-oss-120b": "openai/gpt-oss-120b",
    "gpt 20oss": "openai/gpt-oss-20b",
    "gpt-20oss": "openai/gpt-oss-20b",
    "gpt_20oss": "openai/gpt-oss-20b",
    "openai/gpt-oss-20b": "openai/gpt-oss-20b",
    "kimi": "moonshotai/kimi-k2-instruct-0905",
    "kimi k2": "moonshotai/kimi-k2-instruct-0905",
    "moonshotai/kimi-k2-instruct-0905": "moonshotai/kimi-k2-instruct-0905"
  }
};

const DOMAIN_MANIFEST_IDS = {
  compute_semiconductor: [
    "sundials-cli-json",
    "openmodelica-cli-json",
    "nuxmv-cli-json",
    "gem5-cli-json",
    "gem5-trace-artifact-bundle",
    "openturns-cli-json",
    "xyce-cli-json"
  ],
  mechatronics: [
    "sundials-cli-json",
    "openmodelica-cli-json",
    "nuxmv-cli-json",
    "project-chrono-cli-json",
    "calculix-cli-json",
    "openturns-cli-json"
  ],
  fluidic_energy: [
    "sundials-cli-json",
    "openmodelica-cli-json",
    "openfoam-cli-json",
    "openturns-cli-json"
  ],
  vehicle_systems: [
    "sundials-cli-json",
    "openmodelica-cli-json",
    "nuxmv-cli-json",
    "project-chrono-cli-json",
    "xyce-cli-json",
    "openturns-cli-json"
  ],
  materials_chemistry: [
    "materials-chemistry-cli-json"
  ],
  cosmetic_science: [
    "cosmetic-transport-cli-json",
    "cosmetic-evidence-artifact-bundle"
  ],
  space_cosmology: [
    "space-orbital-cli-json",
    "space-observation-artifact-bundle",
    "space-inference-cli-json"
  ]
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          bindingId: { type: "string" },
          decisionType: {
            type: "string",
            enum: ["builtin_solver", "external_manifest", "artifact_manifest"]
          },
          solver: { type: "string" },
          manifestId: { type: "string" },
          reason: { type: "string" }
        },
        required: ["bindingId", "decisionType", "solver", "manifestId", "reason"]
      }
    }
  },
  required: ["summary", "decisions"]
};

export function createAiSolverOrchestrator({
  provider = resolveAiProvider(process.env.TWINTEST_AI_PROVIDER || ""),
  apiKey = process.env.TWINTEST_AI_API_KEY || process.env.TWINTEST_OPENAI_API_KEY || "",
  model = process.env.TWINTEST_AI_MODEL || process.env.TWINTEST_OPENAI_MODEL || "",
  baseUrl = process.env.TWINTEST_AI_BASE_URL || "",
  fetchImpl = globalThis.fetch
} = {}) {
  const normalizedProvider = resolveAiProvider(provider);

  return new AiSolverOrchestrator({
    provider: normalizedProvider,
    apiKey,
    model: resolveAiModel(normalizedProvider, model),
    baseUrl: resolveAiBaseUrl(normalizedProvider, baseUrl),
    fetchImpl
  });
}

class AiSolverOrchestrator {
  constructor({ provider, apiKey, model, baseUrl, fetchImpl }) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.fetchImpl);
  }

  async createAutobindPlan({
    project,
    compilation,
    strategy = "prefer_runtime_ready",
    instructions = ""
  }) {
    if (!this.isConfigured()) {
      throw new Error("AI solver orchestrator is not configured. Set TWINTEST_OPENAI_API_KEY.");
    }

    const context = await buildAiPromptContext({
      project,
      compilation,
      strategy,
      instructions
    });
    const requestBody = {
      model: this.model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are the TwinTest solver-binding planner.",
                "Choose one binding strategy for each solver binding.",
                "Only use candidate manifests or compatible builtin solvers explicitly provided.",
                "Prefer runtime_ready_local_driver manifests when they fit the domain and evidence goal.",
                "Use artifact manifests only when trace-driven evidence is the strongest current path.",
                "Return only structured JSON matching the schema."
              ].join(" ")
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(context)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "twintest_solver_binding_plan",
          strict: true,
          schema: PLAN_SCHEMA
        }
      }
    };
    applyProviderRequestOptions(this.provider, requestBody);

    const response = await this.fetchImpl(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(`OpenAI Responses API error: ${payload.error?.message || response.statusText}`);
    }

    const parsed = parsePlanPayload(payload);
    validatePlanDecisions(parsed, context.bindings);

    return {
      summary: parsed.summary,
      decisions: parsed.decisions,
      responseId: payload.id || null,
      model: payload.model || this.model,
      provider: this.provider
    };
  }
}

export async function materializeAiBindingPlan({
  graph,
  plan,
  replaceExisting = false,
  bindingParameters = {},
  manifestConfigurationOverrides = {}
}) {
  const manifestCatalog = getExternalSolverManifestCatalog();
  const nativeReadinessCatalog = await getNativeSolverReadinessCatalog();
  const decisionByBindingId = new Map(plan.decisions.map((decision) => [decision.bindingId, decision]));
  const appliedBindings = [];

  for (const binding of graph.solverBindings) {
    if (!replaceExisting && binding.status === "bound") {
      continue;
    }

    const decision = decisionByBindingId.get(binding.id);

    if (!decision) {
      throw new Error(`AI plan did not include binding ${binding.id}.`);
    }

    if (decision.decisionType === "builtin_solver") {
      if (!binding.compatibleSolvers.includes(decision.solver)) {
        throw new Error(`AI selected incompatible builtin solver "${decision.solver}" for binding ${binding.id}.`);
      }

      binding.solver = decision.solver;
      binding.adapterType = "builtin_solver";
      binding.configuration = {
        parameters: buildBindingParameterSeed({
          graph,
          componentId: binding.componentId,
          requiredParameters: binding.requiredParameters,
          overrides: bindingParameters[binding.id] || {}
        })
      };
    } else {
      const manifest = manifestCatalog[decision.manifestId];

      if (!manifest) {
        throw new Error(`AI selected unknown manifest "${decision.manifestId}" for binding ${binding.id}.`);
      }

      const readiness = nativeReadinessCatalog[manifest.id] || null;

      binding.solver = manifest.solver;
      binding.adapterType = manifest.adapterType;
      binding.configuration = {
        ...structuredClone(manifest.bindingTemplate.configuration),
        ...(manifestConfigurationOverrides[manifest.id] || {})
      };

      if (manifest.adapterType === "external_process_json") {
        binding.configuration.parameters = buildBindingParameterSeed({
          graph,
          componentId: binding.componentId,
          requiredParameters: binding.requiredParameters,
          overrides: bindingParameters[binding.id] || {}
        });
        binding.configuration.nativeReadiness = readiness?.status || "unknown";
      }
    }

    binding.status = "bound";
    binding.bindingMode = "ai_autobind";
    binding.boundAt = new Date().toISOString();
    binding.declaredCompatible = binding.compatibleSolvers.includes(binding.solver);
    binding.aiDecision = {
      decisionType: decision.decisionType,
      manifestId: decision.manifestId || null,
      reason: decision.reason
    };
    appliedBindings.push(binding);
  }

  return {
    solverBindings: graph.solverBindings,
    appliedBindings,
    planSummary: plan.summary,
    responseId: plan.responseId || null,
    model: plan.model || null,
    provider: plan.provider || null
  };
}

export function resolveAiProvider(provider) {
  return String(provider || "openai").trim().toLowerCase() || "openai";
}

export function resolveAiModel(provider, model) {
  const normalizedProvider = resolveAiProvider(provider);
  const rawModel = String(model || "").trim();

  if (!rawModel) {
    return normalizedProvider === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_OPENAI_MODEL;
  }

  const aliasKey = rawModel.toLowerCase();
  return MODEL_ALIASES[normalizedProvider]?.[aliasKey] || rawModel;
}

export function resolveAiBaseUrl(provider, baseUrl) {
  const normalizedProvider = resolveAiProvider(provider);
  const explicit = String(baseUrl || "").trim();

  if (explicit) {
    return explicit;
  }

  return normalizedProvider === "groq" ? GROQ_RESPONSES_URL : OPENAI_RESPONSES_URL;
}

function applyProviderRequestOptions(provider, requestBody) {
  if (provider === "groq") {
    return;
  }

  requestBody.store = false;
}

async function buildAiPromptContext({ project, compilation, strategy, instructions }) {
  const graph = compilation.graph;
  const manifestCatalog = getExternalSolverManifestCatalog();
  const builtinCatalog = getBuiltinSolverCatalog();
  const nativeReadinessCatalog = await getNativeSolverReadinessCatalog();

  return {
    strategy,
    instructions,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      dominantDomainId: graph.dominantDomainId,
      domainIds: graph.domainIds
    },
    bindings: graph.solverBindings.map((binding) => {
      const component = graph.components.find((entry) => entry.id === binding.componentId);
      const candidateManifestIds = DOMAIN_MANIFEST_IDS[binding.domainId] || [];

      return {
        bindingId: binding.id,
        domainId: binding.domainId,
        componentId: binding.componentId,
        componentName: component?.name || binding.componentId,
        compatibleBuiltinSolvers: binding.compatibleSolvers,
        compatibleBuiltinDetails: binding.compatibleSolvers.map((solverName) => ({
          solver: solverName,
          family: builtinCatalog[solverName]?.family || "unknown",
          sector: builtinCatalog[solverName]?.sector || "unknown"
        })),
        requiredParameters: binding.requiredParameters,
        candidateManifests: candidateManifestIds.map((manifestId) => ({
          manifestId,
          solver: manifestCatalog[manifestId]?.solver || manifestId,
          adapterType: manifestCatalog[manifestId]?.adapterType || "unknown",
          status: manifestCatalog[manifestId]?.status || "unknown",
          invocationMode: manifestCatalog[manifestId]?.invocationMode || "unknown",
          categories: manifestCatalog[manifestId]?.categories || [],
          nativeReadiness: nativeReadinessCatalog[manifestId]?.status || "unknown"
        }))
      };
    })
  };
}

function parsePlanPayload(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return JSON.parse(payload.output_text);
  }

  const outputText = payload.output
    ?.flatMap((item) => item.content || [])
    ?.find((content) => typeof content.text === "string")
    ?.text;

  if (outputText) {
    return JSON.parse(outputText);
  }

  throw new Error("OpenAI response did not include structured output text.");
}

function validatePlanDecisions(plan, bindingContexts) {
  const bindingIds = new Set(bindingContexts.map((binding) => binding.bindingId));
  const seenBindingIds = new Set();

  for (const decision of plan.decisions || []) {
    if (!bindingIds.has(decision.bindingId)) {
      throw new Error(`AI plan referenced unknown binding "${decision.bindingId}".`);
    }

    if (seenBindingIds.has(decision.bindingId)) {
      throw new Error(`AI plan duplicated binding "${decision.bindingId}".`);
    }

    seenBindingIds.add(decision.bindingId);
    const bindingContext = bindingContexts.find((binding) => binding.bindingId === decision.bindingId);

    if (decision.decisionType === "builtin_solver" && !bindingContext.compatibleBuiltinSolvers.includes(decision.solver)) {
      throw new Error(`AI plan selected unsupported builtin solver "${decision.solver}" for binding ${decision.bindingId}.`);
    }

    if (decision.decisionType !== "builtin_solver") {
      const candidateManifestIds = bindingContext.candidateManifests.map((manifest) => manifest.manifestId);

      if (!candidateManifestIds.includes(decision.manifestId)) {
        throw new Error(`AI plan selected unsupported manifest "${decision.manifestId}" for binding ${decision.bindingId}.`);
      }
    }
  }

  const missingBindings = [...bindingIds].filter((bindingId) => !seenBindingIds.has(bindingId));

  if (missingBindings.length) {
    throw new Error(`AI plan omitted bindings: ${missingBindings.join(", ")}.`);
  }
}
