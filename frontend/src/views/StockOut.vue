<template>
  <div>
    <div class="header-bar">
      <h1>商品出库</h1>
    </div>

    <el-card>
      <el-form :model="form" label-width="120px" :rules="rules" ref="stockOutForm">

        <!-- 第一步：商品选择 -->
        <el-form-item label="商品" prop="productId" required>
          <el-select
            v-model="form.productId"
            placeholder="请选择或输入商品名称搜索"
            filterable
            style="width: 100%;"
            @change="handleProductChange">
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="`${product.name} (${product.type}) - ¥${product.unitPrice}`"
              :value="product.id">
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 商品信息 -->
        <el-form-item v-if="selectedProduct" label="商品信息">
          <div style="color: #606266;">
            <div>名称：{{ selectedProduct.name }}</div>
            <div>类型：{{ selectedProduct.type }}</div>
            <div>单价：¥{{ selectedProduct.unitPrice }}</div>
          </div>
        </el-form-item>

        <!-- 第二步：库存位置列表 -->
        <el-form-item v-if="form.productId" label="库存位置" required>
          <div v-if="locationLoading" style="color: #909399;">加载中...</div>
          <el-empty v-else-if="locationList.length === 0" description="该商品暂无库存" />
          <el-table
            v-else
            :data="locationList"
            border
            stripe
            highlight-current-row
            @row-click="handleLocationSelect"
            :row-class-name="getRowClassName"
            style="width: 100%;">
            <el-table-column prop="warehouseNumber" label="仓库" width="160" align="center" />
            <el-table-column prop="shelfNumber" label="货架" width="140" align="center" />
            <el-table-column prop="floorNumber" label="层数" width="100" align="center">
              <template slot-scope="scope">
                第 {{ scope.row.floorNumber }} 层
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="可用数量" width="120" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.quantity > 0 ? 'success' : 'info'">
                  {{ scope.row.quantity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="选择" width="80" align="center">
              <template slot-scope="scope">
                <el-radio
                  v-model="selectedLocationId"
                  :label="scope.row.shelfId + '-' + scope.row.floorNumber"
                  @change="handleLocationSelect(scope.row)">&nbsp;</el-radio>
              </template>
            </el-table-column>
            <div slot="empty">
              <el-empty description="该商品暂无库存" />
            </div>
          </el-table>
          <div v-if="locationList.length > 0" style="color: #909399; font-size: 12px; margin-top: 8px;">
            <i class="el-icon-info"></i> 点击行或单选按钮选择出库位置（库存总量：{{ totalAvailable }}）
          </div>
        </el-form-item>

        <!-- 第三步：出库数量（选择位置后才显示） -->
        <template v-if="selectedLocation">
          <el-divider content-position="left">出库信息</el-divider>

          <!-- 已选位置展示 -->
          <el-form-item label="出库位置">
            <el-tag type="primary" size="medium">
              {{ selectedLocation.warehouseNumber }} &gt; {{ selectedLocation.shelfNumber }} &gt; 第 {{ selectedLocation.floorNumber }} 层
            </el-tag>
            <span style="margin-left: 16px; color: #606266;">
              可用数量：<strong style="color: #67C23A;">{{ selectedLocation.quantity }}</strong>
            </span>
          </el-form-item>

          <!-- 出库数量 -->
          <el-form-item label="出库数量" prop="quantity" required>
            <el-input-number
              v-model="form.quantity"
              :min="1"
              :max="selectedLocation.quantity"
              style="width: 100%;">
            </el-input-number>
            <div style="color: #909399; font-size: 12px; margin-top: 4px;">
              当前格口可用数量：{{ selectedLocation.quantity }}
            </div>
          </el-form-item>

          <!-- 出库去向 -->
          <el-form-item label="出库去向" prop="destination" required>
            <el-input
              v-model="form.destination"
              placeholder="请输入出库去向（如：客户名称、门店名称）"
              style="width: 100%;">
            </el-input>
          </el-form-item>

          <!-- 重量/体积（自动计算） -->
          <el-form-item label="总重量">
            <div class="info-value">
              <i class="el-icon-heavy-rain" style="color: #E6A23C; margin-right: 6px;"></i>
              {{ computedWeight }} kg
            </div>
          </el-form-item>

          <el-form-item label="总体积">
            <div class="info-value">
              <i class="el-icon-box" style="color: #67C23A; margin-right: 6px;"></i>
              {{ computedVolume }} m³
            </div>
          </el-form-item>
        </template>
      </el-form>

      <div style="text-align: right; margin-top: 20px;">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting" :disabled="!canStockOut || !selectedLocation">
          确认出库
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'StockOut',
  computed: {
    canStockOut() {
      return hasPermission('商品出库');
    },
    totalAvailable() {
      return this.locationList.reduce((sum, loc) => sum + loc.quantity, 0);
    },
    selectedLocation() {
      if (!this.selectedLocationId) return null;
      const [shelfId, floorNumber] = this.selectedLocationId.split('-').map(Number);
      return this.locationList.find(loc => loc.shelfId === shelfId && loc.floorNumber === floorNumber) || null;
    },
    computedWeight() {
      if (!this.selectedLocation || !this.selectedLocation.totalWeight) return '0.000';
      const ratio = this.form.quantity / this.selectedLocation.quantity;
      return (this.selectedLocation.totalWeight * ratio).toFixed(3);
    },
    computedVolume() {
      if (!this.selectedLocation || !this.selectedLocation.totalVolume) return '0.000000';
      const ratio = this.form.quantity / this.selectedLocation.quantity;
      return (this.selectedLocation.totalVolume * ratio).toFixed(6);
    }
  },
  data() {
    return {
      form: {
        productId: null,
        shelfId: null,
        floorNumber: null,
        quantity: 1,
        destination: ''
      },
      rules: {
        productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
        quantity: [{ required: true, message: '请输入出库数量', trigger: 'blur' }],
        destination: [{ required: true, message: '请输入出库去向', trigger: 'blur' }]
      },
      productList: [],
      selectedProduct: null,
      locationList: [],
      locationLoading: false,
      selectedLocationId: null,
      submitting: false
    };
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    fetchProducts() {
      axios.get('/api/product/list').then(res => {
        this.productList = res.data.data || [];
      });
    },
    handleProductChange(productId) {
      this.selectedProduct = this.productList.find(p => p.id === productId);
      this.resetBelow();
      if (productId) {
        this.fetchLocations(productId);
      }
    },
    fetchLocations(productId) {
      this.locationLoading = true;
      axios.get(`/api/inventory/product/${productId}/locations`).then(res => {
        this.locationList = res.data.data || [];
      }).catch(() => {
        this.locationList = [];
      }).finally(() => {
        this.locationLoading = false;
      });
    },
    handleLocationSelect(row) {
      this.selectedLocationId = `${row.shelfId}-${row.floorNumber}`;
      this.form.shelfId = row.shelfId;
      this.form.floorNumber = row.floorNumber;
      this.form.quantity = 1;
    },
    getRowClassName({ row }) {
      const key = `${row.shelfId}-${row.floorNumber}`;
      return this.selectedLocationId === key ? 'selected-row' : '';
    },
    submitForm() {
      if (!this.selectedLocation) {
        this.$message.warning('请先选择出库位置');
        return;
      }
      this.$refs.stockOutForm.validate((valid) => {
        if (!valid) return;
        if (this.form.quantity > this.selectedLocation.quantity) {
          this.$message.warning('出库数量不能超过当前库存（' + this.selectedLocation.quantity + '）');
          return;
        }
        this.doSubmit();
      });
    },
    doSubmit() {
      this.submitting = true;
      const stockOutData = {
        productId: this.form.productId,
        quantity: this.form.quantity,
        shelfId: this.selectedLocation.shelfId,
        floorNumber: this.selectedLocation.floorNumber,
        destination: this.form.destination.trim()
      };

      axios.post('/api/stock-out/add', stockOutData).then(response => {
        if (response.data && response.data.code === 200) {
          this.$message.success('出库成功！');
          this.resetForm();
        } else {
          this.$message.error(response.data && response.data.message ? response.data.message : '出库失败');
        }
      }).catch(error => {
        const errorMessage = error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : (error.message || '出库失败，请检查网络连接');
        this.$message.error(errorMessage);
      }).finally(() => {
        this.submitting = false;
      });
    },
    resetBelow() {
      this.selectedLocationId = null;
      this.locationList = [];
      this.form.quantity = 1;
      this.form.shelfId = null;
      this.form.floorNumber = null;
      this.form.destination = '';
    },
    resetForm() {
      this.$refs.stockOutForm && this.$refs.stockOutForm.resetFields();
      this.selectedProduct = null;
      this.selectedLocationId = null;
      this.locationList = [];
    }
  }
};
</script>

<style scoped>
.header-bar {
  margin-bottom: 20px;
}
.info-value {
  color: #606266;
  font-size: 15px;
  font-weight: 500;
  line-height: 32px;
}
::v-deep .selected-row {
  background-color: #ecf5ff !important;
}
::v-deep .el-table .current-row > td {
  background-color: #ecf5ff !important;
}
</style>
