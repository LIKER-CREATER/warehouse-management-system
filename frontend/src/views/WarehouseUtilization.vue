<template>
  <div>
    <div class="header-bar">
      <h1>仓库利用率</h1>
      <el-select v-model="selectedWarehouseId" placeholder="请选择仓库" style="width: 200px;" @change="fetchUtilization">
        <el-option
          v-for="warehouse in warehouseList"
          :key="warehouse.id"
          :label="warehouse.warehouseNumber"
          :value="warehouse.id">
        </el-option>
      </el-select>
    </div>

    <el-row :gutter="20" v-if="utilization" class="utilization-row">
      <!-- 利用率饼图 -->
      <el-col :span="12">
        <el-card class="utilization-card">
          <div slot="header" style="text-align: center; font-weight: 600;">
            <i class="el-icon-pie-chart" style="margin-right: 8px; color: #409EFF;"></i>
            格口利用率
          </div>
          <div class="pie-chart-container">
            <svg class="pie-chart" viewBox="0 0 200 200">
              <!-- 背景圆 -->
              <circle cx="100" cy="100" r="80" fill="#E4E7ED" />
              <!-- 已占用扇形 -->
              <path 
                :d="getPiePath(utilization.occupiedSlots, utilization.totalSlots)" 
                fill="#F56C6C" 
                stroke="#fff" 
                stroke-width="2" />
              <!-- 中心文字 -->
              <text x="100" y="95" text-anchor="middle" class="pie-percentage">
                {{ Math.round(utilization.utilizationRate) }}%
              </text>
              <text x="100" y="115" text-anchor="middle" class="pie-label">利用率</text>
            </svg>
            <!-- 图例 -->
            <div class="pie-legend">
              <div class="legend-item">
                <span class="legend-color" style="background-color: #F56C6C;"></span>
                <span class="legend-label">已占用</span>
                <span class="legend-value">{{ utilization.occupiedSlots }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background-color: #E4E7ED;"></span>
                <span class="legend-label">空闲</span>
                <span class="legend-value">{{ utilization.emptySlots }}</span>
              </div>
              <div class="legend-item legend-total">
                <span class="legend-label">总计</span>
                <span class="legend-value">{{ utilization.totalSlots }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 格口统计 -->
      <el-col :span="12">
        <el-card class="utilization-card">
          <div slot="header" style="text-align: center; font-weight: 600;">
            <i class="el-icon-data-line" style="margin-right: 8px; color: #409EFF;"></i>
            格口统计
          </div>
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-icon" style="background-color: #E6F7FF; color: #409EFF;">
                <i class="el-icon-s-grid"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ utilization.totalSlots }}</div>
                <div class="stat-label">总格口数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon" style="background-color: #FEF0F0; color: #F56C6C;">
                <i class="el-icon-box"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ utilization.occupiedSlots }}</div>
                <div class="stat-label">已占用</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon" style="background-color: #F0F9FF; color: #67C23A;">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ utilization.emptySlots }}</div>
                <div class="stat-label">空闲</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 空闲格口列表 -->
    <el-card style="margin-top: 20px;" v-if="emptySlots.length > 0">
      <div slot="header" class="empty-slots-header">
        <span style="font-size: 16px; font-weight: 600;">
          <i class="el-icon-s-grid" style="margin-right: 8px; color: #67C23A;"></i>
          空闲格口列表
          <el-tag type="success" size="small" style="margin-left: 10px;">共 {{ emptySlots.length }} 个空闲格口</el-tag>
        </span>
        <el-button style="float: right; padding: 3px 0" type="text" icon="el-icon-refresh" @click="refreshEmptySlots">刷新</el-button>
      </div>
      
      <!-- 按货架分组的空闲格口 -->
      <el-collapse v-model="activeShelves" accordion>
        <el-collapse-item 
          v-for="shelf in groupedEmptySlots" 
          :key="shelf.shelfId"
          :name="shelf.shelfId">
          <template slot="title">
            <div class="shelf-header">
              <i class="el-icon-s-grid shelf-header-icon"></i>
              <el-tag type="primary" size="medium" class="shelf-tag">
                {{ shelf.shelfNumber }}
              </el-tag>
              <span class="shelf-header-count">
                <i class="el-icon-box"></i>
                {{ shelf.slots.length }} 个空闲格口
              </span>
            </div>
          </template>
          
          <!-- 格口卡片网格 -->
          <div class="slots-grid">
            <div 
              v-for="slot in shelf.slots" 
              :key="`${slot.shelfId}-${slot.floorNumber}`"
              class="slot-card">
              <div class="slot-card-content">
                <div class="slot-floor">
                  <i class="el-icon-sort"></i>
                  <span class="floor-number">第{{ slot.floorNumber }}层</span>
                </div>
                <div class="slot-status">
                  <el-tag type="success" size="small" effect="dark">
                    <i class="el-icon-check"></i> 空闲
                  </el-tag>
                </div>
                <div class="slot-location">
                  <i class="el-icon-location"></i>
                  <span class="location-text">{{ slot.shelfNumber }}-{{ slot.floorNumber }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-empty v-else-if="selectedWarehouseId && emptySlots.length === 0" description="该仓库暂无空闲格口"></el-empty>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WarehouseUtilization',
  data() {
    return {
      warehouseList: [],
      selectedWarehouseId: null,
      utilization: null,
      emptySlots: [],
      activeShelves: [] // 展开的货架ID列表
    };
  },
  computed: {
    // 按货架分组的空闲格口
    groupedEmptySlots() {
      const groups = {};
      
      this.emptySlots.forEach(slot => {
        const key = slot.shelfId;
        if (!groups[key]) {
          groups[key] = {
            shelfId: slot.shelfId,
            shelfNumber: slot.shelfNumber,
            slots: []
          };
        }
        groups[key].slots.push(slot);
      });
      
      // 转换为数组并按货架编号排序
      const result = Object.values(groups);
      result.sort((a, b) => a.shelfNumber.localeCompare(b.shelfNumber));
      
      // 对每个货架的格口按层数排序
      result.forEach(group => {
        group.slots.sort((a, b) => a.floorNumber - b.floorNumber);
      });
      
      return result;
    }
  },
  created() {
    this.fetchWarehouses();
  },
  methods: {
    fetchWarehouses() {
      axios.get('/api/warehouse/list').then(res => {
        this.warehouseList = res.data.data;
        if (this.warehouseList.length > 0) {
          this.selectedWarehouseId = this.warehouseList[0].id;
          this.fetchUtilization();
        }
      });
    },
    fetchUtilization() {
      if (!this.selectedWarehouseId) {
        return;
      }

      // 获取利用率
      axios.get(`/api/inventory/warehouse/${this.selectedWarehouseId}/utilization`).then(res => {
        this.utilization = res.data.data;
      });

      // 获取空闲格口
      this.refreshEmptySlots();
    },
    refreshEmptySlots() {
      if (!this.selectedWarehouseId) {
        return;
      }

      axios.get(`/api/inventory/warehouse/${this.selectedWarehouseId}/empty-slots`).then(res => {
        this.emptySlots = res.data.data;
        // 默认所有货架都为折叠状态
        this.activeShelves = [];
      });
    },
    getShelfTagType(shelfId) {
      // 根据货架ID返回不同的标签类型，用于视觉区分
      const types = ['', 'primary', 'success', 'warning', 'danger', 'info'];
      return types[shelfId % types.length] || 'info';
    },
    // 计算饼图路径
    getPiePath(occupied, total) {
      if (total === 0) {
        return '';
      }
      
      const centerX = 100;
      const centerY = 100;
      const radius = 80;
      const percentage = occupied / total;
      const angle = percentage * 2 * Math.PI;
      
      // 起始角度从顶部开始（-90度）
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + angle;
      
      // 计算起点和终点坐标
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      // 大弧标志（如果角度大于180度）
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      // 构建路径
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }
  }
};
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 隐藏当前页面右侧内容区域滚动条（仍可滚轮滚动） */
:deep(.content-stage) {
  scrollbar-width: none; /* Firefox */
}

:deep(.content-stage::-webkit-scrollbar) {
  display: none; /* WebKit */
}

/* 空闲格口列表样式 */
.empty-slots-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 货架分组标题样式 */
.shelf-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 5px 0;
}

.shelf-header-icon {
  color: #409EFF;
  font-size: 18px;
}

.shelf-tag {
  font-size: 14px;
  font-weight: 600;
}

.shelf-header-count {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  color: #67C23A;
  font-size: 14px;
  font-weight: 500;
}

.shelf-header-count i {
  font-size: 16px;
}

/* 格口卡片网格 */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  padding: 15px 0;
}

.slot-card {
  border: 2px solid #E4E7ED;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.slot-card:hover {
  border-color: #67C23A;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
  transform: translateY(-2px);
}

.slot-card-content {
  padding: 15px;
  text-align: center;
}

.slot-floor {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.slot-floor i {
  color: #409EFF;
  font-size: 18px;
}

.floor-number {
  color: #606266;
}

.slot-status {
  margin-bottom: 10px;
}

.slot-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.slot-location i {
  color: #C0C4CC;
}

.location-text {
  font-family: 'Courier New', monospace;
  background-color: #F5F7FA;
  padding: 2px 6px;
  border-radius: 3px;
}

/* 折叠面板样式优化 */
.el-collapse {
  border: none;
}

.el-collapse-item {
  margin-bottom: 10px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.el-collapse-item__header {
  background-color: #F5F7FA;
  padding: 12px 20px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.el-collapse-item__header:hover {
  background-color: #ECF5FF;
}

.el-collapse-item__content {
  padding: 0 20px 20px 20px;
}

.el-collapse-item__wrap {
  border-bottom: none;
}

/* 饼图样式 */
.pie-chart-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 12px;
  gap: 20px;
}

.pie-chart {
  width: 190px;
  height: 190px;
  flex-shrink: 0;
}

.pie-percentage {
  font-size: 32px;
  font-weight: bold;
  fill: #303133;
}

.pie-label {
  font-size: 14px;
  fill: #909399;
}

/* 图例样式 */
.pie-legend {
  width: 240px;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F5F7FA;
}

.legend-item:last-child {
  border-bottom: none;
}

.legend-item.legend-total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 2px solid #E4E7ED;
  font-weight: 600;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 10px;
}

.legend-label {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.legend-value {
  color: #303133;
  font-weight: 600;
  font-size: 16px;
}

/* 统计卡片样式 */
.stats-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #EBEEF5;
  transition: all 0.3s ease;
}

.stat-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 统一卡片高度 */
.utilization-row {
  display: flex;
  align-items: stretch;
}

.utilization-row .el-col {
  display: flex;
}

.utilization-card {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.utilization-card /deep/ .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>

