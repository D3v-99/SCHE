import { useEffect, useState } from 'react'

function SwapModal({ open, team, week, onClose, onConfirm }) {
  const [fromMember, setFromMember] = useState('')
  const [toMember, setToMember] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setFromMember('')
      setToMember('')
      setReason('')
    }
  }, [open])

  if (!open || !team) return null

  const members = team.members.filter((member) => member.active)

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="panel-title">
          <h3>Swap coverage</h3>
          <button className="button button--light" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <p>
          {team.name} | {week?.start?.toLocaleDateString()} - {week?.end?.toLocaleDateString()}
        </p>
        <label>
          Swap from
          <select value={fromMember} onChange={(event) => setFromMember(event.target.value)}>
            <option value="" disabled>
              Select member
            </option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Swap to
          <select value={toMember} onChange={(event) => setToMember(event.target.value)}>
            <option value="" disabled>
              Select member
            </option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reason
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button"
            type="button"
            onClick={() => onConfirm({ fromMember, toMember, reason })}
            disabled={!fromMember || !toMember || fromMember === toMember}
          >
            Confirm swap
          </button>
        </div>
      </div>
    </div>
  )
}

export default SwapModal
