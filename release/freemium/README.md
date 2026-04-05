# TwinTest Freemium Release

Questo profilo forza la piattaforma in modalita `freemium`:

- catalogo piani esposto: solo `freemium`;
- default workspace plan: `freemium`;
- blocco creazione workspace con piani paid.

Avvio server:

```powershell
.\start-server.ps1
```

Avvio worker (richiesto con `TWINTEST_RUN_MODE=external`):

```powershell
.\start-worker.ps1
```
