const API_URL = process.env.NODE_ENV === 'production' ? 
  'https://your-api-url.workers.dev/api' : 
  'http://localhost:5000/api';

// 检查用户是否已登录
const checkAuth = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('authNav').classList.add('d-none');
    document.getElementById('userNav').classList.remove('d-none');
    // 显示用户名，可以根据需要修改显示格式
    document.getElementById('usernameDisplay').textContent = user.username;
    document.getElementById('postCard').classList.remove('d-none');
  } else {
    document.getElementById('authNav').classList.remove('d-none');
    document.getElementById('userNav').classList.add('d-none');
    document.getElementById('postCard').classList.add('d-none');
  }
  return user;
};

// 获取所有表白
const fetchConfessions = async () => {
  const user = checkAuth();
  
  try {
    const res = await fetch(`${API_URL}/confessions`);
    const data = await res.json();
    
    const container = document.getElementById('confessionsContainer');
    container.innerHTML = '';
    
    if (data.length === 0) {
      container.innerHTML = '<div class="col-12 text-center text-muted"><h5>暂无表白内容，快来成为第一个吧！</h5></div>';
      return;
    }
    
    data.forEach(confession => {
      const isOwner = user && user._id === confession.author;
      const isLiked = user && confession.likes.some(likeId => likeId === user._id);
      // 检查是否已收藏
      const isFavorited = user && confession.favorites.some(favId => favId === user._id);
      // 检查是否已举报
      const isReported = user && confession.reports.some(reportId => reportId === user._id);
      
      // 修改匿名显示逻辑，添加年级和班级信息
      let displayName = '匿名用户';
      if (!confession.isAnonymous && confession.authorName) {
        displayName = confession.authorName;
        // 如果有年级和班级信息则显示
        if (confession.grade && confession.class) {
          displayName += ` (${confession.grade}年级${confession.class}班)`;
        }
      }
      
      // 构建评论HTML
      let commentsHtml = '';
      if (confession.comments && confession.comments.length > 0) {
        confession.comments.forEach(comment => {
          const isCommentOwner = user && comment.author === user._id;
          const commentDisplayName = comment.authorName;
          
          commentsHtml += `
            <div class="comment-item" data-comment-id="${comment._id}">
              <div class="d-flex justify-content-between align-items-center">
                <span class="comment-author">${commentDisplayName}</span>
                <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p class="comment-content mb-1">${comment.content}</p>
              ${(isCommentOwner || isOwner) ? `
                <button class="btn btn-sm btn-danger delete-comment-btn" 
                        data-confession-id="${confession._id}" 
                        data-comment-id="${comment._id}">
                  <i class="bi bi-trash"></i> 删除
                </button>
              ` : ''}
            </div>
          `;
        });
      }
      
      const card = `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card confession-card h-100">
            <div class="card-body">
              <p class="card-text">${confession.content}</p>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="confession-author">
                  <i class="bi bi-person"></i> ${displayName}
                  ${confession.isAnonymous ? '<span class="badge bg-secondary ms-1">匿名</span>' : ''}
                </small>
                <small class="confession-date">
                  <i class="bi bi-clock"></i> ${new Date(confession.createdAt).toLocaleString()}
                </small>
              </div>
              
              <!-- 操作按钮 -->
              <div class="mb-2 d-flex gap-2">
                <!-- 点赞按钮 -->
                <button class="btn btn-sm like-btn ${isLiked ? 'liked' : ''}" 
                        data-id="${confession._id}" 
                        ${!user ? 'disabled title="请登录后点赞"' : ''}>
                  <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> 
                  <span>${confession.likes ? confession.likes.length : 0}</span>
                </button>
                
                <!-- 收藏按钮 -->
                <button class="btn btn-sm favorite-btn ${isFavorited ? 'favorited' : ''}" 
                        data-id="${confession._id}" 
                        ${!user ? 'disabled title="请登录后收藏"' : ''}>
                  <i class="bi bi-bookmark${isFavorited ? '-fill' : ''}"></i>
                  <span>${confession.favorites ? confession.favorites.length : 0}</span>
                </button>
                
                <!-- 举报按钮 -->
                <button class="btn btn-sm report-btn ${isReported ? 'reported' : ''}" 
                        data-id="${confession._id}" 
                        ${!user ? 'disabled title="请登录后举报"' : ''}>
                  <i class="bi bi-flag${isReported ? '-fill' : ''}"></i>
                  <span>${confession.reports ? confession.reports.length : 0}</span>
                </button>
              </div>
              
              <!-- 评论区 -->
              <div class="comments-section">
                <div class="comments-list mb-2">
                  ${commentsHtml || '<div class="text-muted small">暂无评论</div>'}
                </div>
                
                ${user ? `
                <div class="input-group input-group-sm">
                  <input type="text" class="form-control comment-input" 
                         placeholder="写下你的评论..." 
                         data-confession-id="${confession._id}">
                  <button class="btn btn-primary send-comment-btn" 
                          data-confession-id="${confession._id}">
                    发送
                  </button>
                </div>
                ` : ''}
              </div>
            </div>
            
            ${isOwner ? `
            <div class="card-footer bg-transparent">
              <button class="btn btn-sm btn-danger delete-btn" data-id="${confession._id}">
                <i class="bi bi-trash"></i> 删除
              </button>
            </div>
            ` : ''}
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
    
    // 添加事件监听
    attachEventListeners();
    
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('confessionsContainer').innerHTML = 
      '<div class="col-12 text-center text-danger"><h5>加载失败，请重试</h5></div>';
  }
};

// 附加所有事件监听器
const attachEventListeners = () => {
  // 删除表白
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteConfession);
  });
  
  // 点赞/取消点赞
  document.querySelectorAll('.like-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', toggleLike);
  });
  
  // 收藏/取消收藏
  document.querySelectorAll('.favorite-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', toggleFavorite);
  });
  
  // 举报
  document.querySelectorAll('.report-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', reportConfession);
  });
  
  // 发送评论
  document.querySelectorAll('.send-comment-btn').forEach(btn => {
    btn.addEventListener('click', sendComment);
  });
  
  // 按回车发送评论
  document.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendComment.call(input.parentElement.querySelector('.send-comment-btn'));
      }
    });
  });
  
  // 删除评论
  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', deleteComment);
  });
};

// 发布表白
const postConfession = async (e) => {
  e.preventDefault();
  
  const content = document.getElementById('confessionContent').value.trim();
  const isAnonymous = document.getElementById('anonymousCheck').checked;
  // 获取年级和班级的值
  const grade = document.getElementById('gradeSelect').value;
  const className = document.getElementById('classSelect').value;
  
  // 如果不是匿名发布，必须选择年级和班级
  if (!isAnonymous && (!grade || !className)) {
    alert('请选择年级和班级');
    return;
  }
  
  if (!content) {
    alert('请输入表白内容');
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  try {
    const res = await fetch(`${API_URL}/confessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ 
        content, 
        isAnonymous,
        // 只有非匿名发布时才发送年级和班级信息
        ...(isAnonymous ? {} : { grade, class: className })
      })
    });
    
    if (res.ok) {
      document.getElementById('confessionContent').value = '';
      document.getElementById('anonymousCheck').checked = false;
      // 清空年级和班级选择
      document.getElementById('gradeSelect').value = '';
      document.getElementById('classSelect').value = '';
      fetchConfessions();
    } else {
      alert('发布失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('发布失败，请重试');
  }
};

// 删除表白
const deleteConfession = async (e) => {
  if (!confirm('确定要删除这条表白吗？')) return;
  
  const id = e.target.closest('.delete-btn').dataset.id;
  const user = JSON.parse(localStorage.getItem('user'));
  
  try {
    const res = await fetch(`${API_URL}/confessions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (res.ok) {
      fetchConfessions();
    } else {
      alert('删除失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('删除失败，请重试');
  }
};

// 点赞/取消点赞
const toggleLike = async (e) => {
  const id = e.target.closest('.like-btn').dataset.id;
  const user = JSON.parse(localStorage.getItem('user'));
  const btn = e.target.closest('.like-btn');
  
  try {
    const res = await fetch(`${API_URL}/confessions/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // 更新UI
      if (data.isLiked) {
        btn.classList.add('liked');
        btn.querySelector('i').classList.remove('bi-heart');
        btn.querySelector('i').classList.add('bi-heart-fill');
      } else {
        btn.classList.remove('liked');
        btn.querySelector('i').classList.remove('bi-heart-fill');
        btn.querySelector('i').classList.add('bi-heart');
      }
      
      btn.querySelector('span').textContent = data.likesCount;
    } else {
      alert('操作失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('操作失败，请重试');
  }
};

// 收藏/取消收藏
const toggleFavorite = async (e) => {
  const id = e.target.closest('.favorite-btn').dataset.id;
  const user = JSON.parse(localStorage.getItem('user'));
  const btn = e.target.closest('.favorite-btn');
  
  try {
    const res = await fetch(`${API_URL}/confessions/${id}/favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // 更新UI
      if (data.isFavorited) {
        btn.classList.add('favorited');
        btn.querySelector('i').classList.remove('bi-bookmark');
        btn.querySelector('i').classList.add('bi-bookmark-fill');
      } else {
        btn.classList.remove('favorited');
        btn.querySelector('i').classList.remove('bi-bookmark-fill');
        btn.querySelector('i').classList.add('bi-bookmark');
      }
      
      btn.querySelector('span').textContent = data.favoritesCount;
    } else {
      alert('操作失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('操作失败，请重试');
  }
};

// 举报表白
const reportConfession = async (e) => {
  const id = e.target.closest('.report-btn').dataset.id;
  const user = JSON.parse(localStorage.getItem('user'));
  const btn = e.target.closest('.report-btn');
  
  // 如果已经举报过，则不允许再次举报
  if (btn.classList.contains('reported')) {
    alert('您已经举报过该表白');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/confessions/${id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // 更新UI
      btn.classList.add('reported');
      btn.querySelector('i').classList.remove('bi-flag');
      btn.querySelector('i').classList.add('bi-flag-fill');
      btn.querySelector('span').textContent = data.reportsCount;
      
      alert('举报成功，感谢您的反馈');
    } else {
      const errorData = await res.json();
      alert(errorData.message || '举报失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('举报失败，请重试');
  }
};

// 发送评论
const sendComment = async function() {
  const confessionId = this.dataset.confessionId;
  const input = document.querySelector(`.comment-input[data-confession-id="${confessionId}"]`);
  const content = input.value.trim();
  
  if (!content) return;
  
  const user = JSON.parse(localStorage.getItem('user'));
  
  try {
    const res = await fetch(`${API_URL}/confessions/${confessionId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ content })
    });
    
    if (res.ok) {
      input.value = '';
      fetchConfessions(); // 重新加载所有表白以显示新评论
    } else {
      alert('评论失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('评论失败，请重试');
  }
};

// 删除评论
const deleteComment = async (e) => {
  if (!confirm('确定要删除这条评论吗？')) return;
  
  const confessionId = e.target.closest('.delete-comment-btn').dataset.confessionId;
  const commentId = e.target.closest('.delete-comment-btn').dataset.commentId;
  const user = JSON.parse(localStorage.getItem('user'));
  
  try {
    const res = await fetch(`${API_URL}/confessions/${confessionId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (res.ok) {
      fetchConfessions(); // 重新加载所有表白以更新评论列表
    } else {
      alert('删除失败，请重试');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('删除失败，请重试');
  }
};

// 退出登录
const logout = () => {
  localStorage.removeItem('user');
  window.location.reload();
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  fetchConfessions();
  
  document.getElementById('postBtn').addEventListener('click', postConfession);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // 为导航栏的发布按钮添加点击事件
  const postNavBtn = document.getElementById('postNavBtn');
  if (postNavBtn) {
    postNavBtn.addEventListener('click', () => {
      // 滚动到发布区域
      const postCard = document.getElementById('postCard');
      if (postCard) {
        postCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});