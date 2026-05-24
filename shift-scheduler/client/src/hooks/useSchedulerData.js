import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api.js'

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

export const useSchedulerData = ({ month, year }) => {
  const [teams, setTeams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [holidays, setHolidays] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const loadTeams = async () => {
    const data = await apiFetch('/teams')
    setTeams(data.teams || [])
  }

  const loadSchedule = async () => {
    const data = await apiFetch(`/schedule?month=${month + 1}&year=${year}`)
    setSchedule(normalizeSchedule(data.schedule || []))
  }

  const loadHolidays = async () => {
    const data = await apiFetch('/holidays')
    setHolidays(data.holidays || [])
  }

  const refreshAll = async () => {
    setLoading(true)
    try {
      await Promise.all([loadTeams(), loadHolidays(), loadSchedule()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll().catch((error) => setStatus(error.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadSchedule().catch((error) => setStatus(error.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year])

  const api = useMemo(
    () => ({
      loadTeams,
      loadSchedule,
      loadHolidays,
      refreshAll
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [month, year]
  )

  return {
    teams,
    setTeams,
    schedule,
    setSchedule,
    holidays,
    setHolidays,
    status,
    setStatus,
    loading,
    api
  }
}
