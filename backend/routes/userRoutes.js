const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// 生成JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 注册用户
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    const user = await User.create({ username, password });
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: '用户名或密码错误' });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增：关注用户
router.post('/follow/:id', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不能关注自己
    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '不能关注自己' });
    }
    
    // 关注用户
    const updatedUser = await req.user.follow(userToFollow._id);
    
    res.json({
      message: '关注成功',
      following: updatedUser.following
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增：取消关注用户
router.post('/unfollow/:id', protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 取消关注用户
    const updatedUser = await req.user.unfollow(userToUnfollow._id);
    
    res.json({
      message: '取消关注成功',
      following: updatedUser.following
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增：获取用户的关注列表
router.get('/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('following', 'username');
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;