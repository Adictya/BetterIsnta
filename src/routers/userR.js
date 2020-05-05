const express = require('express')
// const multer = require('multer')

const User = require('../models/users')


const {check , validationResult} = require('express-validator')
const router = new express.Router()

router.post('/user/login',[
            check("email").isEmail(), check('password').isLength({min:7,max:32}) 
      ],
      async(req,res) => {
            const error = validationResult(req);
            if(!error.isEmpty()){
                  return res.status(422).json({error: error.array()});
            }
            try{
                  const user = await User.findByCredentials(req.body.email,req.body.password)
                  const token = await user.generateAuthToken()
                  res.send({user,token})
            }catch(e){
                  res.status(400).send(e)
            }
      }
      )

router.post('/user/register',[
      check("email").isEmail(),check('password').isLength({min:7,max:32})
      ],async(req,res) => {
            const error = validationResult(req) 
            
            if(!error.isEmpty()){
                  return res.status(422).json({error: error.array()})
            }
            
            const user = new User(req.body)
            try{
                  await user.save()
                  const token = await user.generateAuthToken()
                  res.send({user,token})
            }catch(e){
                  res.status(400).send(e)
            }
      }
)
router.get('/user/fetch',async(req,res) => {
      res.send("Get Fucked")
})
router.get('/user/get',async(req,res) => {})

module.exports = router