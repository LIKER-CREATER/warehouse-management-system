<template>
  <div class="login-page-wrapper">
    <div class="wrapper">
        <!-- 注册表单容器 -->
        <div class="form-container">
            <!-- 标题 -->
            <h2>用户注册</h2>
            
            <!-- 步骤条 -->
            <el-steps :active="currentStep" finish-status="success" align-center class="register-steps">
                <el-step title="账号信息"></el-step>
                <el-step title="个人信息"></el-step>
                <el-step title="联系方式"></el-step>
            </el-steps>

            <!-- 错误提示区域 -->
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
            <!-- 成功提示区域 -->
            <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

            <!-- 步骤1：账号信息 -->
            <div v-show="currentStep === 0" class="step-content">
                <input type="text" v-model="formData.username" class="input-field" placeholder="用户名" aria-label="用户名" title="请输入用户名" @click="clearError">
                <input type="password" v-model="formData.password" class="input-field" placeholder="密码" aria-label="密码" title="请输入密码" @click="clearError">
                <input type="password" v-model="formData.confirmPassword" class="input-field" placeholder="确认密码" aria-label="确认密码" title="请再次输入密码" @click="clearError" @keyup.enter="nextStep">
            </div>

            <!-- 步骤2：个人信息 -->
            <div v-show="currentStep === 1" class="step-content">
                <input type="text" v-model="formData.realName" class="input-field" placeholder="真实姓名" aria-label="真实姓名" title="请输入真实姓名" @click="clearError">
                <select v-model="formData.gender" class="input-field" aria-label="性别" title="请选择性别" @click="clearError">
                <option value="">请选择性别</option>
                <option :value="1">男</option>
                <option :value="0">女</option>
            </select>
            </div>

            <!-- 步骤3：联系方式 -->
            <div v-show="currentStep === 2" class="step-content">
                <input type="text" v-model="formData.phone" class="input-field" placeholder="电话号码" aria-label="电话号码" title="请输入电话号码" @click="clearError">
                <input type="text" v-model="formData.idCard" class="input-field" placeholder="身份证号码" aria-label="身份证号码" title="请输入身份证号码" @click="clearError" @keyup.enter="register">
            </div>

            <!-- 按钮区域 -->
            <div class="button-group">
                <el-button v-if="currentStep > 0" @click="prevStep" class="prev-btn">上一步</el-button>
                <el-button v-if="currentStep < 2" type="primary" @click="nextStep" class="next-btn">下一步</el-button>
                <el-button v-if="currentStep === 2" type="primary" @click="register" :loading="registering" class="register-btn">
                    {{ registering ? '注册中...' : '完成注册' }}
                </el-button>
            </div>

            <!-- 返回登录链接 -->
            <div class="links-row">
                <a href="#" @click.prevent="goToLogin">已有账号？去登录</a>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Register',
  data() {
    return {
      currentStep: 0, // 当前步骤，0-2
      formData: {
        username: '',
        password: '',
        confirmPassword: '',
        realName: '',
        gender: '',
        phone: '',
        idCard: '',
        role: 2 // 默认角色为普通用户
      },
      errorMessage: '',
      successMessage: '',
      registering: false
    };
  },
  methods: {
    // 下一步
    nextStep() {
      this.clearError();
      
      // 步骤1验证：账号信息
      if (this.currentStep === 0) {
      if (!this.formData.username || !this.formData.password) {
        this.errorMessage = '用户名和密码不能为空';
        return;
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errorMessage = '两次输入的密码不一致';
        return;
      }
      if (this.formData.password.length < 6) {
        this.errorMessage = '密码长度不能少于6位';
        return;
        }
      }

      // 步骤2验证：个人信息
      if (this.currentStep === 1) {
      if (!this.formData.realName) {
        this.errorMessage = '真实姓名不能为空';
        return;
      }
      if (this.formData.gender === '') {
        this.errorMessage = '请选择性别';
        return;
      }
      }
      
      // 通过验证，进入下一步
      if (this.currentStep < 2) {
        this.currentStep++;
      }
    },
    
    // 上一步
    prevStep() {
      this.clearError();
      if (this.currentStep > 0) {
        this.currentStep--;
      }
    },
    
    // 注册
    register() {
      this.clearError();
      
      // 最终验证
      if (!this.formData.phone) {
        this.errorMessage = '电话号码不能为空';
        return;
      }

      if (!this.formData.idCard) {
        this.errorMessage = '身份证号码不能为空';
        return;
      }

      // 验证身份证格式（简单验证）
      if (!/^\d{17}[\dXx]$/.test(this.formData.idCard)) {
        this.errorMessage = '身份证号码格式不正确';
        return;
      }

      // 验证手机号格式（简单验证）
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        this.errorMessage = '手机号码格式不正确';
        return;
      }

      this.registering = true;

      // 准备提交数据
      const userData = {
        username: this.formData.username,
        password: this.formData.password,
        realName: this.formData.realName,
        gender: this.formData.gender,
        phone: this.formData.phone,
        idCard: this.formData.idCard,
        role: this.formData.role
      };

      // 先尝试使用公开注册接口，如果不存在则使用需要权限的接口
      axios.post('/api/user/register', userData)
        .then(response => {
          if (response.data && response.data.code === 200) {
            this.successMessage = '注册成功！正在跳转到登录页面...';
            setTimeout(() => {
              this.$router.push('/login');
            }, 2000);
          } else {
            this.errorMessage = response.data.message || '注册失败，请稍后再试';
            this.registering = false;
          }
        })
        .catch(error => {
          // 如果公开注册接口不存在，尝试使用需要权限的接口（可能会失败）
          if (error.response && error.response.status === 404) {
            // 如果后端没有公开注册接口，提示用户联系管理员
            this.errorMessage = '注册功能需要管理员权限，请联系管理员进行注册';
            this.registering = false;
          } else {
          console.error('注册请求失败:', error);
          if (error.response && error.response.data && error.response.data.message) {
            this.errorMessage = error.response.data.message;
          } else if (error.response && error.response.status === 401) {
            this.errorMessage = '注册功能需要管理员权限，请联系管理员';
          } else {
            this.errorMessage = '注册失败，请稍后再试';
          }
          this.registering = false;
          }
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
    margin-bottom: 30px;
    text-align: center;
    color: #2c3e50;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 1.2;
}

/* 步骤条样式 */
.register-steps {
    margin-bottom: 30px;
    padding: 0 20px;
}

/* 步骤内容区域 */
.step-content {
    min-height: 200px;
    padding: 10px 0;
}

.input-field {
    width: 100%;
    height: 44px;
    padding: 10px 0;
    margin: 0 0 16px;
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

select.input-field {
    cursor: pointer;
    color: #2c3e50;
}

select.input-field option {
    color: #2c3e50;
}

/* 按钮组 */
.button-group {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 30px;
}

.prev-btn,
.next-btn,
.register-btn {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: all 0.3s;
}

.register-btn {
    background: linear-gradient(135deg, #007BFF 0%, #0056b3 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.register-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #3672b9 0%, #285990 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
}

.register-btn:active:not(:disabled) {
    transform: translateY(0);
}

.register-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.links-row {
    width: 100%;
    margin: 20px 0 0;
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
    font-size: 13px;
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
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    border-radius: 4px;
    box-sizing: border-box;
}

@media (max-width: 768px) {
    .form-container {
        padding: 20px 20px;
        max-width: 100%;
    }
    
    .register-steps {
        padding: 0 10px;
    }
    
    .step-content {
        min-height: 180px;
    }
    
    .button-group {
        flex-direction: column;
    }
    
    .prev-btn,
    .next-btn,
    .register-btn {
        width: 100%;
    }
}
</style>
