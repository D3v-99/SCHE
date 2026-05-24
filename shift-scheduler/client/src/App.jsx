import { useEffect, useMemo, useState } from 'react'
import { apiFetch, downloadFile } from './api.js'
import { addDays, dateKey, endOfWeek, getCalendarWeeks, startOfWeek } from './utils/date.js'
import Calendar from './components/Calendar.jsx'
import WeekPanel from './components/WeekPanel.jsx'
import SwapModal from './components/SwapModal.jsx'
import TeamSettings from './components/TeamSettings.jsx'
import HolidayPanel from './components/HolidayPanel.jsx'

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

const normalizeSchedule = (entries) =>
  entries.map((entry) => ({
    ...entry,
    teamId: entry.teamId?._id || entry.teamId,
    teamType: entry.teamId?.type || entry.teamType,
    memberId: entry.memberId?._id || entry.memberId,
    memberName: entry.memberId?.name || entry.memberName || '',
    weekStart: new Date(entry.weekStart),
    weekEnd: new Date(entry.weekEnd)
  }))

const buildYearOptions = (currentYear) => {
  const years = []
  for (let offset = -2; offset <= 2; offset += 1) {
    years.push(currentYear + offset)
  }
  return years
}

function App() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [teams, setTeams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [holidays, setHolidays] = useState([])
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(today))
  const [selectedAssignments, setSelectedAssignments] = useState({})
  const [swapState, setSwapState] = useState({ open: false, team: null })
  const [status, setStatus] = useState('')

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

  const selectedWeek = selectedWeekStart
    ? { start: selectedWeekStart, end: endOfWeek(selectedWeekStart) }
    : null

  const loadTeams = async () => {
    const data = await apiFetch('/api/teams')
    setTeams(data.teams || [])
  }

  const loadSchedule = async () => {
    const data = await apiFetch(`/api/schedule?month=${month + 1}&year=${year}`)
    setSchedule(normalizeSchedule(data.schedule || []))
  }

  const loadHolidays = async () => {
    const data = await apiFetch('/api/holidays')
    setHolidays(data.holidays || [])
  }

  useEffect(() => {
    Promise.all([loadTeams(), loadHolidays()]).catch((error) => {
      setStatus(error.message)
    })
  }, [])

  useEffect(() => {
    loadSchedule().catch((error) => setStatus(error.message))
  }, [month, year])

  useEffect(() => {
    if (!selectedWeekStart || !teams.length) return

    const assignments = {}
    teams.forEach((team) => {
      const entry = scheduleMap.get(`${team._id}-${selectedWeekKey}`)
      const activeMembers = team.members.filter((member) => member.active)
      assignments[team._id] = entry?.memberId || activeMembers[0]?._id || ''
    })
    setSelectedAssignments(assignments)
  }, [selectedWeekKey, scheduleMap, teams, selectedWeekStart])

  const handleSelectDate = (date) => {
    setSelectedWeekStart(startOfWeek(date))
  }

  const handleAssignmentChange = (teamId, memberId) => {
    setSelectedAssignments((prev) => ({ ...prev, [teamId]: memberId }))
  }

  const handleSaveWeek = async () => {
    if (!selectedWeekStart) return

    const entries = teams
      .map((team) => {
        const memberId = selectedAssignments[team._id]
        if (!memberId) return null
        return {
          teamId: team._id,
          memberId,
          weekStart: selectedWeekStart,
          weekEnd: addDays(selectedWeekStart, 6)
        }
      })
      .filter(Boolean)

    await apiFetch('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ entries })
    })

    await loadSchedule()
    setStatus('Week assignments saved.')
  }

  const handleAutoAssign = async () => {
    if (!teams.length || !weeks.length) return

    const firstWeekStart = weeks[0].start
    const lastAssignments = await Promise.all(
      teams.map((team) =>
        apiFetch(
          `/api/schedule?teamId=${team._id}&before=${dateKey(firstWeekStart)}&limit=1`
        )
      )
    )

    const entries = []
    teams.forEach((team, index) => {
      const activeMembers = team.members.filter((member) => member.active)
      if (!activeMembers.length) return

      const lastEntry = lastAssignments[index]?.schedule?.[0]
      const lastMemberId = lastEntry?.memberId?._id || lastEntry?.memberId
      let startIndex = 0

      if (lastMemberId) {
        const lastIndex = activeMembers.findIndex((member) => member._id === lastMemberId)
        if (lastIndex >= 0) {
          startIndex = (lastIndex + 1) % activeMembers.length
        }
      }

      weeks.forEach((week, weekIndex) => {
        const member = activeMembers[(startIndex + weekIndex) % activeMembers.length]
        entries.push({
          teamId: team._id,
          memberId: member._id,
          weekStart: week.start,
          weekEnd: week.end
        })
      })
    })

    await apiFetch('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ entries })
    })

    await loadSchedule()
    setStatus('Auto-assign complete for this month.')
  }

  const handleExport = async () => {
    const filename = `schedule-${year}-${String(month + 1).padStart(2, '0')}.csv`
    await downloadFile(`/api/export?month=${month + 1}&year=${year}`, filename)
  }

  const handleOpenSwap = (team) => {
    if (!selectedWeekStart) return
    setSwapState({ open: true, team })
  }

  const handleSwapConfirm = async (payload) => {
    if (!swapState.team || !selectedWeekStart) return

    await apiFetch('/api/swap', {
      method: 'POST',
      body: JSON.stringify({
        teamId: swapState.team._id,
        weekStart: selectedWeekStart,
        requestedBy: payload.fromMember,
        coveredBy: payload.toMember,
        reason: payload.reason
      })
    })

    await loadSchedule()
    setSwapState({ open: false, team: null })
    setStatus('Swap logged.')
  }

  const handleTeamUpdate = (teamId, updater) => {
    setTeams((prev) =>
      prev.map((team) => (team._id === teamId ? updater(team) : team))
    )
  }

  const handleTeamSave = async (teamId) => {
    const team = teams.find((item) => item._id === teamId)
    if (!team) return

    await apiFetch('/api/teams', {
      method: 'POST',
      body: JSON.stringify({
        teamId,
        members: team.members.map((member) => ({
          _id: member._id,
          name: member.name,
          active: member.active
        }))
      })
    })

    await loadTeams()
    setStatus(`${team.name} updated.`)
  }

  const handleHolidayAdd = async (date, name) => {
    await apiFetch('/api/holidays', {
      method: 'POST',
      body: JSON.stringify({ date, name })
    })
    await loadHolidays()
    setStatus('Holiday added.')
  }

  const handleHolidayRemove = async (holidayId) => {
    await apiFetch('/api/holidays', {
      method: 'POST',
      body: JSON.stringify({ remove: true, id: holidayId })
    })
    await loadHolidays()
    setStatus('Holiday removed.')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">IT Support Scheduling</p>
          <h1 className="app-title">Bank On-Call Planner</h1>
          <p className="app-subtitle">
            Assign weekly on-call coverage for Retail and Corporate channels, track public holidays,
            and export monthly schedules.
          </p>
        </div>
        <div className="legend">
          <span className="legend-item legend-item--retail">Retail Channels</span>
          <span className="legend-item legend-item--corporate">Corporate Channels</span>
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
        <div className="toolbar-group">
          <button className="button" type="button" onClick={handleAutoAssign}>
            Auto-assign month
          </button>
          <button className="button button--ghost" type="button" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </section>

      {status ? <div className="status">{status}</div> : null}

      <main className="layout">
        <section className="panel panel--calendar">
          <Calendar
            weeks={weeks}
            month={month}
            teams={teams}
            scheduleMap={scheduleMap}
            holidayMap={holidayMap}
            selectedWeekKey={selectedWeekKey}
            onSelectDate={handleSelectDate}
          />
        </section>

        <section className="side">
          <WeekPanel
            selectedWeek={selectedWeek}
            teams={teams}
            assignments={selectedAssignments}
            onAssignmentChange={handleAssignmentChange}
            onSave={handleSaveWeek}
            onOpenSwap={handleOpenSwap}
          />
          <HolidayPanel
            holidays={holidays}
            onAddHoliday={handleHolidayAdd}
            onRemoveHoliday={handleHolidayRemove}
          />
        </section>
      </main>

      <section className="panel panel--settings">
        <TeamSettings teams={teams} onTeamUpdate={handleTeamUpdate} onSave={handleTeamSave} />
      </section>

      <SwapModal
        open={swapState.open}
        team={swapState.team}
        week={selectedWeek}
        onClose={() => setSwapState({ open: false, team: null })}
        onConfirm={handleSwapConfirm}
      />
    </div>
  )
}

export default App
