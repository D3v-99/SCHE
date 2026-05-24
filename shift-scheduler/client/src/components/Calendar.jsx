import { dateKey, startOfWeek } from '../utils/date.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Calendar({
  weeks,
  month,
  teams,
  scheduleMap,
  holidayMap,
  selectedWeekKey,
  onSelectDate
}) {
  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {weeks.flatMap((week) =>
          week.days.map((day) => {
            const dayKey = dateKey(day)
            const weekKey = dateKey(startOfWeek(day))
            const isCurrentMonth = day.getMonth() === month
            const holiday = holidayMap.get(dayKey)

            return (
              <div
                key={`${dayKey}-${weekKey}`}
                className={
                  'calendar-day' +
                  `${isCurrentMonth ? '' : ' calendar-day--muted'}` +
                  `${selectedWeekKey === weekKey ? ' calendar-day--selected' : ''}` +
                  `${holiday ? ' calendar-day--holiday' : ''}`
                }
                onClick={() => onSelectDate(day)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSelectDate(day)
                }}
              >
                <div className="calendar-day__header">
                  <span>{day.getDate()}</span>
                  {holiday ? <span className="holiday-pill">{holiday.name}</span> : null}
                </div>
                <div>
                  {teams.map((team) => {
                    const entry = scheduleMap.get(`${team._id}-${weekKey}`)
                    const name = entry?.memberName || 'Unassigned'
                    return (
                      <div
                        key={team._id}
                        className={`assignment assignment--${team.type}`}
                      >
                        <span className="assignment-dot" />
                        <span>{name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Calendar
