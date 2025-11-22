const API_URL = 'http://localhost:5000/api';

// 用户信息上报函数
function uploadUserProfileAfterRegister(userData) {
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

// 检查用户是否存在于CSV文件中
async function checkUserInCSV(username) {
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
                
                if (csvUsername === username) {
                    return {
                        username: csvUsername,
                        name: parts[2]?.trim(), // 学生姓名
                        userId: csvUsername
                    };
                }
            }
        }
        return null;
    } catch (error) {
        console.error('检查用户时出错:', error);
        // 显示更具体的错误信息给用户
        document.getElementById('registerError').textContent = '无法加载用户数据，请检查网络连接或稍后重试';
        document.getElementById('registerError').classList.remove('d-none');
        return null;
    }
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('registerError');
    
    // 验证输入
    if (!username || !password) {
        errorElement.textContent = '请输入用户名和密码';
        errorElement.classList.remove('d-none');
        return;
    }
    
    try {
        // 检查用户是否存在于CSV文件中
        const userData = await checkUserInCSV(username);
        
        if (!userData) {
            errorElement.textContent = '用户不存在于系统中，无法注册';
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
        
        // 保存用户信息
        localStorage.setItem('user', JSON.stringify(userObj));
        
        // 上报用户信息
        uploadUserProfileAfterRegister(userObj);
        
        window.location.href = 'index.html';
        
    } catch (error) {
        errorElement.textContent = '注册失败，请重试';
        errorElement.classList.remove('d-none');
    }
});