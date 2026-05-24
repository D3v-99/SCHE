import { useMemo, useState } from 'react'
import Calendar from '../components/Calendar.jsx'
import { useSchedulerData } from '../hooks/useSchedulerData.js'
import { dateKey, getCalendarWeeks, startOfWeek } from '../utils/date.js'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const buildYearOptions = (currentYear) => {
  const years = []
  for (let offset = -2; offset <= 2; offset += 1) {
    years.push(currentYear + offset)
  }
  return years
}

function ViewPage({ onNavigateAdmin }) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(today))

  const { teams, schedule, holidays, status, loading } = useSchedulerData({ month, year })

  const weeks = useMemo(() => getCalendarWeeks(year, month), [year, month])

  const scheduleMap = useMemo(() => {
    const map = new Map()
    schedule.forEach((entry) => {
      map.set(`${entry.teamId}-${dateKey(entry.weekStart)}`, entry)
    })
    return map
  }, [schedule])

  const holidayMap = useMemo(() => {
    const map = new Map()
    holidays.forEach((holiday) => {
      map.set(dateKey(holiday.date), holiday)
    })
    return map
  }, [holidays])

  const selectedWeekKey = selectedWeekStart ? dateKey(selectedWeekStart) : null

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">IT Support Scheduling</p>
          <h1 className="app-title">Bank On-Call Planner</h1>
          <p className="app-subtitle">Monthly view-only schedule for Retail and Corporate channels.</p>
        </div>
        <div className="header-actions">
          <div className="legend">
            <span className="legend-item legend-item--retail">Retail Channels</span>
            <span className="legend-item legend-item--corporate">Corporate Channels</span>
          </div>
          {onNavigateAdmin ? (
            <button className="button button--ghost" type="button" onClick={onNavigateAdmin}>
              Admin
            </button>
          ) : null}
        </div>
      </header>

      <section className="toolbar">
        <div className="toolbar-group">
          <label>
            Month
            <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {MONTHS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {buildYearOptions(year).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="toolbar-group muted">{loading ? 'Loading…' : ' '}</div>
      </section>

      {status ? <div className="status">{status}</div> : null}

      <main className="layout layout--single">
        <section className="panel panel--calendar">
          <Calendar
            weeks={weeks}
            month={month}
            teams={teams}
            scheduleMap={scheduleMap}
            holidayMap={holidayMap}
            selectedWeekKey={selectedWeekKey}
            onSelectDate={(date) => setSelectedWeekStart(startOfWeek(date))}
          />
        </section>
      </main>
    </div>
  )
}

export default ViewPage
