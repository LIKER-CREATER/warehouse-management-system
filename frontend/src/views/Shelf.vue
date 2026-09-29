<template>
  <div>
    <div class="header-bar">
      <h1>货架管理</h1>
      <div class="actions">
        <el-select 
          v-model="filterWarehouseId" 
          placeholder="筛选仓库" 
          clearable
          style="width: 200px; margin-right: 10px;"
          @change="handleWarehouseFilter">
          <el-option
            v-for="warehouse in warehouseData"
            :key="warehouse.id"
            :label="`${warehouse.warehouseNumber} - ${warehouse.address}`"
            :value="warehouse.id">
          </el-option>
        </el-select>
        <el-button
          type="primary"
          class="primary-action-btn"
          @click="handleAdd"
          :disabled="!canAdd"
        >
          新增货架
        </el-button>
      </div>
    </div>
    <!-- 按仓库分组的折叠面板 -->
    <el-collapse v-model="activeWarehouses">
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
            <span class="warehouse-header-count">
              <i class="el-icon-s-grid"></i>
              {{ warehouse.shelves.length }} 个货架
            </span>
          </div>
        </template>
        <el-table 
          :data="warehouse.shelves" 
          border 
          style="width: 100%" 
          stripe
          v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
          <el-table-column prop="shelfNumber" label="货架编号" min-width="180">
            <template slot-scope="scope">
              <div class="shelf-number-cell">
                <i class="el-icon-s-grid shelf-icon"></i>
                <span class="shelf-number-text">{{ scope.row.shelfNumber }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="floorCount" label="层数" width="120" align="center">
            <template slot-scope="scope">
              <el-tag type="info">{{ scope.row.floorCount }} 层</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="areaCategory" label="区域分类" min-width="150">
            <template slot-scope="scope">
              <el-tag type="success" size="small">{{ scope.row.areaCategory }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button
                size="mini"
                class="table-action-btn table-action-edit"
                @click="handleEdit(scope.row)"
                :disabled="!canEdit"
              >
                编辑
              </el-button>
              <el-button
                size="mini"
                type="danger"
                class="table-action-btn table-action-delete"
                @click="handleDelete(scope.row.id)"
                :disabled="!canDelete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
    
    <!-- 空数据提示 -->
    <el-empty v-if="!loading && groupedWarehouses.length === 0" description="暂无货架数据">
      <el-button type="primary" @click="handleAdd" :disabled="!canAdd">新增货架</el-button>
    </el-empty>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" :modal="false" width="40%" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="货架编号"><el-input v-model="form.shelfNumber"></el-input></el-form-item>
        <el-form-item label="层数"><el-input v-model.number="form.floorCount" type="number"></el-input></el-form-item>
        <el-form-item label="区域分类"><el-input v-model="form.areaCategory"></el-input></el-form-item>
        <el-form-item label="所属仓库">
          <el-select v-model="form.warehouseId" placeholder="请选择仓库" style="width: 100%;">
            <el-option v-for="w in warehouseData" :key="w.id" :label="w.warehouseNumber + ' - ' + w.address" :value="w.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelForm">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'Shelf',
  computed: {
    canAdd() {
      return hasPermission('货架新增');
    },
    canEdit() {
      return hasPermission('货架修改');
    },
    canDelete() {
      return hasPermission('货架删除');
    },
    // 按仓库分组的货架数据
    groupedWarehouses() {
      // 防止数据未加载时出错
      if (!Array.isArray(this.warehouseData) || !Array.isArray(this.shelfData)) {
        return [];
      }
      
      const groups = {};
      
      // 初始化所有仓库
      this.warehouseData.forEach(warehouse => {
        if (warehouse && warehouse.id) {
          groups[warehouse.id] = {
            id: warehouse.id,
            warehouseNumber: warehouse.warehouseNumber || '',
            address: warehouse.address || '',
            shelves: []
          };
        }
      });
      
      // 将货架分配到对应仓库
      this.shelfData.forEach(shelf => {
        if (shelf && shelf.warehouseId && groups[shelf.warehouseId]) {
          groups[shelf.warehouseId].shelves.push(shelf);
        }
      });
      
      // 应用筛选
      let result = Object.values(groups);
      if (this.filterWarehouseId) {
        result = result.filter(w => w.id === this.filterWarehouseId);
      }
      
      // 只返回有货架的仓库，并按仓库编号排序
      result = result.filter(w => w.shelves.length > 0);
      if (result.length > 0) {
        result.sort((a, b) => {
          const aNum = a.warehouseNumber || '';
          const bNum = b.warehouseNumber || '';
          return aNum.localeCompare(bNum);
        });
      }
      
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
  data() {
    return {
      shelfData: [],
      warehouseData: [], // 用于仓库下拉菜单
      filterWarehouseId: null, // 仓库筛选
      activeWarehouses: [], // 展开的仓库ID列表
      dialogVisible: false,
      dialogTitle: '',
      loading: false,
      form: {
        id: null,
        shelfNumber: '',
        floorCount: null,
        areaCategory: '',
        warehouseId: null
      }
    };
  },
  created() {
    this.fetchShelves();
    this.fetchWarehouses();
  },
  methods: {
    fetchShelves() {
      this.loading = true;
      axios.get('/api/shelf/list').then(res => {
        this.shelfData = res.data.data || [];
      }).catch(error => {
        console.error('获取货架列表失败:', error);
        this.$message.error('获取货架列表失败');
      }).finally(() => {
        this.loading = false;
      });
    },
    fetchWarehouses() {
      axios.get('/api/warehouse/list').then(res => {
        if (res.data && res.data.code === 200) {
          this.warehouseData = res.data.data || [];
        } else {
          this.warehouseData = [];
          console.error('获取仓库列表失败:', res.data);
        }
      }).catch(error => {
        console.error('获取仓库列表失败:', error);
        this.warehouseData = [];
        this.$message.error('获取仓库列表失败');
      });
    },
    getWarehouseName(warehouseId) {
      const warehouse = this.warehouseData.find(w => w.id === warehouseId);
      return warehouse ? `${warehouse.warehouseNumber} - ${warehouse.address}` : '未知';
    },
    getWarehouseNumber(warehouseId) {
      const warehouse = this.warehouseData.find(w => w.id === warehouseId);
      return warehouse ? warehouse.warehouseNumber : '未知';
    },
    getWarehouseAddress(warehouseId) {
      const warehouse = this.warehouseData.find(w => w.id === warehouseId);
      return warehouse ? warehouse.address : '';
    },
    getWarehouseTagType(warehouseNumber) {
      // 基于仓库编号（WHXXX）生成哈希值，确保相同编号总是相同颜色
      // 扩展颜色池到12种，减少重复概率
      // 与库存管理页面使用相同的算法，保证颜色一致
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
    handleAdd() {
      this.dialogTitle = '新增货架';
      this.form = { id: null, shelfNumber: '', floorCount: null, areaCategory: '', warehouseId: null };
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.dialogTitle = '编辑货架';
      this.form = Object.assign({}, row);
      this.dialogVisible = true;
    },
    handleDelete(id) {
      this.$confirm('此操作将永久删除该货架, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete(`/api/shelf/delete/${id}`).then(() => {
          this.fetchShelves();
          this.$message.success('删除成功!');
        });
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    submitForm() {
      const url = this.form.id ? '/api/shelf/update' : '/api/shelf/add';
      const method = this.form.id ? 'put' : 'post';
      axios[method](url, this.form).then(() => {
        this.dialogVisible = false;
        this.fetchShelves();
        this.$message.success('操作成功!');
      });
    },
    cancelForm() {
      this.dialogVisible = false;
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

.actions {
  display: flex;
  align-items: center;
}

.primary-action-btn {
  border-radius: 999px;
  padding: 10px 24px;
  font-weight: 600;
  box-shadow: 0 14px 30px rgba(99, 102, 241, 0.35);
}

.table-action-btn {
  min-width: 62px;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  border-width: 1px;
}

.table-action-edit {
  border-color: rgba(99, 102, 241, 0.35);
  color: #4f46e5;
  background: rgba(239, 246, 255, 0.8);
}

.table-action-edit:hover {
  background: rgba(219, 234, 254, 0.95);
  border-color: rgba(79, 70, 229, 0.55);
}

.table-action-delete {
  margin-left: 8px;
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.35);
  color: #b91c1c;
}

.table-action-delete:hover {
  background: rgba(248, 113, 113, 0.18);
  border-color: rgba(220, 38, 38, 0.55);
}

/* 仓库分组标题样式 */
.warehouse-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 5px 0;
}

.warehouse-header-icon {
  color: #409EFF;
  font-size: 20px;
}

.warehouse-tag {
  font-size: 14px;
  font-weight: 600;
}

.warehouse-header-address {
  color: #606266;
  font-size: 14px;
  flex: 1;
}

.warehouse-header-count {
  color: #909399;
  font-size: 13px;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.warehouse-header-count i {
  color: #67C23A;
}

.shelf-number-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.shelf-icon {
  color: #67C23A;
  font-size: 16px;
}

.shelf-number-text {
  font-weight: 500;
  color: #303133;
}

/* 折叠面板样式优化 */
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
</style>