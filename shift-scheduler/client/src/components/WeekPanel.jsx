const formatRange = (start, end) => {
  if (!start || !end) return 'Select a week to edit'
  const options = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString(
    'en-US',
    options
  )}`
}

function WeekPanel({ selectedWeek, teams, assignments, onAssignmentChange, onSave, onOpenSwap }) {
  return (
    <div className="panel week-panel">
      <div className="panel-title">
        <h3>Week assignment</h3>
        <span>{formatRange(selectedWeek?.start, selectedWeek?.end)}</span>
      </div>
      {teams.map((team) => (
        <div key={team._id} className="week-row">
          <span className={`team-pill team-pill--${team.type}`}>{team.name}</span>
          <select
            value={assignments[team._id] || ''}
            onChange={(event) => onAssignmentChange(team._id, event.target.value)}
          >
            <option value="" disabled>
              Select member
            </option>
            {team.members
              .filter((member) => member._id)
              .map((member) => (
                <option key={member._id} value={member._id} disabled={!member.active}>
                  {member.name}
                  {member.active ? '' : ' (inactive)'}
                </option>
              ))}
          </select>
          <button className="button button--light" type="button" onClick={() => onOpenSwap(team)}>
            Swap
          </button>
        </div>
      ))}
      <button className="button" type="button" onClick={onSave}>
        Save week assignments
      </button>
    </div>
  )
}

export default WeekPanel
