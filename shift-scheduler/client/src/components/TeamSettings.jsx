import { useState } from 'react'

function TeamSettings({ teams, onTeamUpdate, onSave }) {
  const [drafts, setDrafts] = useState({})

  const handleDraftChange = (teamId, value) => {
    setDrafts((prev) => ({ ...prev, [teamId]: value }))
  }

  const handleAddMember = (teamId) => {
    const name = drafts[teamId]?.trim()
    if (!name) return

    onTeamUpdate(teamId, (team) => ({
      ...team,
      members: [
        ...team.members,
        { name, active: true, localId: `local-${Date.now()}-${Math.random()}` }
      ]
    }))

    handleDraftChange(teamId, '')
  }

  const handleMemberNameChange = (teamId, memberId, value) => {
    onTeamUpdate(teamId, (team) => ({
      ...team,
      members: team.members.map((member) =>
        (member._id || member.localId) === memberId ? { ...member, name: value } : member
      )
    }))
  }

  const handleRemoveMember = (teamId, memberId) => {
    onTeamUpdate(teamId, (team) => ({
      ...team,
      members: team.members.filter((member) => (member._id || member.localId) !== memberId)
    }))
  }

  return (
    <div className="panel">
      <div className="panel-title">
        <h3>Team management</h3>
        <span>Edit active members per team.</span>
      </div>
      <div className="team-list">
        {teams.map((team) => (
          <div key={team._id}>
            <div className="panel-title">
              <h4>{team.name}</h4>
              <button className="button button--ghost" type="button" onClick={() => onSave(team._id)}>
                Save
              </button>
            </div>
            <div className="team-list">
              {team.members
                .filter((member) => member.active)
                .map((member) => (
                  <div key={member._id || member.localId} className="team-member">
                    <input
                      value={member.name}
                      onChange={(event) =>
                        handleMemberNameChange(
                          team._id,
                          member._id || member.localId,
                          event.target.value
                        )
                      }
                    />
                    <button
                      className="button button--light"
                      type="button"
                      onClick={() => handleRemoveMember(team._id, member._id || member.localId)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
            <div className="week-row" style={{ gridTemplateColumns: '1fr auto' }}>
              <input
                placeholder="Add member name"
                value={drafts[team._id] || ''}
                onChange={(event) => handleDraftChange(team._id, event.target.value)}
              />
              <button className="button button--light" type="button" onClick={() => handleAddMember(team._id)}>
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamSettings
