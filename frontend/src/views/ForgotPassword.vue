<template>
  <div class="login-page-wrapper">
    <div class="wrapper">
        <!-- 忘记密码表单容器 -->
        <div class="form-container">
            <!-- 标题 -->
            <h2>忘记密码</h2>
            <!-- 错误提示区域 -->
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
            <!-- 成功提示区域 -->
            <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

            <!-- 用户名输入框 -->
            <input type="text" v-model="username" class="input-field" placeholder="用户名" aria-label="用户名" title="请输入用户名" @click="clearError">
            <br>
            <!-- 手机号输入框 -->
            <input type="text" v-model="phone" class="input-field" placeholder="注册时填写的手机号" aria-label="手机号" title="请输入注册时填写的手机号" @click="clearError"
                @keyup.enter="resetPassword">

            <br>

            <!-- 重置密码按钮 -->
            <button type="button" class="login-btn" @click="resetPassword" :disabled="resetting">
                {{ resetting ? '重置中...' : '重置密码' }}
            </button>
            <!-- 返回登录链接 -->
            <div class="links-row">
                <a href="#" @click.prevent="goToLogin">返回登录</a>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ForgotPassword',
  data() {
    return {
      username: '',
      phone: '',
      errorMessage: '',
      successMessage: '',
      resetting: false
    };
  },
  methods: {
    resetPassword() {
      this.clearError();
      
      // 表单验证
      if (!this.username || !this.phone) {
        this.errorMessage = '用户名和手机号不能为空';
        return;
      }
      
      // 验证手机号格式（简单验证）
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        this.errorMessage = '手机号码格式不正确';
        return;
      }
      
      this.resetting = true;
      
      // 调用重置密码接口
      axios.post('/api/user/reset-password', {
        username: this.username,
        phone: this.phone
      })
      .then(response => {
        if (response.data && response.data.code === 200) {
          this.successMessage = '密码已重置为：123456，正在自动登录...';
          // 使用新密码自动登录
          this.autoLogin();
        } else {
          this.errorMessage = response.data.message || '重置密码失败，请检查用户名和手机号是否正确';
          this.resetting = false;
        }
      })
      .catch(error => {
        console.error('重置密码请求失败:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.errorMessage = error.response.data.message;
        } else if (error.response && error.response.status === 404) {
          this.errorMessage = '重置密码接口不存在，请联系管理员';
        } else {
          this.errorMessage = '重置密码失败，请检查用户名和手机号是否正确';
        }
        this.resetting = false;
      });
    },
    
    // 自动登录
    autoLogin() {
      axios.post('/api/user/login', {
        username: this.username,
        password: '123456'
      })
      .then(response => {
        if (response.data.code === 200 && response.data.data.token) {
          // 将 token 存入 localStorage
          localStorage.setItem('user-token', response.data.data.token);
          // 将用户信息也存入 localStorage
          localStorage.setItem('user-info', JSON.stringify(response.data.data.user));
          // 跳转到主页
          setTimeout(() => {
            this.$router.push('/').then(() => {
              window.location.reload();
            });
          }, 1500);
        } else {
          this.errorMessage = '密码重置成功，但自动登录失败，请手动登录（密码：123456）';
          this.resetting = false;
        }
      })
      .catch(error => {
        console.error('自动登录失败:', error);
        this.errorMessage = '密码重置成功，但自动登录失败，请手动登录（密码：123456）';
        this.resetting = false;
      });
    },
    
    clearError() {
      this.errorMessage = '';
      this.successMessage = '';
    },
    
    goToLogin() {
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
/* 复用登录界面的样式 */
.login-page-wrapper {
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    line-height: 1.5;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
}

.wrapper {
    width: 600px;
    max-width: 90%;
    margin: 0 auto;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.form-container {
    width: 100%;
    padding: 30px 40px;
    background-color: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    box-sizing: border-box;
}

.form-container h2 {
    margin-bottom: 35px;
    text-align: center;
    color: #2c3e50;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 1.2;
}

.input-field {
    width: 100%;
    height: 52px;
    padding: 12px 0;
    margin: 0 0 22px;
    display: block;
    border: none;
    border-bottom: 1px solid #ccc;
    background: transparent;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-bottom-color 0.3s;
}

.input-field::placeholder {
    color: #aaa;
    font-size: 14px;
    font-weight: 400;
}

.input-field:focus {
    border-bottom-color: #4a90e2;
    background: transparent;
    box-shadow: none;
}

.login-btn {
    width: 100%;
    padding: 14px;
    margin: 20px 0 0;
    background: linear-gradient(135deg, #007BFF 0%, #0056b3 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
}

.login-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #3672b9 0%, #285990 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
}

.login-btn:active:not(:disabled) {
    transform: translateY(0);
}

.login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.links-row {
    width: 100%;
    margin: 25px 0 0;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    font-size: 14px;
}

.links-row a {
    color: #007BFF;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
}

.links-row a:hover {
    color: #00b7ff;
}

.error-message {
    width: 100%;
    margin: 0 0 15px;
    padding: 10px 15px;
    background: #f8f8f8;
    color: #e74c3c;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    border-radius: 4px;
    box-sizing: border-box;
}

.success-message {
    width: 100%;
    margin: 0 0 15px;
    padding: 10px 15px;
    background: #f0f9ff;
    color: #67C23A;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    border-radius: 4px;
    box-sizing: border-box;
}

@media (max-width: 768px) {
    .form-container {
        padding: 30px 20px;
        max-width: 100%;
    }
}
</style>

