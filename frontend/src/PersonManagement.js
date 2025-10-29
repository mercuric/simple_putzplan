import React, { useState, useEffect } from 'react';

function PersonManagement() {
  const [persons, setPersons] = useState([]);
  const [newPerson, setNewPerson] = useState({ id: '', name: '', color: '#000000', order: 0 });
  const [editingPerson, setEditingPerson] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE || (window.location.port === '3000' ? 'http://localhost:3001' : '');

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/persons`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Personen');
      }
      const data = await response.json();
      setPersons(data);
    } catch (error) {
      console.error('Fehler beim Laden der Personen:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/persons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPerson),
      });
      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen der Person');
      }
      setNewPerson({ id: '', name: '', color: '#000000', order: 0 });
      fetchPersons();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Person:', error);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/persons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPerson),
      });
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Person');
      }
      setEditingPerson(null);
      fetchPersons();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Person:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Möchten Sie diese Person wirklich löschen?')) {
      try {
        const response = await fetch(`${API_BASE}/api/persons/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Fehler beim Löschen der Person');
        }
        fetchPersons();
      } catch (error) {
        console.error('Fehler beim Löschen der Person:', error);
      }
    }
  };

  return (
    <div className="person-management">
      <h2>Personen verwalten</h2>
      
      <form onSubmit={handleSubmit} className="add-form">
        <h3>Neue Person hinzufügen</h3>
        <div className="form-group">
          <label>ID:</label>
          <input
            type="text"
            value={newPerson.id}
            onChange={(e) => setNewPerson({ ...newPerson, id: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={newPerson.name}
            onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Farbe:</label>
          <input
            type="color"
            value={newPerson.color}
            onChange={(e) => setNewPerson({ ...newPerson, color: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Reihenfolge:</label>
          <input
            type="number"
            value={newPerson.order}
            onChange={(e) => setNewPerson({ ...newPerson, order: parseInt(e.target.value) })}
            required
          />
        </div>
        <button type="submit">Person hinzufügen</button>
      </form>

      <div className="persons-list">
        <h3>Bestehende Personen</h3>
        {persons.map((person) => (
          <div key={person.id} className="person-item">
            {editingPerson && editingPerson.id === person.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editingPerson.name}
                  onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                />
                <input
                  type="color"
                  value={editingPerson.color}
                  onChange={(e) => setEditingPerson({ ...editingPerson, color: e.target.value })}
                />
                <input
                  type="number"
                  value={editingPerson.order}
                  onChange={(e) => setEditingPerson({ ...editingPerson, order: parseInt(e.target.value) })}
                />
                <button onClick={() => handleUpdate(person.id)}>Speichern</button>
                <button onClick={() => setEditingPerson(null)}>Abbrechen</button>
              </div>
            ) : (
              <div className="person-display">
                <span style={{ color: person.color }}>●</span>
                <span>{person.name}</span>
                <span>(Reihenfolge: {person.order})</span>
                <button onClick={() => setEditingPerson(person)}>Bearbeiten</button>
                <button onClick={() => handleDelete(person.id)}>Löschen</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonManagement;

