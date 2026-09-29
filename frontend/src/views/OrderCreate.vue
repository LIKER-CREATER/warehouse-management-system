<template>
  <div>
    <div class="header-bar">
      <h1>订单创建</h1>
    </div>

    <el-card>
      <el-form :model="form" :rules="rules" ref="orderForm" label-width="120px">
        <!-- 发货人 -->
        <el-form-item label="发货地址" prop="senderId">
          <div style="display:flex; gap:10px; align-items:center;">
            <el-select
              v-model="form.senderId"
              placeholder="请选择发货地址"
              style="flex:1"
              filterable
              @change="handleSenderChange">
              <el-option
                v-for="addr in senderList"
                :key="addr.id"
                :label="`${addr.contactName} ${addr.phone} ${addr.province}${addr.city}${addr.detailAddress}`"
                :value="addr.id">
              </el-option>
            </el-select>
            <el-button type="text" @click="openAddressDialog('sender')" style="white-space:nowrap;">
              + 新增发货地址
            </el-button>
          </div>
        </el-form-item>

        <!-- 发货人信息展示 -->
        <div v-if="selectedSender" class="address-info">
          <span>{{ selectedSender.contactName }}</span> |
          <span>{{ selectedSender.phone }}</span> |
          <span>{{ selectedSender.province }}{{ selectedSender.city }}{{ selectedSender.district || '' }}{{ selectedSender.detailAddress }}</span>
        </div>

        <!-- 收货人 -->
        <el-form-item label="收货地址" prop="receiverId">
          <div style="display:flex; gap:10px; align-items:center;">
            <el-select
              v-model="form.receiverId"
              placeholder="请选择收货地址"
              style="flex:1"
              filterable
              @change="handleReceiverChange">
              <el-option
                v-for="addr in receiverList"
                :key="addr.id"
                :label="`${addr.contactName} ${addr.phone} ${addr.province}${addr.city}${addr.detailAddress}`"
                :value="addr.id">
              </el-option>
            </el-select>
            <el-button type="text" @click="openAddressDialog('receiver')" style="white-space:nowrap;">
              + 新增收货地址
            </el-button>
          </div>
        </el-form-item>

        <!-- 收货人信息展示 -->
        <div v-if="selectedReceiver" class="address-info">
          <span>{{ selectedReceiver.contactName }}</span> |
          <span>{{ selectedReceiver.phone }}</span> |
          <span>{{ selectedReceiver.province }}{{ selectedReceiver.city }}{{ selectedReceiver.district || '' }}{{ selectedReceiver.detailAddress }}</span>
        </div>

        <!-- 预估送达时间提示 -->
        <div v-if="selectedSender && selectedReceiver" class="delivery-hint">
          <i class="el-icon-info"></i>
          预计送达时间：
          <strong>{{ estimatedDeliveryText }}</strong>
        </div>

        <el-divider />

        <!-- 商品明细 -->
        <el-form-item label="商品明细" required>
          <el-table :data="form.items" border size="small">
            <el-table-column label="商品" min-width="200">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.productId"
                  placeholder="请选择商品"
                  filterable
                  style="width:100%"
                  @change="handleProductChange(scope.row)">
                  <el-option
                    v-for="p in productList"
                    :key="p.id"
                    :label="`${p.name} (${p.type}) - ¥${p.unitPrice}`"
                    :value="p.id">
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.unitPrice">¥{{ scope.row.unitPrice }}</span>
                <span v-else style="color:#909399;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="发货数量" width="160" align="center">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  :max="scope.row.maxStock || 9999"
                  size="small"
                  @change="recalculate(scope.row)">
                </el-input-number>
                <div v-if="scope.row.maxStock" style="font-size:11px; color:#909399; margin-top:2px;">
                  可用库存：{{ scope.row.maxStock }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.subtotal" style="color:#E6A23C; font-weight:bold;">
                  ¥{{ scope.row.subtotal }}
                </span>
                <span v-else style="color:#909399;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  plain
                  @click="removeItem(scope.$index)"
                  :disabled="form.items.length <= 1">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="text" style="margin-top:8px;" @click="addItem">+ 添加商品</el-button>
        </el-form-item>

        <!-- 订单汇总 -->
        <div v-if="orderSummary" class="order-summary">
          <div class="summary-row">
            <span>商品种类：<strong>{{ form.items.filter(i => i.productId).length }}</strong> 种</span>
            <span>总数量：<strong>{{ totalQuantity }}</strong> 件</span>
            <span>预估货值：<strong class="price">¥{{ totalValue }}</strong></span>
          </div>
        </div>
      </el-form>

      <div style="text-align:right; margin-top:20px;">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting" :disabled="!canCreateOrder">
          提交订单
        </el-button>
      </div>
    </el-card>

    <!-- 地址新增/编辑对话框 -->
    <el-dialog
      :title="addressDialogTitle"
      :visible.sync="addressDialogVisible"
      width="600px"
      append-to-body>
      <el-form :model="addressForm" :rules="addressRules" ref="addressForm" label-width="90px">
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="addressForm.contactName" placeholder="请输入联系人姓名"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="省" prop="province">
          <el-input v-model="addressForm.province" placeholder="如：广东省"></el-input>
        </el-form-item>
        <el-form-item label="市" prop="city">
          <el-input v-model="addressForm.city" placeholder="如：深圳市"></el-input>
        </el-form-item>
        <el-form-item label="区县" prop="district">
          <el-input v-model="addressForm.district" placeholder="如：南山区（选填）"></el-input>
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input v-model="addressForm.detailAddress" placeholder="请输入详细地址"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddress" :loading="addressSubmitting">保存地址</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'OrderCreate',
  computed: {
    canCreateOrder() {
      return hasPermission('订单创建');
    },
    orderSummary() {
      return this.form.items.some(i => i.productId && i.quantity);
    },
    totalQuantity() {
      return this.form.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    },
    totalValue() {
      return this.form.items.reduce((sum, i) => sum + (i.subtotal || 0), 0).toFixed(2);
    },
    estimatedDeliveryText() {
      if (!this.selectedSender || !this.selectedReceiver) return '—';
      const sender = this.selectedSender;
      const receiver = this.selectedReceiver;
      let hours = 72;
      if (sender.province === receiver.province) {
        hours = sender.city === receiver.city ? 24 : 48;
      }
      const now = new Date();
      now.setHours(now.getHours() + hours);
      const pad = n => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    },
    addressDialogTitle() {
      return this.addressDialogType === 'sender' ? '新增发货地址' : '新增收货地址';
    }
  },
  data() {
    return {
      form: {
        senderId: null,
        receiverId: null,
        items: [{ productId: null, quantity: 1, unitPrice: null, subtotal: null, maxStock: null }]
      },
      rules: {
        senderId: [{ required: true, message: '请选择发货地址', trigger: 'change' }],
        receiverId: [{ required: true, message: '请选择收货地址', trigger: 'change' }]
      },
      senderList: [],
      receiverList: [],
      productList: [],
      selectedSender: null,
      selectedReceiver: null,
      submitting: false,
      // 地址对话框
      addressDialogVisible: false,
      addressDialogType: 'sender', // 'sender' | 'receiver'
      addressSubmitting: false,
      addressForm: {
        contactName: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detailAddress: ''
      },
      addressRules: {
        contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
        province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
        city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
        detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
      }
    };
  },
  created() {
    this.loadSelectors();
  },
  methods: {
    loadSelectors() {
      axios.get('/api/address-book/list-by-type?type=0').then(res => {
        this.senderList = res.data.data || [];
      });
      axios.get('/api/address-book/list-by-type?type=1').then(res => {
        this.receiverList = res.data.data || [];
      });
      axios.get('/api/product/list').then(res => {
        this.productList = res.data.data || [];
      });
    },
    handleSenderChange(id) {
      this.selectedSender = this.senderList.find(a => a.id === id) || null;
    },
    handleReceiverChange(id) {
      this.selectedReceiver = this.receiverList.find(a => a.id === id) || null;
    },
    handleProductChange(row) {
      const product = this.productList.find(p => p.id === row.productId);
      if (product) {
        row.unitPrice = product.unitPrice;
        // 查询可用库存（所有格口汇总）
        axios.get(`/api/inventory/product/${product.id}/available`).then(res => {
          const data = res.data.data;
          row.maxStock = data ? (data.quantity || 0) : 0;
          if (row.quantity > row.maxStock) {
            row.quantity = Math.max(1, row.maxStock);
          }
          this.recalculate(row);
        }).catch(() => {
          row.maxStock = null;
        });
      } else {
        row.unitPrice = null;
        row.subtotal = null;
        row.maxStock = null;
      }
    },
    recalculate(row) {
      if (row.productId && row.quantity && row.unitPrice) {
        row.subtotal = parseFloat((row.quantity * row.unitPrice).toFixed(2));
      } else {
        row.subtotal = null;
      }
    },
    addItem() {
      this.form.items.push({ productId: null, quantity: 1, unitPrice: null, subtotal: null, maxStock: null });
    },
    removeItem(index) {
      if (this.form.items.length > 1) {
        this.form.items.splice(index, 1);
      }
    },
    openAddressDialog(type) {
      this.addressDialogType = type;
      this.addressForm = { contactName: '', phone: '', province: '', city: '', district: '', detailAddress: '' };
      this.$nextTick(() => { this.$refs.addressForm && this.$refs.addressForm.clearValidate(); });
      this.addressDialogVisible = true;
    },
    submitAddress() {
      this.$refs.addressForm.validate(valid => {
        if (!valid) return;
        this.addressSubmitting = true;
        const type = this.addressDialogType === 'sender' ? 0 : 1;
        axios.post('/api/address-book/add', { ...this.addressForm, type }).then(res => {
          if (res.data && res.data.code === 200) {
            this.$message.success('地址保存成功');
            this.addressDialogVisible = false;
            // 刷新对应列表
            if (this.addressDialogType === 'sender') {
              this.loadSelectors();
            } else {
              this.loadSelectors();
            }
          } else {
            this.$message.error(res.data.message || '保存失败');
          }
        }).catch(err => {
          this.$message.error((err.response && err.response.data && err.response.data.message) || '保存失败');
        }).finally(() => {
          this.addressSubmitting = false;
        });
      });
    },
    submitForm() {
      this.$refs.orderForm.validate(valid => {
        if (!valid) return;
        const validItems = this.form.items.filter(i => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
          this.$message.warning('请至少添加一个商品');
          return;
        }
        this.submitting = true;
        const payload = {
          senderId: this.form.senderId,
          receiverId: this.form.receiverId,
          items: validItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            batchNo: i.batchNo || null
          }))
        };
        axios.post('/api/logistics/create', payload).then(res => {
          if (res.data && res.data.code === 200) {
            this.$message.success('订单创建成功');
            this.$router.push('/order-query');
          } else {
            this.$message.error(res.data.message || '创建失败');
          }
        }).catch(err => {
          this.$message.error((err.response && err.response.data && err.response.data.message) || '创建失败');
        }).finally(() => {
          this.submitting = false;
        });
      });
    },
    resetForm() {
      this.$refs.orderForm.resetFields();
      this.form.items = [{ productId: null, quantity: 1, unitPrice: null, subtotal: null, maxStock: null }];
      this.selectedSender = null;
      this.selectedReceiver = null;
    }
  }
};
</script>

<style scoped>
.header-bar {
  margin-bottom: 20px;
}
.address-info {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px 12px;
  margin: -10px 0 20px 120px;
  font-size: 13px;
  color: #606266;
}
.delivery-hint {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  padding: 10px 14px;
  margin: 0 0 20px 120px;
  font-size: 13px;
  color: #409eff;
}
.order-summary {
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 4px;
  padding: 14px 20px;
  margin-top: 10px;
}
.summary-row {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #606266;
}
.price {
  color: #E6A23C;
  font-size: 16px;
}
</style>
