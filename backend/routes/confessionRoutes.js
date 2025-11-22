const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const { protect } = require('../middleware/auth');

// 获取所有表白
router.get('/', async (req, res) => {
  try {
    const confessions = await Confession.find().sort({ createdAt: -1 });
    res.json(confessions);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发布表白
router.post('/', protect, async (req, res) => {
  const { content, isAnonymous } = req.body;
  
  try {
    const confession = await Confession.create({
      content,
      author: req.user._id,
      authorName: req.user.username,
      isAnonymous: isAnonymous || false
    });
    
    res.status(201).json(confession);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除表白（仅作者）
router.delete('/:id', protect, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    
    if (!confession) {
      return res.status(404).json({ message: '表白不存在' });
    }
    
    // 验证是否为作者
    if (confession.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: '无权限删除' });
    }
    
    await confession.remove();
    res.json({ message: '表白已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', protect, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    
    if (!confession) {
      return res.status(404).json({ message: '表白不存在' });
    }
    
    // 检查是否已经点赞
    const isLiked = confession.likes.some(like => like.toString() === req.user._id.toString());
    
    if (isLiked) {
      // 取消点赞
      confession.likes = confession.likes.filter(like => like.toString() !== req.user._id.toString());
    } else {
      // 点赞
      confession.likes.push(req.user._id);
    }
    
    await confession.save();
    res.json({ 
      likesCount: confession.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加评论
router.post('/:id/comments', protect, async (req, res) => {
  const { content } = req.body;
  
  try {
    const confession = await Confession.findById(req.params.id);
    
    if (!confession) {
      return res.status(404).json({ message: '表白不存在' });
    }
    
    const newComment = {
      content,
      author: req.user._id,
      authorName: req.user.username
    };
    
    confession.comments.push(newComment);
    await confession.save();
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除评论（仅评论作者或表白作者）
router.delete('/:confessionId/comments/:commentId', protect, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.confessionId);
    
    if (!confession) {
      return res.status(404).json({ message: '表白不存在' });
    }
    
    const comment = confession.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    // 验证权限：评论作者或表白作者
    if (comment.author.toString() !== req.user._id.toString() && 
        confession.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: '无权限删除' });
    }
    
    comment.remove();
    await confession.save();
    
    res.json({ message: '评论已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增：收藏/取消收藏表白
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    
    if (!confession) {
      return res.status(404).json({ message: '表白不存在' });
    }
    
    // 检查是否已经收藏
    const isFavorited = confession.favorites.some(fav => fav.toString() === req.user._id.toString());
    
    if (isFavorited) {
      // 取消收藏
      confession.favorites = confession.favorites.filter(fav => fav.toString() !== req.user._id.toString());
    } else {
      // 收藏
      confession.favorites.push(req.user._id);
    }
    
    await confession.save();
    res.json({ 
      favoritesCount: confession.favorites.length,
      isFavorited: !isFavorited
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增：举报表白
router.post('/:id/report', protect, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    
    if (!confession) {
      return res.status(404).json({ message: '表白不存在' });
    }
    
    // 检查是否已经举报
    const isReported = confession.reports.some(report => report.toString() === req.user._id.toString());
    
    if (isReported) {
      return res.status(400).json({ message: '您已经举报过该表白' });
    }
    
    // 添加举报
    confession.reports.push(req.user._id);
    await confession.save();
    
    res.json({ 
      reportsCount: confession.reports.length,
      message: '举报成功'
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 新增：获取用户收藏的表白
router.get('/favorites', protect, async (req, res) => {
  try {
    const confessions = await Confession.find({ favorites: req.user._id }).sort({ createdAt: -1 });
    res.json(confessions);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;