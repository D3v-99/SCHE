import express from 'express'
import Team from '../models/Team.js'
import Member from '../models/Member.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

const buildTeamsResponse = async () => {
  const teams = await Team.find({}).sort({ type: 1 })
  const teamIds = teams.map((team) => team._id)
  const members = await Member.find({ teamId: { $in: teamIds } }).sort({ createdAt: 1 })

  const membersByTeam = new Map()
  members.forEach((member) => {
    const key = String(member.teamId)
    if (!membersByTeam.has(key)) {
      membersByTeam.set(key, [])
    }
    membersByTeam.get(key).push(member)
  })

  return teams.map((team) => ({
    ...team.toObject(),
    members: membersByTeam.get(String(team._id)) || []
  }))
}

const updateTeamMembers = async (teamId, membersInput) => {
  const team = await Team.findById(teamId)
  if (!team) {
    return
  }

  const members = Array.isArray(membersInput) ? membersInput : []
  const existingMembers = await Member.find({ teamId })
  const existingById = new Map(existingMembers.map((member) => [String(member._id), member]))
  const keepIds = new Set()

  for (const member of members) {
    if (member._id && existingById.has(String(member._id))) {
      keepIds.add(String(member._id))
      await Member.updateOne(
        { _id: member._id },
        {
          $set: {
            name: member.name || existingById.get(String(member._id)).name,
            active: typeof member.active === 'boolean' ? member.active : true
          }
        }
      )
      continue
    }

    if (member.name) {
      const created = await Member.create({
        name: member.name,
        teamId,
        active: typeof member.active === 'boolean' ? member.active : true
      })
      keepIds.add(String(created._id))
    }
  }

  const toDeactivate = existingMembers
    .filter((member) => !keepIds.has(String(member._id)))
    .map((member) => member._id)

  if (toDeactivate.length) {
    await Member.updateMany({ _id: { $in: toDeactivate } }, { $set: { active: false } })
  }
}

router.get('/', async (req, res) => {
  const teams = await buildTeamsResponse()
  res.json({ teams })
})

router.post('/', requireAdmin, async (req, res) => {
  const { teamId, members, teams } = req.body

  if (Array.isArray(teams)) {
    for (const teamUpdate of teams) {
      if (teamUpdate?.teamId) {
        await updateTeamMembers(teamUpdate.teamId, teamUpdate.members)
      }
    }
  } else if (teamId) {
    await updateTeamMembers(teamId, members)
  } else {
    return res.status(400).json({ message: 'teamId or teams payload is required' })
  }

  const updatedTeams = await buildTeamsResponse()
  res.json({ teams: updatedTeams })
})

export default router
