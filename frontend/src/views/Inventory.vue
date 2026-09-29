<template>
  <div>
    <!-- 页面标题和操作栏 -->
    <div class="header-bar">
      <h1>库存管理</h1>
      <div class="actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称或货架编号"
          class="search-input"
          clearable
          @clear="fetchInventory"
          @keyup.enter.native="handleSearch">
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-select 
          v-model="filterWarehouseId" 
          placeholder="筛选仓库" 
          style="width: 200px; margin-left: 10px;"
          clearable 
          @change="handleWarehouseFilter">
          <el-option
            v-for="warehouse in warehouseList"
            :key="warehouse.id"
            :label="warehouse.warehouseNumber"
            :value="warehouse.id">
          </el-option>
        </el-select>
        <div class="stats-info">
          <el-tag type="info" style="margin-right: 10px;">总记录数: {{ total }}</el-tag>
          <el-tag type="warning" v-if="lowStockCount > 0">低库存预警: {{ lowStockCount }} 项</el-tag>
        </div>
      </div>
    </div>
    <!-- 按仓库分组的折叠面板 -->
    <el-collapse v-model="activeWarehouses" v-loading="loading">
      <el-collapse-item 
        v-for="warehouse in groupedWarehouses" 
        :key="warehouse.id"
        :name="warehouse.id">
        <template slot="title">
          <div class="warehouse-header">
            <i class="el-icon-office-building warehouse-header-icon"></i>
            <el-tag :type="getWarehouseTagType(warehouse.warehouseNumber)" size="medium" class="warehouse-tag">
              {{ warehouse.warehouseNumber }}
            </el-tag>
            <span class="warehouse-header-address">{{ warehouse.address }}</span>
            <span class="warehouse-header-stats">
              <el-tag type="info" size="small" style="margin-right: 8px;">
                {{ warehouse.inventoryCount }} 项库存
              </el-tag>
              <el-tag v-if="warehouse.lowStockCount > 0" type="warning" size="small">
                <i class="el-icon-warning"></i> {{ warehouse.lowStockCount }} 项低库存
              </el-tag>
            </span>
          </div>
        </template>
        <el-table 
          :data="warehouse.inventory" 
          border 
          style="width: 100%" 
          stripe
          :row-class-name="tableRowClassName">
          <el-table-column prop="productId" label="商品ID" width="90" align="center">
            <template slot-scope="scope">
              <span class="product-id">{{ scope.row.productId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="productName" label="商品名称" min-width="160" show-overflow-tooltip>
            <template slot-scope="scope">
              <div class="product-name-cell">
                <i class="el-icon-goods product-icon"></i>
                <span class="product-name">{{ scope.row.productName }}</span>
                <el-tag v-if="scope.row.lowStockWarning" type="warning" size="mini" class="low-stock-tag">
                  <i class="el-icon-warning"></i> 低库存
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="productType" label="商品类型" min-width="120" align="center">
            <template slot-scope="scope">
              <el-tag type="info" size="small">{{ scope.row.productType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="shelfNumber" label="货架位置" min-width="160">
            <template slot-scope="scope">
              <div class="location-cell">
                <i class="el-icon-s-grid location-icon"></i>
                <span class="shelf-number">{{ scope.row.shelfNumber }}</span>
                <span class="floor-number">第{{ scope.row.floorNumber }}层</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="库存数量" min-width="140" align="center">
            <template slot-scope="scope">
              <div class="quantity-cell">
                <span 
                  class="quantity-value" 
                  :class="{ 'low-stock': scope.row.lowStockWarning }">
                  {{ scope.row.quantity }}
                </span>
                <div v-if="scope.row.safetyStock" class="safety-stock">
                  <i class="el-icon-info"></i>
                  <span>安全: {{ scope.row.safetyStock }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="totalWeight" label="总重量(kg)" min-width="120" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.totalWeight && scope.row.totalWeight > 0">
                {{ parseFloat(scope.row.totalWeight).toFixed(3) }}
              </span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalVolume" label="总体积(m³)" min-width="130" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.totalVolume && scope.row.totalVolume > 0">
                {{ parseFloat(scope.row.totalVolume).toFixed(6) }}
              </span>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button 
                size="mini" 
                type="primary" 
                icon="el-icon-view"
                @click="viewDetails(scope.row)"
                class="detail-btn"
                plain>
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
    
    <!-- 空数据提示 -->
    <el-empty v-if="!loading && groupedWarehouses.length === 0" description="暂无库存数据">
      <el-button type="primary" @click="$router.push('/stock-in')">去入库</el-button>
    </el-empty>

    <!-- 库存详情对话框 -->
    <el-dialog
      title="库存详情"
      :visible.sync="detailDialogVisible"
      width="650px"
      class="detail-dialog"
      :modal="false"
      append-to-body>
      <div v-if="selectedInventory" class="detail-content">
        <div class="detail-header" v-if="selectedInventory.lowStockWarning">
          <el-alert
            title="低库存预警"
            type="warning"
            :closable="false"
            show-icon>
            <template slot="title">
              <i class="el-icon-warning"></i>
              <span>当前库存低于安全库存，请及时补货</span>
            </template>
          </el-alert>
        </div>
        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item label="商品ID">
            <span class="detail-value">{{ selectedInventory.productId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品名称">
            <span class="detail-value">{{ selectedInventory.productName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品类型">
            <el-tag type="info">{{ selectedInventory.productType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="货架位置">
            <div class="location-detail">
              <i class="el-icon-s-grid"></i>
              <span>{{ selectedInventory.shelfNumber }} - 第{{ selectedInventory.floorNumber }}层</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="所属仓库">
            <div class="warehouse-detail">
              <i class="el-icon-office-building"></i>
              <span>{{ selectedInventory.warehouseNumber }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="当前库存" :span="2">
            <div class="quantity-detail">
              <span 
                class="quantity-detail-value" 
                :class="{ 'low-stock': selectedInventory.lowStockWarning }">
                {{ selectedInventory.quantity }}
              </span>
              <el-tag 
                v-if="selectedInventory.lowStockWarning" 
                type="warning" 
                class="warning-tag">
                <i class="el-icon-warning"></i> 低库存预警
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="安全库存" v-if="selectedInventory.safetyStock">
            <span class="detail-value">{{ selectedInventory.safetyStock }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="库存状态" v-if="selectedInventory.safetyStock">
            <el-tag :type="selectedInventory.lowStockWarning ? 'warning' : 'success'" size="medium">
              <i :class="selectedInventory.lowStockWarning ? 'el-icon-warning' : 'el-icon-success'"></i>
              {{ selectedInventory.lowStockWarning ? '低于安全库存' : '库存充足' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总重量(kg)" v-if="selectedInventory.totalWeight && selectedInventory.totalWeight > 0">
            <i class="el-icon-scale"></i>
            <span class="detail-value">{{ parseFloat(selectedInventory.totalWeight).toFixed(3) }} kg</span>
          </el-descriptions-item>
          <el-descriptions-item label="总体积(m³)" v-if="selectedInventory.totalVolume && selectedInventory.totalVolume > 0">
            <i class="el-icon-box"></i>
            <span class="detail-value">{{ parseFloat(selectedInventory.totalVolume).toFixed(6) }} m³</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Inventory',
  data() {
    return {
      inventoryData: [],
      warehouseList: [],
      searchKeyword: '',
      filterWarehouseId: null,
      activeWarehouses: [], // 展开的仓库ID列表
      loading: false,
      total: 0,
      detailDialogVisible: false,
      selectedInventory: null,
      lowStockCount: 0
    };
  },
  computed: {
    // 按仓库分组的库存数据
    groupedWarehouses() {
      const groups = {};
      
      // 初始化所有仓库
      this.warehouseList.forEach(warehouse => {
        groups[warehouse.id] = {
          id: warehouse.id,
          warehouseNumber: warehouse.warehouseNumber,
          address: warehouse.address,
          inventory: [],
          inventoryCount: 0,
          lowStockCount: 0
        };
      });
      
      // 将库存分配到对应仓库
      this.inventoryData.forEach(item => {
        if (groups[item.warehouseId]) {
          groups[item.warehouseId].inventory.push(item);
          groups[item.warehouseId].inventoryCount++;
          if (item.lowStockWarning) {
            groups[item.warehouseId].lowStockCount++;
          }
        }
      });
      
      // 应用筛选
      let result = Object.values(groups);
      if (this.filterWarehouseId) {
        result = result.filter(w => w.id === this.filterWarehouseId);
      }
      
      // 只返回有库存的仓库，并按仓库编号排序
      result = result.filter(w => w.inventory.length > 0);
      result.sort((a, b) => a.warehouseNumber.localeCompare(b.warehouseNumber));
      
      // 如果有筛选，自动展开该仓库
      if (this.filterWarehouseId && result.length > 0) {
        this.$nextTick(() => {
          if (this.activeWarehouses.indexOf(this.filterWarehouseId) === -1) {
            this.activeWarehouses.push(this.filterWarehouseId);
          }
        });
      }
      
      return result;
    }
  },
  created() {
    this.fetchWarehouses();
    this.fetchInventory();
  },
  methods: {
    fetchWarehouses() {
      axios.get('/api/warehouse/list').then(res => {
        if (res.data.code === 200) {
          this.warehouseList = res.data.data;
        }
      }).catch(error => {
        console.error('获取仓库列表失败:', error);
      });
    },
    fetchInventory() {
      this.loading = true;
      
      // 构建查询参数（获取所有数据，不再分页）
      let url = '/api/inventory/list';
      const params = {
        current: 1,
        size: 10000 // 获取所有数据
      };
      
      if (this.searchKeyword) {
        params.keyword = this.searchKeyword;
      }
      if (this.filterWarehouseId) {
        params.warehouseId = this.filterWarehouseId;
      }

      // 构建查询字符串
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      axios.get(`${url}?${queryString}`).then(res => {
        console.log('库存数据响应:', res.data);
        if (res.data && res.data.code === 200) {
          if (res.data.data && res.data.data.records) {
            // 分页数据
            this.inventoryData = res.data.data.records || [];
            this.total = res.data.data.total || 0;
          } else if (Array.isArray(res.data.data)) {
            // 列表数据
            this.inventoryData = res.data.data || [];
            this.total = this.inventoryData.length;
          } else {
            this.inventoryData = [];
            this.total = 0;
          }
          // 计算低库存数量
          this.lowStockCount = this.inventoryData.filter(item => item.lowStockWarning).length;
          
          // 如果没有数据，给出提示
          if (this.inventoryData.length === 0 && !this.searchKeyword && !this.filterWarehouseId) {
            this.$message.info('当前没有库存数据，请先执行入库操作');
          }
          
          // 默认所有仓库都为折叠状态（不自动展开）
          // activeWarehouses 保持为空数组 []
        } else {
          this.inventoryData = [];
          this.total = 0;
          this.$message.warning(res.data.message || '获取库存数据失败');
        }
      }).catch(error => {
        console.error('获取库存数据失败:', error);
        this.inventoryData = [];
        this.total = 0;
        const errorMsg = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : '获取库存数据失败，请检查网络连接或后端服务';
        this.$message.error(errorMsg);
      }).finally(() => {
        this.loading = false;
      });
    },
    handleSearch() {
      this.fetchInventory();
    },
    handleWarehouseFilter() {
      // 筛选功能已通过computed属性实现
      // 如果选择了仓库，自动展开该仓库
      if (this.filterWarehouseId) {
        this.$nextTick(() => {
          if (this.activeWarehouses.indexOf(this.filterWarehouseId) === -1) {
            this.activeWarehouses.push(this.filterWarehouseId);
          }
        });
      }
    },
    getWarehouseTagType(warehouseNumber) {
      // 基于仓库编号（WHXXX）生成哈希值，确保相同编号总是相同颜色
      // 扩展颜色池到12种，减少重复概率
      const types = ['', 'primary', 'success', 'warning', 'danger', 'info', 'primary', 'success', 'warning', 'danger', 'info', 'primary'];
      
      if (!warehouseNumber) {
        return 'info';
      }
      
      // 对仓库编号进行简单哈希：累加字符码值
      let hash = 0;
      const str = String(warehouseNumber).toUpperCase();
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // 转换为32位整数
      }
      
      // 取绝对值并映射到颜色数组
      const index = Math.abs(hash) % types.length;
      return types[index] || 'info';
    },
    viewDetails(row) {
      this.selectedInventory = row;
      this.detailDialogVisible = true;
    },
    tableRowClassName({ row }) {
      if (row.lowStockWarning) {
        return 'warning-row';
      }
      return '';
    }
  }
};
</script>

<style scoped>
/* 隐藏当前页面右侧内容区域滚动条（仍可滚轮滚动） */
:deep(.content-stage) {
  scrollbar-width: none; /* Firefox */
}

:deep(.content-stage::-webkit-scrollbar) {
  display: none; /* WebKit */
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 320px;
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.warehouse-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  width: 100%;
}

.warehouse-header-icon {
  color: #409eff;
  font-size: 20px;
}

.warehouse-tag {
  font-size: 14px;
  font-weight: 600;
}

.warehouse-header-address {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.warehouse-header-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.product-name-cell,
.location-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.product-icon,
.location-icon {
  color: #409eff;
  font-size: 16px;
}

.low-stock-tag {
  margin-left: 4px;
}

.quantity-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.quantity-value {
  font-weight: 600;
  color: #303133;
}

.quantity-value.low-stock {
  color: #f56c6c;
}

.safety-stock {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.el-table /deep/ .warning-row {
  background-color: #fef0f0;
}

.el-table /deep/ .warning-row:hover > td {
  background-color: #fde2e2 !important;
}

.detail-dialog /deep/ .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 18px 24px;
  border-radius: 4px 4px 0 0;
}

.detail-dialog /deep/ .el-dialog__title,
.detail-dialog /deep/ .el-dialog__close {
  color: #fff;
}

.detail-content {
  padding: 16px 0;
}

.quantity-detail {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-detail-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.quantity-detail-value.low-stock {
  color: #f56c6c;
}

.dialog-footer {
  text-align: right;
}

.detail-btn.el-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  padding: 12px 18px !important;
  border-radius: 999px;
  box-shadow: none !important;
}

/* 仿照货架管理的折叠样式 */
.el-collapse {
  border: none;
}

.el-collapse-item {
  margin-bottom: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.el-collapse-item__header {
  background-color: #F5F7FA;
  padding: 15px 20px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.el-collapse-item__header:hover {
  background-color: #ECF5FF;
}

.el-collapse-item__content {
  padding: 0;
}

.el-collapse-item__wrap {
  border-bottom: none;
}

@media (max-width: 768px) {
  .header-bar {
    flex-direction: column;
    gap: 16px;
  }
  .actions {
    flex-direction: column;
    width: 100%;
  }
  .search-input,
  .actions .el-select {
    width: 100%;
  }
}
</style>

