# Putzplan App

Eine React-basierte Webanwendung zur Verwaltung von Putzplänen mit automatischer Aufgabenrotation.

## Features

- Automatische Aufgabenrotation basierend auf Häufigkeit
- Verwaltung von Personen und Aufgaben
- Druckansicht für den Putzplan
- Responsive Design

## Docker Setup (Empfohlen)

### Voraussetzungen
- Docker Desktop installiert
- Docker Compose verfügbar

### Start der Anwendung

1. **Anwendung starten:**
   ```bash
   docker-compose up -d
   ```

2. **Anwendung im Browser öffnen:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

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
- Öffnen Sie: http://localhost/api/setup
- Dies lädt Standard-Personen und -Aufgaben

## Manuelle Ausführung

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Technologie-Stack

- **Frontend**: React 19, React Router
- **Backend**: Node.js, Express, SQLite
- **Datenbank**: SQLite mit automatischer Initialisierung
- **Container**: Docker mit nginx für das Frontend

## Ports

- Frontend: 80 (HTTP)
- Backend: 3001 (API)

## Datenbank

Die SQLite-Datenbank wird automatisch erstellt und mit Standarddaten gefüllt. Die Datenbankdatei wird als Volume gemountet, sodass Daten zwischen Container-Neustarts erhalten bleiben.

