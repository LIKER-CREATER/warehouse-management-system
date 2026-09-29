<template>
  <div>
    <div class="header-bar">
      <h1>车辆管理</h1>
      <div class="actions">
        <el-input
          placeholder="按车牌号搜索"
          v-model="searchKeyword"
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-select
          v-model="filterCategory"
          placeholder="全部车型"
          class="filter-select"
          clearable
          @change="handleFilterChange"
        >
          <el-option :value="0" label="微面" />
          <el-option :value="1" label="小货" />
          <el-option :value="2" label="中货" />
          <el-option :value="3" label="大货" />
        </el-select>
        <el-button
          type="primary"
          class="primary-action-btn"
          @click="handleAdd"
          :disabled="!canAdd"
        >
          新增车辆
        </el-button>
      </div>
    </div>

    <el-table :data="vehicleList" border style="width: 100%" stripe v-loading="loading">
      <el-table-column prop="plateNumber" label="车牌号" min-width="160" align="center">
        <template slot-scope="scope">
          <div class="plate-number-cell">
            <i class="el-icon-truck plate-icon"></i>
            <el-tag :type="getCategoryColor(scope.row.category)" size="medium" class="plate-tag">
              {{ scope.row.plateNumber }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="categoryText" label="车型" min-width="100" align="center">
        <template slot-scope="scope">
          <div class="category-cell">
            <i :class="getCategoryIcon(scope.row.category)"></i>
            <span>{{ scope.row.categoryText }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="maxWeight" label="最大载重(吨)" min-width="130" align="center">
        <template slot-scope="scope">
          <div class="weight-cell">
            <i class="el-icon-heavy-rain weight-icon"></i>
            <span>{{ scope.row.maxWeight }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="maxVolume" label="最大容积(m³)" min-width="130" align="center">
        <template slot-scope="scope">
          <div class="volume-cell">
            <i class="el-icon-box volume-icon"></i>
            <span>{{ scope.row.maxVolume }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="statusText" label="状态" min-width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="driverName" label="绑定司机" min-width="120" align="center">
        <template slot-scope="scope">
          <span class="driver-text">{{ scope.row.driverName || '未绑定' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="120" align="center" show-overflow-tooltip />
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template slot-scope="scope">
          <div class="action-cell">
            <el-button size="mini" class="action-btn action-edit" @click="handleEdit(scope.row)" :disabled="!canEdit">编辑</el-button>
            <el-button size="mini" class="action-btn action-bind" @click="handleBind(scope.row)" :disabled="!canBind">绑定</el-button>
            <el-button size="mini" type="danger" class="action-btn action-delete" @click="handleDelete(scope.row)" :disabled="!canDelete">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[6]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" :modal="false" width="40%" append-to-body>
      <el-form :model="form" label-width="120px">
        <el-form-item label="车牌号" required>
          <el-input v-model="form.plateNumber" placeholder="请输入车牌号，如：京A12345" />
        </el-form-item>
        <el-form-item label="车型" required>
          <el-select v-model="form.category" style="width:100%">
            <el-option :value="0" label="微面" />
            <el-option :value="1" label="小货" />
            <el-option :value="2" label="中货" />
            <el-option :value="3" label="大货" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大载重(吨)" required>
          <el-input-number v-model="form.maxWeight" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="最大容积(立方)" required>
          <el-input-number v-model="form.maxVolume" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="form.status" style="width:100%">
            <el-option :value="0" label="空闲" />
            <el-option :value="1" label="运输中" />
            <el-option :value="2" label="维修" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible=false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 绑定司机对话框 -->
    <el-dialog title="绑定司机" :visible.sync="bindDialogVisible" :modal="false" width="400px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="选择司机">
          <el-select v-model="bindDriverId" placeholder="请选择司机" style="width:100%">
            <el-option v-for="d in driverList" :key="d.id" :label="d.realName + ' (' + d.phone + ')'" :value="d.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="bindDialogVisible=false">取 消</el-button>
        <el-button type="primary" @click="submitBind">确认绑定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'Vehicle',
  computed: {
    canAdd() {
      return hasPermission('车辆新增');
    },
    canEdit() {
      return hasPermission('车辆修改');
    },
    canDelete() {
      return hasPermission('车辆删除');
    },
    canBind() {
      return hasPermission('车辆绑定司机');
    }
  },
  data() {
    return {
      loading: false,
      vehicleList: [],
      dialogVisible: false,
      bindDialogVisible: false,
      dialogTitle: '新增车辆',
      form: { id: null, plateNumber: '', category: 1, maxWeight: 1, maxVolume: 1, status: 0, remark: '' },
      currentVehicleId: null,
      bindDriverId: null,
      driverList: [],
      searchKeyword: '',
      filterCategory: null,
      currentPage: 1,
      pageSize: 6,
      total: 0
    }
  },
  mounted() {
    this.loadData()
    this.loadDrivers()
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      this.loading = true
      const map = { 0: '空闲', 1: '运输中', 2: '维修' }
      const catMap = { 0: '微面', 1: '小货', 2: '中货', 3: '大货' }
      const decorate = list => (list || []).map(v => ({
        ...v,
        statusText: map[v.status] || '未知',
        categoryText: catMap[v.category] || '未知'
      })).sort((a, b) => a.category - b.category || b.maxVolume - a.maxVolume)

      if (this.searchKeyword && this.searchKeyword.trim()) {
        axios.get(`/api/vehicle/search?keyword=${encodeURIComponent(this.searchKeyword)}`).then(res => {
          const allData = decorate(res.data.data || [])
          const filtered = this.filterCategory != null
            ? allData.filter(v => v.category === this.filterCategory)
            : allData
          this.total = filtered.length
          const start = (this.currentPage - 1) * this.pageSize
          this.vehicleList = filtered.slice(start, start + this.pageSize)
          this.loading = false
        }).catch(() => { this.loading = false })
      } else {
        const params = { current: this.currentPage, size: this.pageSize }
        if (this.filterCategory != null) params.category = this.filterCategory
        axios.get('/api/vehicle/page', { params }).then(res => {
          const pageData = res.data.data
          if (pageData && pageData.records) {
            this.vehicleList = decorate(pageData.records)
            this.total = pageData.total || 0
          } else if (Array.isArray(pageData)) {
            this.vehicleList = decorate(pageData)
            this.total = pageData.length
          } else {
            this.vehicleList = []
            this.total = 0
          }
          this.loading = false
        }).catch(() => { this.loading = false })
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },
    handleFilterChange() {
      this.currentPage = 1
      this.loadData()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadData()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadData()
    },
    loadDrivers() {
      axios.get('/api/vehicle/drivers/all').then(res => { this.driverList = res.data.data || [] })
    },
    handleAdd() {
      this.form = { id: null, plateNumber: '', category: 1, maxWeight: 1, maxVolume: 1, status: 0, remark: '' }
      this.dialogTitle = '新增车辆'
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.form = { ...row }
      this.dialogTitle = '编辑车辆'
      this.dialogVisible = true
    },
    submitForm() {
      if (!this.form.plateNumber || !this.form.plateNumber.trim()) {
        this.$message.warning('请输入车牌号')
        return
      }
      const url = this.form.id ? '/api/vehicle/update' : '/api/vehicle/add'
      const method = this.form.id ? 'put' : 'post'
      axios[method](url, this.form).then(() => {
        this.$message.success('操作成功')
        this.dialogVisible = false
        this.loadData()
      }).catch(error => {
        const errorMessage = error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : '操作失败'
        this.$message.error(errorMessage)
      })
    },
    handleBind(row) {
      this.currentVehicleId = row.id
      this.bindDriverId = row.currentDriverId
      this.bindDialogVisible = true
    },
    submitBind() {
      if (this.bindDriverId) {
        axios.post('/api/vehicle/bind-driver', null, { params: { vehicleId: this.currentVehicleId, driverId: this.bindDriverId } }).then(() => {
          this.$message.success('绑定成功')
          this.bindDialogVisible = false
          this.loadData()
        })
      } else {
        axios.post('/api/vehicle/unbind-driver', null, { params: { vehicleId: this.currentVehicleId } }).then(() => {
          this.$message.success('已解绑')
          this.bindDialogVisible = false
          this.loadData()
        })
      }
    },
    handleDelete(row) {
      this.$confirm('确认删除该车辆？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete(`/api/vehicle/delete/${row.id}`).then(() => {
          this.$message.success('删除成功')
          if (this.vehicleList.length === 1 && this.currentPage > 1) {
            this.currentPage--
          }
          this.loadData()
        }).catch(error => {
          const errorMessage = error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : '删除失败'
          this.$message.error(errorMessage)
        })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    getStatusType(status) {
      return { 0: 'success', 1: 'warning', 2: 'info' }[status] || 'info'
    },
    getCategoryColor(category) {
      return { 0: 'primary', 1: 'success', 2: 'warning', 3: 'danger' }[category] || 'info'
    },
    getCategoryIcon(category) {
      const iconMap = {
        0: 'el-icon-s-cooperation',
        1: 'el-icon-truck',
        2: 'el-icon-box',
        3: 'el-icon-suitcase-1'
      }
      return iconMap[category] || 'el-icon-truck'
    }
  }
}
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 车牌号单元格 */
.plate-number-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.plate-icon {
  color: #409EFF;
  font-size: 18px;
}

.plate-tag {
  font-size: 14px;
  font-weight: 600;
}

/* 车型单元格 */
.category-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #475569;
}

/* 载重单元格 */
.weight-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #475569;
}

.weight-icon {
  color: #E6A23C;
  font-size: 16px;
}

/* 容积单元格 */
.volume-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #475569;
}

.volume-icon {
  color: #67C23A;
  font-size: 16px;
}

/* 司机单元格 */
.driver-text {
  color: #606266;
}

/* 操作单元格 */
.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.action-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  border-width: 1px;
}

.action-edit {
  border-color: rgba(99, 102, 241, 0.35);
  color: #4f46e5;
  background: rgba(239, 246, 255, 0.8);
}

.action-edit:hover {
  background: rgba(219, 234, 254, 0.95);
  border-color: rgba(79, 70, 229, 0.55);
}

.action-bind {
  border-color: rgba(16, 185, 129, 0.35);
  color: #059669;
  background: rgba(209, 250, 229, 0.8);
}

.action-bind:hover {
  background: rgba(167, 243, 208, 0.95);
  border-color: rgba(5, 150, 105, 0.55);
}

.action-delete:hover {
  background: rgba(248, 113, 113, 0.18);
}

.actions {
  display: flex;
  align-items: center;
}

.search-input {
  width: 220px;
  margin-right: 10px;
}

.filter-select {
  width: 130px;
  margin-right: 10px;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
