const express = require('express')
const multer = require('multer')
const User = require('../models/user')
const auth = require('../middleware/auth')
const sharp = require('sharp')
const email = require('../emails/account')
const mongoose = require('mongoose')
const router = express.Router()

//---POST REQUESTS---

//--create new user (PUBLIC)
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    email.sendWelcomeEmail(user)

    const token = await user.generateAuthToken()

    res.status(201).send({user, token})
  } catch (e) {
    res.status(400).send(e)
  }
})

//--login to a user (PUBLIC)
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

    res.send({user, token})
  } catch (error) {
    res.status(400).send()
  }
})

//--set up avatar settings
const upload = multer({
  limits: {
    fileSize: 2000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/.(jpg|png|jpeg)$/)) {
      cb(new Error('Accepted file types are .jpeg and .png'))
    }
    cb(undefined, true)
  },
})

//--set the avatar of the current user
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const buffer = await sharp(req.file.buffer)
        .resize({height: 250, width: 250})
        .png()
        .toBuffer()
      req.user.avatar = buffer
      await req.user.save()
      res.send()
    } catch (error) {
      res.status(500).send()
    }
  },
  (error, req, res, next) => {
    res.status(400).send({error: error.message})
  }
)

//--logout of the current user (req.user)
router.post('/users/logout', auth, async (req, res) => {
  try {
    if (req.query.all) {
      req.user.tokens = []
      await req.user.save()
      return res.send()
    }

    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
    await req.user.save()

    res.send()
  } catch (error) {
    res.status(500).send()
  }
})

//--add a friend to the current user
router.post('/users/me/friends', auth, async (req, res) => {
  try {
    const friend = await User.findById(req.query.id)
    req.user.friends = req.user.friends.concat({friend: friend._id})
    await req.user.save()

    res.send(`${friend.name} has been added as a friend to ${req.user.name}`)
  } catch (error) {
    res.status(400).send()
  }
})

//---PATCH REQUESTS---

//--update current user's info
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const vaildUpdates = ['name', 'age', 'password', 'email']
  const isVaildUpdates = updates.every(update => vaildUpdates.includes(update))

  if (!isVaildUpdates) {
    return res.status(400).send({error: 'Invalid updates!'})
  }

  try {
    updates.forEach(update => (req.user[update] = req.body[update]))
    await req.user.save()

    res.status(200).send(req.user)
  } catch (e) {
    res.status(400).send(e)
  }
})

//---GET REQUESTS---

//--get the current user's profile info
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

//--get the avatar of the user associated with the provided id paramater
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')

    res.send(user.avatar)
  } catch (err) {
    res.status(404).send()
  }
})

//--get a list of all the current users friends
router.get('/users/me/friends', auth, async (req, res) => {
  try {
    await req.user.populate({path: 'friends'}).execPopulate()
    res.send({friends: req.user.friends})
  } catch (error) {
    res.status(400).send()
  }
})

//---DELETE REQUESTS---

//--delete the current user from profile
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()

    email.sendCancelationEmail(req.user)
    res.send(req.user)
  } catch (e) {
    res.status(500).send(e)
  }
})

//--deletes the avatar from the current user's profile
router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
  } catch (error) {
    res.status(500).send()
  }
})

//--removes a specific friend by id
router.delete('/users/me/friends', auth, async (req, res) => {
  try {
    const id = mongoose.Types.ObjectId(req.query.id)
    req.user.friends = req.user.friends.filter(
      friend => friend.friend !== req.query.id
    )

    await req.user.save()

    res.send(req.user.friends)
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
