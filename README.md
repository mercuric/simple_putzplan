# Putzplan App

Eine React-basierte Webanwendung zur Verwaltung von Putzplänen mit automatischer Aufgabenrotation.

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

