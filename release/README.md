# TwinTest Release Profiles

Questa cartella contiene il package rilasciato ora:

- `release/freemium`: versione gratuita rilasciabile.

Il profilo freemium ha:

- `.env.example` dedicato;
- script `start-server.ps1` e `start-worker.ps1`;
- runtime isolato per porta e file dati.

Uso rapido:

```powershell
cd release/freemium
.\start-server.ps1
```

Gli script creano `.env` da `.env.example` se manca.
