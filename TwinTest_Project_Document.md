# Documento Progetto - TwinTest

Nota di governo del progetto:
questo documento e una `living specification` e deve essere aggiornato ogni volta che cambia in modo sostanziale l'architettura, il modello API, il runtime solver o la roadmap esecutiva del repository `TWINTEST`.

## 1. Sintesi del progetto

TwinTest e una piattaforma `idea/spec-to-validation` che trasforma un'idea, una descrizione di sistema fisico o cyber-physical, oppure un workflow tecnico/scientifico in un ambiente di simulazione e validazione multi-agente, con scenari automatici, gate di pass/fail, reportistica e audit trail.

L'idea chiave e forte, ma va formulata correttamente:

- TwinTest non "inventa fisica";
- TwinTest converte una specifica in un modello canonico del sistema;
- TwinTest istanzia agenti da template verificabili;
- TwinTest collega ogni agente al solver o al surrogate model corretto;
- TwinTest esegue validazione automatica, non storytelling plausibile.

In pratica, se l'utente descrive una turbina, una lavatrice, un sistema idraulico, una batteria o una architettura di chip, TwinTest deve poter:

1. decomporre il sistema in componenti, interfacce, stati, parametri e failure modes;
2. generare gli agenti che rappresentano le parti del sistema;
3. generare scenari nominali, edge case, stress test e fault injection;
4. eseguire run su solver coerenti con il dominio;
5. valutare KPI, gate e criteri di pass;
6. produrre un report di validazione tracciabile.

## 2. Problema che risolve

Oggi la validazione di sistemi complessi e spesso frammentata:

- requisiti in documenti separati;
- simulazioni costruite manualmente e poco riusabili;
- assenza di schema unico per KPI, failure mode e gate;
- bassa tracciabilita tra requisito, modello, scenario e risultato;
- forte dipendenza da esperti che ricreano ogni volta la struttura del test.

TwinTest risolve questo problema introducendo un livello sistematico tra specifica e simulazione:

- `spec ingestion`
- `system graph compilation`
- `agent synthesis`
- `solver binding`
- `scenario generation`
- `validation orchestration`
- `evidence and reporting`

## 3. Visione di prodotto

TwinTest deve diventare una piattaforma API-first in cui una `API key` autorizza la creazione, l'esecuzione e la consultazione di digital twin validativi per progetti diversi.

Il prodotto deve poter servire tre classi di utente:

- team di R&D che vogliono ridurre il tempo per costruire un ambiente di validazione serio;
- team di systems engineering che vogliono collegare requisiti, modelli, test e gate;
- organizzazioni deep-tech che hanno bisogno di mostrare evidenza tecnica ripetibile a partner, clienti o investitori.
- founder, product owner e operations lead che vogliono capire se una idea puo diventare un MVP testabile prima di investire su una superficie prodotto troppo ampia.

## 4. Principi di progetto

### 4.1 Metodo generico, fisica specifica

Il metodo deve essere riusabile tra domini, ma i modelli fisici non possono essere finti.

Quindi:

- il framework e generico;
- i template di agente sono dominio-specifici;
- i solver sono dominio-specifici;
- il layer LLM serve per parsing, decomposizione e orchestrazione, non per sostituire la simulazione numerica.

### 4.2 Auditabilita totale

Ogni risultato deve essere ricostruibile:

- quale specifica e stata letta;
- quali componenti sono stati generati;
- quali template di agente sono stati istanziati;
- quali solver sono stati usati;
- quali parametri, scenari, seed e gate hanno prodotto il risultato.

### 4.3 Automation with guardrails

La piattaforma deve essere fortemente automatica, ma con guardrail chiari:

- segnalazione delle assunzioni mancanti;
- evidenza delle parti stimate o surrogate;
- human review nei punti safety-critical;
- blocco dei report se la confidenza non supera una soglia minima.
- blocco dei run se i `solver bindings` non sono risolti;
- divieto di metriche sintetiche o mock nel runtime di validazione.

### 4.4 API-first e workspace-safe

TwinTest deve nascere come piattaforma con:

- autenticazione via API key;
- separazione per workspace, progetto e run;
- risorse asincrone;
- log completo delle esecuzioni;
- accesso a report, artefatti e telemetria via API.

## 5. Architettura della piattaforma

## 5.1 Spec Ingestion Layer

Ingresso di documenti e artefatti:

- PDF, DOCX, TXT, Markdown;
- schemi tecnici;
- dati tabellari;
- configurazioni di test;
- descrizioni CAD metadata o BOM quando disponibili.

Responsabilita:

- parsing;
- estrazione entita;
- riconoscimento requisiti;
- classificazione dei domini fisici coinvolti;
- generazione di una bozza di modello canonico.

## 5.2 Canonical System Graph

Cuore logico della piattaforma.

Ogni progetto viene compilato in un grafo formale contenente:

- `System`
- `Component`
- `Interface`
- `StateVariable`
- `Parameter`
- `Constraint`
- `FailureMode`
- `AgentRole`
- `Scenario`
- `KPI`
- `Gate`
- `Evidence`

Questo livello e il contratto tra parsing, agent synthesis, solver e reporting.

## 5.3 Agent Template Library

TwinTest non deve creare agenti nel vuoto. Deve usare una libreria di template versionati.

Classi iniziali di template:

- mechanical component agent;
- thermal agent;
- fluidic agent;
- electrical agent;
- control system agent;
- safety and interlock agent;
- verification/reference agent;
- energy and cost agent;
- telemetry agent.

Ogni template definisce:

- ingressi;
- uscite;
- stato interno;
- parametri richiesti;
- failure modes osservabili;
- solver compatibili;
- KPI contribuibili;
- vincoli di confidenza.

## 5.4 Agent Synthesis Engine

Motore che mappa il `Canonical System Graph` in istanze concrete di agenti.

Funzioni:

- assegnazione template -> componenti;
- completamento dei parametri mancanti tramite regole o richiesta di evidenza;
- generazione di dipendenze tra agenti;
- costruzione del runtime graph di simulazione.

## 5.5 Solver Adapter Layer

TwinTest non puo basarsi solo su un LLM. Deve collegarsi a solver veri o surrogate model validati.

Categorie di solver:

- ODE / state-space;
- FEM;
- CFD;
- circuit simulation;
- thermal simulation;
- control simulation;
- probabilistic / reliability simulation;
- ML surrogate models quando dichiarati e validati.

Il layer adapter deve uniformare:

- firma degli input;
- unita di misura;
- output standardizzati;
- tracciabilita del solver utilizzato;
- gestione errori e timeout.

Stato corrente del kernel implementato:

- adapter `builtin_solver` per solver reduced-order interni dichiarati e versionati;
- adapter `artifact_metrics_json` per ingestione di output reali gia prodotti nel workspace;
- adapter `external_process_json` per lanciare processi solver esterni e leggere JSON strutturato;
- catalogo manifest per solver esterni con binding template e contract di input/output per i solver prioritari;
- supporto `localDriverId` nei wrapper per rendere eseguibili subito i path `external_process_json` anche senza binario vendor installato;
- nessun solver binding implicito: ogni binding deve essere esplicitamente risolto prima dell'esecuzione.

## 5.6 Scenario and Fault Generator

Motore di generazione automatica dei test:

- nominal operation;
- boundary conditions;
- stress and overload;
- fault injection;
- component degradation;
- parameter sweep;
- ablation del control layer;
- safety and failover scenarios.

## 5.7 Validation Orchestrator

Sistema che esegue i run.

Responsabilita:

- scheduling dei job;
- parallelizzazione;
- riuso di cache e artefatti;
- raccolta della telemetria;
- valutazione KPI;
- esito dei gate.
- blocco hard del run se mancano binding solver, parametri numerici o metriche richieste.

## 5.8 Reporting and Evidence Engine

Output finale del sistema:

- report tecnico;
- matrice requisito -> scenario -> evidenza;
- risultati per KPI;
- pass/fail per gate;
- elenco assunzioni e limiti;
- confronto tra baseline e varianti;
- export per stakeholder tecnici e business.

## 6. Modello dati canonico

TwinTest deve formalizzare un modello dati minimo stabile. Entita obbligatorie:

- `Project`
- `ProjectVersion`
- `SourceDocument`
- `System`
- `Subsystem`
- `Component`
- `Interface`
- `Parameter`
- `StateVariable`
- `OperatingMode`
- `FailureMode`
- `AgentTemplate`
- `AgentInstance`
- `SolverBinding`
- `Scenario`
- `ScenarioRun`
- `TelemetryStream`
- `KPI`
- `Gate`
- `EvidenceArtifact`
- `Assumption`
- `ReviewDecision`

Senza questo livello formale il sistema degenerera in output testuali non governabili.

## 7. Flusso automatico di esecuzione

Flusso target di TwinTest:

1. L'utente crea un progetto tramite API key oppure usa un bootstrap da idea grezza.
2. Carica documenti e parametri iniziali, oppure lascia che TwinTest generi un primo `idea intake`.
3. Il sistema classifica il dominio e genera il `Canonical System Graph`.
4. Il motore istanzia gli agenti dai template.
5. Il sistema propone o assegna i solver compatibili.
6. Viene costruita la test matrix.
7. I run vengono eseguiti in modalita asincrona.
8. KPI e gate vengono valutati.
9. Il sistema produce report, blueprint MVP, evidenze e warning.
10. L'utente revisiona, corregge o approva.

## 8. Esempi d'uso

### 8.1 Turbina

Il sistema genera almeno:

- rotore/statore mechanical agents;
- thermal agents;
- fluidic/flow agents;
- vibration and wear agents;
- controller and safety agents;
- efficiency and power KPI set.

### 8.2 Lavatrice

Il sistema genera almeno:

- motore e drive agent;
- drum and mechanics agent;
- hydraulic inflow/outflow agent;
- thermal agent;
- vibration/noise agent;
- controller/safety agent;
- ciclo, consumo, affidabilita e fault KPI.

### 8.3 Sistema idraulico

Il sistema genera almeno:

- pump agent;
- valve agents;
- pipe network agents;
- pressure and flow agents;
- leak and failure agents;
- control and interlock agents.

### 8.4 Architettura di chip

Il sistema genera almeno:

- compute tile agents;
- thermal agents;
- verification agents;
- scheduler/runtime agents;
- telemetry agents;
- KPI di qualita, energia, latenza e burden di correzione.

## 9. Strategia di rollout per domini

Errore da evitare:
provare a coprire "qualsiasi macchina" dal giorno uno.

Strategia corretta:

### Fase dominio 1 - Compute / semiconductor systems

Primo dominio fondativo:

- RTH-IMC come caso reale gia disponibile;
- schema multi-agente gia dimostrato;
- KPI e metodo gia esistenti;
- ottima base per il motore di validazione.

### Fase dominio 2 - Mechatronics

Secondo dominio:

- macchine elettromeccaniche con attuazione, sensori, controllo e sicurezza;
- ottimo terreno per template riusabili.

### Fase dominio 3 - Fluidic / energy systems

Terzo dominio:

- turbine;
- sistemi idraulici;
- pompe;
- gestione termofluidica.

### Fase dominio 4 - Vehicle systems

Quarto dominio:

- powertrain subsystem;
- battery and thermal loops;
- braking and safety subsystems;
- system-level scenario validation.

## 10. Modello API

La piattaforma deve essere esposta come servizio autenticato da API key.

Endpoint concettuali iniziali:

- `GET /studio`
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

Principi API:

- ogni richiesta e scoped a un workspace;
- i run sono asincroni;
- tutti gli artefatti hanno versioning;
- ogni report riporta solver, template e assunzioni usate;
- la API non restituisce solo testo, ma anche oggetti strutturati;
- la root API deve esporre anche cataloghi strutturati di `solver sectors` e `solver categories`;
- la piattaforma deve esporre una `solver integration roadmap` macchina-leggibile per categoria;
- la piattaforma deve esporre anche manifest di integrazione per i solver esterni prioritari;
- la piattaforma deve esporre anche un preflight di `native solver readiness` per distinguere vendor binary presenti e fallback locali;
- la piattaforma deve esporre anche una `universal test foundation` macchina-leggibile per riusare primitive, archetipi di scenario ed evidence mode tra settori molto diversi;
- la piattaforma deve poter usare l'AI via API per creare piani di solver binding sotto vincoli espliciti;
- la piattaforma deve poter trasformare una idea in un progetto compilato con blueprint MVP persistito;
- la piattaforma deve poter trasformare blueprint e report reali in una decisione MVP leggibile, persistita e rieseguibile;
- la piattaforma deve poter trasformare blueprint, decisione e report reali in un workbench operativo per backlog, evidenze e pilot packet;
- la piattaforma deve esporre anche una UI nativa minima sopra le stesse API per permettere intake e pilot orchestration senza passare da chiamate manuali;
- la piattaforma deve esporre un modello workspace/plan/api-client abbastanza forte da poter essere venduta come servizio multi-tenant;
- la piattaforma deve supportare anche utenti applicativi, membership per workspace e sessioni revocabili con RBAC vero;
- un run non puo partire se i `solver bindings` sono irrisolti;
- i KPI di report devono derivare da output reali di solver o adapter dichiarati, non da mock runtime.

## 11. Metriche di successo del prodotto

Metriche da usare per TwinTest:

- `time_to_first_validation_graph`
- `time_to_first_executable_run`
- `template_reuse_rate`
- `scenario_coverage`
- `requirements_traceability_coverage`
- `solver_binding_success_rate`
- `run_reproducibility_rate`
- `sim_to_real_correlation` dove disponibile
- `human_review_acceptance_rate`
- `false_confidence_incidents`

## 12. Rischi principali

### R1 - Falsa confidenza

Rischio:
report eleganti ma fisica debole.

Mitigazione:

- template versionati;
- solver reali;
- disclosure obbligatoria delle assunzioni;
- blocco dei report sotto soglia di confidenza.

### R2 - Ontologia troppo ampia troppo presto

Rischio:
schema ingestibile e prodotto generico solo in teoria.

Mitigazione:

- rollout per domini;
- schema minimo stabile;
- estensione controllata del modello dati.

### R3 - Dipendenza eccessiva dall'LLM

Rischio:
component decomposition plausibile ma non affidabile.

Mitigazione:

- regole strutturate;
- template hard-coded;
- human review;
- validazione della compilazione del system graph.

### R4 - Integrazione solver fragile

Rischio:
nessun backend numerico abbastanza robusto da sostenere il prodotto.

Mitigazione:

- adapter layer disciplinato;
- supporto iniziale a pochi solver forti;
- surrogate model usati solo se dichiarati e validati.

## 13. Roadmap di esecuzione

## Fase 0 - 0/3 mesi

Obiettivo:
costruire il kernel concettuale e tecnico del prodotto.

Deliverable:

- canonical schema v1;
- agent template strategy;
- RTH-IMC come progetto pilota;
- primo system graph compiler;
- prima bozza di API model.

## Fase 1 - 3/6 mesi

Obiettivo:
chiudere il motore base end-to-end sul primo dominio.

Deliverable:

- ingestion -> graph -> agents -> runs -> report;
- autenticazione via API key;
- reporting con evidence matrix;
- benchmark set sul dominio compute.

## Fase 2 - 6/12 mesi

Obiettivo:
portare TwinTest al secondo dominio e testare la generalizzazione reale.

Deliverable:

- libreria template mechatronics v1;
- solver adapters aggiuntivi;
- scenario generator piu ricco;
- verifica che il metodo, non solo il dominio, sia riusabile.

## Fase 3 - 12/18 mesi

Obiettivo:
trasformare TwinTest in piattaforma multi-dominio credibile.

Deliverable:

- supporto a domini fluidici / energetici;
- workspace multi-tenant;
- audit and review workflow;
- proposition commerciale chiara.

## 14. Decisioni da prendere subito

1. Quale nome di prodotto e definitivo: `TwinTest` o altra variante.
2. Qual e il dominio wedge oltre a RTH-IMC.
3. Quale schema canonico minimo e obbligatorio in v1.
4. Quali solver saranno supportati per primi.
5. Qual e il confine tra automazione e human review.
6. Quale forma avra la API v1.

## 15. Dichiarazione finale

TwinTest ha potenziale molto alto se viene costruito come piattaforma di validazione disciplinata e non come generatore di simulazioni "magiche". Il vantaggio competitivo non sara dire che puo simulare tutto, ma dimostrare che puo trasformare specifiche reali in sistemi di validazione multi-agente, tracciabili, auditabili e riusabili tra domini diversi.

## 16. Stato implementazione corrente

Data di aggiornamento:
21 marzo 2026

Stato del repository `TWINTEST`:

- kernel API-first backend gia avviato nel repository;
- stack attuale: `Node.js` con sola standard library;
- persistenza locale JSON per progetti, compilazioni, run, report, review e telemetria;
- compiler del `Canonical System Graph` attivo con classificazione dominio, componenti, interfacce, KPI, gate, scenari e traceability;
- libreria template multi-dominio attiva per compute/semiconductor, general systems, mechatronics, fluidic/energy, vehicle systems, materials/chemistry, cosmetic science e space/cosmology;
- catalogo solver per settore introdotto con `industria` come stream attivo prioritario.
- catalogo categorie solver introdotto come tassonomia trasversale esposta via API.
- roadmap integrazione solver codificata come catalogo macchina-leggibile con endpoint dedicato.
- libreria manifest solver esterni introdotta per i target di integrazione prioritari.
- wrapper locali introdotti per i manifest `external_process_json` prioritari.
- driver locali numerici introdotti come runtime reale di default per i manifest wrapper-backed.
- preflight di `native solver readiness` introdotto per rilevare binari vendor disponibili o mancanti.
- autobind AI via OpenAI Responses API introdotto per la creazione automatica dei solver binding.
- bootstrap runtime aggiornato per caricare automaticamente `.env` dalla root con parsing compatibile sia `dotenv` sia `PowerShell`.
- foundation layer universale introdotto per unificare primitive di test, archetipi, evidence mode e claim families attraverso domini eterogenei.
- bootstrap `idea -> project -> graph -> mvpBlueprint` introdotto come percorso API nativo per trasformare idee in MVP testabili.
- motore `mvp decision` introdotto per convertire blueprint e run reali in recommendation di pilot, blocker e next build steps.
- `pilot workbench` introdotto per materializzare backlog operativo, artifact checklist e piano di pilot sopra blueprint e decisione.
- UI statica `TwinTest Studio` introdotta come frontend leggero servito dal kernel stesso.
- modello commerciale minimo introdotto con `workspace registry`, `API clients`, `usage metering` e limiti di piano.
- stato subscription e billing summary introdotti come strato commerciale sopra il workspace registry.
- layer utenti/sessioni/RBAC introdotto sopra il modello workspace commerciale.

Stato runtime solver:

- runtime mock rimosso;
- `solver bindings` inizialmente `unbound` e obbligatori prima dei run;
- supporto attivo per `builtin_solver`, `artifact_metrics_json`, `external_process_json`;
- libreria solver interna implementata per tutti i solver dichiarati nel catalogo template corrente;
- libreria solver interna estesa anche ai settori `private`, `personal`, `medical`, `public_infrastructure`, `aerospace_defense`, `robotics_autonomy`, `finance_risk`, `environment_climate`;
- libreria solver interna ulteriormente estesa anche ai settori `materials_chemistry`, `cosmetic_science`, `space_cosmology`;
- numero solver interni attivi: `62`.
- numero categorie solver attive nel catalogo: `78`.
- copertura roadmap integrazione: `78/78` categorie mappate.
- numero manifest solver esterni attivi: `16`.
- numero wrapper locali attivi: `13`.
- numero driver locali attivi: `13`.
- numero manifest `external_process_json` con fallback locale pronto: `13`.
- endpoint AI autobind attivi: `1`.
- endpoint foundation attivi: `1`.

Capacita gia operative:

- creazione progetto;
- bootstrap da idea grezza con documento `idea-intake.md` generato automaticamente;
- upload documenti;
- compilazione del system graph;
- generazione e persistenza di `mvpBlueprint` per ogni progetto che passa dal bootstrap o dalla refresh route dedicata;
- generazione e persistenza di `mvpDecision` per ogni progetto che passa dal bootstrap o dalla refresh route dedicata;
- generazione e persistenza di `pilotWorkbench` per ogni progetto che passa dal bootstrap o dalle refresh route MVP;
- targeting esplicito di domain pack anche per `general_systems`;
- targeting esplicito di domain pack anche per `materials_chemistry`, `cosmetic_science`, `space_cosmology`;
- binding manuale dei solver;
- auto-bind dei solver interni compatibili;
- esecuzione asincrona dei run;
- raccolta telemetria;
- report con KPI, gate, evidence matrix e artifact tracing;
- endpoint `GET /solver-roadmap` con `summary`, `items`, `catalog`;
- endpoint `GET /solver-manifests` con `summary`, `items`, `catalog`;
- endpoint `GET /solver-native-readiness` con `summary`, `items`, `catalog`;
- endpoint `GET /test-foundation` con `summary`, `foundation`;
- endpoint `POST /ideas/bootstrap` per creare subito un progetto MVP testabile;
- endpoint `GET /idea-domain-guides` per alimentare UI e client di intake lato prodotto;
- endpoint `GET /studio` per aprire la UI locale del kernel;
- endpoint `GET /commerce/plans` per esporre il catalogo dei piani;
- endpoint `POST /auth/users/register` per creare utenti applicativi;
- endpoint `POST /auth/login` per aprire sessioni workspace-scoped;
- endpoint `GET /auth/session` e `POST /auth/logout` per introspezione e revoca sessioni;
- endpoint `POST /workspaces` per creare tenant workspace con primo owner client;
- endpoint `GET /workspaces/{id}` per leggere il tenant;
- endpoint `GET /workspaces/{id}/billing` per leggere il billing summary del tenant;
- endpoint `POST /workspaces/{id}/subscription` per cambiare piano e stato subscription;
- endpoint `GET /workspaces/{id}/usage` per leggere il metering commerciale;
- endpoint `GET/POST /workspaces/{id}/members` per gestire i membri umani del workspace;
- endpoint `GET/POST /workspaces/{id}/api-clients` per gestire le chiavi tenant;
- endpoint `GET /projects/{id}/mvp-blueprint` per leggere il blueprint MVP corrente;
- endpoint `POST /projects/{id}/mvp-blueprint` per rigenerare il blueprint dopo nuove evidenze o nuovi vincoli;
- endpoint `GET /projects/{id}/mvp-decision` per leggere la decisione MVP corrente;
- endpoint `POST /projects/{id}/mvp-decision` per rigenerare la decisione MVP a partire dallo stato run/report corrente;
- endpoint `GET /projects/{id}/pilot-workbench` per leggere il workbench operativo corrente;
- endpoint `POST /projects/{id}/pilot-workbench` per rigenerare backlog, checklist e pilot packet sul run desiderato;
- manifest `external_process_json` eseguibili subito in modalita `runtime_ready_local_driver`.

Guardrail gia implementati:

- nessun run senza binding solver risolti;
- nessun report se mancano metriche richieste;
- fallimento esplicito del run se mancano parametri numerici necessari;
- tracciabilita del solver usato per ogni binding e scenario;
- smoke test automatico su tutti i solver interni registrati.

Prossimo focus esecutivo:

- collegare il primo dominio wedge reale `RTH-IMC`;
- sostituire i solver reduced-order interni con adapter verso backend numerici o benchmark reali dove disponibili;
- rafforzare ingestione parametri da documenti e dataset;
- introdurre configurazioni progetto-specifiche per solver, unita e artifact reali.

## 17. Valutazione solver per tipologia di test

Principio guida:
TwinTest non deve scegliere "un solver per tutto", ma una matrice disciplinata di solver per classe di test, con un layer di orchestrazione uniforme.

La scelta corretta non e:

- massimizzare il numero di solver integrati da subito;
- coprire tutto con un solo motore generico;
- confondere orchestrazione, co-simulation e solver fisico.

La scelta corretta e:

- definire una coppia `test typology -> solver family`;
- scegliere per ogni famiglia un `primary solver` e un `secondary solver`;
- usare `FMI` e adapter API come layer di composizione, non come sostituto del solver.

### 17.1 Matrice principale

| Tipologia di test | Dominio fisico/logico | Solver primario | Solver secondario | Decisione TwinTest |
| --- | --- | --- | --- | --- |
| nominal, boundary, transient dynamics | ODE, DAE, state-space, control loops | `SUNDIALS` | `OpenModelica` | stack core v1 per dinamica continua e modelli ridotti |
| control validation, control ablation, failover dynamics | controllo continuo e logica di supervisione | `OpenModelica` | `SUNDIALS` | usare `OpenModelica` quando il modello e gia espresso in Modelica o FMU |
| safety interlock, requirement proof, logic failover | logica discreta, safety-critical control | `nuXmv` | rule-based internal engine solo per screening | per safety seria serve model checking, non solo rule engine |
| multibody motion, actuator mechanics, vibration time evolution | mechatronics, vehicle subsystems | `Project Chrono` | `CalculiX` per modal/structural checks | `Chrono` per dinamica nel tempo; `CalculiX` per stress e modi propri |
| structural static, nonlinear, modal, thermo-structural | FEM meccanico e termico | `CalculiX` | `Elmer` o `MOOSE` per multiphysics piu pesante | `CalculiX` come default open-source pragmatico |
| thermofluidic, pressure-flow, cavitation, heat transfer in fluid systems | CFD e fluid network fidelity | `OpenFOAM` | `Elmer` per accoppiamenti multiphysics | `OpenFOAM` come motore principale per casi fluidici seri |
| electrical analog, mixed-signal, power electronics, drive stages | circuit simulation | `Xyce` | `ngspice` | `Xyce` per scala e parallelismo; `ngspice` per casi piccoli e rapidi |
| reliability, degradation, uncertainty, rare-event estimation | probabilistic validation | `OpenTURNS` | sampling interno minimale solo per debug | `OpenTURNS` e il layer standard per FORM/SORM/Monte Carlo/LHS/Sobol |
| computer architecture, scheduler/runtime, latency-throughput studies | chip, compute, accelerator systems | `gem5` | `SST` | `gem5` come wedge solver per microarchitecture; `SST` dopo per scala HPC/system-level |
| co-simulation tra modelli eterogenei | composizione di modelli e toolchain | `FMI 3.0` / FMU | `FMPy` come runner/validator | standard di interscambio, non solver fisico |

### 17.2 Mappatura per tipologia di scenario di test

| Scenario di test | Motore richiesto | Note operative |
| --- | --- | --- |
| nominal operation | solver fisico primario del dominio | usare solver ridotto solo per pre-check veloci |
| boundary conditions | solver fisico + param sweep controllato | la stabilita numerica diventa criterio di validazione |
| stress and overload | solver ad alta fedelta termica, strutturale o circuitale | evitare surrogate non calibrati |
| fault injection | solver fisico + logica/failover + telemetry validation | spesso richiede co-simulation tra fisica e controllo |
| component degradation | solver fisico + `OpenTURNS` o reliability layer | degradazione non va trattata come semplice rumore random |
| parameter sweep | orchestrazione DOE/UQ sopra il solver primario | preferire `OpenTURNS` per sweep, Sobol, failure probability |
| control ablation | controllo continuo + formal logic checks | combinare `OpenModelica`/`SUNDIALS` con `nuXmv` dove safety-critical |
| safety and failover | model checking + solver fisico dominio-specifico | il pass/fail safety non puo derivare da score euristici |

### 17.3 Decisione architetturale per TwinTest

Stack solver da supportare come priorita alta:

- `SUNDIALS`
- `OpenModelica`
- `FMI 3.0` con runner/validator FMU
- `OpenTURNS`
- `gem5`
- `OpenFOAM`
- `CalculiX`
- `Project Chrono`
- `Xyce`
- `nuXmv`

Stack solver da tenere come secondario o fase successiva:

- `SST`
- `Elmer`
- `MOOSE`
- `ngspice`

### 17.4 Decisione per fasi di integrazione

Fase pratica consigliata:

1. Core cross-domain:
   - `SUNDIALS`
   - `OpenModelica`
   - `FMI`
   - `OpenTURNS`
   - `nuXmv`

2. Dominio wedge compute / semiconductor:
   - `gem5`
   - power/thermal reduced-order interni come pre-check
   - successivamente `SST` per system-scale exploration

3. Dominio mechatronics / vehicle:
   - `Project Chrono`
   - `CalculiX`
   - `OpenModelica`

4. Dominio fluidic / energy:
   - `OpenFOAM`
   - `CalculiX` o `Elmer` per thermal/structural coupling

5. Dominio electrical / drive / power:
   - `Xyce`
   - `ngspice` solo come fallback leggero

### 17.5 Regola di prodotto

TwinTest non deve vendere l'idea che "ha un solver per ogni problema".
TwinTest deve vendere l'idea corretta:

- seleziona il solver coerente con la tipologia di test;
- espone in chiaro quando usa reduced-order, FMU, solver esterno o evidence artifact;
- rifiuta i run quando la catena solver non e abbastanza forte per sostenere il claim di validazione.

## 18. Catalogo solver per settore

Decisione organizzativa:
il catalogo solver di TwinTest deve essere mantenuto anche per `settore`, non solo per `dominio fisico` o `tipologia di test`.

Questo permette di:

- costruire roadmap verticali credibili;
- separare i livelli di rigore richiesti da industria, medicale, consumer e altri ambiti;
- evitare che il catalogo solver degeneri in un elenco indistinto di tool;
- agganciare ogni settore a una tassonomia esplicita di `solver categories`.

### 18.1 Settore industria

Questo e il settore attivo prioritario in questa fase.

Ambiti inclusi:

- compute / semiconductor
- mechatronics
- fluidic / energy systems
- vehicle systems
- industrial control
- power electronics

Solver primari industria:

- `SUNDIALS`
- `OpenModelica`
- `FMI 3.0 / FMU`
- `OpenTURNS`
- `nuXmv`
- `gem5`
- `OpenFOAM`
- `CalculiX`
- `Project Chrono`
- `Xyce`

Solver secondari industria:

- `SST`
- `Elmer`
- `MOOSE`
- `ngspice`

Reduced-order families interne ammesse per bootstrap e pre-check:

- `ode-state-space`
- `state-space-control`
- `thermal-network`
- `fluid-network`
- `probabilistic-reliability`
- `logic-simulation`
- `constraint-checker`
- `timeseries-evaluator`

Regola:
nei casi industriali safety-critical, i reduced-order interni non bastano come evidenza finale di validazione.

### 18.2 Settore privato

Settore ora aperto come stream di build.

Ambiti candidati:

- process simulation
- workflow orchestration testing
- service reliability e capacity planning
- security e compliance validation

Direzione solver prevista:

- `business-process-simulator`
- `service-capacity-solver`
- `security-policy-checker`
- `compliance-workflow-solver`

### 18.3 Settore personale

Settore ora aperto come stream di build.

Ambiti candidati:

- home energy systems
- consumer electronics thermal e battery testing
- smart home control validation
- personal mobility devices

Direzione solver prevista:

- `battery-ecm-solver`
- `wearable-thermal-solver`
- `home-energy-solver`
- `personal-mobility-solver`

### 18.4 Settore medico

Settore ora aperto come stream di build e soggetto a governance piu severa.

Ambiti candidati:

- medical device control validation
- biomechanics e implant testing
- clinical workflow verification
- risk e safety case validation

Direzione solver prevista:

- `medical-device-control-solver`
- `biomechanics-reduced-order`
- `clinical-workflow-checker`
- `physiological-compartment-solver`
- human-in-the-loop review obbligatoria

Regola:
il settore medico non puo essere trattato come semplice estensione del consumer o dell'industriale; richiede policy, evidence e audit piu stringenti.

### 18.5 Infrastrutture e utilities

Settore ora aperto come stream di build.

Solver interni correnti:

- `grid-load-flow-lite`
- `water-network-solver`
- `infrastructure-resilience-solver`

### 18.6 Aerospace e difesa

Settore ora aperto come stream di build.

Solver interni correnti:

- `flight-envelope-solver`
- `propulsion-cycle-solver`
- `mission-reliability-solver`

### 18.7 Robotica e autonomia

Settore ora aperto come stream di build.

Solver interni correnti:

- `robot-kinematics-solver`
- `autonomy-safety-solver`
- `sensor-fusion-solver`

### 18.8 Finance e risk systems

Settore ora aperto come stream di build.

Solver interni correnti:

- `monte-carlo-var-solver`
- `stress-scenario-solver`
- `liquidity-contagion-solver`

### 18.9 Ambiente e climate tech

Settore ora aperto come stream di build.

Solver interni correnti:

- `building-thermal-balance-solver`
- `energy-dispatch-solver`
- `watershed-runoff-solver`

### 18.10 Materiali e chimica

Settore ora aperto come stream di build.

Solver interni correnti:

- `reaction-kinetics-solver`
- `diffusion-barrier-solver`
- `rheology-profile-solver`
- `surface-adsorption-solver`

### 18.11 Cosmetica e personal care science

Settore ora aperto come stream di build.

Solver interni correnti:

- `skin-penetration-solver`
- `cosmetic-stability-solver`
- `preservative-efficacy-solver`
- `sensory-profile-solver`

Regola:
le categorie cosmetiche non vanno trattate come semplice consumer UI testing; servono stabilita, esposizione, challenge test ed evidenza sperimentale governata.

### 18.12 Spazio e cosmologia

Settore ora aperto come stream di build.

Solver interni correnti:

- `orbital-mechanics-solver`
- `observation-calibration-solver`
- `stellar-structure-lite-solver`
- `cosmology-parameter-fit-solver`

Regola:
TwinTest puo diventare base di test anche per scienza e osservazione, ma qui le claim dipendono piu da pipeline dati, calibrazione e inferenza che da pura dinamica meccanica.

### 18.13 Regola di avanzamento

Le categorie aggiunte sopra sono state formalmente aperte nel catalogo solver.

Questo non significa che TwinTest sia gia pronto per claim commerciali in tutti questi settori.
Significa invece che:

- esiste una solver library interna iniziale per ogni stream;
- ogni stream puo essere testato in smoke mode;
- il passo successivo per ciascun settore e collegare solver esterni e dataset reali del dominio.

### 18.14 Tassonomia categorie solver

Stato corrente:

- il repository espone un `solver category catalog` con `78` categorie attive;
- ogni categoria ha almeno: `id`, `label`, `sector`, `status`, `description`;
- ogni settore espone i propri `categoryIds` come contratto macchina leggibile;
- la soglia minima richiesta di `almeno 50 categorie` e quindi superata.

Distribuzione iniziale per settore:

- `industry`: 28 categorie
- `private`: 6 categorie
- `personal`: 6 categorie
- `medical`: 6 categorie
- `public_infrastructure`: 4 categorie
- `aerospace_defense`: 4 categorie
- `robotics_autonomy`: 4 categorie
- `finance_risk`: 4 categorie
- `environment_climate`: 4 categorie
- `materials_chemistry`: 4 categorie
- `cosmetic_science`: 4 categorie
- `space_cosmology`: 4 categorie

Funzione della tassonomia:

- mappare `tipologia di test -> categoria solver -> famiglia solver -> adapter`;
- permettere priorita di integrazione piu disciplinate;
- separare il piano di crescita del catalogo da quello dei singoli solver eseguibili.

## 19. Roadmap integrazione solver

Stato corrente della roadmap:

- `78` categorie su `78` sono coperte da una roadmap eseguibile;
- la roadmap e esposta sia nella root API sia nell'endpoint dedicato `GET /solver-roadmap`;
- ogni entry include almeno: `categoryId`, `solverFamily`, `currentPath`, `targetPath`, `priority`, `phase`, `reviewPolicy`, `evidenceMode`.

Distribuzione priorita:

- `p0`: 18 categorie
- `p1`: 55 categorie
- `p2`: 5 categorie

Distribuzione fasi:

- `external_adapter_next`: 59 categorie
- `artifact_pipeline_now`: 9 categorie
- `review_gated_externalization`: 10 categorie

Distribuzione review policy:

- `standard`: 43 categorie
- `human_review_required`: 29 categorie
- `regulated_review_required`: 6 categorie

Regola di prodotto:

- `currentPath` descrive il percorso eseguibile oggi nel runtime TwinTest;
- `targetPath` descrive il backend o la pipeline che deve diventare il riferimento di validazione per claim piu forti;
- `phase` governa l'ordine di integrazione pratica, non il marketing del settore;
- `reviewPolicy` impedisce che medicale, aerospace o safety logic vengano trattati come normali categorie consumer.

Priorita immediate:

- compute / semiconductor: `gem5`, trace ingestion e co-analisi power-thermal;
- safety logic cross-domain: `nuXmv` per interlock, autonomy safety, avionics failover e clinical workflow;
- ODE/DAE core: `SUNDIALS` e `OpenModelica`;
- UQ e reliability: `OpenTURNS`;
- mechatronics e vehicle: `Project Chrono`, poi `CalculiX`.
- cosmetica e formulation science: pipeline artifact-first per challenge test e stabilita, poi backend di trasporto dermico;
- spazio e cosmologia: observation pipelines artifact-first, poi backend scientifici per dinamica e inferenza.

## 20. Libreria manifest solver esterni

Scopo:

- trasformare la roadmap in contract di integrazione effettivi;
- dichiarare come un solver esterno o una pipeline artifact-first deve essere legato a `external_process_json` o `artifact_metrics_json`;
- ridurre il lavoro manuale per il primo binding reale per progetto.

Stato corrente:

- `16` manifest sono gia presenti nel repository;
- `6` manifest sono `p0`;
- `9` manifest sono `p1`;
- `1` manifest e `p2`;
- `13` manifest usano `external_process_json`;
- `3` manifest usano `artifact_metrics_json`;
- `13` wrapper locali sono gia presenti in `scripts/solver-wrappers/`.
- `13` manifest `external_process_json` sono ora in stato `runtime_ready_local_driver`.

Solver coperti nella prima libreria:

- `SUNDIALS`
- `OpenModelica`
- `nuXmv`
- `gem5`
- `gem5 trace bundle`
- `OpenTURNS`
- `Project Chrono`
- `CalculiX`
- `OpenFOAM`
- `Xyce`
- `Chemical Transport Backend`
- `Dermal and Formulation Backend`
- `Orbital Mechanics Backend`
- `Scientific Inference Backend`

Contenuto minimo di ogni manifest:

- `id`, `solver`, `adapterType`, `priority`, `status`, `invocationMode`;
- `categories` coperte;
- `configurationFields` richiesti;
- `expectedMetrics` attesi;
- `bindingTemplate` gia pronto da completare;
- note operative sul wrapper o sul bundle artifact.

Regola operativa:

- un manifest non sostituisce il solver;
- un manifest definisce il contratto minimo serio per collegare il solver al runtime TwinTest;
- i manifest `contract_ready` possono essere collegati subito con wrapper locali reali;
- i manifest `dataset_pipeline_ready` sono il percorso corretto quando il valore di validazione sta prima nei trace o nei bundle misurati che nell'esecuzione online.

Regola wrapper:

- il wrapper non simula il solver;
- il wrapper supervisiona un `solverBinary` reale o un driver locale reale;
- il wrapper normalizza in JSON i risultati del solver o i file raw prodotti dal solver;
- il wrapper deve fallire esplicitamente se il solver non e disponibile o se l'output non e parsabile.

Regola driver locale:

- il driver locale e il default runtime serio quando il binario vendor non e presente nel workspace o nella macchina;
- il driver locale produce metriche numeriche vere, non testo narrativo o score mock;
- il passaggio al solver vendor avviene senza cambiare il contratto API: si sovrascrivono `solverBinary`, `solverArgs`, `solverCwd`, `solverEnv`;
- `runtime_ready_local_driver` significa che il manifest e gia eseguibile end-to-end nel repository corrente.

## 21. Native solver readiness

Scopo:

- distinguere in modo esplicito tra solver vendor realmente disponibili sulla macchina e fallback locali gia pronti;
- evitare che la mancanza di un binario esterno emerga solo a runtime;
- permettere una migrazione pulita da `localDriverId` a `solverBinary` senza cambiare il resto del binding.

Contratto API:

- root API: `nativeSolverReadinessSummary`, `nativeSolverReadiness`
- endpoint dedicato: `GET /solver-native-readiness`

Stati principali:

- `native_available`
- `native_missing`
- `dataset_pipeline_ready`

Regola operativa:

- se un vendor binary non e presente, TwinTest non mente: il catalogo lo segnala come `native_missing`;
- se il manifest ha `localDriverId`, il percorso resta comunque eseguibile;
- quando il vendor binary viene installato, il readiness cambia senza richiedere refactor del progetto;
- il readiness e un preflight di macchina, non una garanzia che il modello del solver sia gia calibrato.
- stato corrente del repository: `13` path `external_process_json` in fallback locale pronto e `3` path artifact-first.

## 22. AI solver autobind via API

Scopo:

- permettere all'AI di creare i solver binding via API, non solo via regole statiche;
- lasciare all'AI la scelta strategica, ma non la scrittura arbitraria della configurazione;
- mantenere TwinTest auditabile anche quando la decisione iniziale viene dal modello.

Contratto operativo:

- endpoint: `POST /projects/{id}/solver-bindings/autobind-ai`
- backend AI: OpenAI Responses API
- attivazione runtime: `TWINTEST_OPENAI_API_KEY`
- modello di default: `gpt-5`
- provider compatibili: `openai` e provider OpenAI-compatible come `groq`
- configurazione cross-provider: `TWINTEST_AI_PROVIDER`, `TWINTEST_AI_API_KEY`, `TWINTEST_AI_MODEL`, `TWINTEST_AI_BASE_URL`

Guardrail:

- l'AI puo scegliere solo tra `compatible builtin solvers` e `candidate manifests` forniti dal runtime;
- TwinTest valida ogni decisione AI prima di applicarla;
- la configurazione finale viene materializzata dal runtime, non generata liberamente dal modello;
- i binding applicati vengono marcati come `bindingMode = ai_autobind` con metadati di decisione.

Regola di prodotto:

- l'AI non sostituisce il solver;
- l'AI non sostituisce il wrapper;
- l'AI seleziona il path corretto entro uno spazio di opzioni ammesse e tracciate;
- questo e il modo corretto di usare l'AI via API in una piattaforma di validazione seria.

Bootstrap runtime:

- `src/server.js` carica automaticamente `.env` prima di risolvere provider, modello e chiavi;
- il loader accetta sia `TWINTEST_AI_PROVIDER=groq` sia `$env:TWINTEST_AI_PROVIDER = "groq"`;
- gli alias brevi `PROVIDER`, `API_KEY`, `AI_MODEL`, `AI_BASE_URL` vengono mappati ai corrispondenti `TWINTEST_AI_*`;
- righe non di assegnazione nel file, per esempio `node src/server.js`, vengono ignorate.

Nota Groq:

- alias `gpt 120oss` viene risolto in `openai/gpt-oss-120b`
- alias `kimi` viene risolto in `moonshotai/kimi-k2-instruct-0905`
- per `groq` TwinTest usa il base URL `https://api.groq.com/openai/v1/responses`
- per compatibilita Groq, il payload AI non invia il campo `store`

## 23. Universal test foundation

Scopo:

- dare a TwinTest una base cross-domain reale, non solo un catalogo di settori;
- riusare primitive di test tra engineering, medicale, cosmetica, materiali e cosmologia;
- separare cio che e veramente universale da cio che resta dominio-specifico.

Contratto API:

- root API: `universalTestFoundationSummary`, `universalTestFoundation`
- endpoint dedicato: `GET /test-foundation`

Contenuto minimo attuale:

- `6` primitive canoniche
- `8` archetipi di test
- `5` evidence mode
- `4` solver modalities
- `3` review tiers
- `6` claim families

Regola di prodotto:

- il foundation layer non sostituisce i solver settoriali;
- il foundation layer definisce il linguaggio comune per descrivere test molto diversi;
- questo e il pezzo che permette a TwinTest di crescere da industriale e medicale verso cosmetica, materiali, space science e altri domini senza rifare l'architettura ogni volta.

## 24. Idea-to-MVP bootstrap

Scopo:

- permettere a un utente di inserire una idea grezza e ottenere subito un progetto compilato, testabile e leggibile come MVP;
- restringere automaticamente la scope a un primo workflow validabile invece di lasciare il progetto a livello di descrizione vaga;
- collegare in un solo passaggio intake, graph compilation, solver binding e first-run readiness.

Contratto API:

- endpoint principale: `POST /ideas/bootstrap`
- endpoint di lettura: `GET /projects/{id}/mvp-blueprint`
- endpoint di refresh: `POST /projects/{id}/mvp-blueprint`

Comportamento attuale del kernel:

- `POST /ideas/bootstrap` crea il progetto;
- genera un documento `idea-intake.md`;
- compila il `Canonical System Graph`;
- esegue `autobind` opzionale con `none`, `builtin` o `ai`;
- persiste un `mvpBlueprint` con statement di prodotto, feature MVP, feature differite, first journey, KPI, gate, readiness e next actions;
- puo mettere in coda subito il primo run se tutti i solver binding risultano risolti.

Dominio wedge per idee generaliste:

- `general_systems`
- template correnti: `workflow`, `service runtime`, `policy guardrail`, `usage telemetry`
- obiettivo: trasformare una idea di servizio, piattaforma, workflow o automazione in un MVP con metriche di completamento, latenza, affidabilita e governance.

Guardrail:

- il bootstrap non sostituisce la raccolta di evidenze numeriche o di dominio quando il progetto e safety-critical o scientifico;
- il blueprint MVP non e marketing copy: e un oggetto di lavoro che espone scope, limiti, readiness e azioni successive;
- se i solver binding restano irrisolti, il blueprint esiste ma il run non parte;
- il refresh del blueprint deve tenere traccia dei nuovi vincoli e aggiornare il `latestMvpBlueprintId` del progetto.

## 25. MVP decision engine

Scopo:

- trasformare il lavoro di bootstrap e i run reali in una decisione di prodotto leggibile e persistita;
- evitare che l'utente debba interpretare manualmente blueprint, gate, KPI e report per capire se l'idea puo andare a pilot;
- chiudere il loop `idea -> blueprint -> run -> decision`.

Contratto API:

- endpoint di lettura: `GET /projects/{id}/mvp-decision`
- endpoint di refresh: `POST /projects/{id}/mvp-decision`

Comportamento attuale del kernel:

- il bootstrap iniziale genera gia una prima `mvpDecision`;
- la refresh del blueprint rigenera anche la decisione;
- la decisione usa il blueprint corrente, lo stato dell'ultimo run e l'ultimo report completato disponibile;
- se un `runId` viene passato alla refresh route, TwinTest usa esplicitamente quel run come base della decisione;
- l'oggetto decisione espone almeno:
  - `recommendation`
  - `status`
  - score di `blueprint readiness`, `validation strength`, `pilot fit`
  - `goSignals`
  - `blockers`
  - `pilotPlan`
  - `claimBoundary`
  - `nextBuildSteps`

Regola di prodotto:

- una decisione MVP senza report reale resta esplicitamente `blocked` o `in_progress`;
- un report passato non basta automaticamente per claim esterni in domini review-gated come cosmetica o space science;
- la decisione deve restare un oggetto auditabile, non un testo motivazionale;
- il `latestMvpDecisionId` del progetto deve sempre riflettere l'ultimo refresh effettivo.

## 26. Pilot workbench

Scopo:

- trasformare la decisione MVP in un piano operativo immediato;
- dare all'utente un punto unico dove leggere backlog, artifact checklist, execution board e pilot packet;
- evitare che il progetto si perda tra blueprint valido e prossimi passi non strutturati.

Contratto API:

- endpoint di lettura: `GET /projects/{id}/pilot-workbench`
- endpoint di refresh: `POST /projects/{id}/pilot-workbench`

Comportamento attuale del kernel:

- il bootstrap iniziale genera gia un primo `pilotWorkbench`;
- la refresh del blueprint e della decisione rigenera anche il workbench;
- il workbench usa blueprint, decisione, ultimo run e ultimo report disponibile;
- se un `runId` viene passato alla refresh route, TwinTest ricalcola il workbench sul run richiesto;
- l'oggetto workbench espone almeno:
  - `summary`
  - backlog `now`, `next`, `later`
  - `artifactChecklist`
  - `pilotPacket`
  - `executionBoard`
  - `nextApiSequence`

Regola di prodotto:

- il workbench non decide da solo se il progetto e pronto: rende operativa la decisione gia calcolata;
- il backlog `now` deve concentrarsi solo su scope, blocker ed evidenze immediate;
- la `artifactChecklist` deve rendere espliciti i requisiti di evidenza mancanti, non nasconderli in testo libero;
- il `latestPilotWorkbenchId` del progetto deve sempre riflettere l'ultimo workbench coerente con blueprint e decisione correnti.

## 27. TwinTest Studio UI

Scopo:

- dare al kernel una interfaccia operativa minima, immediatamente usabile da founder, operator e team tecnici;
- evitare che il primo uso del sistema richieda per forza `PowerShell`, `curl` o client custom;
- mantenere una singola sorgente di verita: la UI usa esattamente le stesse API del kernel.

Contratto attuale:

- route HTML: `GET /studio`
- asset serviti dal kernel: `/studio/styles.css`, `/studio/app.js`

Capacita correnti:

- onboarding commerciale iniziale direttamente da UI con creazione workspace, scelta piano e bootstrap del primo owner;
- registrazione utente, login, sync sessione e logout direttamente nello Studio;
- preferenza esplicita per sessioni `Bearer` in uso umano, con API key workspace mantenuta come fallback tecnico;
- intake di idea, target user, outcome, constraints e domain wedge;
- bootstrap MVP via `POST /ideas/bootstrap`;
- lettura da UI di workspace snapshot con piano, billing, usage e roster membri quando il ruolo lo consente;
- visualizzazione di project summary, graph readiness, blueprint, decision e pilot workbench;
- polling del run baseline;
- refresh di `mvpDecision` e `pilotWorkbench` dal frontend;
- consultazione dei `idea domain guides` per orientare il wedge iniziale.

Regola di prodotto:

- la UI non introduce logica di business separata;
- ogni operazione rilevante deve restare disponibile anche via API;
- la UI serve per accelerare il first-use e il pilot workflow, non per nascondere lo stato tecnico del sistema.

## 28. Commercial workspace foundation

Scopo:

- trasformare TwinTest da kernel tecnico a servizio vendibile in modalita workspace-based;
- separare chiaramente `platform admin`, `tenant workspace` e `workspace API clients`;
- introdurre metering e limiti minimi di piano prima di parlare seriamente di vendita.

Contratto API attuale:

- `GET /commerce/plans`
- `POST /workspaces`
- `GET /workspaces/{id}`
- `GET /workspaces/{id}/usage`
- `GET /workspaces/{id}/api-clients`
- `POST /workspaces/{id}/api-clients`

Comportamento attuale del kernel:

- il `master API key` del kernel puo creare workspace;
- ogni workspace nasce con un primo `owner API client` e una chiave dedicata;
- i `workspace clients` possono autenticarsi senza dipendere dalla chiave master;
- il kernel tiene `usageMeters` per workspace con almeno:
  - `apiCalls`
  - `projectsCreated`
  - `runsCreated`
  - `compilationsCreated`
  - `aiAutobinds`
  - `reportsRead`
- i piani correnti sono esposti via catalogo e applicano limiti minimi su:
  - numero progetti
  - numero run
  - numero API client
  - disponibilita `AI autobind`

Regola di prodotto:

- questo non e ancora billing completo;
- questo e il foundation layer minimo per parlare di tenancy, piani e consumo;
- il percorso commerciale corretto deve passare da chiavi workspace dedicate, non dal `master API key` di sviluppo;
- il metering deve restare auditabile e leggibile via API, non nascosto in log opachi.

## 29. Subscription and billing summary

Scopo:

- dare a ogni workspace uno stato commerciale esplicito, non solo un piano statico;
- esporre billing summary e cambio piano via API prima di integrare un provider di pagamento reale;
- preparare TwinTest a trial, upgrade e gestione account in modo tracciabile.

Contratto API attuale:

- `GET /workspaces/{id}/billing`
- `POST /workspaces/{id}/billing/checkout-session`
- `GET /workspaces/{id}/billing/invoices`
- `GET /workspaces/{id}/billing/events`
- `POST /workspaces/{id}/subscription`
- `POST /billing/webhooks/simulated`

Comportamento attuale del kernel:

- ogni workspace ha una `subscription` persistita;
- stati correnti supportati: `trialing`, `active`, `past_due`, `canceled`;
- ogni workspace puo avere `billingCustomer`, `billingCheckoutSession`, `billingInvoice` e `billingEvent` persistiti;
- il kernel espone un provider runtime-ready `simulated_stripe` per sviluppare checkout, webhook e UI commerciale senza SaaS esterno;
- il provider `http_json` permette anche checkout verso un provider billing esterno HTTP-compatible;
- il billing summary espone almeno:
  - `plan`
  - `subscription`
  - `billingEmail`
  - `recurringChargeUsd`
  - `estimatedNextInvoiceUsd`
  - `upgradeRecommendation`
  - `customerCount`
  - `openCheckoutSessions`
  - `latestCheckoutSession`
  - `latestInvoice`
  - `invoiceStatusCounts`
  - `eventCount`
  - `utilization`
  - `usage`
- il cambio piano aggiorna sia il `planId` del workspace sia la subscription.

Regola di prodotto:

- questo non sostituisce Stripe o un provider billing reale;
- questo e il contratto applicativo minimo per collegarsi poi a billing esterno senza rifare la semantica del dominio;
- il billing summary deve restare spiegabile e leggibile da API e UI;
- checkout, invoice ed eventi webhook devono lasciare trail persistito, non solo mutare lo stato finale;
- il cambio piano non deve essere una mutazione opaca: deve risultare evidente nello stato del workspace.

## 30. User sessions and RBAC

Scopo:

- permettere uso umano del prodotto senza dipendere solo da API key machine-to-machine;
- distinguere chiaramente utenti, membership workspace e API client tecnici;
- introdurre un RBAC reale prima di parlare seriamente di collaborazione commerciale.

Contratto API attuale:

- `POST /auth/users/register`
- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/logout`
- `GET /workspaces/{id}/members`
- `POST /workspaces/{id}/members`

Comportamento attuale del kernel:

- gli utenti applicativi sono persistiti con password hashata;
- il login emette una sessione `Bearer` scoped al workspace;
- le sessioni sono revocabili;
- ogni membership workspace ha un ruolo esplicito;
- ruoli correnti:
  - `owner`
  - `admin`
  - `operator`
  - `viewer`
- il routing applica RBAC almeno sui blocchi:
  - gestione membri e API client
  - creazione progetto e mutazioni operative
  - letture tecniche consentite anche a `viewer`

Regola di prodotto:

- le sessioni utente non sostituiscono le API key tenant;
- le API key restano il path corretto per agenti, CI e integrazioni server-to-server;
- le sessioni sono il path corretto per utenti umani, Studio UI e backoffice;
- Studio deve presentare prima il path session-first e solo dopo il fallback tecnico con API key;
- il RBAC deve essere applicato nel routing e non solo esistere come metadato.

## 31. Store backend runtime

Scopo:

- togliere il lock architetturale del solo JSON file store;
- introdurre un backend SQL reale senza dipendenze esterne per ambienti locali o small deployment;
- preparare il passaggio futuro a Postgres senza cambiare il contratto del platform layer.

Contratto runtime attuale:

- `TWINTEST_STORE_BACKEND=json|sqlite|postgres_http`
- `TWINTEST_DATA_FILE` per il path del backend JSON
- `TWINTEST_DATABASE_FILE` per il path del backend SQLite
- `TWINTEST_POSTGRES_BASE_URL` per il backend `postgres_http`
- `TWINTEST_POSTGRES_API_KEY` per il backend `postgres_http`
- `TWINTEST_POSTGRES_SCHEMA` per il backend `postgres_http`
- `TWINTEST_POSTGRES_TABLE` per il backend `postgres_http`

Comportamento attuale del kernel:

- esiste una store abstraction comune con `snapshot()` e `transact()`;
- il backend di default resta `json`;
- il backend `sqlite` usa `node:sqlite` nativo del runtime Node 24;
- il backend `postgres_http` usa un adapter `fetch` verso un gateway SQL/JSON esterno e persiste lo stesso state model in `JSONB`;
- entrambi i backend persistono lo stesso state model applicativo;
- i test coprono persistenza reale su restart per `sqlite` e `postgres_http`.

Regola di prodotto:

- questo non sostituisce ancora un backend Postgres da produzione;
- ma elimina il vincolo di avere solo un file JSON monolitico come persistenza;
- il resto del kernel non deve conoscere il backend concreto dello store;
- `postgres_http` e il contratto adapter-ready corretto per collegare poi un Postgres reale senza rifare il domain model.

## 32. Persistent run queue and worker mode

Scopo:

- separare l'HTTP server dalla computazione run;
- rendere i run persistiti, drainabili e osservabili anche fuori dal processo web;
- preparare TwinTest a code worker e deploy multi-processo.

Contratto API e runtime attuale:

- `GET /ops/run-queue`
- `POST /ops/run-queue/drain-once`
- `TWINTEST_RUN_MODE=embedded|external`
- `TWINTEST_WORKER_POLL_MS`
- script worker dedicato: `node src/worker.js`

Comportamento attuale del kernel:

- ogni `run` genera anche un `runQueueJob` persistito;
- in `embedded` mode il server puo ancora drenare la coda da solo per dev e test;
- in `external` mode il server HTTP si limita a mettere il run in coda;
- il worker esterno chiama `processQueuedRunsOnce()` in loop e completa i run;
- la coda resta leggibile via API e supporta drain manuale per recovery.

Regola di prodotto:

- il web process non deve essere il punto unico di esecuzione lunga;
- i run devono poter sopravvivere a restart del server HTTP;
- la coda deve essere persistita e visibile, non implicita in timer in-memory.

## 33. Artifact storage and document file intake

Scopo:

- gestire file reali di progetto e run come oggetti persistiti e scaricabili;
- separare metadata applicativi e bytes fisici degli asset;
- preparare TwinTest a ingestion piu seria di dataset, report e allegati di validazione.

Contratto API e runtime attuale:

- `POST /projects/{id}/artifacts`
- `GET /projects/{id}/artifacts`
- `POST /projects/{id}/documents/import-artifact`
- `GET /artifacts/{id}`
- `GET /artifacts/{id}/content`
- `TWINTEST_ARTIFACT_ROOT`
- `TWINTEST_ARTIFACT_STORE_BACKEND`
- `TWINTEST_ARTIFACT_BUCKET`
- `TWINTEST_ARTIFACT_PUBLIC_BASE_URL`
- `TWINTEST_ARTIFACT_REMOTE_BASE_URL`
- `TWINTEST_ARTIFACT_REMOTE_API_KEY`

Comportamento attuale del kernel:

- gli artifact sono persistiti su filesystem locale dedicato;
- ogni artifact ha metadata applicativi, `sha256`, `byteLength`, `mediaType` e `storagePath`;
- il backend default resta `local_filesystem`;
- il backend `s3_layout_filesystem` usa layout `bucket/objectKey` e puo esporre `objectUrl` per integrazioni CDN/object-store-like;
- il backend `remote_http_object_store` scrive e legge via `fetch` su endpoint HTTP object-compatible e mantiene lo stesso contratto artifact;
- il project summary tiene traccia del numero artifact associati;
- `import-artifact` puo trasformare in documento compilabile file `txt`, `md`, `json`, `yaml`, `xml`, `html`, `csv`, `tsv`, `pdf`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `doc`, `xls`, `ppt`;
- OOXML e OpenDocument vengono letti strutturalmente dal container ZIP;
- PDF viene estratto in modalita euristica dai content stream testuali;
- i formati legacy binari `doc/xls/ppt` usano fallback `printable strings` per intake operativo;
- i report di run completati vengono esportati automaticamente anche come artifact JSON persistiti;
- il contenuto binario e scaricabile via API dedicata con `Content-Type` coerente.

Regola di prodotto:

- un file non deve vivere solo come blob opaco in memoria o nel body di una singola request;
- i bytes persistiti devono avere metadata leggibili e un path di retrieval stabile;
- la scelta del backend artifact deve essere separata dal dominio applicativo e non richiedere riscrittura delle API;
- l'ingestion documentale deve essere esplicita sul livello di affidabilita dell'estrazione;
- PDF e formati legacy binari sono supportati in modalita `best effort`, non ancora come parser semantici full-fidelity o regulatory-grade.

## 34. Billing provider lifecycle and object-style artifact backend

Scopo:

- spingere TwinTest oltre il foundation commerciale statico;
- rendere persistiti checkout session, invoice ed eventi webhook;
- preparare il passaggio successivo a provider esterni e object storage veri senza cambiare il contratto API.

Contratto runtime attuale:

- provider billing runtime-ready: `simulated_stripe`, `http_json`
- secret webhook: `TWINTEST_BILLING_WEBHOOK_SECRET`
- backend artifact supportati: `local_filesystem`, `s3_layout_filesystem`, `remote_http_object_store`

Comportamento attuale del kernel:

- `POST /workspaces/{id}/billing/checkout-session` crea una sessione di checkout persistita con `checkoutUrl`;
- `POST /billing/webhooks/simulated` applica eventi firmati e aggiorna subscription, invoice ed event log;
- `GET /workspaces/{id}/billing/invoices` e `GET /workspaces/{id}/billing/events` espongono il trail commerciale;
- il backend `s3_layout_filesystem` resta locale nel repo ma impone semantica `bucket/objectKey`, utile per preparare CDN e object store esterni;
- il provider `http_json` chiama un endpoint esterno `/checkout-sessions` via `fetch` e persiste il risultato nel domain model TwinTest;
- il backend `remote_http_object_store` chiama endpoint remoti `PUT/GET /objects/{storagePath}` via `fetch` e preserva metadata locali;
- il root endpoint espone il backend artifact attivo e i backend disponibili.

Regola di prodotto:

- checkout, invoice, webhook e artifact backend devono essere sostituibili senza rompere il dominio;
- simulare un provider non basta per claim production-ready, ma serve per bloccare il contratto corretto prima dell'integrazione SaaS reale;
- il passaggio successivo corretto resta: provider billing esterno vero + object storage remoto vero.

## 35. Postgres production-store adapter

Scopo:

- preparare TwinTest a uno store di produzione oltre `json` e `sqlite`;
- fissare un contratto runtime per Postgres prima del collegamento a un database live;
- mantenere invariato il domain model del kernel durante il passaggio di backend.

Contratto runtime attuale:

- backend store `postgres_http`
- trasporto configurato da:
  - `TWINTEST_POSTGRES_BASE_URL`
  - `TWINTEST_POSTGRES_API_KEY`
  - `TWINTEST_POSTGRES_SCHEMA`
  - `TWINTEST_POSTGRES_TABLE`

Comportamento attuale del kernel:

- `postgres_http` crea schema e tabella se mancanti tramite gateway SQL/JSON;
- legge e persiste un singolo documento di stato applicativo in colonna `JSONB`;
- usa `SELECT` e `INSERT ... ON CONFLICT DO UPDATE` per mantenere semantica identica agli altri store;
- il root endpoint espone il `storeRuntime` attivo con backend, schema, tabella e stato configurazione;
- i test verificano persistenza reale su restart anche per questo path.

Regola di prodotto:

- questo non equivale ancora a dire che un cluster Postgres live sia gia collegato in questo ambiente;
- equivale pero a bloccare il contratto di integrazione corretto e testarne il comportamento nel repo;
- il prossimo passo corretto resta collegare un gateway o driver Postgres reale in deploy.

## 36. Local Postgres gateway and activation path

Scopo:

- permettere il collegamento rapido a un Postgres reale anche senza driver Node esterni nel repo;
- evitare che il backend `postgres_http` resti solo teorico;
- dare un percorso operativo corto per sviluppo e staging.

Contratto runtime attuale:

- file compose: `infra/postgres.compose.yml`
- gateway locale: `node src/postgres-gateway.js`
- script package: `npm run postgres:gateway`
- script package: `npm run postgres:up`, `npm run postgres:ps`, `npm run postgres:down`
- modalita gateway:
  - `docker_exec`
  - `host_psql`

Comportamento attuale del kernel:

- in modalita `docker_exec` il gateway esegue `psql` dentro il container `twintest-postgres` via `docker exec`;
- in modalita `host_psql` il gateway usa `psql` installato sulla macchina host;
- il path operativo locale attuale nel repo usa `.env` gia predisposto su `postgres_http` + gateway `docker_exec`;
- il gateway espone almeno:
  - `GET /health`
  - `POST /query`
- il contratto `/query` riceve `sql` e `params`, interpola i placeholder e restituisce `rows` JSON;
- il gateway deve sopprimere il chatter di `psql` e tollerare eventuali command tag residui, cosi anche `CREATE` e `INSERT` restano compatibili con il contract JSON;
- il gateway deve consegnare SQL a `psql` via `stdin`, non solo via argomento `-c`, per evitare rotture su payload di stato grandi;
- se la porta del gateway e gia occupata, il bootstrap deve emettere un errore esplicito che dica di riallineare `TWINTEST_POSTGRES_GATEWAY_PORT` e `TWINTEST_POSTGRES_BASE_URL`;
- se il gateway non e raggiungibile, il backend `postgres_http` deve emettere un errore operativo chiaro con URL e porta attesa;
- se il gateway risponde `500`, il backend `postgres_http` deve includere anche il dettaglio del body errore nel messaggio finale, cosi cause operative come `spawn EPERM` non restano nascoste;
- i test coprono interpolazione SQL, wrapping `COPY`, executor e request handler del gateway.

Regola di prodotto:

- `psql` sull'host non e obbligatorio se Docker e disponibile;
- il percorso piu corto in locale e: container Postgres + gateway locale + TwinTest `postgres_http`;
- in produzione il gateway locale puo essere sostituito da un gateway SQL/JSON o da un driver Postgres diretto senza cambiare il contract del platform layer.

## 37. Local Studio startup clarification

Scopo:

- evitare false diagnosi quando TwinTest non mostra la UI locale;
- chiarire la differenza tra root API e schermata Studio;
- standardizzare il comportamento quando la porta default e gia occupata.

Regola runtime:

- la UI locale e servita su `/studio`, non sulla root `/`;
- TwinTest deve poter leggere sia `PORT` sia `TWINTEST_PORT`;
- se la porta scelta e gia occupata, il bootstrap deve emettere un errore esplicito che dica di scegliere una porta libera e aprire `/studio`.

## 38. Studio bilingual localization

Scopo:

- rendere Studio usabile anche per operatori italiani senza fork della UI;
- mantenere una sola base frontend per ambienti commerciali e tecnici;
- evitare traduzioni manuali parziali o incoerenti nei riepiloghi dinamici.

Regola runtime:

- Studio supporta almeno `en` e `it`;
- la lingua puo essere scelta dall'operatore e viene persistita localmente;
- in assenza di scelta esplicita, Studio puo preferire l'italiano quando il browser dell'utente e italiano;
- la cromatura principale della UI e i riepiloghi visibili del workbench devono poter essere localizzati.

## 39. Studio UX clarification for access, billing and platform coverage

Scopo:

- ridurre la confusione tra `login umano`, `fallback tecnico`, `workspace commerciale` e `bootstrap MVP`;
- evitare che i badge del form domini vengano letti come copertura totale della piattaforma;
- rendere il billing snapshot piu leggibile e meno “raw API” per operatori e buyer.

Regola runtime:

- Studio deve presentare prima il percorso `session-first` per uso umano e solo dopo il fallback tecnico con API key;
- il blocco di creazione workspace deve essere presentato come azione opzionale, non come prerequisito per ogni uso di Studio;
- la UI deve distinguere chiaramente tra:
  - `domini eseguibili/compilabili oggi`
  - `settori piattaforma`
  - `categorie solver`
- il riepilogo runtime deve esporre almeno numero di domini eseguibili, settori, categorie e piani;
- il riepilogo workspace deve mostrare piano, stato commerciale, uso e team con semantica leggibile, non solo campi tecnici;
- la copertura piattaforma deve essere visibile nello Studio stesso, senza obbligare l'utente ad andare sulla root API.

## 40. Stato operativo snapshot (2026-04-05)

Stato verificato in runtime locale:

- suite test integrata `node --test --test-isolation=none`: `49/49` pass, `0` fail;
- copertura verificata su pipeline `idea -> compile -> bind -> run -> report`, AI autobind, decision engine e pilot workbench;
- Studio con percorso `session-first` per operatori umani, fallback tecnico API key e localizzazione `en/it`;
- backend validati in test per `sqlite`, `postgres_http`, coda persistente con worker esterno, artifact storage locale/s3-layout/http;
- catalogo solver con domini, settori e categorie disponibili via endpoint dedicati e vista Studio.

Valutazione attuale:

- TwinTest e in stato `commercial alpha` (base forte e funzionante, non ancora `commercial GA`).

Gap principali per passaggio a `commercial GA`:

1. hardening infrastruttura produzione: backup/restore, secret rotation, health checks estesi, runbook DR;
2. security/compliance: policy rate limiting produzione, retention audit log, controlli sessione e attivita sospette;
3. billing reale end-to-end: webhooks firmati, riconciliazione pagamenti, fatturazione e policy fiscali operative;
4. SRE e performance: test di carico con SLO ufficiali, alerting e procedure operative on-call;
5. operation e go-to-market: onboarding guidato, documentazione operativa completa, support workflow con SLA.

Prossimo obiettivo consigliato:

- chiudere il `production readiness gate` con checklist misurabile e blocco release se un requisito critico non e soddisfatto.

## 41. GA hardening runtime (2026-04-05)

Obiettivo:

- passare da dichiarazione qualitativa a `GA gate` verificabile via API.

Implementazione runtime:

- rate limiting server-side con risposta `429` e `Retry-After`;
- lockout login anti brute-force dopo tentativi falliti ripetuti;
- webhook billing con firma HMAC SHA-256 (`t=<timestamp>,v1=<signature>`) e tolleranza timestamp configurabile;
- retrocompatibilita mantenuta in modalita `billing webhook mode = auto` con secret header legacy;
- endpoint operativo `GET /ops/health` per salute runtime;
- endpoint operativo `GET /ops/ga-readiness` con checklist e stage:
  - `commercial_alpha`
  - `ga_candidate_with_warnings`
  - `commercial_ga_ready`
- root API estesa con `gaReadinessSummary`.

Regola di rilascio GA:

- TwinTest puo essere dichiarato `commercial_ga_ready` solo con `criticalCount = 0` nel payload di `GET /ops/ga-readiness`.
- la suite automatica include un test dedicato che dimostra il passaggio a `commercial_ga_ready` in configurazione hardening completa.

## 42. Local stable GA profile (2026-04-05)

Profilo locale applicato per avvio stabile senza dipendenze esterne obbligatorie:

- `store backend = sqlite`;
- `run mode = external`;
- `artifact backend = s3_layout_filesystem` con bucket locale;
- `TWINTEST_API_KEY` non default;
- `TWINTEST_BILLING_WEBHOOK_SECRET` non default;
- `TWINTEST_BILLING_WEBHOOK_MODE = hmac_sha256`.

Risultato verifica:

- avvio kernel confermato su `http://localhost:3100`;
- endpoint `GET /ops/ga-readiness` in questo profilo restituisce `commercial_ga_ready` con `criticalCount = 0` e `warningCount = 0`.

## 43. Split release freemium vs paid (2026-04-05)

Obiettivo:

- separare in modo esplicito il rilascio gratuito dal rilascio commerciale.

Implementazione:

- nuovo `offer profile` runtime: `full | freemium | paid`;
- profilo `freemium`:
  - catalogo piani esposto solo su `freemium`;
  - default workspace plan `freemium`;
  - blocco piani paid in creazione workspace e subscription update;
  - endpoint sensibili di integrazione solver (`/solver-roadmap`, `/solver-manifests`, `/solver-native-readiness`) non esposti in root e bloccati con `403`;
- profilo `paid`:
  - catalogo piani esposto su `starter`, `growth`, `enterprise`;
  - piano `freemium` non disponibile;
- root API e endpoint `GET /commerce/plans` ora riflettono il profilo attivo.

Packaging repository:

- cartella `release/freemium` con `.env.example` e script di avvio dedicati;
- `release/README.md` come indice operativo del package rilasciato;
- il package `paid` resta gestito a livello runtime (`offer profile paid`) ma non viene pubblicato in questa release Git.
