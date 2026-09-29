import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/styles/theme.css'
import axios from 'axios' // 引入axios

Vue.config.productionTip = false

Vue.use(ElementUI)

// 设置Axios请求拦截器
axios.interceptors.request.use(
  config => {
    // 从localStorage中获取token
    const token = localStorage.getItem('user-token');
    if (token) {
      // 如果token存在，则在每个请求的header中添加Authorization字段
      config.headers['Authorization'] = token;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 设置Axios响应拦截器
axios.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    // 统一判断业务响应码，非200视为失败，抛入catch分支处理
    if (response.data && response.data.code !== undefined && response.data.code !== 200) {
      return Promise.reject({
        response: {
          data: response.data,
          status: response.status
        }
      });
    }
    return response;
  },
  error => {
    // 对响应错误做点什么
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // 401 未授权，清除token并跳转到登录页
      if (status === 401) {
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-info');
        // 避免在登录页面重复跳转
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // 403 禁止访问
      if (status === 403) {
        // 可以显示错误消息，但不跳转
        console.error('无权访问:', data.message || '无权访问此资源');
      }
      
      // 500 服务器错误
      if (status === 500) {
        console.error('服务器错误:', data);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误，请检查网络连接');
    } else {
      // 在设置请求时发生了一些事情，触发了错误
      console.error('请求配置错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
