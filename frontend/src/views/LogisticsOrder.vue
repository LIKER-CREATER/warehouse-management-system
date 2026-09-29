<template>
  <div>
    <div class="header-bar">
      <h1>物流订单管理</h1>
      <el-button type="primary" @click="handleCreate" :disabled="!canCreate">创建物流订单</el-button>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" size="small" @change="loadOrders">
        <el-radio-button :label="null">全部</el-radio-button>
        <el-radio-button :label="0">待指派</el-radio-button>
        <el-radio-button :label="1">已指派</el-radio-button>
        <el-radio-button :label="2">运输中</el-radio-button>
        <el-radio-button :label="3">已完成</el-radio-button>
        <el-radio-button :label="4">已取消</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="orderList" border stripe v-loading="loading">
      <el-table-column prop="orderNo" label="运单号" min-width="180" />
      <el-table-column prop="statusText" label="状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalWeight" label="总重量(kg)" width="120" align="center" />
      <el-table-column prop="totalVolume" label="总体积(m³)" width="120" align="center" />
      <el-table-column prop="profitEstimate" label="预估货值(元)" width="130" align="center" />
      <el-table-column label="预计送达" width="160">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.estimatedTime) }}
        </template>
      </el-table-column>
      <el-table-column label="出发时间" width="160">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column label="实际送达" width="160">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.actualArrivalTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right" align="center">
        <template slot-scope="scope">
          <el-dropdown trigger="click" @command="cmd => handleCommand(cmd, scope.row)" style="display:inline-block; text-align:center; width:100%;">
            <span style="display:inline-block; text-align:center; width:100%; cursor:pointer; color:#409EFF;">
              操作 <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown" style="text-align:left;">
              <el-dropdown-item command="detail" icon="el-icon-view">查看详情</el-dropdown-item>
              <el-dropdown-item
                v-if="scope.row.status === 0"
                command="assign"
                icon="el-icon-user"
                :disabled="!canAssign">指派司机</el-dropdown-item>
              <el-dropdown-item
                v-if="scope.row.status === 1"
                command="start"
                icon="el-icon-truck"
                :disabled="!canStart">确认出发</el-dropdown-item>
              <el-dropdown-item
                v-if="scope.row.status === 2"
                command="complete"
                icon="el-icon-circle-check"
                :disabled="!canComplete">确认送达</el-dropdown-item>
              <el-dropdown-item
                v-if="scope.row.status !== 3 && scope.row.status !== 4"
                command="cancel"
                icon="el-icon-close"
                divided
                :disabled="!canCancel">取消订单</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

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

    <!-- 创建订单对话框 -->
    <el-dialog title="创建物流订单" :visible.sync="createDialogVisible" width="700px" :modal="false">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="发货人">
          <el-select v-model="createForm.senderId" placeholder="请选择发货人" style="width:100%">
            <el-option v-for="s in senderList" :key="s.id" :label="s.contactName + ' - ' + s.province + s.city" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="收货人">
          <el-select v-model="createForm.receiverId" placeholder="请选择收货人" style="width:100%">
            <el-option v-for="r in receiverList" :key="r.id" :label="r.contactName + ' - ' + r.province + r.city" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品明细">
          <div v-for="(item, idx) in createForm.items" :key="idx" style="display:flex;gap:10px;margin-bottom:8px;">
            <el-select v-model="item.productId" placeholder="商品" style="flex:2">
              <el-option v-for="p in productList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
            <el-input-number v-model="item.quantity" :min="1" style="flex:1" />
            <el-button type="danger" size="small" @click="removeItem(idx)">删除</el-button>
          </div>
          <el-button type="text" @click="addItem">+ 添加商品</el-button>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="createDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确认创建</el-button>
      </span>
    </el-dialog>

    <!-- 指派对话框 -->
    <el-dialog title="指派司机车辆" :visible.sync="assignDialogVisible" width="600px" :modal="false">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="司机车辆">
          <el-select v-model="assignForm.driverId" placeholder="请选择司机及其车辆" style="width:100%" @change="onDriverVehicleChange">
            <el-option
              v-for="dv in driverVehicleList"
              :key="dv.driverId"
              :label="`${dv.driverName}（${dv.plateNumber} | ${dv.categoryText} | 载重${dv.maxWeight}吨 | 容积${dv.maxVolume}方）`"
              :value="dv.driverId">
              <span style="font-size:13px;">
                <strong>{{ dv.driverName }}</strong>（{{ dv.plateNumber }}）
                <span style="color:#909399;">{{ dv.categoryText }} | 载重{{ dv.maxWeight }}吨 | 容积{{ dv.maxVolume }}方</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="assignDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :disabled="!assignForm.driverId">确认指派</el-button>
      </span>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog title="订单详情" :visible.sync="detailDialogVisible" width="800px" :modal="false">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="运单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag>{{ currentOrder.statusText }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="总重量">{{ currentOrder.totalWeight }} kg</el-descriptions-item>
        <el-descriptions-item label="总体积">{{ currentOrder.totalVolume }} m³</el-descriptions-item>
        <el-descriptions-item label="预估货值">¥{{ currentOrder.profitEstimate }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="预计送达">{{ formatDateTime(currentOrder.estimatedTime) }}</el-descriptions-item>
        <el-descriptions-item label="出发时间">{{ formatDateTime(currentOrder.startTime) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="实际送达">{{ formatDateTime(currentOrder.actualArrivalTime) || '—' }}</el-descriptions-item>
      </el-descriptions>
      <h4 style="margin-top:16px">商品明细</h4>
      <el-table :data="currentOrder ? currentOrder.items : []" border size="small">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" align="center" />
        <el-table-column prop="unitPrice" label="单价" align="center" />
        <el-table-column prop="subtotal" label="小计" align="center" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'LogisticsOrder',
  computed: {
    canCreate() { return hasPermission('订单创建'); },
    canAssign() { return hasPermission('订单编辑'); },
    canStart() { return true; },
    canComplete() { return true; },
    canCancel() { return hasPermission('订单取消'); }
  },
  data() {
    return {
      loading: false,
      statusFilter: null,
      orderList: [],
      currentPage: 1,
      pageSize: 5,
      total: 0,
      createDialogVisible: false,
      assignDialogVisible: false,
      detailDialogVisible: false,
      currentOrder: null,
      senderList: [],
      receiverList: [],
      productList: [],
      driverList: [],
      driverVehicleList: [],
      createForm: {
        senderId: null,
        receiverId: null,
        items: [{ productId: null, quantity: 1 }]
      },
      assignForm: {
        orderId: null,
        driverId: null,
        vehicleId: null
      }
    }
  },
  mounted() {
    this.loadOrders()
    this.loadSelectors()
  },
  methods: {
    loadOrders() {
      this.loading = true
      const params = this.statusFilter !== null ? `?status=${this.statusFilter}` : ''
      axios.get(`/api/logistics/vo/list${params}`).then(res => {
        const data = res.data.data || []
        this.total = data.length
        const start = (this.currentPage - 1) * this.pageSize
        this.orderList = data.slice(start, start + this.pageSize)
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    loadSelectors() {
      axios.get('/api/address-book/list-by-type?type=0').then(res => { this.senderList = res.data.data || [] })
      axios.get('/api/address-book/list-by-type?type=1').then(res => { this.receiverList = res.data.data || [] })
      axios.get('/api/product/list').then(res => { this.productList = res.data.data || [] })
    },
    handleCreate() {
      this.createForm = { senderId: null, receiverId: null, items: [{ productId: null, quantity: 1 }] }
      this.createDialogVisible = true
    },
    addItem() {
      this.createForm.items.push({ productId: null, quantity: 1 })
    },
    removeItem(idx) {
      this.createForm.items.splice(idx, 1)
    },
    submitCreate() {
      const valid = this.createForm.senderId && this.createForm.receiverId && this.createForm.items.every(i => i.productId && i.quantity > 0)
      if (!valid) { this.$message.warning('请填写完整信息'); return }
      axios.post('/api/logistics/create', this.createForm).then(() => {
        this.$message.success('创建成功')
        this.createDialogVisible = false
        this.loadOrders()
      })
    },
    handleAssign(row) {
      this.assignForm = { orderId: row.id, driverId: null, vehicleId: null }
      axios.get('/api/vehicle/driver-vehicles', { params: { weight: row.totalWeight, volume: row.totalVolume } }).then(res => {
        this.driverVehicleList = res.data.data || []
      })
      this.assignDialogVisible = true
    },
    onDriverVehicleChange(driverId) {
      const dv = this.driverVehicleList.find(d => d.driverId === driverId)
      this.assignForm.vehicleId = dv ? dv.vehicleId : null
    },
    submitAssign() {
      if (!this.assignForm.driverId) { this.$message.warning('请选择司机和车辆'); return }
      axios.post('/api/logistics/assign', null, { params: this.assignForm }).then(() => {
        this.$message.success('指派成功')
        this.assignDialogVisible = false
        this.loadOrders()
      })
    },
    handleStart(row) {
      this.$confirm('确认开始运输？').then(() => {
        axios.post(`/api/logistics/start/${row.id}`).then(() => {
          this.$message.success('已开始运输')
          this.loadOrders()
        })
      })
    },
    handleComplete(row) {
      this.$confirm('确认货物已送达？').then(() => {
        axios.post(`/api/logistics/complete/${row.id}`).then(() => {
          this.$message.success('订单已完成')
          this.loadOrders()
        })
      })
    },
    handleCommand(cmd, row) {
      switch (cmd) {
        case 'detail':   this.viewDetail(row);    break;
        case 'assign':   this.handleAssign(row);  break;
        case 'start':    this.handleStart(row);   break;
        case 'complete': this.handleComplete(row); break;
        case 'cancel':   this.handleCancel(row);  break;
      }
    },
    handleCancel(row) {
      this.$confirm('确认取消该订单？').then(() => {
        axios.post(`/api/logistics/cancel/${row.id}`).then(() => {
          this.$message.success('订单已取消')
          this.loadOrders()
        })
      })
    },
    viewDetail(row) {
      axios.get(`/api/logistics/vo/${row.id}`).then(res => {
        this.currentOrder = res.data.data
        this.detailDialogVisible = true
      })
    },
    getStatusType(status) {
      const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger' }
      return map[status] || 'info'
    },
    formatDateTime(dt) {
      if (!dt) return '—'
      return dt.replace('T', ' ')
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadOrders()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadOrders()
    }
  }
}
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.filter-bar {
  margin-bottom: 12px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
