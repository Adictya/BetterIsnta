const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const Post = require("../models/posts");
const sharp = require("sharp");

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

router.get("/post/:id");

module.exports = router;
