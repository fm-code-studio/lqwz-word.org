const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 添加关注列表字段
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// 密码加密
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码验证方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 添加关注用户的方法
userSchema.methods.follow = async function(userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    await this.save();
  }
  return this;
};

// 添加取消关注用户的方法
userSchema.methods.unfollow = async function(userId) {
  this.following = this.following.filter(id => id.toString() !== userId.toString());
  await this.save();
  return this;
};

module.exports = mongoose.model('User', userSchema);