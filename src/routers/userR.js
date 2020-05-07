const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const User = require("../models/users");
const sharp = require("sharp");
const follow = require("../middleware/follow");

const { check, validationResult } = require("express-validator");
const router = new express.Router();

const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(png|jpg|bmp|)$/)) {
			return cb(new Error("File must be an image"));
		}
		cb(undefined, true);
	},
});

router.post(
	"/user/login",
	[
		check("email").isEmail(),
		check("password").isLength({ min: 7, max: 32 }),
	],
	async (req, res) => {
		const error = validationResult(req);
		if (!error.isEmpty()) {
			return res.status(422).json({ error: error.array() });
		}
		try {
			const user = await User.findByCredentials(
				req.body.email,
				req.body.password
			);
			const token = await user.generateAuthToken();
			res.send({ user, token });
		} catch (e) {
			res.send(e);
		}
	}
);

router.post(
	"/user/register",
	[
		check("email").isEmail(),
		check("password").isLength({ min: 7, max: 32 }),
	],
	async (req, res) => {
		const error = validationResult(req);

		if (!error.isEmpty()) {
			return res.status(422).json({ error: error.array() });
		}

		const user = new User(req.body);
		try {
			await user.save();
			const token = await user.generateAuthToken();
			res.send({ user, token });
		} catch (e) {
			res.status(400).send(e);
		}
	}
);

router.post("/user/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});
		await req.user.save();

		res.send();
	} catch (e) {
		res.status(500).send;
	}
});

router.post("/user/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send;
	}
});

router.get("/user/fetch/:id", async (req, res) => {
	try {
		const user = User.findById(req.params.id);
		if (!user) {
			throw new Error();
		}
		res.set("Content-Type", "image/png");
		res.send(user.avatar);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.get("/user/me", auth, async (req, res) => {
	res.send(req.user);
});

router.delete("/user/me", auth, async (req, res) => {
	try {
		await req.user.remove();
		res.send(req.user);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.post(
	"/user/upload/avatar",
	auth,
	upload.single("avatar"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send(req.user.avatar);
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

router.delete("user/delete/avatar", auth, async (req, res) => {
	req.user.avatar = undefined;
	res.send(req.user);
	await req.user.s;
});

router.get("/user/avatar/:id", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user || !user.avatar) {
			throw new Error();
		}

		res.set("Content-Type", "image/jpg");
		res.send(user.avatar);
	} catch (e) {
		res.sendStatus(404);
	}
});

router.get("/user/me/avatar", auth, async (req, res) => {
	const user = await User.findById(req.user._id);
	res.set("Content-Type", "image/png");
	res.send(user.avatar);
});

router.post("/user/follow/:id", auth, follow, async (req, res) => {
	const follid = req.params.id;
	const user = User.findById(req.params.id);
	if (!user) {
		return res.status(400).send("user not found");
	}
	// req.user.followedBy(follid, req.user._id);
	res.sendStatus(200);
});

router.get("/user/me/following", auth, async (req, res) => {
	const followings = [];
	try {
		var each = new Promise((resolve, reject) => {
			req.user.following.forEach(async (obj, index, array) => {
				// if(index>=req.query.skip && index<=req.query.limit)
				const foll = await User.findOne({ _id: obj });
				followings.push(foll);
				if (index === array.length - 1) resolve();
			});
		}).then(() => {
			followings.sort((a, b) =>
				a.name > b.name ? 1 : b.name > a.name ? -1 : 0
			);
			res.send(followings);
		});
	} catch (e) {
		res.status(500).send(e);
	}
});

router.get("/user/me/follower", auth, async (req, res) => {
	const followers = [];
	try {
		var each = new Promise((resolve, reject) => {
			req.user.follower.forEach(async (obj, index, array) => {
				// if(index>=req.query.skip && index<=req.query.limit)
				const foll = await User.findOne({ _id: obj });
				followers.push(foll);
				if (index === array.length - 1) resolve();
			});
		}).then(() => {
			followers.sort((a, b) =>
				a.name > b.name ? 1 : b.name > a.name ? -1 : 0
			);
			res.send(followers);
		});
	} catch (e) {
		res.status(500).send(e);
	}
});

module.exports = router;
