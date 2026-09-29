<template>
  <div>
    <div class="header-bar">
      <h1>地址簿</h1>
      <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd" :disabled="!canAdd">新增地址</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索联系人 / 电话"
        size="small"
        clearable
        style="width: 200px"
        @input="onFilterChange">
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>
      <el-select v-model="filterType" placeholder="类型筛选" size="small" clearable style="width: 140px" @change="onFilterChange">
        <el-option label="全部" :value="null" />
        <el-option label="发货人" :value="0" />
        <el-option label="收货人" :value="1" />
      </el-select>
    </div>

    <!-- 地址列表 -->
    <div class="table-card">
      <el-table :data="paginatedList" border stripe v-loading="loading" :header-cell-style="{background:'#f5f7fa', color:'#606266'}">
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="typeText" label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === 0 ? 'primary' : 'success'" size="small">
              {{ scope.row.typeText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="地址" min-width="300">
          <template slot-scope="scope">
            {{ scope.row.province }}{{ scope.row.city }}{{ scope.row.district || '' }}{{ scope.row.detailAddress }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template slot-scope="scope">
            <div class="actions-cell">
              <el-button size="mini" type="text" style="color:#409EFF;" @click="handleEdit(scope.row)" :disabled="!canEdit">编辑</el-button>
              <el-button size="mini" type="text" style="color:#F56C6C;" @click="handleDelete(scope.row)" :disabled="!canDelete">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <div slot="empty" class="table-empty">
          <i class="el-icon-location-information"></i>
          <p>暂无地址数据</p>
        </div>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pageSize"
        layout="total, prev, pager, next"
        :total="total">
      </el-pagination>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="520px" :modal="false">
      <el-form :model="form" label-width="82px" :rules="rules" ref="formRef">
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入联系人姓名" maxlength="20" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="20" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :label="0">发货人（仓库）</el-radio>
            <el-radio :label="1">收货人（客户）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="form.province" placeholder="如：广东省" maxlength="20" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="form.city" placeholder="如：深圳市" maxlength="20" />
        </el-form-item>
        <el-form-item label="区县">
          <el-input v-model="form.district" placeholder="如：南山区" maxlength="20" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input v-model="form.detailAddress" type="textarea" :rows="2" placeholder="请输入详细地址，如街道、门牌号等" maxlength="100" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitForm">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'AddressBook',
  computed: {
    canAdd() { return hasPermission('通讯录新增'); },
    canEdit() { return hasPermission('通讯录修改'); },
    canDelete() { return hasPermission('通讯录删除'); }
  },
  data() {
    return {
      loading: false,
      addressList: [],
      filteredList: [],
      paginatedList: [],
      keyword: '',
      filterType: null,
      dialogVisible: false,
      dialogTitle: '新增地址',
      currentPage: 1,
      pageSize: 5,
      total: 0,
      form: {
        id: null,
        contactName: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detailAddress: '',
        type: 0
      },
      rules: {
        contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
        city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
        detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
      }
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      axios.get('/api/address-book/list').then(res => {
        this.addressList = (res.data.data || []).map(a => ({
          ...a,
          typeText: a.type === 0 ? '发货人' : '收货人'
        }));
        this.applyFilter();
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    onFilterChange() {
      this.currentPage = 1;
      this.applyFilter();
    },
    applyFilter() {
      this.filteredList = this.addressList.filter(a => {
        const matchKw = !this.keyword ||
          (a.contactName && a.contactName.includes(this.keyword)) ||
          (a.phone && a.phone.includes(this.keyword));
        const matchType = this.filterType === null || a.type === this.filterType;
        return matchKw && matchType;
      });
      this.total = this.filteredList.length;
      const start = (this.currentPage - 1) * this.pageSize;
      this.paginatedList = this.filteredList.slice(start, start + this.pageSize);
    },
    handleAdd() {
      this.form = { id: null, contactName: '', phone: '', province: '', city: '', district: '', detailAddress: '', type: 0 };
      this.dialogTitle = '新增地址';
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate());
    },
    handleEdit(row) {
      this.form = { ...row };
      this.dialogTitle = '编辑地址';
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate());
    },
    submitForm() {
      this.$refs.formRef.validate(valid => {
        if (!valid) return;
        const url = this.form.id ? '/api/address-book/update' : '/api/address-book/add';
        const method = this.form.id ? 'put' : 'post';
        axios[method](url, this.form).then(() => {
          this.$message.success('操作成功');
          this.dialogVisible = false;
          this.loadData();
        });
      });
    },
    handleDelete(row) {
      this.$confirm(`确认删除地址"${row.contactName}"？`, '删除确认', { type: 'warning' }).then(() => {
        axios.delete(`/api/address-book/delete/${row.id}`).then(() => {
          this.$message.success('删除成功');
          this.loadData();
        });
      }).catch(() => {});
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.applyFilter();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.applyFilter();
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

.filter-bar {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
}

.table-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}

.table-empty {
  padding: 40px 0;
  color: #c0c4cc;
  text-align: center;
}
.table-empty i { font-size: 40px; margin-bottom: 8px; display: block; }
.table-empty p { margin: 0; font-size: 14px; }

.actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
