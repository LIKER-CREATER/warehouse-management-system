<template>
  <div class="statistics-container">
    <h1 class="page-title">分类统计</h1>
    
    <el-card class="stats-card">
      <div slot="header" class="stats-card-header">
        <span style="font-weight: 600;">
          <i class="el-icon-pie-chart" style="margin-right: 8px; color: #409EFF;"></i>
          区域库存分布
        </span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-select v-model="statisticsType" style="width: 150px;" @change="loadAreaStatistics">
            <el-option label="按库存数量" value="quantity"></el-option>
            <el-option label="按商品SKU" value="sku"></el-option>
          </el-select>
          <el-button icon="el-icon-refresh" size="small" @click="loadAreaStatistics">刷新</el-button>
        </div>
      </div>
      
      <div v-loading="loading" class="chart-wrapper">
        <!-- 显示图表 -->
        <div v-if="areaStatistics.length > 0" id="area-chart"></div>
        <el-empty v-else-if="!loading" description="暂无区域统计数据"></el-empty>
      </div>
    </el-card>
    
    <!-- 区域详情表格（点击图表后显示） -->
    <el-card v-if="selectedArea" style="margin-top: 20px;">
      <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600;">
          <i class="el-icon-s-grid" style="margin-right: 8px; color: #67C23A;"></i>
          {{ selectedArea }} 库存详情
        </span>
        <el-button icon="el-icon-close" size="small" @click="closeAreaDetail">关闭</el-button>
      </div>
      
      <div v-loading="detailLoading">
        <el-table 
          :data="areaDetailData" 
          border 
          stripe
          style="width: 100%"
          :default-sort="{prop: 'quantity', order: 'descending'}">
          <el-table-column prop="shelfNumber" label="货架编号" width="150" align="center">
            <template slot-scope="scope">
              <el-tag type="primary">{{ scope.row.shelfNumber }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="productName" label="商品名称" min-width="160">
            <template slot-scope="scope">
              <div style="display: flex; align-items: center;">
                <i class="el-icon-goods" style="margin-right: 8px; color: #409EFF;"></i>
                <span>{{ scope.row.productName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="productType" label="商品类型" width="120" align="center">
            <template slot-scope="scope">
              <el-tag type="info" size="small">{{ scope.row.productType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" width="150" align="center">
            <template slot-scope="scope">
              <div style="display: flex; align-items: center; justify-content: center;">
                <i class="el-icon-location" style="margin-right: 4px; color: #67C23A;"></i>
                <span style="font-family: 'Courier New', monospace;">{{ scope.row.location }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="库存数量" width="120" align="center" sortable>
            <template slot-scope="scope">
              <span style="font-weight: 600; color: #303133;">{{ scope.row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalWeight" label="总重量(kg)" width="120" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.totalWeight && scope.row.totalWeight > 0">
                {{ parseFloat(scope.row.totalWeight).toFixed(3) }}
              </span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalVolume" label="总体积(m³)" width="130" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.totalVolume && scope.row.totalVolume > 0">
                {{ parseFloat(scope.row.totalVolume).toFixed(6) }}
              </span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-if="areaDetailData.length === 0 && !detailLoading" style="text-align: center; padding: 40px;">
          <i class="el-icon-info" style="color: #909399; font-size: 24px;"></i>
          <p style="margin-top: 10px; color: #909399;">该区域暂无库存数据</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  name: 'AreaStatistics',
  data() {
    return {
      statisticsType: 'quantity', // 'quantity' 或 'sku'
      areaStatistics: [],
      selectedArea: null,
      areaDetailData: [],
      loading: false,
      detailLoading: false,
      areaChart: null
    };
  },
  mounted() {
    this.loadAreaStatistics();
  },
  beforeDestroy() {
    if (this.areaChart) {
      this.areaChart.dispose();
      this.areaChart = null;
    }
    // 移除窗口大小变化监听器
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
  },
  methods: {
    // 初始化图表
    initChart() {
      if (!echarts) {
        console.warn('ECharts 未安装，将使用表格视图');
        return;
      }
      // 如果图表已经初始化，不需要重复初始化
      if (this.areaChart) {
        return;
      }
      const chartDom = document.getElementById('area-chart');
      if (chartDom) {
        this.areaChart = echarts.init(chartDom);
        this.areaChart.on('click', (params) => {
          this.handleAreaClick(params.name);
        });
        // 监听窗口大小变化
        const resizeHandler = () => {
          if (this.areaChart) {
            this.areaChart.resize();
          }
        };
        window.addEventListener('resize', resizeHandler);
        // 保存 resize handler，以便在组件销毁时移除
        this._resizeHandler = resizeHandler;
      } else {
        console.warn('图表容器未找到，请检查 DOM 元素是否存在');
      }
    },
    
    // 加载区域统计
    async loadAreaStatistics() {
      this.loading = true;
      try {
        // 获取所有库存数据
        const inventoryRes = await axios.get('/api/inventory/list?current=1&size=10000');
        if (inventoryRes.data && inventoryRes.data.code === 200) {
          const inventoryList = inventoryRes.data.data.records || inventoryRes.data.data || [];
          
          // 获取所有货架信息（包含区域分类）
          const shelfRes = await axios.get('/api/shelf/list');
          const shelves = shelfRes.data.data || [];
          
          // 创建货架ID到区域分类的映射
          const shelfAreaMap = {};
          shelves.forEach(shelf => {
            shelfAreaMap[shelf.id] = shelf.areaCategory || '未分类';
          });
          
          // 按区域统计
          const areaMap = {};
          
          if (this.statisticsType === 'quantity') {
            // 按库存数量统计
            inventoryList.forEach(item => {
              const area = shelfAreaMap[item.shelfId] || '未分类';
              if (!areaMap[area]) {
                areaMap[area] = {
                  areaCategory: area,
                  value: 0,
                  shelfCount: new Set()
                };
              }
              areaMap[area].value += item.quantity || 0;
              areaMap[area].shelfCount.add(item.shelfId);
            });
          } else {
            // 按商品SKU数量统计
            inventoryList.forEach(item => {
              const area = shelfAreaMap[item.shelfId] || '未分类';
              if (!areaMap[area]) {
                areaMap[area] = {
                  areaCategory: area,
                  value: 0,
                  shelfCount: new Set(),
                  products: new Set()
                };
              }
              areaMap[area].products.add(item.productId);
              areaMap[area].shelfCount.add(item.shelfId);
            });
            
            // 转换Set大小为数量
            Object.keys(areaMap).forEach(area => {
              areaMap[area].value = areaMap[area].products.size;
            });
          }
          
          // 转换为数组并计算百分比
          const total = Object.values(areaMap).reduce((sum, item) => sum + item.value, 0);
          this.areaStatistics = Object.values(areaMap).map(item => ({
            areaCategory: item.areaCategory,
            value: item.value,
            percentage: total > 0 ? ((item.value / total) * 100).toFixed(2) : 0,
            shelfCount: item.shelfCount.size
          })).sort((a, b) => b.value - a.value);
          
          // 数据加载完成后，初始化并更新图表
          this.$nextTick(() => {
            this.initChart();
            this.updateChart();
          });
        }
      } catch (error) {
        console.error('加载区域统计失败:', error);
        this.$message.error('加载区域统计数据失败，请稍后重试');
        this.areaStatistics = [];
      } finally {
        this.loading = false;
      }
    },
    
    // 更新图表
    updateChart() {
      if (!echarts || !this.areaChart || this.areaStatistics.length === 0) {
        return;
      }
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const data = params.data;
            return `${data.name}<br/>${this.statisticsType === 'quantity' ? '库存数量' : '商品SKU'}: ${data.value}<br/>占比: ${data.percentage}%<br/>货架数: ${data.shelfCount}`;
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          itemWidth: 14,
          itemHeight: 14,
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: this.statisticsType === 'quantity' ? '库存数量' : '商品SKU',
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['60%', '52%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            data: this.areaStatistics.map(item => ({
              value: item.value,
              name: item.areaCategory,
              percentage: item.percentage,
              shelfCount: item.shelfCount
            }))
          }
        ]
      };
      
      this.areaChart.setOption(option);
    },
    
    // 处理区域点击事件
    async handleAreaClick(areaCategory) {
      this.selectedArea = areaCategory;
      this.detailLoading = true;
      
      try {
        // 获取所有库存数据
        const inventoryRes = await axios.get('/api/inventory/list?current=1&size=10000');
        if (inventoryRes.data && inventoryRes.data.code === 200) {
          const inventoryList = inventoryRes.data.data.records || inventoryRes.data.data || [];
          
          // 获取所有货架信息
          const shelfRes = await axios.get('/api/shelf/list');
          const shelves = shelfRes.data.data || [];
          
          // 创建货架ID到区域分类的映射
          const shelfAreaMap = {};
          const shelfNumberMap = {};
          shelves.forEach(shelf => {
            shelfAreaMap[shelf.id] = shelf.areaCategory || '未分类';
            shelfNumberMap[shelf.id] = shelf.shelfNumber;
          });
          
          // 筛选该区域的库存数据
          const areaInventory = inventoryList.filter(item => {
            return shelfAreaMap[item.shelfId] === areaCategory;
          });
          
          // 转换为详情数据格式
          this.areaDetailData = areaInventory.map(item => ({
            shelfId: item.shelfId,
            shelfNumber: shelfNumberMap[item.shelfId] || `货架${item.shelfId}`,
            productId: item.productId,
            productName: item.productName,
            productType: item.productType,
            quantity: item.quantity,
            floorNumber: item.floorNumber,
            location: `${shelfNumberMap[item.shelfId] || item.shelfId}-${item.floorNumber}`,
            totalWeight: item.totalWeight,
            totalVolume: item.totalVolume
          }));
        }
      } catch (error) {
        console.error('加载区域详情失败:', error);
        this.$message.error('加载区域详情失败，请稍后重试');
        this.areaDetailData = [];
      } finally {
        this.detailLoading = false;
      }
    },
    
    // 关闭区域详情
    closeAreaDetail() {
      this.selectedArea = null;
      this.areaDetailData = [];
    }
  }
};
</script>

<style scoped>
.statistics-container {
  padding: 0;
}

.page-title {
  margin-bottom: 20px;
  margin-top: 16px;
}

.stats-card {
  max-width: 1280px;
  margin: 8px auto 24px;
}

.stats-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  min-height: 420px;
}

/* 图表容器样式 */
#area-chart {
  width: 100%;
  min-height: 420px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .statistics-container {
    padding: 10px;
  }
  
  #area-chart {
    height: 400px !important;
  }
}
</style>

