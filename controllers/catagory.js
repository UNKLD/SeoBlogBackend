const Catagory = require('../models/catagory')
const Blog = require('../models/blog')
const {errorHandler} = require('../helpers/dbErrorHandler')
const slugify = require('slugify')


exports.create = (req, res) => {
  const {name} = req.body
  let slug = slugify(name).toLowerCase()

  let catagory = new Catagory({name, slug})

  catagory.save((err, data) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    res.json(data)
  })
}

exports.list = (req, res) => {
  Catagory.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    res.json(data)
  })
}

exports.read = (req, res) => {
  const slug = req.params.slug.toLowerCase()

  Catagory.findOne({ slug }).exec((err, catagory) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    // res.json(catagory);
    Blog.find({catagories: catagory})
      .populate('catagories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id username name')
      .select('_id title slug excerpt catagories postedBy tags createdAt updatedAt')
      .exec((err, data) => {
        if(err) {
          return res.status(400).json({error: errorHandler(err)})
        }
        res.json({catagory, blogs: data})
      })
  })
}

exports.remove = (req, res) => {
  const slug = req.params.slug.toLowerCase()

  Catagory.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    res.json({message: 'Catagory Removed Succesfully'});
  })
}
