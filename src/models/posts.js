const mongoose = require('mongoose')
 
const PostSchema = new mongoose.Schema({
      image:{
            type:Buffer,
            required:true
      },
      description:{
            type:String,
            required:true
      },
      owner:{
            type: mongoose.Schema.Types.ObjectId,
            required: true
      }
})

const Post = mongoose.model('Post',PostSchema)
module.exports = Post