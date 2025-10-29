import React, { useEffect, useState } from 'react';

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskFrequency, setNewTaskFrequency] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskFrequency, setEditTaskFrequency] = useState(1);
  const API_BASE = process.env.REACT_APP_API_BASE || (window.location.port === '3000' ? 'http://localhost:3001' : '');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName || !newTaskFrequency) return;
    try {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          name: newTaskName,
          frequency: parseInt(newTaskFrequency),
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewTaskName('');
      setNewTaskFrequency(1);
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setEditTaskName(task.name);
    setEditTaskFrequency(task.frequency);
  };

  const handleUpdateTask = async (id) => {
    if (!editTaskName || !editTaskFrequency) return;
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editTaskName,
          frequency: parseInt(editTaskFrequency),
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setEditingTaskId(null);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="management-container">
      <h2>Aufgaben verwalten</h2>
      <div className="add-form">
        <input
          type="text"
          placeholder="Aufgabenname"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Rhythmus (Wochen)"
          value={newTaskFrequency}
          onChange={(e) => setNewTaskFrequency(e.target.value)}
          min="1"
        />
        <button onClick={handleAddTask}>Aufgabe hinzufügen</button>
      </div>
      <ul className="item-list">
        {tasks.map((task) => (
          <li key={task.id} className="list-item">
            {editingTaskId === task.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                />
                <input
                  type="number"
                  value={editTaskFrequency}
                  onChange={(e) => setEditTaskFrequency(e.target.value)}
                  min="1"
                />
                <button onClick={() => handleUpdateTask(task.id)}>Speichern</button>
                <button onClick={() => setEditingTaskId(null)}>Abbrechen</button>
              </div>
            ) : (
              <div className="item-display">
                <span>{task.name} (Rhythmus: {task.frequency} Wochen)</span>
                <div className="actions">
                  <button onClick={() => handleEditClick(task)}>Bearbeiten</button>
                  <button onClick={() => handleDeleteTask(task.id)}>Löschen</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskManagement; 