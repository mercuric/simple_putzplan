import React, { useEffect, useState } from 'react';

function PrintView() {
  const [putzplan, setPutzplan] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE || (window.location.port === '3000' ? 'http://localhost:3001' : '');

  useEffect(() => {
    const fetchPrintPutzplan = async () => {
      try {
        // Fordere 10 Wochen an (aktuelle + 9 zukünftige)
        const response = await fetch(`${API_BASE}/api/putzplan?weeks=10`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPutzplan(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching print putzplan:", error);
        setError(error);
        setLoading(false);
      }
    };

    fetchPrintPutzplan();
  }, []);

  if (loading) {
    return <div className="print-container">Lade Putzplan für den Ausdruck...</div>;
  }

  if (error) {
    return <div className="print-container">Fehler beim Laden des Putzplans für den Ausdruck: {error.message}</div>;
  }

  // Sortiere die Wochennummern für die korrekte Reihenfolge
  const sortedWeekNums = Object.keys(putzplan).sort((a, b) => parseInt(a) - parseInt(b));

  // Extrahiere Aufgabenamen von der ersten Woche, um Spalten zu generieren
  const taskNames = (Object.values(putzplan)[0]?.assignments || []).map(a => a.taskName);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="print-container">
      <h1>Putzplan (Druckansicht)</h1>
      <table>
        <thead>
          <tr>
            <th>Aufgabe</th>
            {sortedWeekNums.map(weekNum => {
              const weekData = putzplan[weekNum];
              return (
                <th key={weekNum}>
                  {weekData.startDate.substring(8, 10)}.{weekData.startDate.substring(5, 7)} - {weekData.endDate.substring(8, 10)}.{weekData.endDate.substring(5, 7)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {taskNames.map(taskName => (
            <tr key={taskName}>
              <td>{taskName}</td>
              {sortedWeekNums.map(weekNum => {
                const weekData = putzplan[weekNum];
                const assignment = weekData.assignments.find(a => a.taskName === taskName);
                return (
                  <td key={`${taskName}-${weekNum}`}>
                    {assignment && (
                      <span className="person-box" style={{ backgroundColor: assignment.personColor }}>
                        {assignment.personName}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Online-Version:</span>
          <a href={siteUrl} target="_blank" rel="noreferrer">
            {siteUrl}
          </a>
        </div>
        <span style={{ fontSize: '12px', color: '#666' }}>QR-Code: {siteUrl}</span>
      </div>
    </div>
  );
}

export default PrintView; 