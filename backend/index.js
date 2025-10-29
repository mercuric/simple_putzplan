const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const util = require('util'); // Für promisify
const cors = require('cors'); // NEU: CORS für Cross-Origin-Anfragen

const app = express();
app.use(cors()); // NEU: CORS aktivieren
app.use(express.json()); // NEU: Für die Verarbeitung von JSON-Anfragen
const port = 3001; // Ändern Sie den Port bei Bedarf

// Datenbank-Initialisierung
const configuredDbPath = process.env.DB_PATH || path.resolve(__dirname, 'putzplan.db');
const dbDir = path.dirname(configuredDbPath);
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (e) {
  console.error('Fehler beim Erstellen des DB-Verzeichnisses:', e.message);
}
const dbPath = configuredDbPath;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
  } else {
    console.log('Verbindung zur SQLite-Datenbank hergestellt.');
    db.serialize(() => {
      // Tabelle für SystemConfig
      db.run(`CREATE TABLE IF NOT EXISTS SystemConfig (
        id INTEGER PRIMARY KEY,
        startDate TEXT
      )`);

      // Tabelle für Persons
      db.run(`CREATE TABLE IF NOT EXISTS Persons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        'order' INTEGER NOT NULL UNIQUE
      )`);

      // Tabelle für Tasks
      db.run(`CREATE TABLE IF NOT EXISTS Tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        frequency INTEGER NOT NULL
      )`);

      // Initialisiere SystemConfig, falls leer
      db.get(`SELECT COUNT(*) AS count FROM SystemConfig WHERE id = 1`, (err, row) => {
        if (err) {
          console.error('Fehler beim Zählen von SystemConfig:', err.message);
          return;
        }
        if (row.count === 0) {
          const initialStartDate = '2025-01-20'; // Das gewünschte Startdatum
          db.run(`INSERT INTO SystemConfig (id, startDate) VALUES (1, ?)`, initialStartDate, (err) => {
            if (err) {
              console.error('Fehler beim Einfügen von SystemConfig:', err.message);
            } else {
              console.log('SystemConfig initialisiert mit Startdatum:', initialStartDate);
            }
          });
        }
      });
    });
  }
});

// Promisify SQLite methods
const dbGet = util.promisify(db.get).bind(db);
const dbAll = util.promisify(db.all).bind(db);
const dbRun = util.promisify(db.run).bind(db);

// Hilfsfunktion zur Wochenberechnung
function getWeekNumber(date, systemStartDate) {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    // Sicherstellen, dass beide Daten auf den Start des Tages (Mitternacht UTC) gesetzt sind, um genaue Tagesunterschiede zu berechnen
    const d1 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = Date.UTC(systemStartDate.getFullYear(), systemStartDate.getMonth(), systemStartDate.getDate());

    const diffTime = d1 - d2;
    const diffDays = Math.floor(diffTime / oneDay);
    // Wochennummer (startet bei 0 für die Woche des systemStartDate)
    return Math.floor(diffDays / 7);
}

// Rotationslogik
async function calculateAssignments(persons, tasks, targetWeekNumber) {
    const assignments = [];
    const personsSorted = persons.sort((a, b) => a.order - b.order);
    const numPersons = personsSorted.length;

    // 1. Aufgaben nach Rhythmus sortieren (absteigend)
    const sortedTasks = tasks.sort((a, b) => b.frequency - a.frequency);

    let taskIndex = 0; // Um die 'Standard'-Startperson zu bestimmen
    for (const task of sortedTasks) {
        // Die Person, die diese Aufgabe in Woche 0 (des Systems) zugewiesen bekommen hätte,
        // wenn initialRotationOffset 0 wäre und die Aufgabe an Index `taskIndex` steht.
        const basePersonOffset = taskIndex % numPersons;
        
        let assignedPersonIndex = basePersonOffset; // Initialer Index
        
        // Mathematische Formel für die Zuweisung
        // Der Wochen-Offset für die Rotation ist (targetWeekNumber / task.frequency)
        // Dies addieren wir zum initialen Offset und rotieren über die Personen
        if (task.frequency > 0) {
            assignedPersonIndex = (basePersonOffset + Math.floor(targetWeekNumber / task.frequency)) % numPersons;
            if (assignedPersonIndex < 0) { // Sicherstellen, dass der Index positiv ist
                assignedPersonIndex += numPersons; // Korrektur für negative Modulo-Ergebnisse
            }
        }

        const assignedPerson = personsSorted[assignedPersonIndex];
        assignments.push({
            taskName: task.name,
            personName: assignedPerson.name,
            personColor: assignedPerson.color
        });
        taskIndex++;
    }
    return assignments;
}

// API-Endpunkt für den Putzplan
app.get('/api/putzplan', async (req, res) => {
  // console.log('Putzplan-API-Endpunkt aufgerufen - Version 2.0'); // Debug log entfernt
  try {
    const configRow = await dbGet(`SELECT startDate FROM SystemConfig WHERE id = 1`);
    if (!configRow) {
      return res.status(500).json({ error: 'SystemConfig not initialized.' });
    }

    // Wichtig: systemStartDate als UTC-Datum parsen, um Zeitzonenprobleme zu vermeiden
    let systemStartDate = new Date(configRow.startDate + 'T00:00:00Z');

    // Stelle sicher, dass systemStartDate ein Montag (UTC) ist
    const systemStartDayOfWeek = systemStartDate.getUTCDay(); // 0 für Sonntag (UTC), 1 für Montag (UTC), ..., 6 für Samstag (UTC)
    const daysToSubtractForMonday = systemStartDayOfWeek === 0 ? 6 : systemStartDayOfWeek - 1; // Wenn Sonntag (0), dann 6 Tage zurück, sonst dayOfWeek - 1
    systemStartDate.setUTCDate(systemStartDate.getUTCDate() - daysToSubtractForMonday);

    const today = new Date();
    const currentWeekNumber = getWeekNumber(today, systemStartDate);
    // console.log(`Backend: Angepasstes System-Startdatum (Montag): ${systemStartDate.toISOString().split('T')[0]}`); // Debug log entfernt
    // console.log(`Backend: Heutiges Datum: ${today.toISOString().split('T')[0]}, Berechnete aktuelle Wochennummer: ${currentWeekNumber}`); // Debug log entfernt

    const tasks = await dbAll(`SELECT * FROM Tasks`); // Aufgaben direkt laden
    const persons = await dbAll(`SELECT * FROM Persons ORDER BY 'order' ASC`);

    // Bestimme die Anzahl der Wochen, die angezeigt werden sollen.
    // Standardmäßig von -1 (letzte) bis +5 (nächste 5) = 7 Wochen insgesamt.
    // Falls ein 'weeks' Parameter übergeben wird, werden 0 (aktuelle) bis 'weeks'-1 Wochen angezeigt.
    const numWeeksToShow = req.query.weeks ? parseInt(req.query.weeks) : 7;
    const startWeekOffset = req.query.weeks ? 0 : -1;

    // Generiere den Plan für die angeforderten Wochen
    const plan = {};
    for (let i = startWeekOffset; i < startWeekOffset + numWeeksToShow; i++) {
        const targetWeek = currentWeekNumber + i;

        const weekStartDate = new Date(systemStartDate);
        weekStartDate.setUTCDate(systemStartDate.getUTCDate() + targetWeek * 7);

        // Nur Wochen anzeigen, die nicht vor dem System-Startdatum liegen
        if (weekStartDate >= systemStartDate) {
            const assignmentsForWeek = await calculateAssignments(persons, tasks, targetWeek);
            const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
            // console.log(`Backend: Woche ${targetWeek}: Start: ${weekStartDate.toISOString().split('T')[0]}, Ende: ${weekEndDate.toISOString().split('T')[0]}`); // Debug log entfernt

            plan[targetWeek] = {
                startDate: weekStartDate.toISOString().split('T')[0],
                endDate: weekEndDate.toISOString().split('T')[0],
                assignments: assignmentsForWeek
            };
        }
    }
    console.log(`Backend: Anzahl der generierten Wochen: ${Object.keys(plan).length}`); // Debug log hinzugefügt
    res.json(plan);

  } catch (error) {
    console.error('Fehler im Putzplan-API-Endpunkt:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API-Endpunkte für Personen
app.post('/api/persons', async (req, res) => {
  const { id, name, color, order } = req.body;
  if (!id || !name || !color || order === undefined) {
    return res.status(400).json({ error: 'Alle Felder (id, name, color, order) sind erforderlich.' });
  }
  try {
    await dbRun(`INSERT INTO Persons (id, name, color, 'order') VALUES (?, ?, ?, ?)`, id, name, color, order);
    res.status(201).json({ message: 'Person erfolgreich hinzugefügt.' });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/persons', async (req, res) => {
  try {
    const persons = await dbAll(`SELECT * FROM Persons ORDER BY 'order' ASC`);
    res.json(persons);
  } catch (error) {
    console.error('Fehler beim Abrufen der Personen:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/persons/:id', async (req, res) => {
  const { id } = req.params;
  const { name, color, order } = req.body;
  if (!name || !color || order === undefined) {
    return res.status(400).json({ error: 'Alle Felder (name, color, order) sind erforderlich.' });
  }
  try {
    const result = await dbRun(`UPDATE Persons SET name = ?, color = ?, 'order' = ? WHERE id = ?`, name, color, order, id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Person nicht gefunden.' });
    }
    res.status(200).json({ message: 'Person erfolgreich aktualisiert.' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/persons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbRun(`DELETE FROM Persons WHERE id = ?`, id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Person nicht gefunden.' });
    }
    res.status(200).json({ message: 'Person erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen der Person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API-Endpunkte für Aufgaben
app.post('/api/tasks', async (req, res) => {
  const { id, name, frequency } = req.body;
  if (!id || !name || !frequency) {
    return res.status(400).json({ error: 'Alle Felder (id, name, frequency) sind erforderlich.' });
  }

  try {
    await dbRun(`INSERT INTO Tasks (id, name, frequency) VALUES (?, ?, ?)`, 
      id, name, frequency);
    res.status(201).json({ message: 'Aufgabe erfolgreich hinzugefügt.' });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Aufgabe:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await dbAll(`SELECT * FROM Tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgaben:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { name, frequency } = req.body; // initialRotationOffset auch hier
  if (!name || !frequency) {
    return res.status(400).json({ error: 'Alle Felder (name, frequency) sind erforderlich.' });
  }
  try {
    const result = await dbRun(`UPDATE Tasks SET name = ?, frequency = ? WHERE id = ?`, name, frequency, id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Aufgabe nicht gefunden.' });
    }
    res.status(200).json({ message: 'Aufgabe erfolgreich aktualisiert.' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Aufgabe:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbRun(`DELETE FROM Tasks WHERE id = ?`, id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Aufgabe nicht gefunden.' });
    }
    res.status(200).json({ message: 'Aufgabe erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API-Endpunkt für Setup (zum Hinzufügen von Initialdaten)
app.get('/api/setup', async (req, res) => {
  try {
    // Bestehende Daten löschen
    await dbRun(`DELETE FROM Persons`);
    await dbRun(`DELETE FROM Tasks`);

    // Standard-Personen hinzufügen
    const personsToInsert = [
      { id: 'p1', name: 'Mona', color: '#ADD8E6', order: 0 }, // Hellblau
      { id: 'p2', name: 'Paul', color: '#90EE90', order: 1 }, // Hellgrün
      { id: 'p3', name: 'Simon', color: '#FFFFE0', order: 2 }, // Hellgelb
      { id: 'p4', name: 'Kristiana', color: '#FFB6C1', order: 3 }, // Hellrosa
      { id: 'p5', name: 'Karlo', color: '#FFA07A', order: 4 }, // Hellorange
    ];
    for (const person of personsToInsert) {
      await dbRun(`INSERT INTO Persons (id, name, color, 'order') VALUES (?, ?, ?, ?)`, 
        person.id, person.name, person.color, person.order);
    }
    console.log('Standard-Personen hinzugefügt.');

    // Standard-Aufgaben hinzufügen
    const tasksToInsert = [
      { id: 't1', name: 'Mülltonnen', frequency: 4 },
      { id: 't2', name: 'Pfand', frequency: 2 },
      { id: 't3', name: 'Altglas', frequency: 2 },
      { id: 't4', name: 'Küche', frequency: 1 },
      { id: 't5', name: 'Bäder unten', frequency: 1 },
      { id: 't6', name: 'Saugen', frequency: 1 },
      { id: 't7', name: 'Gemeinsame Räume aufräumen', frequency: 1 },
      { id: 't8', name: 'Bad oben', frequency: 1 },
    ];

    for (const task of tasksToInsert) {
      await dbRun(`INSERT INTO Tasks (id, name, frequency) VALUES (?, ?, ?)`, 
        task.id, task.name, task.frequency);
    }
    console.log('Standard-Aufgaben hinzugefügt.');

    res.status(200).json({ message: 'Datenbank erfolgreich initialisiert mit Standarddaten.' });
  } catch (error) {
    console.error('Fehler beim Setup der Datenbank:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Server starten
app.listen(port, () => {
  console.log(`Putzplan-Backend läuft auf http://localhost:${port}`);
});
 