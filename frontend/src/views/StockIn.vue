<template>
  <div>
    <div class="header-bar">
      <h1>商品入库</h1>
    </div>

    <el-card>
      <el-form :model="form" label-width="120px" :rules="rules" ref="stockInForm">
        <!-- 商品选择 -->
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

        <!-- 商品信息显示 -->
        <el-form-item v-if="selectedProduct" label="商品信息">
          <div style="color: #606266;">
            <div>名称：{{ selectedProduct.name }}</div>
            <div>类型：{{ selectedProduct.type }}</div>
            <div>单价：¥{{ selectedProduct.unitPrice }}</div>
            <div>安全库存：{{ selectedProduct.safetyStock }}</div>
          </div>
        </el-form-item>

        <!-- 数量输入 -->
        <el-form-item label="入库数量" prop="quantity" required>
          <el-input-number 
            v-model="form.quantity" 
            :min="1" 
            :max="9999"
            style="width: 100%;">
          </el-input-number>
        </el-form-item>

        <!-- 仓库选择 -->
        <el-form-item label="选择仓库" prop="warehouseId" required>
          <el-select 
            v-model="form.warehouseId" 
            placeholder="请选择仓库" 
            style="width: 100%;"
            @change="handleWarehouseChange">
            <el-option
              v-for="warehouse in warehouseList"
              :key="warehouse.id"
              :label="`${warehouse.warehouseNumber} - ${warehouse.address}`"
              :value="warehouse.id">
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 货架选择 -->
        <el-form-item label="选择货架" prop="shelfId" required>
          <el-select 
            v-model="form.shelfId" 
            placeholder="请先选择仓库" 
            style="width: 100%;"
            :disabled="!form.warehouseId"
            @change="handleShelfChange">
            <el-option
              v-for="shelf in shelfList"
              :key="shelf.id"
              :label="`${shelf.shelfNumber} (${shelf.areaCategory})`"
              :value="shelf.id">
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 层数选择 -->
        <el-form-item label="选择层数" prop="floorNumber" required>
          <el-select 
            v-model="form.floorNumber" 
            placeholder="请先选择货架" 
            style="width: 100%;"
            :disabled="!form.shelfId">
            <el-option
              v-for="floor in availableFloors"
              :key="floor"
              :label="`第${floor}层`"
              :value="floor">
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 格口状态显示 -->
        <el-form-item v-if="form.shelfId && form.floorNumber" label="格口状态">
          <div v-if="slotStatus" style="display: flex; align-items: center;">
            <span 
              :style="{ 
                display: 'inline-block',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: slotStatus.status === 'EMPTY' ? '#67C23A' : '#F56C6C',
                marginRight: '10px'
              }">
            </span>
            <span v-if="slotStatus.status === 'EMPTY'">空闲</span>
            <span v-else>
              已占用 - {{ slotStatus.productName }} (库存: {{ slotStatus.quantity }})
            </span>
          </div>
          <div v-else style="color: #909399;">加载中...</div>
        </el-form-item>

        <!-- 其他信息 -->
        <el-form-item label="重量(kg)">
          <el-input-number 
            v-model="form.weight" 
            :precision="3" 
            :min="0"
            style="width: 100%;"
            placeholder="可选">
          </el-input-number>
        </el-form-item>

        <el-form-item label="体积(m³)">
          <el-input-number 
            v-model="form.volume" 
            :precision="6" 
            :min="0"
            style="width: 100%;"
            placeholder="可选">
          </el-input-number>
        </el-form-item>
      </el-form>

      <div style="text-align: right; margin-top: 20px;">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting" :disabled="!canStockIn">确认入库</el-button>
      </div>
    </el-card>

    <!-- 冲突确认对话框 -->
    <el-dialog
      title="格口冲突警告"
      :visible.sync="conflictDialogVisible"
      width="500px"
      :modal="false"
      append-to-body>
      <div style="color: #E6A23C; margin-bottom: 20px;">
        <i class="el-icon-warning" style="font-size: 24px; margin-right: 10px;"></i>
        {{ conflictMessage }}
      </div>
      <div v-if="conflictInfo" style="background-color: #f5f7fa; padding: 15px; border-radius: 4px;">
        <div>冲突商品：{{ conflictInfo.conflictProductName }}</div>
        <div>当前库存：{{ conflictInfo.currentQuantity }}</div>
      </div>
      <span slot="footer">
        <el-button @click="conflictDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmConflict">强制确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'StockIn',
  computed: {
    canStockIn() {
      return hasPermission('商品入库');
    }
  },
  data() {
    return {
      form: {
        productId: null,
        quantity: 1,
        warehouseId: null,
        shelfId: null,
        floorNumber: null,
        weight: null,
        volume: null
      },
      rules: {
        productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
        quantity: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        shelfId: [{ required: true, message: '请选择货架', trigger: 'change' }],
        floorNumber: [{ required: true, message: '请选择层数', trigger: 'change' }]
      },
      productList: [],
      warehouseList: [],
      shelfList: [],
      selectedProduct: null,
      selectedShelf: null,
      availableFloors: [],
      slotStatus: null,
      conflictDialogVisible: false,
      conflictMessage: '',
      conflictInfo: null,
      submitting: false
    };
  },
  created() {
    this.fetchProducts();
    this.fetchWarehouses();
  },
  watch: {
    'form.shelfId'(newVal) {
      if (newVal && this.selectedShelf) {
        this.availableFloors = Array.from({ length: this.selectedShelf.floorCount }, (_, i) => i + 1);
        this.form.floorNumber = null;
        this.slotStatus = null;
      }
    },
    'form.floorNumber'(newVal) {
      if (newVal && this.form.shelfId) {
        this.fetchSlotStatus();
      }
    }
  },
  methods: {
    fetchProducts() {
      axios.get('/api/product/list').then(res => {
        this.productList = res.data.data;
      });
    },
    fetchWarehouses() {
      axios.get('/api/warehouse/list').then(res => {
        this.warehouseList = res.data.data;
      });
    },
    handleProductChange(productId) {
      this.selectedProduct = this.productList.find(p => p.id === productId);
    },
    handleWarehouseChange(warehouseId) {
      this.form.shelfId = null;
      this.form.floorNumber = null;
      this.shelfList = [];
      this.slotStatus = null;
      
      if (warehouseId) {
        axios.get(`/api/shelf/warehouse/${warehouseId}`).then(res => {
          this.shelfList = res.data.data;
        });
      }
    },
    handleShelfChange(shelfId) {
      this.selectedShelf = this.shelfList.find(s => s.id === shelfId);
      this.form.floorNumber = null;
      this.slotStatus = null;
      
      if (this.selectedShelf) {
        this.availableFloors = Array.from({ length: this.selectedShelf.floorCount }, (_, i) => i + 1);
      }
    },
    fetchSlotStatus() {
      if (!this.form.shelfId || !this.form.floorNumber) {
        return;
      }
      
      axios.get(`/api/inventory/shelf/${this.form.shelfId}/slots`).then(res => {
        const slots = res.data.data;
        this.slotStatus = slots.find(s => s.floorNumber === this.form.floorNumber);
      });
    },
    checkConflict() {
      if (!this.form.shelfId || !this.form.floorNumber || !this.form.productId) {
        return Promise.resolve({ hasConflict: false });
      }
      
      return axios.post('/api/inventory/check-slot-conflict', {
        shelfId: this.form.shelfId,
        floorNumber: this.form.floorNumber,
        productId: this.form.productId
      }).then(res => res.data.data);
    },
    submitForm() {
      this.$refs.stockInForm.validate((valid) => {
        if (!valid) {
          return false;
        }

        // 检查冲突
        this.checkConflict().then(conflict => {
          if (conflict.hasConflict) {
            this.conflictInfo = conflict;
            this.conflictMessage = conflict.message;
            this.conflictDialogVisible = true;
          } else {
            this.doSubmit();
          }
        });
      });
    },
    confirmConflict() {
      this.conflictDialogVisible = false;
      this.doSubmit();
    },
    doSubmit() {
      this.submitting = true;
      
      const stockInData = {
        productId: this.form.productId,
        quantity: this.form.quantity,
        shelfId: this.form.shelfId,
        floorNumber: this.form.floorNumber,
        weight: this.form.weight,
        volume: this.form.volume
        // 不发送 storageTime，让后端自动设置为当前时间
      };

      // 保存当前选择的货架和层数，用于刷新格口状态
      const currentShelfId = this.form.shelfId;
      const currentFloorNumber = this.form.floorNumber;

      console.log('提交入库数据：', stockInData);
      axios.post('/api/stock-in/add', stockInData).then(response => {
        console.log('入库响应：', response.data);
        if (response.data && response.data.code === 200) {
          this.$message.success('入库成功！');
          // 重置表单
          this.resetForm();
          // 使用保存的值刷新格口状态（延迟刷新，确保后端数据已提交到数据库）
          if (currentShelfId && currentFloorNumber) {
            setTimeout(() => {
              // 临时恢复表单值以便刷新格口状态
              this.form.shelfId = currentShelfId;
              this.form.floorNumber = currentFloorNumber;
              this.fetchSlotStatus();
              // 清空表单值，让用户重新选择
              setTimeout(() => {
                this.form.shelfId = null;
                this.form.floorNumber = null;
                this.slotStatus = null;
              }, 1000);
            }, 500);
          }
        } else {
          const errorMsg = response.data && response.data.message ? response.data.message : '入库失败';
          this.$message.error(errorMsg);
          console.error('入库失败：', response.data);
        }
      }).catch(error => {
        console.error('入库请求失败：', error);
        const errorMessage = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : (error.message || '入库失败，请检查网络连接');
        this.$message.error(errorMessage);
      }).finally(() => {
        this.submitting = false;
      });
    },
    resetForm() {
      this.$refs.stockInForm.resetFields();
      this.selectedProduct = null;
      this.selectedShelf = null;
      this.shelfList = [];
      this.availableFloors = [];
      this.slotStatus = null;
    }
  }
};
</script>

<style scoped>
.header-bar {
  margin-bottom: 20px;
}
</style>

