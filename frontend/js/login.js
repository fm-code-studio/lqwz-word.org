const API_URL = 'http://localhost:5000/api';

// 用户信息上报函数
function uploadUserProfileAfterLogin(userData) {
    var ui = {
        ak: '6921857a8560e34872f13fd2',
        sdt: 'h5mp',
        uin: userData.username,
        uit: 'China',
        uil: 'Chinese',
        id: userData.userId,
        it: 'xxxx' // 与aplus-idtype值保持一致
    };
    aplus.uploadUserProfile(JSON.stringify(ui), function(res) {
        console.log('uploadUserProfile: ', res);
    });
}

// 从CSV数据中验证用户
async function validateUserFromCSV(username, password) {
    try {
        // 使用本地相对路径的CSV文件
        const response = await fetch('/csv/高一年级账号密码.csv', {
            method: 'GET',
            mode: 'cors', // 确保启用跨域模式
            cache: 'no-cache'
        });
        
        // 检查响应是否成功
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // 解析CSV数据
        const lines = csvText.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const parts = line.split(',');
                const csvUsername = parts[3]?.trim(); // 学号作为用户名
                const csvPassword = parts[4]?.trim(); // 密码字段
                
                if (csvUsername === username && csvPassword === password) {
                    return {
                        username: csvUsername,
                        password: csvPassword,
                        userId: csvUsername,
                        name: parts[2]?.trim() // 学生姓名
                    };
                }
            }
        }
        return null;
    } catch (error) {
        console.error('验证用户时出错:', error);
        // 显示更具体的错误信息给用户
        document.getElementById('loginError').textContent = '无法加载用户数据，请检查网络连接或稍后重试';
        document.getElementById('loginError').classList.remove('d-none');
        return null;
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    // 验证输入
    if (!username || !password) {
        errorElement.textContent = '请输入用户名和密码';
        errorElement.classList.remove('d-none');
        return;
    }
    
    try {
        // 从CSV文件验证用户
        const userData = await validateUserFromCSV(username, password);
        
        if (!userData) {
            errorElement.textContent = '用户名或密码错误';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // 构造用户数据对象
        const userObj = {
            _id: userData.userId,
            username: userData.username,
            name: userData.name,
            token: 'mock_token_' + userData.username
        };
        
        // 保存用户信息到localStorage
        localStorage.setItem('user', JSON.stringify(userObj));
        
        // 上报用户信息
        uploadUserProfileAfterLogin(userObj);
        
        window.location.href = 'index.html';
        
    } catch (error) {
        errorElement.textContent = '登录失败，请重试';
        errorElement.classList.remove('d-none');
    }
});