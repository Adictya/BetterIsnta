const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
	{
		poster: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		onPost: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Comments = mongoose.model("Comments", CommentSchema);

module.exports = Comments;
