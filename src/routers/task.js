const express = require('express')
const auth = require('../middleware/auth')
const Task = require('../models/task')
const User = require('../models/user')
const router = express.Router()

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (error) {
    res.status(400).send(e)
  }
})

router.get('/tasks', auth, async (req, res) => {
  const match = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
        },
      })
      .execPopulate()
    // const tasks = await Task.find({owner: req.user._id})
    res.send(req.user.tasks)
  } catch (e) {
    res.status(500).send()
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    const task = await Task.findOne({_id, owner: req.user._id})
    if (!task) {
      res.status(404).send()
    }
    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const vaildUpdates = ['description', 'completed']
  const isVaildUpdates = updates.every(update => vaildUpdates.includes(update))

  if (!isVaildUpdates) {
    return res.status(400).send({error: 'Invalid updates!'})
  }

  const _id = req.params.id
  try {
    const task = await Task.findOne({_id, owner: req.user._id})

    if (!task) {
      return res.status(404).send()
    }

    updates.forEach(update => (task[update] = req.body[update]))
    await task.save()

    res.send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const task = await Task.findOneAndDelete({_id, owner: req.user._id})

    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
