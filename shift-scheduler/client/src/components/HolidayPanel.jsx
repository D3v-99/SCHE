import { useState } from 'react'
import { dateKey } from '../utils/date.js'

function HolidayPanel({ holidays, onAddHoliday, onRemoveHoliday }) {
  const [date, setDate] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!date || !name) return
    onAddHoliday(date, name)
    setDate('')
    setName('')
  }

  return (
    <div className="panel">
      <div className="panel-title">
        <h3>Public holidays</h3>
        <span>Highlight dates and assign coverage.</span>
      </div>
      <form className="week-panel" onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button className="button" type="submit">
          Add holiday
        </button>
      </form>
      <div className="holiday-list">
        {holidays.map((holiday) => (
          <div key={holiday._id} className="holiday-item">
            <span>
              {dateKey(holiday.date)} - {holiday.name}
            </span>
            <button
              className="button button--light"
              type="button"
              onClick={() => onRemoveHoliday(holiday._id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HolidayPanel
