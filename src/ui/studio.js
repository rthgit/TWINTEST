const STORAGE_KEY = "twintest.studio.state.v6";

const LOCALE_CATALOG = Object.freeze({
  en: {
    "page.title": "TwinTest Studio",
    "hero.eyebrow": "TwinTest Studio",
    "hero.title": "From raw idea to pilot-ready workbench.",
    "hero.text": "Insert one idea, constrain the first workflow, and let TwinTest produce the compiled graph, solver path, MVP blueprint, decision, and pilot workbench.",
    "locale.label": "Language",
    "locale.option.en": "English",
    "locale.option.it": "Italiano",
    "status.mode.label": "Mode",
    "status.mode.value": "Idea to Validation",
    "status.runtime.label": "Runtime",
    "flow.access.kicker": "1. Access",
    "flow.access.title": "Open a human session first",
    "flow.access.text": "Use email and password for day-to-day Studio work. Keep API keys only as fallback for technical flows.",
    "flow.workspace.kicker": "2. Workspace",
    "flow.workspace.title": "Create a workspace only when needed",
    "flow.workspace.text": "If you already have a workspace, just sync it. Use the commercial form only when spinning up a new customer environment.",
    "flow.validation.kicker": "3. Validation",
    "flow.validation.title": "Bootstrap only compile-ready domains",
    "flow.validation.text": "The chips below are only the domains TwinTest can compile directly today. Wider sector coverage is shown in the platform panel.",
    "access.kicker": "Access",
    "access.title": "Login, session, technical fallback",
    "access.helper": "TwinTest prefers a bearer session for human operators. The workspace API key remains available for server-to-server and technical fallback flows.",
    "auth.human.kicker": "Recommended",
    "auth.human.title": "Human session",
    "auth.human.helper": "Use this for normal Studio work, reviews and pilot decisions.",
    "auth.technical.kicker": "Fallback",
    "auth.technical.title": "Technical access",
    "auth.technical.helper": "Keep this for server-to-server calls, admin recovery and workspace sync.",
    "launch.kicker": "Workspace setup",
    "launch.title": "Create a workspace and owner session",
    "launch.helper": "Use this only when you need a new customer workspace. If the workspace already exists, keep the current page on access sync and bootstrap.",
    "intake.kicker": "Intake",
    "intake.title": "Bootstrap a testable MVP",
    "intake.helper": "Intake uses the active bearer session when available. If no human session is active, Studio falls back to the technical API key configured above.",
    "intake.domainHelper": "Only compile-ready domains are selectable here. Full platform coverage appears in the panel on the right.",
    "guides.kicker": "Domain guides",
    "guides.title": "Choose the right wedge",
    "coverage.kicker": "Platform coverage",
    "coverage.title": "Sectors, executable domains, categories",
    "coverage.helper": "The bootstrap chips show only domains TwinTest can compile directly today. The coverage below shows the wider platform footprint.",
    "workspace.kicker": "Workspace",
    "workspace.title": "Workspace control",
    "project.kicker": "Project",
    "project.title": "Compilation snapshot",
    "blueprint.kicker": "Blueprint",
    "blueprint.title": "MVP framing",
    "decision.kicker": "Decision",
    "decision.title": "Pilot recommendation",
    "workbench.kicker": "Workbench",
    "workbench.title": "Backlog, checklist, execution board",
    "run.kicker": "Run & report",
    "run.title": "Live execution status",
    "field.workspace": "Workspace",
    "field.technicalApiKey": "Technical API key",
    "field.email": "Email",
    "field.displayName": "Display name",
    "field.password": "Password",
    "field.masterApiKey": "Master API key",
    "field.plan": "Plan",
    "field.workspaceName": "Workspace name",
    "field.workspaceId": "Workspace ID",
    "field.ownerEmail": "Owner email",
    "field.ownerDisplayName": "Owner display name",
    "field.ownerPassword": "Owner password",
    "field.projectNameOptional": "Project name (optional)",
    "field.systemNameOptional": "System name (optional)",
    "field.idea": "Idea",
    "field.targetUser": "Target user",
    "field.desiredOutcome": "Desired outcome",
    "field.constraints": "Constraints",
    "field.autobind": "Autobind",
    "field.runLabel": "Run label",
    "field.targetDomains": "Target domains",
    "field.queueRun": "Queue a baseline run immediately when the project is executable",
    "placeholder.projectName": "TwinTest will infer one if omitted.",
    "placeholder.systemName": "Label for the compiled graph.",
    "option.autobind.builtin": "builtin",
    "option.autobind.ai": "ai",
    "option.autobind.none": "none",
    "button.registerUser": "Register user",
    "button.login": "Login",
    "button.syncAccess": "Sync access",
    "button.logout": "Logout",
    "button.createWorkspace": "Create workspace & owner",
    "button.refreshWorkspace": "Refresh workspace",
    "button.bootstrapMvp": "Bootstrap MVP",
    "button.refreshDecision": "Refresh decision",
    "button.refreshWorkbench": "Refresh workbench",
    "button.pollRun": "Poll run",
    "runtime.loading": "Loading kernel summary...",
    "runtime.unavailable": "Kernel summary unavailable",
    "runtime.summary": ({ domains, sectors, categories, plans }) => `${domains} executable domains, ${sectors} sectors, ${categories} categories, ${plans} plans`,
    "empty.workspace": "Refresh access or launch a workspace to inspect plan, billing, usage and members.",
    "empty.project": "Bootstrap an idea to see the project and graph summary.",
    "empty.blueprint": "The MVP blueprint will appear here.",
    "empty.decision": "The MVP decision will appear here after bootstrap.",
    "empty.workbench": "The pilot workbench will appear here after bootstrap.",
    "empty.run": "When a baseline run exists, its state and report summary will appear here.",
    "feedback.ready": "TwinTest Studio is ready.",
    "feedback.loadingKernel": "Loading TwinTest kernel summary...",
    "feedback.summaryUnavailable": "Could not load TwinTest summary."
  },
  it: {
    "page.title": "TwinTest Studio",
    "hero.eyebrow": "TwinTest Studio",
    "hero.title": "Dall'idea grezza al workbench pronto per il pilot.",
    "hero.text": "Inserisci una sola idea, vincola il primo workflow e lascia che TwinTest produca il grafo compilato, il percorso solver, l'MVP blueprint, la decisione e il pilot workbench.",
    "locale.label": "Lingua",
    "locale.option.en": "English",
    "locale.option.it": "Italiano",
    "status.mode.label": "Modalita",
    "status.mode.value": "Idea in validazione",
    "status.runtime.label": "Runtime",
    "flow.access.kicker": "1. Accesso",
    "flow.access.title": "Apri prima una sessione umana",
    "flow.access.text": "Usa email e password per il lavoro quotidiano in Studio. Tieni le API key solo come fallback tecnico.",
    "flow.workspace.kicker": "2. Workspace",
    "flow.workspace.title": "Crea un workspace solo quando serve",
    "flow.workspace.text": "Se hai gia un workspace, sincronizzalo e basta. Usa il form commerciale solo quando devi aprire un nuovo ambiente cliente.",
    "flow.validation.kicker": "3. Validazione",
    "flow.validation.title": "Bootstrap solo dei domini compilabili",
    "flow.validation.text": "I chip sotto mostrano solo i domini che TwinTest puo compilare direttamente oggi. La copertura piu ampia della piattaforma e visibile nel pannello dedicato.",
    "access.kicker": "Accesso",
    "access.title": "Login, sessione e fallback tecnico",
    "access.helper": "TwinTest preferisce una bearer session per gli operatori umani. La API key del workspace resta disponibile per flussi server-to-server e fallback tecnico.",
    "auth.human.kicker": "Consigliato",
    "auth.human.title": "Sessione umana",
    "auth.human.helper": "Usa questo percorso per il lavoro normale in Studio, le review e le decisioni pilot.",
    "auth.technical.kicker": "Fallback",
    "auth.technical.title": "Accesso tecnico",
    "auth.technical.helper": "Tieni questo blocco per chiamate server-to-server, recovery admin e sync del workspace.",
    "launch.kicker": "Setup workspace",
    "launch.title": "Crea un workspace e una sessione owner",
    "launch.helper": "Usa questo blocco solo quando devi creare un nuovo workspace cliente. Se il workspace esiste gia, resta sul sync accesso e bootstrap.",
    "intake.kicker": "Intake",
    "intake.title": "Bootstrap di un MVP testabile",
    "intake.helper": "L'intake usa la bearer session attiva quando disponibile. Se non c'e una sessione umana attiva, Studio usa la API key tecnica configurata sopra.",
    "intake.domainHelper": "Qui puoi selezionare solo i domini gia compilabili. La copertura completa della piattaforma e mostrata nel pannello a destra.",
    "guides.kicker": "Guide di dominio",
    "guides.title": "Scegli il wedge giusto",
    "coverage.kicker": "Copertura piattaforma",
    "coverage.title": "Settori, domini eseguibili, categorie",
    "coverage.helper": "I chip del bootstrap mostrano solo i domini che TwinTest puo compilare direttamente oggi. Sotto vedi la copertura piu ampia della piattaforma.",
    "workspace.kicker": "Workspace",
    "workspace.title": "Controllo workspace",
    "project.kicker": "Progetto",
    "project.title": "Snapshot di compilazione",
    "blueprint.kicker": "Blueprint",
    "blueprint.title": "Inquadramento MVP",
    "decision.kicker": "Decisione",
    "decision.title": "Raccomandazione pilot",
    "workbench.kicker": "Workbench",
    "workbench.title": "Backlog, checklist e execution board",
    "run.kicker": "Run e report",
    "run.title": "Stato esecuzione live",
    "field.workspace": "Workspace",
    "field.technicalApiKey": "API key tecnica",
    "field.email": "Email",
    "field.displayName": "Nome visualizzato",
    "field.password": "Password",
    "field.masterApiKey": "Master API key",
    "field.plan": "Piano",
    "field.workspaceName": "Nome workspace",
    "field.workspaceId": "ID workspace",
    "field.ownerEmail": "Email owner",
    "field.ownerDisplayName": "Nome owner",
    "field.ownerPassword": "Password owner",
    "field.projectNameOptional": "Nome progetto (opzionale)",
    "field.systemNameOptional": "Nome sistema (opzionale)",
    "field.idea": "Idea",
    "field.targetUser": "Utente target",
    "field.desiredOutcome": "Outcome desiderato",
    "field.constraints": "Vincoli",
    "field.autobind": "Autobind",
    "field.runLabel": "Etichetta run",
    "field.targetDomains": "Domini target",
    "field.queueRun": "Accoda subito un run baseline quando il progetto e eseguibile",
    "placeholder.projectName": "TwinTest lo inferira se lasciato vuoto.",
    "placeholder.systemName": "Etichetta per il grafo compilato.",
    "option.autobind.builtin": "interno",
    "option.autobind.ai": "ai",
    "option.autobind.none": "nessuno",
    "button.registerUser": "Registra utente",
    "button.login": "Login",
    "button.syncAccess": "Sincronizza accesso",
    "button.logout": "Logout",
    "button.createWorkspace": "Crea workspace e owner",
    "button.refreshWorkspace": "Aggiorna workspace",
    "button.bootstrapMvp": "Bootstrap MVP",
    "button.refreshDecision": "Aggiorna decisione",
    "button.refreshWorkbench": "Aggiorna workbench",
    "button.pollRun": "Interroga run",
    "runtime.loading": "Caricamento riepilogo kernel...",
    "runtime.unavailable": "Riepilogo kernel non disponibile",
    "runtime.summary": ({ domains, sectors, categories, plans }) => `${domains} domini eseguibili, ${sectors} settori, ${categories} categorie, ${plans} piani`,
    "empty.workspace": "Aggiorna l'accesso o crea un workspace per ispezionare piano, billing, uso e membri.",
    "empty.project": "Fai bootstrap di un'idea per vedere progetto e riepilogo del grafo.",
    "empty.blueprint": "L'MVP blueprint apparira qui.",
    "empty.decision": "La decisione MVP apparira qui dopo il bootstrap.",
    "empty.workbench": "Il pilot workbench apparira qui dopo il bootstrap.",
    "empty.run": "Quando esiste un baseline run, qui appariranno stato e riepilogo del report.",
    "feedback.ready": "TwinTest Studio e pronto.",
    "feedback.loadingKernel": "Caricamento riepilogo kernel TwinTest...",
    "feedback.summaryUnavailable": "Impossibile caricare il riepilogo TwinTest."
  }
});

const DOMAIN_LABELS = Object.freeze({
  it: {
    general_systems: "Sistemi MVP generali",
    compute_semiconductor: "Compute / Sistemi a semiconduttore",
    mechatronics: "Sistemi meccatronici",
    fluidic_energy: "Sistemi fluidici ed energetici",
    vehicle_systems: "Sistemi veicolari",
    materials_chemistry: "Materiali e sistemi chimici",
    cosmetic_science: "Scienza cosmetica e personal care",
    space_cosmology: "Spazio e cosmologia"
  }
});

const GUIDE_COPY = Object.freeze({
  it: {
    general_systems: {
      coreValue: "trasforma un'idea grezza in un workflow misurabile con segnali visibili di uso, latenza e conformita",
      evidenceNeeds: ["una persona target chiarissima", "una metrica outcome per il workflow core", "un'aspettativa base di SLA o tempo di risposta"]
    },
    compute_semiconductor: {
      coreValue: "dimostra che l'architettura rispetta i guardrail di performance e osservabilita prima di investire in implementazione costosa",
      evidenceNeeds: ["mix di workload target", "budget di latenza e potenza", "bundle di trace telemetriche o benchmark"]
    },
    mechatronics: {
      coreValue: "riduci il rischio del primo comportamento macchina controllabile prima di costruire una grande superficie software",
      evidenceNeeds: ["target di attuazione", "soglie di trip di sicurezza", "limiti termici e vibrazionali"]
    },
    fluidic_energy: {
      coreValue: "mostra che il loop fluido/energia resta stabile prima di espandere controlli custom e dashboard",
      evidenceNeeds: ["target di portata", "limite di pressione", "inviluppo termico"]
    },
    vehicle_systems: {
      coreValue: "prova che un sottosistema puo soddisfare obiettivi di autonomia, frenata o failover prima di scalare l'integrazione",
      evidenceNeeds: ["target di autonomia o coppia", "aspettativa di risposta frenante", "limiti di inviluppo termico"]
    },
    materials_chemistry: {
      coreValue: "capisci se lo stack di chimica o materiali e valido prima di investire pesantemente in laboratorio o pilot",
      evidenceNeeds: ["target di reazione", "target di trasporto o ritenzione", "vincoli di viscosita o reologia"]
    },
    cosmetic_science: {
      coreValue: "trasforma un concept cosmetico in un MVP di formulazione governato con gate chiari di sicurezza e qualita",
      evidenceNeeds: ["uso previsto e livello di esposizione", "target di shelf-life", "evidenza di challenge test"]
    },
    space_cosmology: {
      coreValue: "dimostra che la catena osservazione-inferenza e coerente prima di scalare il prodotto scientifico",
      evidenceNeeds: ["target di qualita osservativa", "vincoli di geometria di missione", "soglia di qualita del fit"]
    }
  }
});

const elements = {
  localePicker: document.getElementById("localePicker"),
  sessionForm: document.getElementById("sessionForm"),
  workspaceLaunchForm: document.getElementById("workspaceLaunchForm"),
  bootstrapForm: document.getElementById("bootstrapForm"),
  apiKey: document.getElementById("apiKey"),
  workspaceId: document.getElementById("workspaceId"),
  sessionEmail: document.getElementById("sessionEmail"),
  sessionDisplayName: document.getElementById("sessionDisplayName"),
  sessionPassword: document.getElementById("sessionPassword"),
  registerUserButton: document.getElementById("registerUserButton"),
  refreshSessionButton: document.getElementById("refreshSessionButton"),
  logoutButton: document.getElementById("logoutButton"),
  accessGuide: document.getElementById("accessGuide"),
  authSummary: document.getElementById("authSummary"),
  masterApiKey: document.getElementById("masterApiKey"),
  launchWorkspaceName: document.getElementById("launchWorkspaceName"),
  launchWorkspaceId: document.getElementById("launchWorkspaceId"),
  launchPlanId: document.getElementById("launchPlanId"),
  ownerEmail: document.getElementById("ownerEmail"),
  ownerDisplayName: document.getElementById("ownerDisplayName"),
  ownerPassword: document.getElementById("ownerPassword"),
  refreshWorkspaceButton: document.getElementById("refreshWorkspaceButton"),
  commerceGuide: document.getElementById("commerceGuide"),
  projectName: document.getElementById("projectName"),
  systemName: document.getElementById("systemName"),
  idea: document.getElementById("idea"),
  targetUser: document.getElementById("targetUser"),
  desiredOutcome: document.getElementById("desiredOutcome"),
  constraints: document.getElementById("constraints"),
  autobind: document.getElementById("autobind"),
  runLabel: document.getElementById("runLabel"),
  queueRun: document.getElementById("queueRun"),
  domainPicker: document.getElementById("domainPicker"),
  guideRail: document.getElementById("guideRail"),
  coverageExplorer: document.getElementById("coverageExplorer"),
  runtimeSummary: document.getElementById("runtimeSummary"),
  feedbackBar: document.getElementById("feedbackBar"),
  workspaceSummary: document.getElementById("workspaceSummary"),
  projectSummary: document.getElementById("projectSummary"),
  blueprintSummary: document.getElementById("blueprintSummary"),
  decisionSummary: document.getElementById("decisionSummary"),
  workbenchSummary: document.getElementById("workbenchSummary"),
  runSummary: document.getElementById("runSummary"),
  refreshDecisionButton: document.getElementById("refreshDecisionButton"),
  refreshWorkbenchButton: document.getElementById("refreshWorkbenchButton"),
  pollRunButton: document.getElementById("pollRunButton")
};

const persistedState = loadPersistedState();

const state = {
  locale: resolveInitialLocale(persistedState.locale),
  supportedDomains: [],
  solverSectors: [],
  commercePlans: [],
  ideaDomainGuides: {},
  selectedDomainIds: persistedState.selectedDomainIds?.length ? persistedState.selectedDomainIds : ["general_systems"],
  currentProject: null,
  currentRun: null,
  currentReport: null,
  lastBootstrapPayload: null,
  sessionToken: persistedState.sessionToken || "",
  auth: null,
  workspaceSnapshot: null
};

restorePersistedInputs(persistedState);
elements.localePicker.value = state.locale;

elements.localePicker.addEventListener("change", handleLocaleChange);
elements.sessionForm.addEventListener("submit", handleLoginSubmit);
elements.workspaceLaunchForm.addEventListener("submit", handleLaunchWorkspace);
elements.bootstrapForm.addEventListener("submit", handleBootstrapSubmit);
elements.registerUserButton.addEventListener("click", handleRegisterUser);
elements.refreshSessionButton.addEventListener("click", () => refreshAccessState());
elements.logoutButton.addEventListener("click", handleLogout);
elements.refreshWorkspaceButton.addEventListener("click", () => refreshWorkspaceSnapshot());
elements.refreshDecisionButton.addEventListener("click", handleRefreshDecision);
elements.refreshWorkbenchButton.addEventListener("click", handleRefreshWorkbench);
elements.pollRunButton.addEventListener("click", handlePollRun);
elements.domainPicker.addEventListener("change", handleDomainSelectionChange);

for (const input of document.querySelectorAll("input, textarea, select")) {
  input.addEventListener("input", persistStudioState);
  input.addEventListener("change", persistStudioState);
}

applyLocale({ preserveFeedback: false });
await initializeStudio();

function handleLocaleChange(event) {
  state.locale = event.target.value === "it" ? "it" : "en";
  persistStudioState();
  applyLocale({ preserveFeedback: false });
}

function applyLocale({ preserveFeedback = true } = {}) {
  document.documentElement.lang = state.locale;
  document.title = t("page.title");

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }

  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  }

  elements.runtimeSummary.textContent = state.supportedDomains.length
    ? t("runtime.summary", {
      domains: state.supportedDomains.length,
      sectors: state.solverSectors.length,
      categories: state.solverCategoryCount || 0,
      plans: state.commercePlans.length
    })
    : t("runtime.loading");

  renderPlanPicker();
  renderAccessGuide();
  renderDomainPicker();
  renderGuideRail();
  renderCoverageExplorer();
  renderAuthSummary();
  renderCommerceGuide();
  renderWorkspaceSummary();

  if (state.lastBootstrapPayload) {
    renderBootstrapResult(state.lastBootstrapPayload);
  }

  if (!preserveFeedback) {
    setFeedback(t("feedback.ready"));
  }
}

async function initializeStudio() {
  setFeedback(t("feedback.loadingKernel"));

  try {
    const payload = await fetchJson("/");
    state.supportedDomains = payload.supportedDomains || [];
    state.solverSectors = Object.values(payload.solverSectorCatalog || {});
    state.solverCategoryCount = payload.solverCategoryCount || 0;
    state.commercePlans = payload.commercePlans || [];
    state.ideaDomainGuides = payload.ideaDomainGuides || {};
    elements.runtimeSummary.textContent = t("runtime.summary", {
      domains: payload.supportedDomains.length,
      sectors: state.solverSectors.length,
      categories: payload.solverCategoryCount,
      plans: state.commercePlans.length
    });
    renderPlanPicker();
    renderAccessGuide();
    renderDomainPicker();
    renderGuideRail();
    renderCoverageExplorer();
    await refreshAccessState({ silent: true });
    await refreshWorkspaceSnapshot({ silent: true });
    updateActionState();
    setFeedback(t("feedback.ready"));
  } catch (error) {
    elements.runtimeSummary.textContent = t("runtime.unavailable");
    renderAccessGuide();
    renderCoverageExplorer();
    renderAuthSummary();
    renderCommerceGuide();
    renderWorkspaceSummary();
    updateActionState();
    setFeedback(error.message || t("feedback.summaryUnavailable"), true);
  }
}

async function handleRegisterUser() {
  const email = elements.sessionEmail.value.trim();
  const password = elements.sessionPassword.value;
  const displayName = elements.sessionDisplayName.value.trim();

  if (!email || !password) {
    setFeedback("Email and password are required to register a user.", true);
    return;
  }

  setFeedback("Registering application user...");

  try {
    const payload = await fetchJson("/auth/users/register", {
      method: "POST",
      body: {
        email,
        displayName,
        password
      }
    });

    syncOwnerIdentityFields({
      email,
      displayName,
      password
    });
    persistStudioState();
    setFeedback(`User ${payload.user.email} registered. Add workspace membership or login into an existing workspace.`);
  } catch (error) {
    setFeedback(error.message || "Could not register the user.", true);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const workspaceId = elements.workspaceId.value.trim();
  const email = elements.sessionEmail.value.trim();
  const password = elements.sessionPassword.value;

  if (!workspaceId || !email || !password) {
    setFeedback("Workspace, email and password are required to login.", true);
    return;
  }

  setFeedback(`Opening user session for ${workspaceId}...`);

  try {
    const payload = await fetchJson("/auth/login", {
      method: "POST",
      body: {
        workspaceId,
        email,
        password
      }
    });

    state.sessionToken = payload.sessionToken;
    state.auth = {
      authMode: "user_session",
      workspaceId: payload.session.workspaceId,
      role: payload.session.role,
      session: payload.session
    };
    persistStudioState();
    await refreshAccessState({ silent: true });
    await refreshWorkspaceSnapshot({ silent: true });
    updateActionState();
    setFeedback(`Bearer session ready for ${payload.session.user.email} in workspace ${payload.session.workspaceId}.`);
  } catch (error) {
    setFeedback(error.message || "Login failed.", true);
  }
}

async function handleLogout() {
  setFeedback("Closing current session...");

  try {
    if (state.sessionToken) {
      await fetchJson("/auth/logout", {
        method: "POST",
        headers: buildHeaders()
      });
    }
  } catch (error) {
    // Clear the client-side token even if the server-side session is already gone.
  } finally {
    clearUserSessionState();
    persistStudioState();
    await refreshAccessState({ silent: true });
    await refreshWorkspaceSnapshot({ silent: true });
    updateActionState();
    setFeedback("User session closed. Studio is back on technical access mode.");
  }
}

async function handleLaunchWorkspace(event) {
  event.preventDefault();

  const name = elements.launchWorkspaceName.value.trim();
  const preferredWorkspaceId = elements.launchWorkspaceId.value.trim();
  const planId = elements.launchPlanId.value || state.commercePlans[0]?.id || "starter";
  const ownerEmail = elements.ownerEmail.value.trim();
  const ownerDisplayName = elements.ownerDisplayName.value.trim();
  const ownerPassword = elements.ownerPassword.value;

  if (!name || !ownerEmail || !ownerPassword) {
    setFeedback("Workspace name, owner email and owner password are required.", true);
    return;
  }

  setFeedback("Creating workspace, owner identity and session...");

  try {
    const workspacePayload = await fetchJson("/workspaces", {
      method: "POST",
      headers: buildHeaders({
        authMode: "master"
      }),
      body: {
        name,
        workspaceId: preferredWorkspaceId,
        planId
      }
    });

    const workspaceId = workspacePayload.workspace.id;

    await ensureWorkspaceOwnerIdentity({
      workspaceId,
      bootstrapApiKey: workspacePayload.bootstrapApiClient.apiKey,
      email: ownerEmail,
      displayName: ownerDisplayName,
      password: ownerPassword
    });

    elements.workspaceId.value = workspaceId;
    elements.apiKey.value = workspacePayload.bootstrapApiClient.apiKey;
    elements.sessionEmail.value = ownerEmail;
    elements.sessionDisplayName.value = ownerDisplayName;
    syncOwnerIdentityFields({
      email: ownerEmail,
      displayName: ownerDisplayName,
      password: ownerPassword
    });

    const loginPayload = await fetchJson("/auth/login", {
      method: "POST",
      body: {
        workspaceId,
        email: ownerEmail,
        password: ownerPassword
      }
    });

    state.sessionToken = loginPayload.sessionToken;
    state.auth = {
      authMode: "user_session",
      workspaceId: loginPayload.session.workspaceId,
      role: loginPayload.session.role,
      session: loginPayload.session
    };
    persistStudioState();
    await refreshAccessState({ silent: true });
    await refreshWorkspaceSnapshot({ silent: true });
    updateActionState();
    setFeedback(`Workspace ${workspaceId} is live on plan ${workspacePayload.workspace.planId}. Owner session is ready.`);
  } catch (error) {
    setFeedback(error.message || "Workspace launch failed.", true);
  }
}

async function handleBootstrapSubmit(event) {
  event.preventDefault();

  const payload = {
    idea: elements.idea.value.trim(),
    name: elements.projectName.value.trim(),
    systemName: elements.systemName.value.trim(),
    targetUser: elements.targetUser.value.trim(),
    desiredOutcome: elements.desiredOutcome.value.trim(),
    constraints: splitLines(elements.constraints.value),
    targetDomains: getSelectedDomains(),
    autobind: elements.autobind.value,
    queueRun: elements.queueRun.checked,
    runLabel: elements.runLabel.value.trim()
  };

  setFeedback("Bootstrapping MVP...");

  try {
    const result = await fetchJson("/ideas/bootstrap", {
      method: "POST",
      headers: buildHeaders(),
      body: payload
    });

    state.lastBootstrapPayload = result;
    state.currentProject = result.project;
    state.currentRun = result.run || null;
    state.currentReport = null;
    renderBootstrapResult(result);
    updateActionState();
    persistStudioState();
    setFeedback(`Project ${result.project.name} bootstrapped successfully.`);

    if (result.run) {
      await refreshRunArtifacts();
    }
  } catch (error) {
    setFeedback(error.message || "Bootstrap failed.", true);
  }
}

async function handleRefreshDecision() {
  if (!state.currentProject) {
    return;
  }

  setFeedback("Refreshing MVP decision...");

  try {
    const result = await fetchJson(`/projects/${encodeURIComponent(state.currentProject.id)}/mvp-decision`, {
      method: "POST",
      headers: buildHeaders(),
      body: {
        runId: state.currentRun?.id || ""
      }
    });

    state.currentProject = result.project;
    renderDecision(result.mvpDecision);
    renderWorkbench(result.pilotWorkbench);
    updateActionState();
    setFeedback("MVP decision refreshed.");
  } catch (error) {
    setFeedback(error.message || "Decision refresh failed.", true);
  }
}

async function handleRefreshWorkbench() {
  if (!state.currentProject) {
    return;
  }

  setFeedback("Refreshing pilot workbench...");

  try {
    const result = await fetchJson(`/projects/${encodeURIComponent(state.currentProject.id)}/pilot-workbench`, {
      method: "POST",
      headers: buildHeaders(),
      body: {
        runId: state.currentRun?.id || ""
      }
    });

    state.currentProject = result.project;
    renderWorkbench(result.pilotWorkbench);
    updateActionState();
    setFeedback("Pilot workbench refreshed.");
  } catch (error) {
    setFeedback(error.message || "Workbench refresh failed.", true);
  }
}

async function handlePollRun() {
  if (!state.currentRun?.id) {
    return;
  }

  setFeedback(`Polling run ${state.currentRun.id}...`);
  await refreshRunArtifacts();
}

function handleDomainSelectionChange() {
  state.selectedDomainIds = getSelectedDomains();
  persistStudioState();
}

async function refreshAccessState({ silent = false, allowFallback = true } = {}) {
  const hasSession = Boolean(state.sessionToken);
  const hasApiKey = Boolean(elements.apiKey.value.trim());

  if (!hasSession && !hasApiKey) {
    state.auth = null;
    renderAccessGuide();
    renderAuthSummary();
    updateActionState();
    return;
  }

  try {
    const payload = await fetchJson("/auth/session", {
      headers: buildHeaders({
        includeJson: false
      })
    });

    state.auth = payload.auth;
    renderAccessGuide();
    renderAuthSummary();
    updateActionState();

    if (!silent) {
      setFeedback(`${formatAuthMode(payload.auth.authMode)} ready for workspace ${payload.auth.workspaceId}.`);
    }
  } catch (error) {
    if (hasSession && allowFallback) {
      clearUserSessionState();
      persistStudioState();
      await refreshAccessState({
        silent,
        allowFallback: false
      });
      return;
    }

    state.auth = null;
    renderAccessGuide();
    renderAuthSummary();
    updateActionState();

    if (!silent) {
      setFeedback(error.message || "Could not sync access.", true);
    }
  }
}

async function refreshWorkspaceSnapshot({ silent = false } = {}) {
  const workspaceId = elements.workspaceId.value.trim();

  if (!workspaceId) {
    state.workspaceSnapshot = null;
    renderCommerceGuide();
    renderWorkspaceSummary();
    updateActionState();
    return;
  }

  try {
    const workspacePayload = await fetchJson(`/workspaces/${encodeURIComponent(workspaceId)}`, {
      headers: buildHeaders({
        includeJson: false
      })
    });

    const [billingPayload, usagePayload, membersPayload] = await Promise.all([
      fetchJsonOptional(`/workspaces/${encodeURIComponent(workspaceId)}/billing`, {
        headers: buildHeaders({
          includeJson: false
        }),
        allowedStatus: [403]
      }),
      fetchJsonOptional(`/workspaces/${encodeURIComponent(workspaceId)}/usage`, {
        headers: buildHeaders({
          includeJson: false
        }),
        allowedStatus: [403]
      }),
      fetchJsonOptional(`/workspaces/${encodeURIComponent(workspaceId)}/members`, {
        headers: buildHeaders({
          includeJson: false
        }),
        allowedStatus: [403]
      })
    ]);

    state.workspaceSnapshot = {
      workspace: workspacePayload.workspace,
      billing: billingPayload?.billing || null,
      usage: usagePayload?.usage || null,
      members: membersPayload?.members || null
    };
    renderCommerceGuide();
    renderWorkspaceSummary();
    updateActionState();

    if (!silent) {
      setFeedback(`Workspace ${workspaceId} snapshot refreshed.`);
    }
  } catch (error) {
    state.workspaceSnapshot = null;
    renderCommerceGuide();
    renderWorkspaceSummary();
    updateActionState();

    if (!silent) {
      setFeedback(error.message || "Could not refresh workspace.", true);
    }
  }
}

async function refreshRunArtifacts() {
  if (!state.currentRun?.id) {
    return;
  }

  try {
    const runPayload = await fetchJson(`/runs/${encodeURIComponent(state.currentRun.id)}`, {
      headers: buildHeaders({
        includeJson: false
      })
    });

    state.currentRun = runPayload.run;
    let report = null;

    if (state.currentRun.status === "completed") {
      report = await fetchJsonOptional(`/runs/${encodeURIComponent(state.currentRun.id)}/report`, {
        headers: buildHeaders({
          includeJson: false
        }),
        allowedStatus: [404]
      });
    }

    state.currentReport = report;
    renderRun(state.currentRun, report);
    updateActionState();
    setFeedback(`Run ${state.currentRun.id} is ${state.currentRun.status}.`);
  } catch (error) {
    setFeedback(error.message || "Could not poll run.", true);
  }
}

async function ensureWorkspaceOwnerIdentity({ workspaceId, bootstrapApiKey, email, displayName, password }) {
  try {
    await fetchJson("/auth/users/register", {
      method: "POST",
      body: {
        email,
        displayName,
        password
      }
    });
  } catch (error) {
    if (!String(error.message || "").includes("User already exists")) {
      throw error;
    }
  }

  try {
    await fetchJson(`/workspaces/${encodeURIComponent(workspaceId)}/members`, {
      method: "POST",
      headers: buildHeaders({
        apiKey: bootstrapApiKey,
        workspaceId
      }),
      body: {
        email,
        displayName,
        role: "owner"
      }
    });
  } catch (error) {
    if (!String(error.message || "").includes("already a member")) {
      throw error;
    }
  }
}

function renderAccessGuide() {
  if (!elements.accessGuide) {
    return;
  }

  if (state.auth?.authMode === "user_session") {
    elements.accessGuide.innerHTML = `
      <strong>${escapeHtml(state.locale === "it" ? "Percorso consigliato attivo" : "Recommended path active")}</strong>
      <p>${escapeHtml(state.locale === "it"
        ? "Stai lavorando con una sessione umana. Studio usera prima il bearer token per bootstrap, review e letture workspace."
        : "You are working with a human session. Studio will use the bearer token first for bootstrap, reviews and workspace reads.")}</p>
    `;
    return;
  }

  if (state.auth) {
    elements.accessGuide.innerHTML = `
      <strong>${escapeHtml(state.locale === "it" ? "Sei in modalita tecnica" : "You are in technical mode")}</strong>
      <p>${escapeHtml(state.locale === "it"
        ? "Il workspace e raggiungibile via API key. Va bene per sync e fallback, ma per uso quotidiano la UI e piu chiara con login utente."
        : "The workspace is reachable through an API key. This is fine for sync and fallback, but the UI is clearer for day-to-day work when you log in as a user.")}</p>
    `;
    return;
  }

  elements.accessGuide.innerHTML = `
    <strong>${escapeHtml(state.locale === "it" ? "Prima azione consigliata" : "Recommended first action")}</strong>
    <p>${escapeHtml(state.locale === "it"
      ? "Fai login con un owner o operator del workspace. Tieni API key e master key solo come fallback tecnico."
      : "Log in with a workspace owner or operator first. Keep the API key and master key only as technical fallback.")}</p>
  `;
}

function renderCommerceGuide() {
  if (!elements.commerceGuide) {
    return;
  }

  if (state.workspaceSnapshot?.workspace) {
    const workspace = state.workspaceSnapshot.workspace;
    const plan = getPlanById(workspace.planId);
    elements.commerceGuide.innerHTML = `
      <strong>${escapeHtml(state.locale === "it" ? "Workspace corrente" : "Current workspace")}</strong>
      <p>${escapeHtml(state.locale === "it"
        ? `${workspace.name} e gia attivo${plan ? ` sul piano ${plan.label}` : ""}. Usa questo blocco solo se devi creare un nuovo ambiente cliente.`
        : `${workspace.name} is already active${plan ? ` on the ${plan.label} plan` : ""}. Use this block only when you need to create a new customer environment.`)}</p>
    `;
    return;
  }

  elements.commerceGuide.innerHTML = `
    <strong>${escapeHtml(state.locale === "it" ? "Quando usare questo form" : "When to use this form")}</strong>
    <p>${escapeHtml(state.locale === "it"
      ? "Apri un nuovo workspace solo per un nuovo cliente, team o ambiente. Se il workspace esiste gia, sincronizzalo dal blocco Accesso e continua con il bootstrap."
      : "Create a new workspace only for a new customer, team or environment. If the workspace already exists, sync it from the Access block and continue with bootstrap.")}</p>
  `;
}

function renderCoverageExplorer() {
  if (!elements.coverageExplorer) {
    return;
  }

  const supportedDomains = [...state.supportedDomains];
  const sectors = [...state.solverSectors].sort((left, right) => left.label.localeCompare(right.label));

  if (!supportedDomains.length && !sectors.length) {
    elements.coverageExplorer.innerHTML = `<div class="empty-state">${escapeHtml(state.locale === "it"
      ? "La copertura piattaforma apparira dopo il caricamento del kernel."
      : "Platform coverage will appear after the kernel loads.")}</div>`;
    return;
  }

  const executableLabel = state.locale === "it" ? "Domini eseguibili" : "Executable domains";
  const sectorsLabel = state.locale === "it" ? "Settori piattaforma" : "Platform sectors";
  const categoriesLabel = state.locale === "it" ? "Categorie solver" : "Solver categories";
  const supportedChips = supportedDomains
    .map((domain) => `<span class="coverage-chip">${escapeHtml(resolveDomainLabel(domain.id, domain.label))}</span>`)
    .join("");
  const sectorCards = sectors
    .map((sector) => `
      <article class="sector-card">
        <div class="sector-card-head">
          <h3>${escapeHtml(sector.label)}</h3>
          <span class="status-badge ${statusClass(sector.status)}">${escapeHtml(formatSectorStatus(sector.status))}</span>
        </div>
        <p>${escapeHtml(sector.description || "")}</p>
        <div class="metric-row">
          ${metricPill(`${sector.categoryIds?.length || 0} ${state.locale === "it" ? "categorie" : "categories"}`)}
          ${metricPill(`${sector.builtinSolvers?.length || 0} ${state.locale === "it" ? "solver interni" : "builtin solvers"}`)}
          ${metricPill(`${sector.focusAreas?.length || 0} ${state.locale === "it" ? "focus" : "focus areas"}`)}
        </div>
      </article>
    `)
    .join("");

  elements.coverageExplorer.innerHTML = `
    <div class="coverage-stats">
      <article class="packet-card">
        <h3>${escapeHtml(executableLabel)}</h3>
        <p>${escapeHtml(String(supportedDomains.length))}</p>
      </article>
      <article class="packet-card">
        <h3>${escapeHtml(sectorsLabel)}</h3>
        <p>${escapeHtml(String(sectors.length))}</p>
      </article>
      <article class="packet-card">
        <h3>${escapeHtml(categoriesLabel)}</h3>
        <p>${escapeHtml(String(state.solverCategoryCount || 0))}</p>
      </article>
    </div>
    <article class="summary-card">
      <h3>${escapeHtml(state.locale === "it" ? "Selezionabili nel bootstrap" : "Selectable in bootstrap")}</h3>
      <p>${escapeHtml(state.locale === "it"
        ? "Questi sono i domini che puoi scegliere direttamente nel form MVP."
        : "These are the domains you can choose directly in the MVP form.")}</p>
      <div class="coverage-chip-row">${supportedChips}</div>
    </article>
    <div class="sector-grid">${sectorCards}</div>
  `;
}

function renderPlanPicker() {
  const order = ["freemium", "starter", "growth", "enterprise", "dev"];
  const preferredPlanId = persistedState.launchPlanId || state.commercePlans[0]?.id || "starter";
  const plans = [...state.commercePlans].sort((left, right) => {
    return (order.indexOf(left.id) === -1 ? 999 : order.indexOf(left.id))
      - (order.indexOf(right.id) === -1 ? 999 : order.indexOf(right.id));
  });

  elements.launchPlanId.innerHTML = plans
    .map((plan) => {
      const price = plan.monthlyPriceUsd == null
        ? (state.locale === "it" ? "prezzo custom" : "custom pricing")
        : `${formatUsd(plan.monthlyPriceUsd)}/${state.locale === "it" ? "mese" : "mo"}`;
      const status = plan.status === "sellable" ? "" : `, ${plan.status}`;
      const selected = plan.id === preferredPlanId ? "selected" : "";
      return `<option value="${escapeHtml(plan.id)}" ${selected}>${escapeHtml(plan.label)} (${escapeHtml(price + status)})</option>`;
    })
    .join("");
}

function renderDomainPicker() {
  const preferredOrder = [
    "general_systems",
    "compute_semiconductor",
    "mechatronics",
    "fluidic_energy",
    "vehicle_systems",
    "materials_chemistry",
    "cosmetic_science",
    "space_cosmology"
  ];
  const selectedDomainIds = new Set(state.selectedDomainIds);
  const domains = [...state.supportedDomains].sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left.id);
    const rightIndex = preferredOrder.indexOf(right.id);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });

  elements.domainPicker.innerHTML = domains
    .map((domain) => `
      <label class="domain-chip">
        <input type="checkbox" name="domain" value="${escapeHtml(domain.id)}" ${selectedDomainIds.has(domain.id) ? "checked" : ""}>
        <span>
          <strong>${escapeHtml(resolveDomainLabel(domain.id, domain.label))}</strong>
          <small>${escapeHtml(domain.id)}</small>
        </span>
      </label>
    `)
    .join("");
}

function renderGuideRail() {
  const guideEntries = Object.entries(state.ideaDomainGuides);

  elements.guideRail.innerHTML = guideEntries
    .map(([domainId, guide]) => {
      const localizedGuide = GUIDE_COPY[state.locale]?.[domainId];
      const coreValue = localizedGuide?.coreValue || guide.coreValue || "";
      const evidenceNeeds = localizedGuide?.evidenceNeeds || guide.evidenceNeeds || [];

      return `
        <article class="guide-card">
          <h3>${escapeHtml(resolveDomainLabel(domainId, domainId))}</h3>
          <p>${escapeHtml(coreValue)}</p>
          <ul class="list-block">
            ${evidenceNeeds.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `;
    })
    .join("");
}

function renderAuthSummary() {
  const workspaceId = elements.workspaceId.value.trim() || "studio-lab";

  if (!state.auth) {
    elements.authSummary.innerHTML = `
      <strong>${escapeHtml(state.locale === "it" ? "Stato accesso" : "Access status")}</strong>
      <h3>${escapeHtml(state.locale === "it" ? "Nessuna sessione umana attiva" : "No human session active")}</h3>
      <p>${escapeHtml(state.locale === "it"
        ? `Workspace corrente: ${workspaceId}. Puoi fare login come utente oppure restare in fallback tecnico con API key.`
        : `Current workspace: ${workspaceId}. You can log in as a user or stay in technical fallback with the API key.`)}</p>
      <div class="metric-row">
        ${metricPill(state.locale === "it" ? "fallback tecnico disponibile" : "technical fallback available")}
      </div>
    `;
    return;
  }

  if (state.auth.authMode === "user_session") {
    const user = state.auth.session?.user || {};
    elements.authSummary.innerHTML = `
      <strong>${escapeHtml(state.locale === "it" ? "Stato accesso" : "Access status")}</strong>
      <h3>${escapeHtml(user.displayName || user.email || (state.locale === "it" ? "Utente workspace" : "Workspace user"))}</h3>
      <p>${escapeHtml(state.locale === "it"
        ? `${user.email || "unknown"} e attivo nel workspace ${state.auth.workspaceId} con ruolo ${state.auth.session?.role || state.auth.role || "operator"}.`
        : `${user.email || "unknown"} is active in workspace ${state.auth.workspaceId} as ${state.auth.session?.role || state.auth.role || "operator"}.`)}</p>
      <div class="metric-row">
        ${metricPill(state.locale === "it" ? "sessione umana attiva" : "human session active")}
        ${metricPill(`${state.locale === "it" ? "workspace" : "workspace"} ${state.auth.workspaceId}`)}
        ${metricPill(`${state.locale === "it" ? "scade" : "expires"} ${formatDate(state.auth.session?.expiresAt)}`)}
      </div>
    `;
    return;
  }

  elements.authSummary.innerHTML = `
    <strong>${escapeHtml(state.locale === "it" ? "Stato accesso" : "Access status")}</strong>
    <h3>${escapeHtml(state.locale === "it" ? "Modalita tecnica attiva" : "Technical mode active")}</h3>
    <p>${escapeHtml(state.locale === "it"
      ? `Studio sta raggiungendo il workspace ${state.auth.workspaceId} via ${state.auth.authMode === "master" ? "chiave admin di piattaforma" : "client API del workspace"}, con ruolo ${state.auth.role || "operator"}.`
      : `Studio is reaching workspace ${state.auth.workspaceId} through ${state.auth.authMode === "master" ? "the platform admin key" : "a workspace API client"}, with role ${state.auth.role || "operator"}.`)}</p>
    <div class="metric-row">
      ${metricPill(formatAuthMode(state.auth.authMode))}
      ${metricPill(`${state.locale === "it" ? "workspace" : "workspace"} ${state.auth.workspaceId}`)}
      ${metricPill(`${state.locale === "it" ? "ruolo" : "role"} ${state.auth.role || "platform_admin"}`)}
    </div>
  `;
}

function renderWorkspaceSummary() {
  const snapshot = state.workspaceSnapshot;

  if (!snapshot?.workspace) {
    elements.workspaceSummary.innerHTML = `<div class="empty-state">${escapeHtml(state.locale === "it"
      ? "Aggiorna l'accesso o crea un workspace per ispezionare piano, billing, uso e membri."
      : "Refresh access or launch a workspace to inspect plan, billing, usage and members.")}</div>`;
    return;
  }

  const workspace = snapshot.workspace;
  const billing = snapshot.billing;
  const usage = snapshot.usage;
  const members = snapshot.members;
  const plan = getPlanById(workspace.planId);
  const planLabel = plan?.label || workspace.planId;
  const planPrice = plan?.monthlyPriceUsd == null
    ? (state.locale === "it" ? "prezzo custom" : "custom pricing")
    : formatUsd(plan.monthlyPriceUsd);
  const memberItems = members?.length
    ? members.slice(0, 4).map((member) => `<li>${escapeHtml(member.user?.email || member.userId)} - ${escapeHtml(member.role)}</li>`).join("")
    : `<li>${escapeHtml(members
      ? (state.locale === "it" ? "Nessun membro registrato." : "No members registered yet.")
      : (state.locale === "it" ? "L'elenco membri non e visibile con il ruolo corrente." : "Member roster is hidden for the current role."))}</li>`;

  elements.workspaceSummary.innerHTML = `
    <div class="summary-grid">
      <article class="summary-card">
        <h3>${escapeHtml(workspace.name)}</h3>
        <p>${escapeHtml(state.locale === "it"
          ? `Workspace ${workspace.id} attivo sul piano ${planLabel}.`
          : `Workspace ${workspace.id} is active on the ${planLabel} plan.`)}</p>
        <div class="metric-row">
          ${metricPill(`${state.locale === "it" ? "stato" : "status"} ${workspace.status}`)}
          ${metricPill(`${state.locale === "it" ? "piano" : "plan"} ${planLabel}`)}
          ${metricPill(`${workspace.apiClientCount} ${state.locale === "it" ? "client API" : "API clients"}`)}
        </div>
      </article>
      <article class="summary-card">
        <h3>${escapeHtml(state.locale === "it" ? "Commerciale" : "Commercial")}</h3>
        ${billing ? `
          <p>${escapeHtml(state.locale === "it"
            ? `Abbonamento ${billing.subscription.status}, ricorrenza ${formatUsd(billing.recurringChargeUsd)}.`
            : `${billing.subscription.status} subscription, recurring charge ${formatUsd(billing.recurringChargeUsd)}.`)}</p>
          <div class="metric-row">
            ${metricPill(`${state.locale === "it" ? "piano listino" : "list price"} ${planPrice}`)}
            ${metricPill(`${state.locale === "it" ? "prossima fattura" : "next invoice"} ${formatUsd(billing.estimatedNextInvoiceUsd)}`)}
            ${metricPill(`${state.locale === "it" ? "rinnovo" : "renews"} ${formatDate(billing.subscription.renewsAt)}`)}
          </div>
        ` : `
          <p>${escapeHtml(state.locale === "it"
            ? "Il dettaglio commerciale non e visibile con il ruolo corrente."
            : "Commercial detail is hidden for the current role.")}</p>
        `}
      </article>
    </div>
    <div class="summary-grid">
      <article class="summary-card">
        <h3>${escapeHtml(state.locale === "it" ? "Utilizzo" : "Usage")}</h3>
        ${usage ? `
          <ul class="list-block">
            <li>${escapeHtml(state.locale === "it" ? "progetti" : "projects")}: ${escapeHtml(String(usage.counts.liveProjects))}</li>
            <li>${escapeHtml(state.locale === "it" ? "run" : "runs")}: ${escapeHtml(String(usage.counts.liveRuns))}</li>
            <li>${escapeHtml(state.locale === "it" ? "chiamate API" : "API calls")}: ${escapeHtml(String(usage.counts.apiCalls))}</li>
            <li>${escapeHtml(state.locale === "it" ? "autobind AI" : "AI autobinds")}: ${escapeHtml(String(usage.counts.aiAutobinds))}</li>
          </ul>
        ` : `
          <p>${escapeHtml(state.locale === "it"
            ? "Le metriche di utilizzo non sono visibili con il ruolo corrente."
            : "Usage metrics are hidden for the current role.")}</p>
        `}
      </article>
      <article class="summary-card">
        <h3>${escapeHtml(state.locale === "it" ? "Team" : "Team")}</h3>
        <ul class="list-block">
          ${memberItems}
        </ul>
      </article>
    </div>
  `;
}

function renderBootstrapResult(payload) {
  renderProject(payload);
  renderBlueprint(payload.mvpBlueprint);
  renderDecision(payload.mvpDecision);
  renderWorkbench(payload.pilotWorkbench);
  renderRun(payload.run, null);
}

function renderProject(payload) {
  const readiness = payload.readiness || payload.graphSummary?.readiness || {};

  elements.projectSummary.innerHTML = `
    <div class="summary-grid">
      <article class="summary-card">
        <h3>${escapeHtml(payload.project.name)}</h3>
        <p>${escapeHtml(payload.graphSummary.dominantDomainId)} with ${payload.graphSummary.counts.components} components and ${payload.graphSummary.counts.scenarios} scenarios.</p>
        <div class="metric-row">
          ${metricPill(`workspace ${payload.project.workspaceId}`)}
          ${metricPill(`graph ${payload.graphSummary.graphId}`)}
          ${metricPill(`${readiness.boundSolverBindings}/${readiness.totalSolverBindings} bindings`)}
        </div>
      </article>
      <article class="summary-card">
        <h3>Readiness</h3>
        <ul class="list-block">
          <li>unbound bindings: ${readiness.unboundSolverBindings}</li>
          <li>unresolved parameters: ${readiness.unresolvedParameters}</li>
          <li>compilation: ${escapeHtml(payload.compilation.id)}</li>
        </ul>
      </article>
    </div>
  `;
}

function renderBlueprint(blueprint) {
  elements.blueprintSummary.innerHTML = `
    <div class="summary-grid">
      <article class="summary-card">
        <h3>${escapeHtml(blueprint.title)}</h3>
        <p>${escapeHtml(blueprint.mvp.productStatement)}</p>
        <ul class="list-block">
          ${blueprint.mvp.includedFeatures.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="summary-card">
        <h3>Next actions</h3>
        <ul class="list-block">
          ${blueprint.nextActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="metric-row">
          ${metricPill(`readiness ${blueprint.readiness.readinessBand}`)}
          ${metricPill(`score ${formatScore(blueprint.readiness.overallScore)}`)}
        </div>
      </article>
    </div>
  `;
}

function renderDecision(decision) {
  elements.decisionSummary.innerHTML = `
    <div class="signal-grid">
      <article class="signal-card">
        <strong>Recommendation</strong>
        <h3>${escapeHtml(decision.summary.recommendation)}</h3>
        <p>${escapeHtml(decision.summary.rationale)}</p>
        <div class="metric-row">
          ${metricPill(`pilot fit ${formatScore(decision.scores.pilotFitScore)}`)}
          ${metricPill(`validation ${formatScore(decision.scores.validationStrengthScore)}`)}
        </div>
      </article>
      <article class="signal-card">
        <strong>Go signals</strong>
        <ul class="list-block">
          ${renderListItems(decision.goSignals, "No go signal yet.")}
        </ul>
      </article>
      <article class="signal-card">
        <strong>Blockers</strong>
        <ul class="list-block">
          ${renderListItems(decision.blockers, "No blocker registered.")}
        </ul>
      </article>
      <article class="signal-card">
        <strong>Claim boundary</strong>
        <p>${escapeHtml(decision.pilotPlan.claimBoundary)}</p>
        <p>${escapeHtml(decision.pilotPlan.acceptanceRule)}</p>
      </article>
    </div>
  `;
}

function renderWorkbench(workbench) {
  const checklist = (workbench.artifactChecklist || [])
    .map((item) => `
      <div class="checklist-item">
        <span>${escapeHtml(item.label)}</span>
        <span class="status-badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
    `)
    .join("");

  elements.workbenchSummary.innerHTML = `
    <div class="summary-grid">
      <article class="summary-card">
        <h3>Now</h3>
        <ul class="list-block">
          ${renderListItems(workbench.backlog.now, "No immediate item.")}
        </ul>
      </article>
      <article class="summary-card">
        <h3>Next</h3>
        <ul class="list-block">
          ${renderListItems(workbench.backlog.next, "No next item.")}
        </ul>
      </article>
    </div>
    <div class="summary-grid">
      <article class="summary-card">
        <h3>Later</h3>
        <ul class="list-block">
          ${renderListItems(workbench.backlog.later, "No deferred item.")}
        </ul>
      </article>
      <article class="summary-card">
        <h3>Next API sequence</h3>
        <ul class="list-block">
          ${renderListItems(workbench.nextApiSequence, "No follow-up sequence.")}
        </ul>
      </article>
    </div>
    <div class="packet-grid">
      <article class="packet-card">
        <h3>Stage</h3>
        <p>${escapeHtml(workbench.summary.stage)}</p>
      </article>
      <article class="packet-card">
        <h3>Success metric</h3>
        <p>${escapeHtml(workbench.pilotPacket.successMetric.name || "Primary MVP KPI")}</p>
        <p>${escapeHtml(String(workbench.pilotPacket.successMetric.currentValue ?? "pending"))}</p>
      </article>
      <article class="packet-card">
        <h3>Pilot scope</h3>
        <p>${escapeHtml(workbench.pilotPacket.pilotScope.targetWorkflow || "No workflow yet.")}</p>
      </article>
    </div>
    <div class="checklist-grid">${checklist}</div>
  `;
}

function renderRun(run, report) {
  if (!run) {
    elements.runSummary.innerHTML = `<div class="empty-state">No baseline run queued yet.</div>`;
    return;
  }

  elements.runSummary.innerHTML = `
    <div class="run-bar">
      <article class="run-metric">
        <strong>Run</strong>
        <span>${escapeHtml(run.id)}</span>
      </article>
      <article class="run-metric">
        <strong>Status</strong>
        <span>${escapeHtml(run.status)}</span>
      </article>
      <article class="run-metric">
        <strong>Outcome</strong>
        <span>${escapeHtml(run.outcome || "pending")}</span>
      </article>
      <article class="run-metric">
        <strong>Label</strong>
        <span>${escapeHtml(run.label)}</span>
      </article>
    </div>
    ${report ? `
      <div class="summary-grid">
        <article class="summary-card">
          <h3>Report summary</h3>
          <p>${escapeHtml(report.summary.validationOutcome)} with confidence ${escapeHtml(String(report.summary.confidence))}</p>
          <div class="metric-row">
            ${metricPill(`coverage ${report.summary.scenarioCoverage}`)}
            ${metricPill(`pass rate ${formatScore(report.summary.passRate)}`)}
          </div>
        </article>
        <article class="summary-card">
          <h3>Gate results</h3>
          <ul class="list-block">
            ${(report.gateResults || []).slice(0, 4).map((gate) => `<li>${escapeHtml(gate.name)}: ${escapeHtml(gate.passed ? "pass" : "fail")}</li>`).join("")}
          </ul>
        </article>
      </div>
    ` : `<div class="empty-state">The run exists, but no report is available yet.</div>`}
  `;
}

function updateActionState() {
  const hasProject = Boolean(state.currentProject?.id);
  const hasWorkspace = Boolean(elements.workspaceId.value.trim());
  elements.refreshDecisionButton.disabled = !hasProject;
  elements.refreshWorkbenchButton.disabled = !hasProject;
  elements.pollRunButton.disabled = !state.currentRun?.id;
  elements.refreshWorkspaceButton.disabled = !hasWorkspace;
  elements.logoutButton.disabled = !state.sessionToken;
}

function buildHeaders({ includeJson = true, authMode = "auto", apiKey = "", workspaceId = "" } = {}) {
  const headers = {};

  if (includeJson) {
    headers["content-type"] = "application/json";
  }

  if (authMode === "auto" && state.sessionToken) {
    headers.authorization = `Bearer ${state.sessionToken}`;
    return headers;
  }

  const resolvedApiKey = apiKey || (authMode === "master"
    ? (elements.masterApiKey.value.trim() || elements.apiKey.value.trim() || "dev-twintest-key")
    : (elements.apiKey.value.trim() || "dev-twintest-key"));
  const resolvedWorkspaceId = authMode === "master"
    ? "platform-admin"
    : (workspaceId || elements.workspaceId.value.trim() || "studio-lab");

  headers["x-api-key"] = resolvedApiKey;
  headers["x-workspace-id"] = resolvedWorkspaceId;
  return headers;
}

async function fetchJson(url, { method = "GET", headers = undefined, body = undefined } = {}) {
  const response = await fetch(url, {
    method,
    headers: headers || buildHeaders({
      includeJson: method !== "GET"
    }),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload?.error || `${method} ${url} failed with status ${response.status}.`);
  }

  return payload;
}

async function fetchJsonOptional(url, { method = "GET", headers = undefined, body = undefined, allowedStatus = [] } = {}) {
  const response = await fetch(url, {
    method,
    headers: headers || buildHeaders({
      includeJson: method !== "GET"
    }),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok && !allowedStatus.includes(response.status)) {
    throw new Error(payload?.error || `${method} ${url} failed with status ${response.status}.`);
  }

  return response.ok ? payload : null;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      error: text
    };
  }
}

function restorePersistedInputs(saved) {
  const mappedValues = {
    apiKey: saved.apiKey,
    workspaceId: saved.workspaceId,
    sessionEmail: saved.sessionEmail,
    sessionDisplayName: saved.sessionDisplayName,
    masterApiKey: saved.masterApiKey,
    launchWorkspaceName: saved.launchWorkspaceName,
    launchWorkspaceId: saved.launchWorkspaceId,
    ownerEmail: saved.ownerEmail,
    ownerDisplayName: saved.ownerDisplayName,
    projectName: saved.projectName,
    systemName: saved.systemName,
    idea: saved.idea,
    targetUser: saved.targetUser,
    desiredOutcome: saved.desiredOutcome,
    constraints: saved.constraints,
    autobind: saved.autobind,
    runLabel: saved.runLabel
  };

  for (const [key, value] of Object.entries(mappedValues)) {
    if (typeof value === "string" && elements[key]) {
      elements[key].value = value;
    }
  }

  if (typeof saved.queueRun === "boolean") {
    elements.queueRun.checked = saved.queueRun;
  }
}

function persistStudioState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      locale: state.locale,
      apiKey: elements.apiKey.value.trim(),
      workspaceId: elements.workspaceId.value.trim(),
      sessionEmail: elements.sessionEmail.value.trim(),
      sessionDisplayName: elements.sessionDisplayName.value.trim(),
      masterApiKey: elements.masterApiKey.value.trim(),
      launchWorkspaceName: elements.launchWorkspaceName.value.trim(),
      launchWorkspaceId: elements.launchWorkspaceId.value.trim(),
      launchPlanId: elements.launchPlanId.value,
      ownerEmail: elements.ownerEmail.value.trim(),
      ownerDisplayName: elements.ownerDisplayName.value.trim(),
      projectName: elements.projectName.value.trim(),
      systemName: elements.systemName.value.trim(),
      idea: elements.idea.value,
      targetUser: elements.targetUser.value.trim(),
      desiredOutcome: elements.desiredOutcome.value.trim(),
      constraints: elements.constraints.value,
      autobind: elements.autobind.value,
      runLabel: elements.runLabel.value.trim(),
      queueRun: elements.queueRun.checked,
      selectedDomainIds: getSelectedDomains(),
      sessionToken: state.sessionToken
    }));
  } catch (error) {
    // Ignore localStorage failures and keep Studio functional in transient environments.
  }
}

function loadPersistedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function clearUserSessionState() {
  state.sessionToken = "";

  if (state.auth?.authMode === "user_session") {
    state.auth = null;
  }
}

function syncOwnerIdentityFields({ email, displayName, password }) {
  if (email) {
    elements.ownerEmail.value = email;
  }

  if (displayName) {
    elements.ownerDisplayName.value = displayName;
  }

  if (password) {
    elements.ownerPassword.value = password;
  }
}

function getSelectedDomains() {
  return [...elements.domainPicker.querySelectorAll('input[name="domain"]:checked')].map((input) => input.value);
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n|[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function setFeedback(message, isError = false) {
  elements.feedbackBar.textContent = message;
  elements.feedbackBar.style.background = isError
    ? "linear-gradient(135deg, rgba(164, 79, 45, 0.18), rgba(255, 248, 238, 0.92))"
    : "linear-gradient(135deg, rgba(15, 108, 115, 0.12), rgba(255, 251, 245, 0.9))";
}

function renderListItems(items, fallback) {
  if (!items?.length) {
    return `<li>${escapeHtml(fallback)}</li>`;
  }

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function metricPill(text) {
  return `<span class="metric-pill">${escapeHtml(text)}</span>`;
}

function statusClass(status) {
  return `status-${String(status || "").toLowerCase()}`;
}

function formatScore(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "n/a";
}

function formatUsd(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(Number(value))
    : (state.locale === "it" ? "personalizzato" : "custom");
}

function formatDate(value) {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "n/a" : date.toLocaleDateString(intlLocale());
}

function formatAuthMode(authMode) {
  switch (authMode) {
    case "user_session":
      return state.locale === "it" ? "Sessione utente" : "User session";
    case "workspace_client":
      return state.locale === "it" ? "Client API workspace" : "Workspace API client";
    case "master":
      return state.locale === "it" ? "Admin piattaforma" : "Platform admin";
    default:
      return state.locale === "it" ? "Accesso sconosciuto" : "Unknown access";
  }
}

function formatSectorStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (state.locale === "it") {
    if (normalized === "active") {
      return "attivo";
    }

    if (normalized === "building") {
      return "in costruzione";
    }

    return normalized || "sconosciuto";
  }

  return normalized || "unknown";
}

function getPlanById(planId) {
  return state.commercePlans.find((plan) => plan.id === planId) || null;
}

function resolveInitialLocale(savedLocale) {
  if (savedLocale === "it" || savedLocale === "en") {
    return savedLocale;
  }

  return String(globalThis.navigator?.language || "").toLowerCase().startsWith("it") ? "it" : "en";
}

function resolveDomainLabel(domainId, fallbackLabel) {
  return DOMAIN_LABELS[state.locale]?.[domainId] || fallbackLabel || domainId;
}

function t(key, params = {}) {
  const catalog = LOCALE_CATALOG[state.locale] || LOCALE_CATALOG.en;
  const entry = catalog[key] ?? LOCALE_CATALOG.en[key] ?? key;

  if (typeof entry === "function") {
    return entry(params);
  }

  return String(entry).replace(/\{(\w+)\}/g, (match, token) => {
    return token in params ? params[token] : match;
  });
}

function intlLocale() {
  return state.locale === "it" ? "it-IT" : "en-US";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
