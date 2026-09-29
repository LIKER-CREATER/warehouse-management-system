<template>
  <div v-loading="loading">
    <div class="header-bar">
      <h1>人员管理</h1>
      <div class="header-bar-right">
        <el-select v-model="filterRole" placeholder="全部角色" size="small" clearable style="width: 130px; margin-right: 12px;">
          <el-option label="超级管理员" :value="0"></el-option>
          <el-option label="仓管员" :value="1"></el-option>
          <el-option label="普通用户" :value="2"></el-option>
          <el-option label="司机" :value="3"></el-option>
        </el-select>
        <el-button
          type="primary"
          class="primary-action-btn"
          @click="handleAdd"
          :disabled="!canAdd"
        >
          新增员工
        </el-button>
      </div>
    </div>
    <el-table :data="pagedUserData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="realName" label="真实姓名"></el-table-column>
      <el-table-column prop="gender" label="性别" width="80" :formatter="formatGender"></el-table-column>
      <el-table-column prop="phone" label="电话"></el-table-column>
      <el-table-column prop="idCard" label="身份证号"></el-table-column>
      <el-table-column prop="role" label="角色" :formatter="formatRole"></el-table-column>
      <el-table-column label="操作" width="180">
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

    <!-- 分页组件（复用商品管理写法，前端分页） -->
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" :modal-append-to-body="false" width="40%" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名"><el-input v-model="form.username"></el-input></el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" show-password :placeholder="form.id ? '留空则不修改' : '请输入密码'"></el-input>
        </el-form-item>
        <el-form-item label="真实姓名"><el-input v-model="form.realName"></el-input></el-form-item>
        <el-form-item label="性别" required>
          <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%;">
            <el-option label="男" :value="1"></el-option>
            <el-option label="女" :value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone"></el-input></el-form-item>
        <el-form-item label="身份证号"><el-input v-model="form.idCard"></el-input></el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%;">
            <el-option label="超级管理员" :value="0"></el-option>
            <el-option label="仓管员" :value="1"></el-option>
            <el-option label="普通用户" :value="2"></el-option>
            <el-option label="司机" :value="3"></el-option>
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
  name: 'Staff',
  computed: {
    canAdd() {
      return hasPermission('用户新增');
    },
    canEdit() {
      return hasPermission('用户修改');
    },
    canDelete() {
      return hasPermission('用户删除');
    },
    // 前端分页数据（复用商品管理的分页思路）
    pagedUserData() {
      if (!Array.isArray(this.userData)) {
        return [];
      }
      const filtered = this.filterRole !== null && this.filterRole !== undefined
        ? this.userData.filter(u => u.role === this.filterRole)
        : this.userData;
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return filtered.slice(start, end);
    }
  },
  data() {
    return {
      userData: [],
      loading: false,
      dialogVisible: false,
      dialogTitle: '',
      currentPage: 1,
      pageSize: 6,
      total: 0,
      filterRole: null,
      form: {
        id: null,
        username: '',
        password: '',
        realName: '',
        gender: null,
        phone: '',
        idCard: '',
        role: null
      }
    };
  },
  created() {
    this.fetchUsers();
  },
  watch: {
    filterRole() {
      this.currentPage = 1;
    }
  },
  methods: {
    fetchUsers() {
      this.loading = true;
      axios.get('/api/user/list').then(res => {
        if (res.data && res.data.code === 200) {
          this.userData = res.data.data || [];
          this.total = this.userData.length || 0;
        } else {
          this.$message.error('加载用户列表失败');
          this.userData = [];
          this.total = 0;
        }
      }).catch(error => {
        console.error('加载用户列表失败:', error);
        this.$message.error('加载用户列表失败，请稍后重试');
        this.userData = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    formatRole(row) {
      const roles = { 0: '超级管理员', 1: '仓管员', 2: '普通用户', 3: '司机' };
      return roles[row.role] || '未知';
    },
    formatGender(row) {
      return row.gender === 1 ? '男' : row.gender === 0 ? '女' : '未知';
    },
    handleAdd() {
      this.dialogTitle = '新增员工';
      this.form = { id: null, username: '', password: '', realName: '', gender: null, phone: '', idCard: '', role: null };
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.dialogTitle = '编辑员工';
      this.form = {
        id: row.id,
        username: row.username,
        password: '',
        realName: row.realName,
        gender: row.gender,
        phone: row.phone,
        idCard: row.idCard,
        role: row.role
      };
      this.dialogVisible = true;
    },
    handleDelete(id) {
      this.$confirm('此操作将永久删除该用户, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete(`/api/user/delete/${id}`).then(res => {
          if (res.data && res.data.code === 200) {
            this.$message.success('删除成功!');
            // 重新加载数据
            this.fetchUsers();
          } else {
            const errorMsg = res.data && res.data.message ? res.data.message : '删除失败';
            this.$message.error(errorMsg);
          }
        }).catch(error => {
          console.error('删除失败:', error);
          // 尝试从不同位置获取错误信息
          let errorMessage = '删除失败，请稍后重试';
          if (error.response) {
            const data = error.response.data;
            if (data) {
              if (typeof data === 'string') {
                try {
                  const parsed = JSON.parse(data);
                  errorMessage = parsed.message || errorMessage;
                } catch (e) {
                  errorMessage = data || errorMessage;
                }
              } else if (data.message) {
                errorMessage = data.message;
              } else if (data.data && data.data.message) {
                errorMessage = data.data.message;
              }
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.$message.error(errorMessage);
        });
      }).catch(() => {
        // 用户取消删除
      });
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    submitForm() {
      // 表单验证
      if (!this.form.username || !this.form.username.trim()) {
        this.$message.warning('请输入用户名');
        return;
      }
      
      // 用户名格式验证（3-20个字符，只能包含字母、数字、下划线）
      const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernamePattern.test(this.form.username.trim())) {
        this.$message.warning('用户名格式不正确（3-20个字符，只能包含字母、数字、下划线）');
        return;
      }
      
      // 新增时必须输入密码，编辑时密码可选
      if (!this.form.id && (!this.form.password || !this.form.password.trim())) {
        this.$message.warning('请输入密码');
        return;
      }
      
      // 密码长度验证（如果输入了密码）
      if (this.form.password && this.form.password.trim()) {
        if (this.form.password.trim().length < 6) {
          this.$message.warning('密码长度不能少于6位');
          return;
        }
      }
      
      if (!this.form.realName || !this.form.realName.trim()) {
        this.$message.warning('请输入真实姓名');
        return;
      }
      
      if (this.form.gender === null || this.form.gender === undefined) {
        this.$message.warning('请选择性别');
        return;
      }
      
      if (!this.form.phone || !this.form.phone.trim()) {
        this.$message.warning('请输入电话号码');
        return;
      }
      
      // 手机号格式验证
      const phonePattern = /^1[3-9]\d{9}$/;
      if (!phonePattern.test(this.form.phone.trim())) {
        this.$message.warning('手机号码格式不正确（请输入11位有效手机号）');
        return;
      }
      
      if (!this.form.idCard || !this.form.idCard.trim()) {
        this.$message.warning('请输入身份证号码');
        return;
      }
      
      // 身份证格式验证（18位，最后一位可以是X）
      const idCardPattern = /^\d{17}[\dXx]$/;
      if (!idCardPattern.test(this.form.idCard.trim())) {
        this.$message.warning('身份证号码格式不正确（请输入18位身份证号）');
        return;
      }
      
      if (this.form.role === null || this.form.role === undefined) {
        this.$message.warning('请选择角色');
        return;
      }
      
      // 准备提交数据
      const submitData = {
        id: this.form.id,
        username: this.form.username.trim(),
        realName: this.form.realName.trim(),
        gender: this.form.gender,
        phone: this.form.phone.trim(),
        idCard: this.form.idCard.trim(),
        role: this.form.role
      };
      
      // 只有输入了密码才添加到提交数据中（编辑时密码为空则不修改）
      if (this.form.password && this.form.password.trim()) {
        submitData.password = this.form.password.trim();
      }
      
      this.loading = true;
      const url = this.form.id ? '/api/user/update' : '/api/user/add';
      const method = this.form.id ? 'put' : 'post';
      axios[method](url, submitData).then(res => {
        if (res.data && res.data.code === 200) {
          this.dialogVisible = false;
          this.$message.success('操作成功!');
          // 重新加载数据
          this.fetchUsers();
        } else {
          this.$message.error(res.data.message || '操作失败');
          this.loading = false;
        }
      }).catch(error => {
        console.error('操作失败:', error);
        const errorMessage = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : '操作失败，请稍后重试';
        this.$message.error(errorMessage);
        this.loading = false;
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

/* 分页样式，与商品管理保持一致，右下对齐 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>