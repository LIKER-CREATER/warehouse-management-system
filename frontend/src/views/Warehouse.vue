<template>
  <div>
    <div class="header-bar">
      <h1>仓库管理</h1>
      <el-button
        type="primary"
        class="primary-action-btn"
        @click="handleAdd"
        :disabled="!canAdd"
      >
        新增仓库
      </el-button>
    </div>
    <el-table :data="warehouseData" border style="width: 100%" stripe>
      <el-table-column prop="warehouseNumber" label="仓库编号" min-width="160">
        <template slot-scope="scope">
          <div class="warehouse-number-cell">
            <i class="el-icon-office-building warehouse-icon"></i>
            <el-tag :type="getWarehouseTagType(scope.row.warehouseNumber)" size="medium" class="warehouse-tag">
              {{ scope.row.warehouseNumber }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          <div class="address-cell">
            <i class="el-icon-location-outline address-icon"></i>
            <span>{{ scope.row.address }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="managerName" label="管理者姓名" min-width="140">
        <template slot-scope="scope">
          <div class="manager-cell">
            <i class="el-icon-user manager-icon"></i>
            <span>{{ scope.row.managerName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="managerPhone" label="管理者电话" min-width="160">
        <template slot-scope="scope">
          <div class="phone-cell">
            <i class="el-icon-phone phone-icon"></i>
            <span>{{ scope.row.managerPhone }}</span>
          </div>
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" :modal="false" width="40%" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="仓库编号" required>
          <el-input v-model="form.warehouseNumber" placeholder="请输入仓库编号"></el-input>
        </el-form-item>
        <el-form-item label="仓库地址" required>
          <el-input v-model="form.address" placeholder="请输入仓库地址"></el-input>
        </el-form-item>
        <el-form-item label="管理者姓名" required>
          <el-input v-model="form.managerName" placeholder="请输入管理者姓名"></el-input>
        </el-form-item>
        <el-form-item label="管理者电话" required>
          <el-input v-model="form.managerPhone" placeholder="请输入管理者联系方式"></el-input>
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
  name: 'Warehouse',
  computed: {
    canAdd() {
      return hasPermission('仓库新增');
    },
    canEdit() {
      return hasPermission('仓库修改');
    },
    canDelete() {
      return hasPermission('仓库删除');
    }
  },
  data() {
    return {
      warehouseData: [],
      dialogVisible: false,
      dialogTitle: '',
      form: { id: null, warehouseNumber: '', address: '', managerName: '', managerPhone: '' }
    };
  },
  created() {
    this.fetchWarehouses();
  },
  methods: {
    fetchWarehouses() { 
      axios.get('/api/warehouse/list').then(res => { 
        this.warehouseData = res.data.data; 
      }); 
    },
    handleAdd() { 
      this.dialogTitle = '新增仓库'; 
      this.form = { id: null, warehouseNumber: '', address: '', managerName: '', managerPhone: '' }; 
      this.dialogVisible = true; 
    },
    handleEdit(row) { 
      this.dialogTitle = '编辑仓库'; 
      this.form = Object.assign({}, row); 
      this.dialogVisible = true; 
    },
    handleDelete(id) { 
      this.$confirm('此操作将永久删除该仓库, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete(`/api/warehouse/delete/${id}`).then(() => { 
          this.fetchWarehouses(); 
          this.$message.success('删除成功!'); 
        });
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    submitForm() { 
      // 表单验证
      if (!this.form.warehouseNumber || !this.form.warehouseNumber.trim()) {
        this.$message.warning('请输入仓库编号');
        return;
      }
      if (!this.form.address || !this.form.address.trim()) {
        this.$message.warning('请输入仓库地址');
        return;
      }
      if (!this.form.managerName || !this.form.managerName.trim()) {
        this.$message.warning('请输入管理者姓名');
        return;
      }
      if (!this.form.managerPhone || !this.form.managerPhone.trim()) {
        this.$message.warning('请输入管理者联系方式');
        return;
      }
      
      const method = this.form.id ? 'put' : 'post'; 
      const url = this.form.id ? `/api/warehouse/update` : '/api/warehouse/add'; 
      axios[method](url, this.form).then(() => { 
        this.dialogVisible = false; 
        this.fetchWarehouses(); 
        this.$message.success('操作成功!'); 
      }).catch(error => {
        const errorMessage = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : '操作失败';
        this.$message.error(errorMessage);
      }); 
    },
    cancelForm() { 
      this.dialogVisible = false; 
    },
    getWarehouseTagType(warehouseNumber) {
      // 基于仓库编号（WHXXX）生成哈希值，确保相同编号总是相同颜色
      // 与库存管理、货架管理页面使用相同的算法，保证颜色一致
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

/* 仓库编号单元格样式 */
.warehouse-number-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warehouse-icon {
  color: #409EFF;
  font-size: 18px;
}

.warehouse-tag {
  font-size: 14px;
  font-weight: 600;
}

/* 地址单元格样式 */
.address-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.address-icon {
  color: #67C23A;
  font-size: 16px;
}

/* 管理者单元格样式 */
.manager-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.manager-icon {
  color: #E6A23C;
  font-size: 16px;
}

/* 电话单元格样式 */
.phone-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-icon {
  color: #909399;
  font-size: 16px;
}
</style>