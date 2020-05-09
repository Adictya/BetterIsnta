const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const Post = require("../models/posts");
const sharp = require("sharp");
const User = require("../models/users");
const Comment = require("../models/comments");

const router = new express.Router();

const upload = multer({
	limits: {
		fileSize: 50000000,
	},
	fileFileter(req, file, cb) {
		if (!file.orignalname.orignalname.match(/\.(png|jpg|bmp)$/)) {
			return cb(new Error("File must be an image"));
		}
		cb(undefined, true);
	},
});

router.post(
	"/post/upload",
	auth,
	upload.single("post"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 1024, height: 1024 })
			.png()
			.toBuffer();
		const post = new Post({
			image: buffer,
			description: req.body.description,
			owner: req.user._id,
		});

		await post.save();
		res.send(200);
	},
	(error, req, res, nest) => {
		res.status(400).send({ error: error.message });
	}
);

router.get("/post/me", auth, async (req, res) => {
	const sort = {};
	sort["createdAt"] = 1;

	try {
		await req.user
			.populate({
				path: "posts",
				options: {
					limits: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort,
				},
			})
			.execPopulate();
		res.send(req.user.posts);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.get("/posts", auth, async (req, res) => {
	const sort = {};
	const sending = [];
	sort["createdAt"] = 1;

	const post = await Post.find({
		owner: { $in: req.user.following },
	}).cursor();
	await post.eachAsync(async (doc) => {
		const temp = await Post.findOne({ _id: doc._id }).populate({
			path: "comments",
			options: {
				sort,
			},
			model: Comment,
		});
		sending.push({ post: temp, comments: temp.comments });
	});
	res.send(sending);
});

router.get("/post/:id", auth, async (req, res) => {
	const sort = {};
	sort["createdAt"] = 1;
	try {
		const post = await Post.findOne({ _id: req.params.id }).populate({
			path: "comments",
			options: {
				sort,
			},
			model: Comment,
		});
		if (req.user._id === post.owner) {
			res.send({ post, comments: post.comments });
		}
		const user = await User.findOne({ follower: req.user._id });
		if (!user || !post) {
			return res.sendStatus(400);
		}
		res.send({ post, comments: post.comments });
	} catch (e) {
		res.status(500).send(e);
	}
});

router.post("/post/comments/:id", auth, async (req, res) => {
	console.log(req.body.content);
	try {
		const comments = new Comment({
			content: req.body.content,
			poster: req.user._id,
			onPost: req.params.id,
		});
		await comments.save();
		res.sendStatus(200);
	} catch (e) {
		res.status(400).send(e);
	}
});

module.exports = router;
