module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888', // 这里是您的Spring Boot后端的地址
        ws: true,
        changeOrigin: true
      }
    }
  }
};

