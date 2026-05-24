import { useEffect, useMemo, useState } from 'react'
import { apiFetch, downloadFile } from '../api.js'
import { clearToken, getToken, setToken } from '../auth.js'
import Calendar from '../components/Calendar.jsx'
import HolidayPanel from '../components/HolidayPanel.jsx'
import SwapModal from '../components/SwapModal.jsx'
import TeamSettings from '../components/TeamSettings.jsx'
import WeekPanel from '../components/WeekPanel.jsx'
import AdminLogin from '../components/AdminLogin.jsx'
import { useSchedulerData } from '../hooks/useSchedulerData.js'
import { addDays, dateKey, endOfWeek, getCalendarWeeks, startOfWeek } from '../utils/date.js'

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

function AdminPage({ onNavigateView }) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(today))
  const [selectedAssignments, setSelectedAssignments] = useState({})
  const [swapState, setSwapState] = useState({ open: false, team: null })
  const [user, setUser] = useState(null)

  const { teams, setTeams, schedule, holidays, status, setStatus, loading, api } = useSchedulerData({
    month,
    year
  })

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

  useEffect(() => {
    const token = getToken()
    if (!token) return

    apiFetch('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken()
        setUser(null)
      })
  }, [])

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

  const handleLogin = async ({ username, password }) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      setToken(data.token)
      setUser(data.user)
      setStatus('Signed in.')
    } catch (error) {
      setStatus(error.message)
      throw error
    }
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setStatus('Signed out.')
  }

  const handleSelectDate = (date) => {
    setSelectedWeekStart(startOfWeek(date))
  }

  const handleAssignmentChange = (teamId, memberId) => {
    setSelectedAssignments((prev) => ({ ...prev, [teamId]: memberId }))
  }

  const handleSaveWeek = async () => {
    if (!selectedWeekStart) return

    try {
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

      await apiFetch('/schedule', {
        method: 'POST',
        body: JSON.stringify({ entries })
      })

      await api.loadSchedule()
      setStatus('Week assignments saved.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleAutoAssign = async () => {
    if (!teams.length || !weeks.length) return

    try {
      const firstWeekStart = weeks[0].start
      const lastAssignments = await Promise.all(
        teams.map((team) =>
          apiFetch(`/schedule?teamId=${team._id}&before=${dateKey(firstWeekStart)}&limit=1`)
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

      await apiFetch('/schedule', {
        method: 'POST',
        body: JSON.stringify({ entries })
      })

      await api.loadSchedule()
      setStatus('Auto-assign complete for this month.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleExport = async () => {
    try {
      const filename = `schedule-${year}-${String(month + 1).padStart(2, '0')}.csv`
      await downloadFile(`/export?month=${month + 1}&year=${year}`, filename)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleOpenSwap = (team) => {
    if (!selectedWeekStart) return
    setSwapState({ open: true, team })
  }

  const handleSwapConfirm = async (payload) => {
    if (!swapState.team || !selectedWeekStart) return

    try {
      await apiFetch('/swap', {
        method: 'POST',
        body: JSON.stringify({
          teamId: swapState.team._id,
          weekStart: selectedWeekStart,
          requestedBy: payload.fromMember,
          coveredBy: payload.toMember,
          reason: payload.reason
        })
      })

      await api.loadSchedule()
      setSwapState({ open: false, team: null })
      setStatus('Swap logged.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleTeamUpdate = (teamId, updater) => {
    setTeams((prev) => prev.map((team) => (team._id === teamId ? updater(team) : team)))
  }

  const handleTeamSave = async (teamId) => {
    const team = teams.find((item) => item._id === teamId)
    if (!team) return

    try {
      await apiFetch('/teams', {
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

      await api.loadTeams()
      setStatus(`${team.name} updated.`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleHolidayAdd = async (date, name) => {
    try {
      await apiFetch('/holidays', {
        method: 'POST',
        body: JSON.stringify({ date, name })
      })
      await api.loadHolidays()
      setStatus('Holiday added.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleHolidayRemove = async (holidayId) => {
    try {
      await apiFetch('/holidays', {
        method: 'POST',
        body: JSON.stringify({ remove: true, id: holidayId })
      })
      await api.loadHolidays()
      setStatus('Holiday removed.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  if (!user || !getToken()) {
    return (
      <div className="app">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">IT Support Scheduling</p>
            <h1 className="app-title">Bank On-Call Planner</h1>
            <p className="app-subtitle">Admin access required to change schedules.</p>
          </div>
          {onNavigateView ? (
            <button className="button button--ghost" type="button" onClick={onNavigateView}>
              View calendar
            </button>
          ) : null}
        </header>

        <main className="layout layout--single">
          <AdminLogin onLogin={handleLogin} status={status} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Admin</p>
          <h1 className="app-title">Schedule management</h1>
          <p className="app-subtitle">Manage members, holidays, swaps, and weekly assignments.</p>
        </div>
        <div className="header-actions">
          <div className="legend">
            <span className="legend-item legend-item--retail">Retail Channels</span>
            <span className="legend-item legend-item--corporate">Corporate Channels</span>
          </div>
          {onNavigateView ? (
            <button className="button button--ghost" type="button" onClick={onNavigateView}>
              View
            </button>
          ) : null}
          <button className="button button--light" type="button" onClick={handleLogout}>
            Sign out
          </button>
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
          <button className="button" type="button" onClick={handleAutoAssign} disabled={loading}>
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

export default AdminPage
