const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        min: 3,
        max: 160,
        required: true
    },
    body: {
        type: {},
        required: true,
        min: 200,
        max: 2000000,
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    mtitle: {
        type: String
    },
    mdesc: {
        type: String
    },
    excerpt: {
        type: String,
        max: 1000
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    catagories: [{ type: ObjectId, ref: 'Catagory', required: true }],
    tags: [{ type: ObjectId, ref: 'Tag', required: true }],
    postedBy: {
      type: ObjectId,
      ref: 'User'
    }
}, {timestamps: true}
);


module.exports = mongoose.model('Blog', blogSchema)
