# TwinTest Platform Kernel

Bootstrap iniziale della piattaforma `spec-to-validation` descritta in [TwinTest_Project_Document.md](./TwinTest_Project_Document.md).

Il progetto implementa un kernel API-first senza dipendenze esterne che copre il flusso:

1. bootstrap da idea grezza a MVP testabile oppure creazione progetto manuale;
2. upload documenti;
3. compilazione del `Canonical System Graph`;
4. istanziazione agenti e solver binding espliciti;
5. generazione della test matrix;
6. esecuzione asincrona dei run solo su evidenze reali;
7. report, telemetry, MVP blueprint ed evidence matrix;
8. review decision su compilazioni o run.

## Stack

- Node.js 24+
- solo standard library
- store backend selezionabile: `json` oppure `sqlite`
- persistenza default JSON locale in `data/twintest-store.json`
- persistenza SQL nativa opzionale in `data/twintest-store.sqlite`
- artifact storage locale su filesystem in `data/artifacts`

## Avvio

```powershell
node src/server.js
```

Worker esterno:

```powershell
node src/worker.js
```

Profili release separati:

```powershell
npm run start:freemium
npm run worker:freemium
```

Gateway Postgres locale:

```powershell
node src/postgres-gateway.js
```

Oppure via script:

```powershell
npm run postgres:gateway
```

UI locale:

- apri [http://localhost:3000/studio](http://localhost:3000/studio)
- la UI usa gli endpoint del kernel per onboarding workspace, login sessione, intake idea, bootstrap MVP, decisione e pilot workbench
- Studio preferisce `Authorization: Bearer <session-token>` per utenti umani e mantiene la API key workspace come fallback tecnico
- Studio separa in modo esplicito `sessione umana`, `fallback tecnico`, `setup workspace` e `bootstrap MVP`, per ridurre l'ambiguita tra login, billing e flussi commerciali
- Studio mostra anche la `platform coverage`: `settori`, `domini eseguibili` e `categorie solver`, cosi i badge del bootstrap non vengono confusi con l'intera copertura della piattaforma
- resta un frontend sopra le stesse API JSON, non un path separato di business logic
- Studio supporta localizzazione `EN/IT`, con fallback automatico al browser italiano e persistenza locale della lingua scelta
- se `3000` e occupata, imposta `PORT` oppure `TWINTEST_PORT` su una porta libera come `3100` e apri `/studio` su quella porta

TwinTest carica automaticamente il file `.env` dalla root del progetto prima di leggere la configurazione runtime.

Variabili opzionali:

- `PORT` default `3000`
- `TWINTEST_PORT` alias esplicito di `PORT`, utile per mantenere tutta la configurazione sotto namespace TwinTest
- `TWINTEST_API_KEY` default `dev-twintest-key`
- `TWINTEST_OFFER_PROFILE` default `full`, valori supportati: `full`, `freemium`, `paid`
- `TWINTEST_STORE_BACKEND` default `json`, valori supportati: `json`, `sqlite`, `postgres_http`
- `TWINTEST_DATA_FILE` per cambiare il file dati
- `TWINTEST_DATABASE_FILE` per cambiare il file SQLite
- `TWINTEST_POSTGRES_BASE_URL` per il backend `postgres_http`
- `TWINTEST_POSTGRES_API_KEY` per il backend `postgres_http`
- `TWINTEST_POSTGRES_SCHEMA` default `public` per il backend `postgres_http`
- `TWINTEST_POSTGRES_TABLE` default `twintest_state` per il backend `postgres_http`
- `TWINTEST_RUN_MODE` default `embedded`, valori supportati: `embedded`, `external`
- `TWINTEST_WORKER_POLL_MS` default `1000` per il loop del worker esterno
- `TWINTEST_ARTIFACT_ROOT` per cambiare la root filesystem degli artifact
- `TWINTEST_ARTIFACT_STORE_BACKEND` default `local_filesystem`, valori supportati: `local_filesystem`, `s3_layout_filesystem`, `remote_http_object_store`
- `TWINTEST_ARTIFACT_BUCKET` per il layout object-style del backend `s3_layout_filesystem`
- `TWINTEST_ARTIFACT_PUBLIC_BASE_URL` per esporre `objectUrl` sugli artifact object-style
- `TWINTEST_ARTIFACT_REMOTE_BASE_URL` per il backend `remote_http_object_store`
- `TWINTEST_ARTIFACT_REMOTE_API_KEY` per il backend `remote_http_object_store`
- `TWINTEST_BILLING_PROVIDER` default `simulated_stripe`, valori supportati: `simulated_stripe`, `http_json`
- `TWINTEST_BILLING_API_BASE_URL` per il provider esterno `http_json`
- `TWINTEST_BILLING_API_KEY` per il provider esterno `http_json`
- `TWINTEST_BILLING_CALLBACK_BASE_URL` per i callback URL di checkout generati dal provider esterno
- `TWINTEST_BILLING_WEBHOOK_SECRET` default `dev-billing-webhook-secret` per proteggere `POST /billing/webhooks/simulated`
- `TWINTEST_BILLING_WEBHOOK_MODE` default `auto`, valori supportati: `auto`, `shared_secret`, `hmac_sha256`
- `TWINTEST_BILLING_WEBHOOK_TOLERANCE_SECONDS` default `300`, finestra di validita timestamp per firma HMAC
- `TWINTEST_RATE_LIMIT_ENABLED` default `true`
- `TWINTEST_RATE_LIMIT_MAX_REQUESTS` default `600` richieste per finestra
- `TWINTEST_RATE_LIMIT_WINDOW_SECONDS` default `60`
- `TWINTEST_AUTH_LOCKOUT_THRESHOLD` default `5` tentativi login falliti
- `TWINTEST_AUTH_LOCKOUT_WINDOW_SECONDS` default `600`
- `TWINTEST_AUTH_LOCKOUT_DURATION_SECONDS` default `900`
- `TWINTEST_AI_PROVIDER` default `openai`
- `TWINTEST_AI_API_KEY` per abilitare provider AI esterni
- `TWINTEST_AI_MODEL` per selezionare il modello provider-specifico
- `TWINTEST_AI_BASE_URL` per override del base URL provider
- `TWINTEST_OPENAI_API_KEY` per abilitare l'autobind AI via OpenAI Responses API
- `TWINTEST_OPENAI_MODEL` default `gpt-5`

Variabili gateway Postgres:

- `TWINTEST_POSTGRES_GATEWAY_PORT` default `3040`
- `TWINTEST_POSTGRES_GATEWAY_MODE` default `docker_exec`, valori supportati: `docker_exec`, `host_psql`
- `TWINTEST_PG_CONTAINER` default `twintest-postgres` in modalita `docker_exec`
- `TWINTEST_PG_USER`, `TWINTEST_PG_DATABASE`, `TWINTEST_PG_PASSWORD`
- `TWINTEST_PG_HOST`, `TWINTEST_PG_PORT` se usi modalita `host_psql`
- il gateway normalizza anche output `psql` con command tag, cosi `CREATE`, `INSERT` e `SELECT` restano compatibili con il contract JSON di `postgres_http`
- il gateway invia SQL a `psql` via `stdin` invece che via `-c`, cosi i payload di stato grandi non rompono piu il runtime `postgres_http`
- se la porta del gateway e occupata, riallinea sempre `TWINTEST_POSTGRES_GATEWAY_PORT` e `TWINTEST_POSTGRES_BASE_URL` sulla stessa porta libera
- se il gateway non e attivo, `postgres_http` ora restituisce un errore esplicito con URL e porta attesa, invece di uno stack `fetch failed`
- se il gateway risponde `500`, `postgres_http` ora propaga anche il dettaglio del body errore, cosi cause come `spawn EPERM` emergono subito

Formati `.env` accettati:

- dotenv classico: `TWINTEST_AI_PROVIDER=groq`
- sintassi PowerShell: `$env:TWINTEST_AI_PROVIDER = "groq"`
- alias brevi AI: `PROVIDER`, `API_KEY`, `AI_MODEL`, `AI_BASE_URL`

Nota:

- l'alias breve `API_KEY` vale per la chiave del provider AI e viene mappato a `TWINTEST_AI_API_KEY`
- la chiave API del kernel TwinTest resta `TWINTEST_API_KEY`
- righe non di assegnazione, per esempio `node src/server.js`, vengono ignorate dal loader

## API

Header richiesti:

- `x-api-key` per auth machine-to-machine
- oppure `Authorization: Bearer <session-token>` per auth utente
- `x-workspace-id` resta utile con le API key; con le sessioni il workspace e gia implicito

Endpoint principali:

- `GET /studio`
- `GET /ops/health`
- `GET /ops/ga-readiness`
- `GET /commerce/plans`
- `POST /auth/users/register`
- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/logout`
- `GET /ops/run-queue`
- `POST /ops/run-queue/drain-once`
- `POST /workspaces`
- `GET /workspaces/{id}`
- `GET /workspaces/{id}/billing`
- `POST /workspaces/{id}/billing/checkout-session`
- `GET /workspaces/{id}/billing/invoices`
- `GET /workspaces/{id}/billing/events`
- `POST /workspaces/{id}/subscription`
- `POST /billing/webhooks/simulated`
- `GET /workspaces/{id}/usage`
- `GET /workspaces/{id}/members`
- `POST /workspaces/{id}/members`
- `GET /workspaces/{id}/api-clients`
- `POST /workspaces/{id}/api-clients`
- `GET /idea-domain-guides`
- `POST /ideas/bootstrap`
- `POST /projects`
- `POST /projects/{id}/documents`
- `POST /projects/{id}/documents/import-artifact`
- `GET /projects/{id}/artifacts`
- `POST /projects/{id}/artifacts`
- `POST /projects/{id}/compile`
- `GET /projects/{id}/mvp-blueprint`
- `POST /projects/{id}/mvp-blueprint`
- `GET /projects/{id}/mvp-decision`
- `POST /projects/{id}/mvp-decision`
- `GET /projects/{id}/pilot-workbench`
- `POST /projects/{id}/pilot-workbench`
- `GET /projects/{id}/system-graph`
- `POST /projects/{id}/solver-bindings`
- `POST /projects/{id}/solver-bindings/autobind-builtin`
- `POST /projects/{id}/solver-bindings/autobind-ai`
- `POST /projects/{id}/runs`
- `GET /solver-roadmap`
- `GET /solver-manifests`
- `GET /solver-native-readiness`
- `GET /test-foundation`
- `GET /runs/{id}`
- `GET /runs/{id}/telemetry`
- `GET /runs/{id}/report`
- `GET /artifacts/{id}`
- `GET /artifacts/{id}/content`
- `POST /projects/{id}/reviews`

Tipi adapter supportati:

- `builtin_solver`
- `artifact_metrics_json`
- `external_process_json`

Release profiles separati:

- [release/freemium/README.md](./release/freemium/README.md)

Security hardening runtime:

- rate limiting per workspace/client con risposta `429` e header `Retry-After`
- lockout login dopo tentativi falliti ripetuti (anti brute-force)
- webhook billing con firma HMAC (`x-billing-signature` formato `t=<unix>,v1=<sha256>`) e timestamp tolerance configurabile
- compatibilita retroattiva mantenuta: in modalita `auto` resta accettato `x-billing-webhook-secret`

Endpoint operativi:

- `GET /ops/health` restituisce liveness/readiness dei componenti runtime
- `GET /ops/ga-readiness` restituisce gate commerciale (`commercial_alpha`, `ga_candidate_with_warnings`, `commercial_ga_ready`) con checklist strutturata
- il gate diventa `commercial_ga_ready` quando `criticalCount = 0` e `warningCount = 0` (config hardening + runtime sano)

Libreria solver interna:

- `62` solver interni reduced-order gia registrati
- copertura attiva per `industry`, `private`, `personal`, `medical`, `public_infrastructure`, `aerospace_defense`, `robotics_autonomy`, `finance_risk`, `environment_climate`, `materials_chemistry`, `cosmetic_science`, `space_cosmology`
- esempi: `architectural-surrogate`, `thermal-network`, `medical-device-control-solver`, `skin-penetration-solver`, `reaction-kinetics-solver`, `orbital-mechanics-solver`, `cosmology-parameter-fit-solver`

Catalogo categorie solver:

- `78` categorie solver attive esposte dall'endpoint `GET /`
- la root API restituisce `solverCategoryCount`, `solverCategories`, `solverCategoryCatalog`
- ogni settore espone i propri `categoryIds` nel `solverSectorCatalog`

Roadmap integrazione solver:

- copertura completa `78/78` categorie
- summary esposto come `solverIntegrationSummary` sulla root API
- catalogo esposto come `solverIntegrationRoadmap` sulla root API
- endpoint dedicato `GET /solver-roadmap` con `summary`, `items`, `catalog`
- distribuzione attuale: `18` categorie `p0`, `55` categorie `p1`, `5` categorie `p2`
- fasi attuali: `59` categorie `external_adapter_next`, `9` categorie `artifact_pipeline_now`, `10` categorie `review_gated_externalization`

Manifest solver esterni:

- `16` manifest versionati per solver esterni e artifact pipeline prioritari
- summary esposto come `externalSolverManifestSummary` sulla root API
- catalogo esposto come `externalSolverManifests` sulla root API
- endpoint dedicato `GET /solver-manifests` con `summary`, `items`, `catalog`
- copertura attuale: `6` manifest `p0`, `9` manifest `p1`, `1` manifest `p2`
- adapter target: `13` manifest `external_process_json`, `3` manifest `artifact_metrics_json`
- solver coperti: `SUNDIALS`, `OpenModelica`, `nuXmv`, `gem5`, `OpenTURNS`, `Project Chrono`, `CalculiX`, `OpenFOAM`, `Xyce`, `Chemical Transport Backend`, `Dermal and Formulation Backend`, `Orbital Mechanics Backend`, `Scientific Inference Backend`
- stato runtime attuale: `13` manifest `runtime_ready_local_driver`, `3` `dataset_pipeline_ready`

Wrapper locali:

- i manifest `external_process_json` puntano ora a script reali in `scripts/solver-wrappers/`
- wrapper presenti: `sundials`, `openmodelica`, `nuxmv`, `gem5`, `openturns`, `project-chrono`, `calculix`, `openfoam`, `xyce`, `materials-chemistry`, `cosmetic-transport`, `space-orbital`, `space-inference`
- ogni wrapper supervisiona un `solverBinary` reale, normalizza output `json_stdout`, `json_file`, `key_value_stdout` o `key_value_file`
- se il binario, il file raw o le metriche richieste mancano, il wrapper fallisce esplicitamente

Driver locali:

- i wrapper possono usare subito driver numerici locali reali tramite `binding.configuration.localDriverId`
- i driver locali attivi sono `13` e coprono tutte le famiglie `external_process_json`
- il fallback locale non e un mock: esegue calcoli numerici veri nel processo wrapper
- quando il binario vendor sara disponibile, basta sovrascrivere `solverBinary`, `solverArgs`, `solverCwd`, `solverEnv`

Readiness nativa:

- endpoint dedicato `GET /solver-native-readiness`
- la root API restituisce `nativeSolverReadinessSummary` e `nativeSolverReadiness`
- il preflight separa `native_available`, `native_missing`, `dataset_pipeline_ready`
- il fallback locale resta disponibile anche quando il binario vendor non e installato
- stato attuale del repo: `13` external process path con fallback locale pronto, `3` artifact pipeline path

Universal test foundation:

- endpoint dedicato `GET /test-foundation`
- la root API restituisce `universalTestFoundationSummary` e `universalTestFoundation`
- il foundation layer rende TwinTest una base trasversale per engineering, medicale, cosmetica, materiali e spazio/cosmologia
- primitive correnti: `6`
- archetipi di test correnti: `8`
- evidence mode correnti: `5`
- claim family correnti: `6`

Bootstrap idea -> MVP:

- endpoint `GET /idea-domain-guides` per costruire client di intake e suggerire il domain wedge corretto
- endpoint `POST /ideas/bootstrap`
- crea progetto, documento `idea-intake.md`, compilazione, solver autobind e `mvpBlueprint`
- supporta `autobind = none | builtin | ai`
- supporta `queueRun = true` per lanciare subito il primo baseline run se tutti i binding sono risolti
- il blueprint persistito e recuperabile con `GET /projects/{id}/mvp-blueprint`
- il blueprint puo essere rigenerato con `POST /projects/{id}/mvp-blueprint`

MVP decision engine:

- endpoint `GET /projects/{id}/mvp-decision`
- endpoint `POST /projects/{id}/mvp-decision`
- persiste una decisione MVP costruita da blueprint, stato run e ultimo report reale disponibile
- restituisce `recommendation`, `status`, score di pilot fit, blocker, go-signal, pilot scope e claim boundary
- viene generata automaticamente durante `POST /ideas/bootstrap` e quando il blueprint viene rigenerato

Pilot workbench:

- endpoint `GET /projects/{id}/pilot-workbench`
- endpoint `POST /projects/{id}/pilot-workbench`
- persiste un workbench operativo sopra blueprint, decisione, run e report
- espone backlog `now`, `next`, `later`, artifact checklist, pilot packet, execution board e next API sequence
- viene rigenerato automaticamente durante bootstrap, refresh blueprint e refresh decision

Commercial workspace model:

- `GET /commerce/plans` espone i piani vendibili e i loro limiti
- `POST /workspaces` crea un tenant workspace e restituisce il primo `owner API client`
- `GET /workspaces/{id}/billing` espone piano, stato subscription, rinnovo e billing summary
- `POST /workspaces/{id}/subscription` aggiorna piano, stato e billing email
- `GET /workspaces/{id}/usage` espone usage metering e consumo dei limiti
- `GET/POST /workspaces/{id}/api-clients` gestisce le credenziali del tenant
- il `master API key` del kernel resta compatibile per sviluppo, ma il percorso corretto commerciale passa da workspace e client dedicati
- i limiti di piano oggi coprono almeno `projects`, `runs`, `api clients` e `AI autobind`
- ogni workspace ha anche una `subscription` persistita con `trialing`, `active` o `canceled`

User sessions and RBAC:

- `POST /auth/users/register` crea un utente applicativo
- `POST /auth/login` emette una sessione scoped al workspace
- `GET /auth/session` restituisce il contesto auth corrente
- `POST /auth/logout` revoca la sessione
- `GET/POST /workspaces/{id}/members` gestisce i membri del workspace
- ruoli correnti: `owner`, `admin`, `operator`, `viewer`
- le API key workspace restano utili per automazioni e integrazioni server-to-server
- `TwinTest Studio` supporta direttamente bootstrap commerciale: creazione workspace, registrazione owner, membership owner, login e refresh snapshot workspace

Store and execution runtime:

- `TWINTEST_STORE_BACKEND=sqlite` abilita il backend SQL nativo via `node:sqlite`
- `TWINTEST_STORE_BACKEND=postgres_http` abilita il backend Postgres adapter-ready via gateway HTTP SQL/JSON
- `TWINTEST_RUN_MODE=external` disattiva l'esecuzione inline nel server HTTP e lascia i run in coda persistita
- `node src/worker.js` drena la coda run persistita e processa i job in loop
- `GET /ops/run-queue` espone lo stato della coda per workspace
- `POST /ops/run-queue/drain-once` permette un drain manuale per recovery o ambienti piccoli
- il backend `postgres_http` preserva lo stesso state model applicativo e upsert su riga singola `JSONB`, ma delega il trasporto a un adapter HTTP esterno

Postgres reale locale:

- `infra/postgres.compose.yml` avvia un Postgres locale in container con nome `twintest-postgres`
- `node src/postgres-gateway.js` espone `POST /query` e parla al DB via `docker exec` senza richiedere `psql` sul tuo host
- se preferisci `psql` installato sulla macchina, imposta `TWINTEST_POSTGRES_GATEWAY_MODE=host_psql`
- script rapidi disponibili: `npm run postgres:up`, `npm run postgres:ps`, `npm run postgres:down`, `npm run postgres:gateway`
- Docker Desktop deve essere attivo prima di usare il path `docker_exec`

Artifact storage and file intake:

- ogni progetto puo avere artifact persistiti con metadata, checksum SHA-256 e download path
- `POST /projects/{id}/artifacts` salva attachment persistiti da UI, agenti o integrazioni
- `POST /projects/{id}/documents/import-artifact` importa in documento compilabile anche file `txt`, `md`, `json`, `yaml`, `xml`, `html`, `csv`, `tsv`, `pdf`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `doc`, `xls`, `ppt`
- `GET /artifacts/{id}/content` restituisce i bytes reali dell'artifact con `Content-Type` corretto
- ogni report di run completato viene esportato anche come artifact JSON persistito e scaricabile
- il backend `s3_layout_filesystem` salva gli artifact con semantica `bucket/objectKey` e puo esporre `objectUrl`
- il backend `remote_http_object_store` scrive e legge object payload via `fetch`, pronto per storage remoti HTTP-compatible
- l'import usa estrazione strutturata per OOXML/OpenDocument, euristica per PDF e fallback `printable strings` per legacy binary
- PDF e formati legacy binari sono supportati in modalita `best effort`: utili per intake operativo, non ancora parser semantici full-fidelity

Billing lifecycle:

- `POST /workspaces/{id}/billing/checkout-session` crea una checkout session persistita per il piano target
- `POST /billing/webhooks/simulated` applica webhook firmati con `TWINTEST_BILLING_WEBHOOK_SECRET`
- `GET /workspaces/{id}/billing/invoices` e `GET /workspaces/{id}/billing/events` espongono trail persistito di invoice ed eventi
- il provider runtime-ready attuale e `simulated_stripe`, utile per collegare UI e logica commerciale senza dipendere ancora da SaaS esterni
- il provider `http_json` permette checkout verso un provider billing esterno HTTP-compatible tramite `fetch`, con contratti testati nel repo

Esempio rapido:

```powershell
$platformHeaders = @{
  "x-api-key" = "dev-twintest-key"
  "x-workspace-id" = "platform-admin"
  "Content-Type" = "application/json"
}

$workspace = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/workspaces" -Headers $platformHeaders -Body (@{
  name = "Acme Robotics"
  workspaceId = "acme-robotics"
  planId = "starter"
} | ConvertTo-Json)

$tenantHeaders = @{
  "x-api-key" = $workspace.bootstrapApiClient.apiKey
  "Content-Type" = "application/json"
}

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/workspaces/acme-robotics/usage" -Headers $tenantHeaders

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/workspaces/acme-robotics/billing" -Headers $tenantHeaders
```

Autobind AI:

- endpoint `POST /projects/{id}/solver-bindings/autobind-ai`
- usa OpenAI Responses API per scegliere, via AI, tra builtin solver e manifest ammessi
- TwinTest valida la risposta AI e materializza i binding in modo deterministico
- se `TWINTEST_OPENAI_API_KEY` non e configurata, l'endpoint risponde come servizio non disponibile
- supporta anche provider OpenAI-compatible come Groq via `TWINTEST_AI_PROVIDER=groq`
- alias Groq supportati: `gpt 120oss` -> `openai/gpt-oss-120b`, `kimi` -> `moonshotai/kimi-k2-instruct-0905`

Esempio Groq con GPT-OSS 120B:

```powershell
@'
PROVIDER = "groq"
API_KEY = "<groq-api-key>"
AI_MODEL = "gpt 120oss"
'@ | Set-Content .env

node src/server.js
```

Catalogo solver per settore:

- `industry` attivo
- `private` in build
- `personal` in build
- `medical` in build
- `public_infrastructure` in build
- `aerospace_defense` in build
- `robotics_autonomy` in build
- `finance_risk` in build
- `environment_climate` in build
- `materials_chemistry` in build
- `cosmetic_science` in build
- `space_cosmology` in build

## Quickstart

Bootstrap rapido da idea a MVP:

```powershell
$headers = @{
  "x-api-key" = "dev-twintest-key"
  "x-workspace-id" = "idea-lab"
  "Content-Type" = "application/json"
}

$bootstrap = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/ideas/bootstrap" -Headers $headers -Body (@{
  idea = "A service that lets boutique clinics manage bookings, intake workflows and treatment follow-ups without manual coordination."
  targetUser = "clinic operations lead"
  desiredOutcome = "launch a narrow booking and follow-up MVP with measurable completion rate and response time"
  constraints = @(
    "launch with one critical workflow only",
    "keep governance checks visible to operators"
  )
  targetDomains = @("general_systems")
  autobind = "builtin"
  queueRun = $true
  runLabel = "Idea Bootstrap Baseline"
  systemName = "Clinic Workflow MVP"
} | ConvertTo-Json -Depth 8)

$bootstrap.project
$bootstrap.mvpBlueprint
$bootstrap.mvpDecision
$bootstrap.pilotWorkbench
```

```powershell
$headers = @{
  "x-api-key" = "dev-twintest-key"
  "x-workspace-id" = "lab-seed"
  "Content-Type" = "application/json"
}

$project = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects" -Headers $headers -Body (@{
  name = "Twin Washer Pilot"
  description = "Washing machine with motor, pump, drum, controller and vibration constraints"
} | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects/$($project.project.id)/documents" -Headers $headers -Body (@{
  name = "washer-spec.md"
  format = "markdown"
  content = "The system shall complete the cycle safely. Motor, drum, pump, valves and controller must stay within vibration and energy limits."
} | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects/$($project.project.id)/compile" -Headers $headers -Body (@{
  systemName = "Twin Washer"
} | ConvertTo-Json)

$graph = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/projects/$($project.project.id)/system-graph" -Headers $headers

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects/$($project.project.id)/solver-bindings" -Headers $headers -Body (@{
  bindings = @(
    $graph.graph.solverBindings | ForEach-Object {
      @{
        bindingId = $_.id
        solver = $_.compatibleSolvers[0]
        adapterType = "artifact_metrics_json"
        configuration = @{
          path = ".\inputs\washer-metrics.json"
          selector = "scenarioType"
          label = "Washer solver output"
        }
      }
    }
  )
} | ConvertTo-Json -Depth 8)

# Oppure auto-bind dei solver interni sul primo solver compatibile.
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects/$($project.project.id)/solver-bindings/autobind-builtin" -Headers $headers -Body (@{
  bindingParameters = @{}
} | ConvertTo-Json -Depth 8)

$run = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects/$($project.project.id)/runs" -Headers $headers -Body (@{} | ConvertTo-Json)

$status = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/runs/$($run.run.id)" -Headers $headers
while ($status.run.status -ne "completed") {
  Start-Sleep -Milliseconds 200
  $status = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/runs/$($run.run.id)" -Headers $headers
}

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/runs/$($run.run.id)/report" -Headers $headers

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/projects/$($project.project.id)/mvp-decision" -Headers $headers -Body (@{
  runId = $run.run.id
} | ConvertTo-Json)

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/projects/$($project.project.id)/pilot-workbench" -Headers $headers
```

## Domini iniziali coperti

- `compute_semiconductor`
- `general_systems`
- `mechatronics`
- `fluidic_energy`
- `vehicle_systems`
- `materials_chemistry`
- `cosmetic_science`
- `space_cosmology`

Ogni dominio genera:

- componenti canonici;
- agent template bindings;
- solver bindings espliciti da completare;
- scenari nominali, boundary, stress, fault injection, degradation, parameter sweep, control ablation, safety failover;
- KPI, gate, traceability ed evidence matrix.

## Esecuzione Reale

Il runtime non genera piu metriche sintetiche.

- Un run viene rifiutato se esistono `solverBindings` non risolti.
- `builtin_solver` esegue solver numerici reduced-order interni al runtime.
- `artifact_metrics_json` legge un file JSON reale nel workspace e usa le metriche presenti.
- `external_process_json` lancia un processo reale e si aspetta JSON su `stdout`.
- Le metriche devono essere prodotte dal solver o dal post-processing reale, non da fallback interni.

Per i solver interni:

- il solver viene scelto dal catalogo dei `compatibleSolvers`;
- i parametri possono arrivare dal grafo compilato oppure da `binding.configuration.parameters`;
- se i parametri necessari mancano, il run fallisce esplicitamente.

Formato minimo supportato per `artifact_metrics_json`:

```json
{
  "scenarios": {
    "nominal_operation": {
      "metrics": {
        "performance": 0.92,
        "efficiency": 0.88,
        "safety": 0.94,
        "vibration": 0.87
      }
    }
  }
}
```

## Test

```powershell
node --test --test-isolation=none
```
