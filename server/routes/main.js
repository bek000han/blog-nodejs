const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET / HOME
router.get('', async (req, res) => {
    try {
        const locals = {
            title: "BeckBlogs",
            desc: "a blog by Bekz"
        }
        
        let perPage = 5;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ { $sort: {createdAt: -1} } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        res.render('index', {
            locals, 
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null
        });

    } catch (error) {
        console.log(error);
    }
});

// GET / POST :id
router.get('/post/:id', async (req, res) => {
    try {
        let slug = req.params.id;
        const data = await Post.findById({ _id: slug });
        const locals = {
            title: data.title,
            desc: "a blog by Bekz"
        }

        res.render('post', { locals, data });
    } catch (error) {
        console.log(error);
    }
});

router.get('/about', (req, res) => {
    res.render('about');
});


module.exports = router;