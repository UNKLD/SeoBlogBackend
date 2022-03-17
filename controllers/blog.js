const Blog = require('../models/blog')
const User = require('../models/user')
const Catagory = require('../models/catagory')
const Tag = require('../models/tag')
const formidable = require('formidable')
const slugify = require('slugify')
const stripHtml = require('string-strip-html')
const _ = require('lodash')
const {errorHandler} = require('../helpers/dbErrorHandler')
const fs = require('fs')
const {smartTrim} = require('../helpers/blog')

exports.create = (req, res) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({error: 'Image could not upload'})
    }

    const {title, body, catagories, tags} = fields

    if (!title || !title.length) {
      return res.status(400).json({error: "Title is required"})
    }

    if (!body || body.length < 200) {
      return res.status(400).json({error: "Content is Too short"})
    }

    if (!catagories || catagories.length === 0) {
      return res.status(400).json({error: "Atleast one catagory is required"})
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({error: "Atleast one tag is required"})
    }

    let blog = new Blog()
    blog.title = title
    blog.body = body
    blog.excerpt = smartTrim(body, 321, ' ', ' ...')
    blog.slug = slugify(title).toLowerCase()
    blog.mtitle = `${title} - ${process.env.APP_NAME}`
    blog.mdesc = stripHtml(body.substring(0, 160)).result
    blog.postedBy = req.user._id
    // catagories and tags
    let arrayOfCatagories = catagories && catagories.split(',')
    let arrayOfTags = tags && tags.split(',')

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({error: 'Image Should be less than 1MB'})
      }
      blog.photo.data = fs.readFileSync(files.photo.path)
      blog.photo.contentType = files.photo.type
    }
    blog.save((err, result) => {
      if (err) {
        return res.status(400).json({error: "Blog Already Exists"})
      }
      //res.json(result)
      Blog.findByIdAndUpdate(result._id, {
        $push: {
          catagories: arrayOfCatagories
        }
      }, {new: true}).exec((err, result) => {
        if (err) {
          return res.status(400).json({error: errorHandler(err)})
        } else {
          Blog.findByIdAndUpdate(result._id, {
            $push: {
              tags: arrayOfTags
            }
          }, {new: true}).exec((err, result) => {
            if (err) {
              return res.status(400).json({error: errorHandler(err)})
            } else {
              res.json(result)
            }
          })
        }
      })
    })
  })
}

//list, read, listAllBlogsCatagoriesTags
exports.list = (req, res) => {
  Blog.find({})
  .populate('catagories', '_id name slug')
  .populate('tags', '_id name slug')
  .populate('postedBy', '_id name username')
  .sort({updatedAt: -1})
  .select('_id title slug excerpt catagories tags postedBy createdAt updatedAt')
  .exec((err, data) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    res.json(data)
  })

}

exports.listAllBlogsCatagoriesTags = (req, res) => {
    let limit = req.body.limit  ? parseInt(req.body.limit)  : 10
    let skip = req.body.skip  ? parseInt(req.body.skip)  : 0

    let blogs
    let catagories
    let tags

  Blog.find({})
    .populate('catagories', '_id name slug')
    .populate('tags', '_id name slug')
    .populate('postedBy', '_id name username profile')
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .select('_id title slug excerpt catagories tags postedBy createdAt updatedAt').exec((err, data) => {
      if (err) {
        return res.status(400).json({error: errorHandler(err)})
      }
    blogs = data // all blogs
    //get all catagories
    Catagory.find({}).exec((err, c) => {
      if (err) {
        return res.status(400).json({error: errorHandler(err)})
      }
      catagories = c //all catagories
      // get all tags
      Tag.find({}).exec((err, t) => {
        if (err) {
          return res.status(400).json({error: errorHandler(err)})
        }
        tags = t //all tags
        // return listAllBlogsCatagoriesTags
        res.json({blogs, catagories, tags, size: blogs.length})
      })
    })
  })
}

exports.read = (req, res) => {
  const slug = req.params.slug.toLowerCase()
  Blog.findOne({slug})
  .populate('catagories', '_id name slug')
  .populate('tags', '_id name slug')
  .populate('postedBy', '_id name username')
  .select('_id title body slug mtitle mdesc catagories tags postedBy createdAt updatedAt')
  .exec((err, data) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    res.json(data)
  })
}

exports.remove = (req, res) => {
  const slug = req.params.slug.toLowerCase()
  Blog.findOneAndRemove({slug}).exec((err, data) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    res.json({message: "Blog Removed Successfully"})
  })
}

exports.update = (req, res) => {
  const slug = req.params.slug.toLowerCase()
  Blog.findOne({slug}).exec((err, oldBlog) => {
    if (err) {
      return res.status(400).json({error: errorHandler(err)})
    }
    let form = new formidable.IncomingForm()
    form.keepExtensions = true

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(400).json({error: 'Image could not upload'})
      }

      let slugBeforeMerge = oldBlog.slug
      oldBlog = _.merge(oldBlog, fields)
      oldBlog.slug = slugBeforeMerge

      const {body, desc, catagories, tags} = fields

      if (body) {
        oldBlog.excerpt = smartTrim(body, 320, ' ', ' ...')
        oldBlog.desc = stripHtml(body.substring(0, 160)).result
      }

      if (catagories) {
        oldBlog.catagories = catagories.split(',')
      }

      if (tags) {
        oldBlog.tags = tags.split(',')
      }

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res.status(400).json({error: 'Image Should be less than 1MB'})
        }
        oldBlog.photo.data = fs.readFileSync(files.photo.path)
        oldBlog.photo.contentType = files.photo.type
      }
      oldBlog.save((err, result) => {
        if (err) {
          return res.status(400).json({error: errorHandler(err)})
        }
        result.photo = undefined
        res.json(result)
      })
    })
  })

}

exports.photo = (req, res) => {
  const slug = req.params.slug.toLowerCase()
  Blog.findOne({slug})
   .select('photo')
   .exec((err, blog) => {
     if (err || !blog) {
       return res.status(400).json({
         error: errorHandler(err)
       })
     }
     res.set('Content-Type', blog.photo.contentType)
     return res.send(blog.photo.data)
   })
}

exports.listRelated = (req, res) => {
    let limit = req.body.limit ? parseInt(req.body.limit) : 3
    const { _id, catagories } = req.body.blog

  Blog.find({_id: {$ne: _id} , catagories: {$in: catagories} })
    .limit(limit)
    .populate('postedBy', '_id name username profile')
    .select('title slug excerpt postedBy createdAt updatedAt')
    .exec((err, blogs) => {
      if(err) {
        res.status(400).json({
          error: "No related Blogs"
        })
      }
      res.json(blogs)
      //console.log(blogs)
    })
}

exports.listSearch = (req, res) => {
  console.log(' requested',req.query)
  const { search } = req.query;
  //console.log('Search',search)
  if (search) {
    Blog.find(
      {
      $or: [{ title: { $regex: search, $options: "i" } }, { body: { $regex: search, $options: "i" } }]
    },
    (err, blogs) => {
      if (err) {
        return res.status(400).json({
          error: "something went wrong"
        })
      }
      //console.log(blogs)
     res.json(blogs)
    }).select('-photo -body');
  }
}

exports.listByUser = (req, res) => {
  User.findOne({username: req.params.username}).exec((err, user) => {
    if(err){
      return res.status(400).json({
        error: errorHandler(err)
      })
    }
    let userId = user._id
    Blog.find({postedBy: userId})
          .populate('catagories', '_id name slug')
          .populate('tags', '_id name slug')
          .populate('postedBy', '_id name username')
          .select(' _id title slug postedBy createdAt updatedAt ')
          .exec((err, data) => {
            if(err){
              return res.status(400).json({
                error: errorHandler(err)
              })
            }
            res.json(data)
          })
  })
}
