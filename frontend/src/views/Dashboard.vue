<template>
  <div class="dashboard-page">
    <!-- 页面标题和操作栏 -->
    <div class="header-bar">
      <h1>运营看板</h1>
      <div class="actions">
        <el-button 
          icon="el-icon-refresh" 
          size="small" 
          @click="loadDashboardData"
          :loading="loading">
          刷新数据
        </el-button>
        <el-tooltip content="数据自动刷新间隔：5分钟" placement="bottom">
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            inactive-text=""
            @change="handleAutoRefresh">
          </el-switch>
        </el-tooltip>
      </div>
    </div>
    
    <!-- 统计卡片区域 -->
    <div class="stats-cards-section">
      <el-row :gutter="24">
        <!-- 总库存价值 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="dashboard-card stat-card micro-interaction">
            <div class="stat-content">
              <div class="stat-icon stat-icon-primary">
                <i class="el-icon-coin"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">总库存价值</div>
                <div class="stat-value">¥{{ formatCurrency(totalValue) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 活跃仓库数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="dashboard-card stat-card micro-interaction">
            <div class="stat-content">
              <div class="stat-icon stat-icon-success">
                <i class="el-icon-office-building"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">
                  活跃仓库数
                  <el-tooltip content="活跃仓库数：指当前有库存的仓库数量（库存价值大于0的仓库）" placement="top">
                    <i class="el-icon-question" style="margin-left: 4px; color: #909399; cursor: help;"></i>
                  </el-tooltip>
                </div>
                <div class="stat-value">{{ warehouseValues.length }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 仓库数量 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="dashboard-card stat-card micro-interaction">
            <div class="stat-content">
              <div class="stat-icon stat-icon-warning">
                <img src="../../icon/store.png" alt="仓库" class="store-icon" />
              </div>
              <div class="stat-info">
                <div class="stat-label">仓库数量</div>
                <div class="stat-value">{{ totalWarehouseCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 平均仓库价值 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="dashboard-card stat-card micro-interaction">
            <div class="stat-content">
              <div class="stat-icon stat-icon-info">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">平均仓库价值</div>
                <div class="stat-value">¥{{ formatCurrency(averageWarehouseValue) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 详细数据区域 -->
    <div class="dashboard-section">
      <el-row :gutter="24">
        <!-- 仓库价值柱状图 -->
        <el-col :xs="24" :sm="24" :md="24">
          <el-card class="dashboard-card micro-interaction">
            <div slot="header" class="card-header">
              <span class="card-title">
                <i class="el-icon-coin card-icon primary"></i>
                仓库库存价值
              </span>
              <span class="card-total">总计：¥{{ formatCurrency(totalValue) }}</span>
            </div>
            <div class="chart-wrapper">
              <div id="warehouse-bar-chart"></div>
              <div v-if="warehouseValues.length === 0" class="no-data">
                <i class="el-icon-info"></i>
                <span>暂无仓库数据</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  name: 'Dashboard',
  data() {
    return {
      totalValue: 0,
      warehouseValues: [], // 按仓库分组的库存价值（只包含有库存的）
      totalWarehouseCount: 0, // 所有仓库的总数量
      lowStockProducts: [], // 占位，避免历史模板引用报错
      loading: false,
      autoRefresh: false, // 自动刷新开关
      refreshTimer: null, // 自动刷新定时器
      warehouseBarChart: null
    };
  },
  mounted() {
    this.loadDashboardData();
  },
  computed: {
    // 计算平均仓库价值
    averageWarehouseValue() {
      if (this.warehouseValues.length === 0) {
        return 0;
      }
      return this.totalValue / this.warehouseValues.length;
    }
  },
  beforeDestroy() {
    // 清除定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    window.removeEventListener('resize', this.resizeWarehouseChart);
    if (this.warehouseBarChart) {
      this.warehouseBarChart.dispose();
      this.warehouseBarChart = null;
    }
  },
  methods: {
    // 加载所有看板数据
    async loadDashboardData() {
      this.loading = true;
      try {
        await Promise.all([
          this.loadTotalValue()
        ]);
      } catch (error) {
        console.error('加载看板数据失败:', error);
        this.$message.error('加载看板数据失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载总库存价值（按仓库分组）
    async loadTotalValue() {
      try {
        // 获取所有仓库信息
        const warehousesRes = await axios.get('/api/warehouse/list');
        if (!warehousesRes.data || warehousesRes.data.code !== 200) {
          return;
        }
        const warehouses = warehousesRes.data.data || [];
        
        // 获取所有库存数据
        const inventoryRes = await axios.get('/api/inventory/list?current=1&size=10000');
        if (!inventoryRes.data || inventoryRes.data.code !== 200) {
          return;
        }
        const inventoryList = inventoryRes.data.data.records || inventoryRes.data.data || [];
        
        // 获取所有商品信息（包含单价）
        const productRes = await axios.get('/api/product/list');
        const products = productRes.data.data || [];
        
        // 创建商品ID到单价的映射
        const priceMap = {};
        products.forEach(p => {
          priceMap[p.id] = parseFloat(p.unitPrice) || 0;
        });
        
        // 保存所有仓库的总数量
        this.totalWarehouseCount = warehouses.length;
        
        // 创建仓库ID到仓库信息的映射
        const warehouseMap = {};
        warehouses.forEach(w => {
          warehouseMap[w.id] = {
            id: w.id,
            warehouseNumber: w.warehouseNumber,
            value: 0
          };
        });
        
        // 按仓库和商品计算库存价值
        inventoryList.forEach(item => {
          const warehouseId = item.warehouseId;
          const productId = item.productId;
          const quantity = item.quantity || 0;
          const price = priceMap[productId] || 0;
          
          if (warehouseMap[warehouseId]) {
            warehouseMap[warehouseId].value += quantity * price;
          }
        });
        
        // 转换为数组并按价值排序
        this.warehouseValues = Object.values(warehouseMap)
          .filter(w => w.value > 0) // 只显示有库存的仓库
          .sort((a, b) => b.value - a.value); // 按价值降序排列
        
        // 计算总价值
        this.totalValue = this.warehouseValues.reduce((sum, w) => sum + w.value, 0);
        this.$nextTick(() => {
          this.renderWarehouseBarChart();
        });
      } catch (error) {
        console.error('加载总库存价值失败:', error);
        this.totalValue = 0;
        this.warehouseValues = [];
        this.totalWarehouseCount = 0;
      }
    },
    
    // 格式化货币
    formatCurrency(value) {
      if (value === null || value === undefined) {
        return '0.00';
      }
      return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    },
    
    // 计算仓库价值占比
    getWarehousePercentage(value) {
      if (this.totalValue === 0) {
        return '0.00';
      }
      return ((value / this.totalValue) * 100).toFixed(2);
    },
    
    renderWarehouseBarChart() {
      const dom = document.getElementById('warehouse-bar-chart');
      if (!dom) return;
      if (!this.warehouseBarChart) {
        this.warehouseBarChart = echarts.init(dom);
        window.addEventListener('resize', this.resizeWarehouseChart);
      }
      if (!this.warehouseValues || this.warehouseValues.length === 0) {
        this.warehouseBarChart.clear();
        return;
      }
      const names = this.warehouseValues.map(w => w.warehouseNumber);
      const values = this.warehouseValues.map(w => Number((w.value || 0).toFixed(2)));
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const item = params[0];
            const val = Number(item.value || 0);
            return `${item.name}<br/>价值：¥${val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
          }
        },
        grid: { left: 70, right: 20, bottom: 40, top: 30 },
        xAxis: {
          type: 'category',
          data: names,
          axisTick: { alignWithLabel: true },
          axisLabel: { color: '#606266' }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#606266',
            formatter: (v) => {
              // 千分位显示，避免长数字被截断
              if (Number.isNaN(v)) return '¥0';
              return `¥${echarts.format.addCommas(Number(v).toFixed(0))}`;
            }
          },
          splitLine: { lineStyle: { color: '#ebeef5' } }
        },
        series: [
          {
            name: '仓库价值',
            type: 'bar',
            data: values,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#60a5fa' }
              ]),
              borderRadius: [6, 6, 0, 0]
            },
            barWidth: 32
          }
        ]
      };
      this.warehouseBarChart.setOption(option);
    },
    resizeWarehouseChart() {
      if (this.warehouseBarChart) {
        this.warehouseBarChart.resize();
      }
    },
    
    // 处理自动刷新
    handleAutoRefresh(value) {
      if (value) {
        // 开启自动刷新，每5分钟刷新一次
        this.refreshTimer = setInterval(() => {
          this.loadDashboardData();
        }, 5 * 60 * 1000); // 5分钟
        this.$message.success('已开启自动刷新，每5分钟更新一次');
      } else {
        // 关闭自动刷新
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
          this.refreshTimer = null;
        }
        this.$message.info('已关闭自动刷新');
      }
    }
  }
};
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--text-strong);
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-bar h1 {
  margin: 21.44px 0;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 卡片基础样式 */
.dashboard-card {
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.dashboard-card /deep/ .el-card__body {
  padding: 20px;
}

/* 统计卡片区域 */
.stats-cards-section {
  margin-bottom: 24px;
}

/* 统计卡片样式 */
.stat-card {
  background-color: white;
}

.stat-card /deep/ .el-card__body {
  padding: 24px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  color: white;
}

.stat-icon-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.store-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

/* 详细数据区域 */
.dashboard-section {
  margin-bottom: 0;
}

/* 卡片头部样式 */
.card-header {
  padding: 12px 20px;
  margin: -20px -20px 20px;
  background-color: #fafafa;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  font-size: 18px;
}

.card-icon {
  font-size: 18px;
  margin-right: 8px;
}

.card-icon.primary {
  color: #409EFF;
}

.card-icon.danger {
  color: #F56C6C;
}

.card-total {
  color: #606266;
  font-size: 14px;
}

.warehouse-value-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
}

.warehouse-value-item {
  display: flex;
  align-items: center;
  padding: 18px 16px;
  margin-bottom: 12px;
  background: rgba(248, 250, 252, 0.85);
  border-radius: 18px;
  border-left: 4px solid rgba(99, 102, 241, 0.25);
  transition: all 0.3s ease;
}

/* 禁用 tooltip */
.warehouse-value-list .el-tooltip__popper,
.warehouse-value-list [x-placement] {
  display: none !important;
}

.warehouse-value-item.top-warehouse {
  background: rgba(248, 113, 113, 0.08);
  border-left-color: #F56C6C;
}

.warehouse-value-item:last-child {
  margin-bottom: 0;
}

.warehouse-rank {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.rank-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e4e7ed;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.rank-number.rank-top {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.warehouse-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.warehouse-icon {
  font-size: 20px;
  color: #409EFF;
  margin-right: 10px;
}

.warehouse-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.warehouse-value-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.warehouse-amount {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.chart-wrapper {
  min-height: 360px;
}

#warehouse-bar-chart {
  width: 100%;
  height: 360px;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.no-data i {
  font-size: 24px;
  margin-bottom: 10px;
  display: block;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .dashboard-page {
    padding: 16px;
  }
  
  .el-col {
    margin-bottom: 16px;
  }
  
  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .card-header {
    padding: 10px 16px;
    margin: -16px -16px 16px;
  }
  
  .dashboard-card /deep/ .el-card__body {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .header-bar h1 {
    font-size: 24px;
  }
  
  .stat-card /deep/ .el-card__body {
    padding: 20px 16px;
  }
  
  .stat-content {
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
  
  .stat-value {
    font-size: 22px;
  }
}
</style>

