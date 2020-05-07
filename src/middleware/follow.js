const User = require("../models/users");

const follow = async (req, res, next) => {
	const user1 = await User.findOne({
		_id: req.params.id,
	});
	if (!user1) {
	}
	user1.followedBy(req.user._id);
	req.user.follow(user1._id);
	next();
};

module.exports = follow;
