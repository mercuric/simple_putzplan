# Putzplan App

Eine React-basierte Webanwendung zur Verwaltung von Putzplänen mit automatischer Aufgabenrotation.

## Ziel und Funktionsweise

Der Putzplan adressiert WGs und Hausprojekte und wird vollständig lokal betrieben – ohne Cloud und ohne Sammlung historischer Nutzungsdaten.

- Personenverwaltung: Anlage von Personen mit Name, Farbe und Reihenfolge.
- Aufgabenverwaltung: Anlage von Aufgaben mit Name und Häufigkeit in Wochen (z. B. 1 = wöchentlich, 2 = zweiwöchentlich, 4 = vierwöchentlich).
- Automatische Wochenplanung: Für jede Kalenderwoche wird die Zuweisung deterministisch berechnet; es werden keine vergangenen Wochen gespeichert.

Vorteile
- Zustandslos (stateless): Der Plan kann jederzeit gestoppt/gestartet werden; es sind keine Migrationen oder Nachpflege historischer Daten nötig.
- Faire Verteilung: Aufgaben rotieren gleichmäßig über alle Personen, so dass die wöchentliche Belastung möglichst ausgeglichen ist.
- Langfristige Stabilität: Die Verteilung bleibt über Jahre konsistent, da sie stets neu und nachvollziehbar berechnet wird.

Verteilungslogik (Rotation)
- Aufgaben werden nach Häufigkeit absteigend sortiert (selten → häufig), um Kollisionen zu reduzieren und die Last gleichmäßig zu streuen.
- Jede Aufgabe rotiert in Abhängigkeit ihrer Häufigkeit im Wochenraster zur nächsten Person (Round‑Robin bezogen auf die feste Personenreihenfolge).
- Das System‑Startdatum wird auf einen Montag normalisiert, sodass Wochen einheitlich als Montag–Sonntag betrachtet werden.

## Features

- Automatische Aufgabenrotation basierend auf Häufigkeit
- Verwaltung von Personen und Aufgaben
- Druckansicht für den Putzplan
- Responsive Design

## Docker Deployment (Empfohlen)

### Voraussetzungen
- Docker Desktop installiert
- Docker Compose verfügbar

### Start der Anwendung

1. **Anwendung starten:**
   ```bash
   docker-compose up -d --build
   ```

2. **Anwendung im Browser öffnen:**
   - Frontend: http://localhost:8085 (konfigurierbar über docker-compose Port-Mapping)
   - Backend API: intern erreichbar (kein Host-Port-Mapping)

3. **Anwendung stoppen:**
   ```bash
   docker-compose down
   ```

4. **Logs anzeigen:**
   ```bash
   docker-compose logs -f
   ```

### Erste Einrichtung

Nach dem ersten Start können Sie die Standarddaten laden:
- Öffnen Sie: http://localhost:8085/api/setup (oder über Ihre Subdomain)
- Dies lädt Standard-Personen und -Aufgaben

## Entwicklung (optional)
Für lokale Entwicklung siehe CONTRIBUTING.md.

## Technologie-Stack

- **Frontend**: React 19, React Router
- **Backend**: Node.js, Express, SQLite
- **Datenbank**: SQLite mit automatischer Initialisierung
- **Container**: Docker mit nginx für das Frontend

## Ports

- Frontend (Container): 80 (Nginx). Host-Port standardmäßig auf 8085 gemappt.
- Backend (Container): 3001 (API). Kein Host-Port-Mapping (intern erreichbar).

## Datenbank

Die SQLite-Datenbank wird automatisch erstellt und mit Standarddaten gefüllt. Die Datenbankdatei wird über ein benanntes Volume persistiert:

- Volume: `putzplan-data` → gemountet nach `/app/data`
- Pfad per Env: `DB_PATH=/app/data/putzplan.db`

## Portainer-Deployment

1. In Portainer einen Stack anlegen und die `docker-compose.yml` verwenden.
2. Optional Host-Port für das Frontend anpassen (z. B. `8085:80`).
3. Nach dem Start einmal `http://<host>:<frontend_port>/api/setup` aufrufen.

## Reverse Proxy und Subdomain

- Empfohlen: Nur der Reverse Proxy (z. B. Nginx) veröffentlicht 80/443.
- Subdomain → Reverse Proxy → `http://<host>:8085` (Frontend). `/api` wird vom Frontend-Nginx intern an das Backend proxyt.

## Lizenz
Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE`.

