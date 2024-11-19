const User = require('../models/User')

async function banUser(req, res) {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: 'user not found'})
    }
    if (user.isBan) {
         user.isBan = false;
    } else {
        user.isBan = true;
    }
   
    user.save();
    return res.status(200).json({ message: "Ban user successfully! "})

}

async function loadAllUser(req, res) {
    const users = await User.find();
    return res.status(200).json(users);
}


module.exports = { banUser, loadAllUser }