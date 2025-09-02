import React, { useEffect, useState } from 'react';

function PutzplanView() {
  const [putzplan, setPutzplan] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPutzplan = async () => {
      try {
        const response = await fetch('/api/putzplan');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPutzplan(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching putzplan:", error);
        setError(error);
        setLoading(false);
      }
    };
    fetchPutzplan();
  }, []);

  if (loading) {
    return <div className="App">Lade Putzplan...</div>;
  }

  if (error) {
    return <div className="App">Fehler beim Laden des Putzplans: {error.message}</div>;
  }

  return (
    <div className="putzplan-container">
      <table>
        <thead>
          <tr>
            <th>Aufgabe</th>
            {Object.keys(putzplan).sort((a, b) => parseInt(a) - parseInt(b)).map(weekNum => {
              const weekData = putzplan[weekNum];
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Setzt die Zeit auf Mitternacht für genaue Datumsvergleiche

              const weekStartDate = new Date(weekData.startDate);
              weekStartDate.setHours(0, 0, 0, 0); // Setzt die Zeit auf Mitternacht
              const weekEndDate = new Date(weekData.endDate);
              weekEndDate.setHours(0, 0, 0, 0); // Setzt die Zeit auf Mitternacht

              // Prüfen, ob das heutige Datum innerhalb der aktuellen Woche liegt
              const isCurrentWeek = today >= weekStartDate && today <= weekEndDate;
              
              const currentYear = today.getFullYear();
              const currentMonth = today.getMonth();

              const weekStartYear = weekStartDate.getFullYear();
              const weekStartMonth = weekStartDate.getMonth();

              // Prüfen, ob der aktuelle Monat mit dem Monat der Woche übereinstimmt
              const isCurrentMonth = (currentYear === weekStartYear && currentMonth === weekStartMonth);

              return (
                <th
                  key={weekNum}
                  className={`${isCurrentWeek ? 'current-week-header' : ''} ${isCurrentMonth ? 'current-month-header' : ''}`}
                >
                  {weekData.startDate.substring(8, 10)}.{weekData.startDate.substring(5, 7)} - {weekData.endDate.substring(8, 10)}.{weekData.endDate.substring(5, 7)}
                  {isCurrentWeek && <span className="current-week-label">Aktuelle Woche</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {(Object.values(putzplan)[0]?.assignments || []).map(a => a.taskName).map(taskName => (
            <tr key={taskName}>
              <td>{taskName}</td>
              {Object.keys(putzplan).sort((a, b) => parseInt(a) - parseInt(b)).map(weekNum => {
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
    </div>
  );
}

export default PutzplanView; 