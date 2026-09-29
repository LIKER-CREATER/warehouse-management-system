<template>
  <div class="login-page-wrapper">
    <div class="gradient-orb orb-one"></div>
    <div class="gradient-orb orb-two"></div>
    <div class="wrapper glass-panel">
      <div class="brand-column" aria-hidden="true">
        <img src="../../icon/warehouse_login.jpg" alt="仓储管理系统" class="brand-image">
      </div>
      <div class="form-container surface-card">
            <h2>仓储管理系统</h2>
            <br>

            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="input-group">
          <label>用户名</label>
          <input
            type="text"
            v-model="username"
            class="input-field"
            placeholder="请输入用户名"
            aria-label="用户名"
            @click="clearError">
        </div>

        <div class="input-group">
          <label>密码</label>
          <input
            type="password"
            v-model="password"
            class="input-field"
            placeholder="请输入密码"
            aria-label="密码"
            @click="clearError"
                @keyup.enter="login">
        </div>

        <button type="button" class="login-btn" @click="login">
          <span>登录</span>
          <i class="el-icon-arrow-right"></i>
        </button>

            <div class="links-row">
                <a href="#" @click.prevent="goToForgotPassword">忘记密码？</a>
                <a href="#" @click.prevent="goToRegister">去注册</a>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    login() {
      if (!this.username || !this.password) {
        this.errorMessage = '用户名和密码不能为空';
        return;
      }

      axios.post('/api/user/login', {
        username: this.username,
        password: this.password
      })
      .then(response => {
        // 假设后端在成功时返回的数据中有一个 success 字段为 true
        // 并且返回一个 token 用于后续的认证
        if (response.data.code === 200 && response.data.data.token) {
          console.log('登录成功');
          // 将 token 存入 localStorage
          localStorage.setItem('user-token', response.data.data.token);
          // 将用户信息也存入 localStorage
          localStorage.setItem('user-info', JSON.stringify(response.data.data.user));
          this.$router.push('/').then(() => {
            window.location.reload();
          });
        } else {
          this.errorMessage = response.data.message || '用户名或密码错误';
        }
      })
      .catch(error => {
        console.error('登录请求失败:', error);
        // 为了方便测试，我们添加一个前端的临时登录逻辑
        if (this.username === 'admin' && this.password === 'password') {
            console.log('登录成功 (前端模拟)');
            localStorage.setItem('user-token', 'mock-token-for-dev');
            this.$router.push('/');
            return;
        }
        this.errorMessage = '登录失败，请稍后再试。';
      });
    },
    clearError() {
      this.errorMessage = '';
    },
    goToRegister() {
      this.$router.push('/register');
    },
    goToForgotPassword() {
      this.$router.push('/forgot-password');
    }
  }
};
</script>

<style scoped>
.login-page-wrapper {
  position: relative;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    line-height: 1.5;
  background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.25), transparent 40%),
              radial-gradient(circle at 80% 0%, rgba(125, 211, 252, 0.25), transparent 42%),
              var(--app-gradient, #f8fafc);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  padding: 40px 20px;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.65;
  z-index: 0;
}

.orb-one {
  width: 320px;
  height: 320px;
  background: rgba(99, 102, 241, 0.55);
  top: 10%;
  left: 12%;
}

.orb-two {
  width: 420px;
  height: 420px;
  background: rgba(14, 165, 233, 0.45);
  bottom: 5%;
  right: 12%;
}

.wrapper {
  position: relative;
  width: min(960px, 100%);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2px;
  padding: 0;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 45px 90px rgba(15, 23, 42, 0.16);
  z-index: 1;
    overflow: hidden;
}

.brand-column {
  padding: 0;
  background: transparent;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 30px 0 0 30px;
  overflow: hidden;
}

.brand-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0px;
  opacity: 0.95;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.brand-column .eyebrow {
  letter-spacing: 0.4em;
  font-size: 12px;
  opacity: 0.7;
}

.brand-column h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
}

.brand-column .sub-copy {
  margin-top: 24px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
}

.form-container {
  padding: 48px 42px 40px;
  border-radius: 0px;
  background: rgba(255, 255, 255, 0.9);
}

.form-container h2 {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 30px;
    font-weight: 700;
}

.form-subtitle {
  margin: 0 0 30px;
  font-size: 14px;
  color: #94a3b8;
}

.input-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.input-field {
    width: 100%;
    height: 52px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 0 16px;
    font-size: 15px;
  background: rgba(255, 255, 255, 0.9);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.input-field:focus {
  border-color: rgba(99, 102, 241, 0.8);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  outline: none;
}

.login-btn {
    width: 100%;
  padding: 16px;
  margin: 15px 0 0;
  background: linear-gradient(120deg, #6366f1, #60a5fa);
    color: #fff;
    border: none;
  border-radius: 18px;
    font-size: 16px;
    font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
    cursor: pointer;
  box-shadow: 0 20px 35px rgba(99, 102, 241, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 25px 45px rgba(99, 102, 241, 0.45);
}

.login-btn:active {
  transform: translateY(-1px);
}

.links-row {
  margin-top: 24px;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  color: #64748b;
}

.links-row a {
  color: #6366f1;
    text-decoration: none;
  font-weight: 600;
}

.links-row a:hover {
  color: #4f46e5;
}

.error-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #b91c1c;
  border-radius: 12px;
    font-size: 14px;
}

@media (max-width: 900px) {
  .wrapper {
    grid-template-columns: 1fr;
  }
  .brand-column {
    border-radius: 30px 30px 0 0;
  }
}

@media (max-width: 600px) {
  .login-page-wrapper {
    padding: 30px 16px;
  }
  .form-container,
  .brand-column {
    padding: 32px 24px;
  }
  .links-row {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>