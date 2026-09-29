<template>
  <div>
    <div class="header-bar">
      <h1>商品管理</h1>
      <div class="actions">
        <el-input
          placeholder="按名称或类型搜索"
          v-model="searchKeyword"
          class="search-input"
          clearable
          @clear="fetchProducts"
          @keyup.enter.native="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button
          type="primary"
          class="primary-action-btn"
          @click="handleAdd"
          :disabled="!canAdd"
        >
          新增商品
        </el-button>
      </div>
    </div>
    <el-table :data="productData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="商品名称"></el-table-column>
      <el-table-column prop="type" label="类型"></el-table-column>
      <el-table-column prop="unitPrice" label="单价" :formatter="formatPrice"></el-table-column>
      <el-table-column prop="safetyStock" label="安全库存"></el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" :modal="false" width="40%" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" placeholder="请输入商品名称"></el-input>
        </el-form-item>
        <el-form-item label="商品类型" required>
          <el-input v-model="form.type" placeholder="请输入商品类型"></el-input>
        </el-form-item>
        <el-form-item label="单价" required>
          <el-input-number v-model="form.unitPrice" :precision="2" :step="0.1" :min="0" style="width: 100%;"></el-input-number>
        </el-form-item>
        <el-form-item label="安全库存">
          <el-input-number v-model="form.safetyStock" :min="0" style="width: 100%;" placeholder="用于低库存预警"></el-input-number>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">当库存低于此值时将触发预警</div>
        </el-form-item>
      </el-form>
      <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 4px; color: #606266; font-size: 13px;">
        <strong>说明：</strong>商品管理仅维护商品基础信息。库存、入库时间、所在货架等信息请在"库存管理"模块中查看和管理。
      </div>
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
  name: 'Product',
  computed: {
    canAdd() {
      return hasPermission('商品新增');
    },
    canEdit() {
      return hasPermission('商品修改');
    },
    canDelete() {
      return hasPermission('商品删除');
    }
  },
  data() {
    return {
      productData: [],
      searchKeyword: '',
      dialogVisible: false,
      dialogTitle: '',
      loading: false,
      currentPage: 1,
      pageSize: 6,
      total: 0,
      form: {
        id: null,
        name: '',
        type: '',
        unitPrice: 0.00,
        safetyStock: 0
      }
    };
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    fetchProducts() {
      this.loading = true;
      // 如果有搜索关键词，先搜索再分页；否则直接分页查询
      if (this.searchKeyword && this.searchKeyword.trim()) {
        // 搜索时获取所有结果，然后前端分页
        axios.get(`/api/product/search?keyword=${encodeURIComponent(this.searchKeyword)}`).then(res => {
          if (res.data && res.data.code === 200) {
            const allData = res.data.data || [];
            this.total = allData.length;
            // 前端分页
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            this.productData = allData.slice(start, end);
          } else {
            this.productData = [];
            this.total = 0;
          }
          this.loading = false;
        }).catch(error => {
          console.error('搜索商品失败:', error);
          this.productData = [];
          this.total = 0;
          this.loading = false;
          this.$message.error('搜索商品失败，请检查网络连接');
        });
      } else {
        // 使用分页API
        axios.get(`/api/product/page?current=${this.currentPage}&size=${this.pageSize}`).then(res => {
          if (res.data && res.data.code === 200) {
            const pageData = res.data.data;
            if (pageData && pageData.records) {
              // MyBatis Plus 分页对象
              this.productData = pageData.records || [];
              this.total = pageData.total || 0;
            } else if (Array.isArray(pageData)) {
              // 直接返回数组
              this.productData = pageData;
              this.total = pageData.length;
            } else {
              this.productData = [];
              this.total = 0;
            }
          } else {
            this.productData = [];
            this.total = 0;
          }
          this.loading = false;
        }).catch(error => {
          console.error('获取商品列表失败:', error);
          this.productData = [];
          this.total = 0;
          this.loading = false;
          this.$message.error('获取商品列表失败，请检查网络连接');
        });
      }
    },
    handleSearch() {
      this.currentPage = 1; // 搜索时重置到第一页
      this.fetchProducts();
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.fetchProducts();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchProducts();
    },
    formatPrice(row, column, cellValue) {
      return cellValue ? '¥' + parseFloat(cellValue).toFixed(2) : '¥0.00';
    },
    handleAdd() {
      this.dialogTitle = '新增商品';
      this.form = { id: null, name: '', type: '', unitPrice: 0.00, safetyStock: 0 };
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.dialogTitle = '编辑商品';
      this.form = Object.assign({}, row);
      this.dialogVisible = true;
    },
    handleDelete(id) {
      this.$confirm('此操作将永久删除该商品, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete(`/api/product/delete/${id}`).then(() => {
          this.$message.success('删除成功!');
          // 如果当前页没有数据了，且不是第一页，则跳转到上一页
          if (this.productData.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.fetchProducts();
        }).catch(error => {
          const errorMessage = error.response && error.response.data && error.response.data.message 
            ? error.response.data.message 
            : '删除失败';
          this.$message.error(errorMessage);
        });
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    submitForm() {
      // 表单验证
      if (!this.form.name || !this.form.name.trim()) {
        this.$message.warning('请输入商品名称');
        return;
      }
      if (!this.form.type || !this.form.type.trim()) {
        this.$message.warning('请输入商品类型');
        return;
      }
      if (!this.form.unitPrice || this.form.unitPrice <= 0) {
        this.$message.warning('请输入有效的单价');
        return;
      }
      
      const url = this.form.id ? '/api/product/update' : '/api/product/add';
      const method = this.form.id ? 'put' : 'post';
      axios[method](url, this.form).then(() => {
        this.dialogVisible = false;
        this.fetchProducts();
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
.search-input {
  width: 250px;
  margin-right: 10px;
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

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>