const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// Check Login Token
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.status(401).json({ message: 'Unauthorised'});
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorised'});
    }
}

// GET / ADMIN login
router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "Admin Mode",
            desc: "a blog by Bekz"
        }
        res.render('admin/index', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

// POST / ADMIN check login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if(!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id}, jwtSecret);
        res.cookie('token', token, { httpOnly: true });

        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
    }
});

// POST / ADMIN register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password:hashedPassword });
            res.status(201).json({ message: 'User created', user});
        } catch (error) {
            if (error.code === 11000) {
                res.status(409).json({ message: 'User already created'});
            }
            res.status(500).json({ message: 'Internal server error'});
        }
    } catch (error) {
        console.log(error);
    }
});

// GET / ADMIN DASHBOARD
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Admin Dashboard",
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

        res.render('admin/dashboard', {
            locals, 
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            layout: adminLayout 
        });
    } catch (error) {
        console.log(error);
    }
});

// GET / ADMIN CREATE post
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Create Post",
            desc: "a blog by Bekz"
        }
        const data = await Post.find();
        res.render('admin/add-post', {
            locals,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error);
    }
});

// POST / ADMIN Create Post
router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            });
            await Post.create(newPost);
        } catch (error) {
            console.log(error);
        }
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
});

// GET / ADMIN Update Post
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Create Post",
            desc: "a blog by Bekz"
        }
        const data = await Post.findOne({ _id: req.params.id });

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error);
    }
});

// PUT / ADMIN Update Post
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });
        res.redirect(`/edit-post/${req.params.id}`);
    } catch (error) {
        console.log(error);
    }
});

// DELETE / ADMIN Delete Post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
});

// GET / ADMIN Logout
router.get('/logout', (req, res) => {
    try {
        res.clearCookie('token');
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;