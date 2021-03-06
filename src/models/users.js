const mongoose = require("mongoose");
const validator = require("express-validator");
const bcrypt = require("bcryptjs");

const Post = require("./posts");
// const Collections = require('./collections')

const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			require: true,
			lowercase: true,
			trim: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 7,
			trim: true,
		},
		age: {
			type: Number,
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
		avatar: {
			type: Buffer,
		},
		follower: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Follower",
				required: true,
			},
		],
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				required: true,
				ref: "Following",
			},
		],
		saved: [
			{
				type: mongoose.Schema.Types.ObjectId,
				required: true,
			},
		],
	},
	{
		timestamps: true,
	}
);
userSchema.methods.generateAuthToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.BCRYPT_SECRET
	);
	user.tokens = user.tokens.concat({ token });

	await user.save();
	return token;
};
userSchema.methods.followedBy = async function (id) {
	const user = this;
	const _id = mongoose.Types.ObjectId(id);
	user.follower.addToSet(_id);
	await user.save();
	return 1;
};
userSchema.methods.follow = async function (id) {
	const user = this;
	const _id = mongoose.Types.ObjectId(id);
	user.following.addToSet(_id);
	await user.save();
	return 1;
};
userSchema.virtual("saves", {
	ref: "Saved",
	localField: "saved",
	foreignField: "_id",
});
userSchema.virtual("followers", {
	ref: "Follower",
	localField: "_id",
	foreignField: "following",
});
userSchema.virtual("followings", {
	ref: "Following",
	localField: "_id",
	foreignField: "follower",
});
userSchema.virtual("posts", {
	ref: "Post",
	localField: "_id",
	foreignField: "owner",
});

userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;
	// delete userObject.avatar;

	return userObject;
};

userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error("Unable to Log-In");
	}

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		throw new Error("Unable to Log-In");
	}

	return user;
};

userSchema.pre("remove", async function (next) {
	const user = this;

	await Post.deleteMany({ owner: user._id });

	next();
});

userSchema.pre("save", async function (next) {
	const user = this;

	if (user.isModified("password")) {
		user.password = await bcrypt.hash(user.password, 8);
	}

	next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;
