<template>
  <div>
    <div class="header-bar">
      <h1>订单查询</h1>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" size="small" @change="loadOrders">
        <el-radio-button :label="null">全部</el-radio-button>
        <el-radio-button :label="0">待指派</el-radio-button>
        <el-radio-button :label="1">已指派/待装货</el-radio-button>
        <el-radio-button :label="2">运输中</el-radio-button>
        <el-radio-button :label="3">已完成</el-radio-button>
        <el-radio-button :label="4">已取消</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="keyword"
        placeholder="运单号 / 发货人 / 收货人 / 司机"
        style="width:260px; margin-left:16px;"
        size="small"
        clearable
        @clear="loadOrders"
        @keyup.enter.native="loadOrders">
        <i slot="prefix" class="el-icon-search"></i>
      </el-input>
      <el-button size="small" style="margin-left:8px;" @click="loadOrders">搜索</el-button>
    </div>

    <el-table :data="orderList" border stripe v-loading="loading">
      <el-table-column prop="orderNo" label="运单号" min-width="180" />
      <el-table-column label="状态" width="130" align="center">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发货人" min-width="140">
        <template slot-scope="scope">
          <span v-if="scope.row.sender">{{ scope.row.sender.contactName }} {{ scope.row.sender.phone }}</span>
          <span v-else style="color:#909399;">—</span>
        </template>
      </el-table-column>
      <el-table-column label="收货人" min-width="140">
        <template slot-scope="scope">
          <span v-if="scope.row.receiver">{{ scope.row.receiver.contactName }} {{ scope.row.receiver.phone }}</span>
          <span v-else style="color:#909399;">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalWeight" label="总重量(kg)" width="110" align="center" />
      <el-table-column prop="totalVolume" label="总体积(m³)" width="110" align="center" />
      <el-table-column prop="profitEstimate" label="货值(元)" width="100" align="center">
        <template slot-scope="scope">
          <span style="color:#E6A23C;">¥{{ scope.row.profitEstimate }}</span>
        </template>
      </el-table-column>
      <el-table-column label="指派信息" width="120" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.driver">{{ scope.row.driver.realName }}</span>
          <span v-else style="color:#909399;">待指派</span>
        </template>
      </el-table-column>
      <el-table-column label="预计送达" width="160">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.estimatedTime) }}
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

    <!-- 指派对话框 -->
    <el-dialog title="指派司机车辆" :visible.sync="assignDialogVisible" width="700px" append-to-body>
      <el-form :model="assignForm" label-width="100px">
        <el-descriptions :column="1" border size="small" style="margin-bottom:16px;">
          <el-descriptions-item label="运单号">{{ assignForm.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="总重量">{{ assignForm.totalWeight }} kg</el-descriptions-item>
          <el-descriptions-item label="总体积">{{ assignForm.totalVolume }} m³</el-descriptions-item>
        </el-descriptions>
        <el-form-item label="司机车辆" required>
          <el-select v-model="assignForm.driverId" placeholder="请选择司机及其车辆" style="width:100%">
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
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :loading="assignLoading" :disabled="!assignForm.driverId">确认指派</el-button>
      </span>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog title="订单详情" :visible.sync="detailDialogVisible" width="850px" append-to-body>
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="运单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="getStatusType(currentOrder.status)">{{ currentOrder.statusText }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="预计送达">{{ formatDateTime(currentOrder.estimatedTime) }}</el-descriptions-item>
        <el-descriptions-item label="出发时间">{{ currentOrder.startTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="实际送达">{{ currentOrder.actualArrivalTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ currentOrder.totalWeight }} kg</el-descriptions-item>
        <el-descriptions-item label="总体积">{{ currentOrder.totalVolume }} m³</el-descriptions-item>
        <el-descriptions-item label="预估货值">¥{{ currentOrder.profitEstimate }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">发货人</el-divider>
      <div v-if="currentOrder && currentOrder.sender" style="font-size:13px; color:#606266;">
        {{ currentOrder.sender.contactName }} | {{ currentOrder.sender.phone }}<br/>
        {{ currentOrder.sender.province }}{{ currentOrder.sender.city }}{{ currentOrder.sender.district || '' }}{{ currentOrder.sender.detailAddress }}
      </div>

      <el-divider content-position="left">收货人</el-divider>
      <div v-if="currentOrder && currentOrder.receiver" style="font-size:13px; color:#606266;">
        {{ currentOrder.receiver.contactName }} | {{ currentOrder.receiver.phone }}<br/>
        {{ currentOrder.receiver.province }}{{ currentOrder.receiver.city }}{{ currentOrder.receiver.district || '' }}{{ currentOrder.receiver.detailAddress }}
      </div>

      <el-divider content-position="left">承运信息</el-divider>
      <div v-if="currentOrder && currentOrder.driver" style="font-size:13px; color:#606266;">
        司机：{{ currentOrder.driver.realName }} ({{ currentOrder.driver.phone }})<br/>
        车牌：{{ currentOrder.vehicle ? currentOrder.vehicle.plateNumber : '—' }} {{ currentOrder.vehicle ? getCategoryText(currentOrder.vehicle.category) : '' }}
      </div>
      <div v-else style="font-size:13px; color:#909399;">尚未指派</div>

      <el-divider content-position="left">商品明细</el-divider>
      <el-table :data="currentOrder ? currentOrder.items : []" border size="small">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="productType" label="类型" />
        <el-table-column prop="quantity" label="数量" align="center" />
        <el-table-column prop="unitPrice" label="单价" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">¥{{ scope.row.unitPrice }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="subtotal" label="小计" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.subtotal">¥{{ scope.row.subtotal }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="库位" width="140">
          <template slot-scope="scope">
            <span v-if="scope.row.shelfId">货架{{ scope.row.shelfId }} / 第{{ scope.row.floorNumber }}层</span>
            <span v-else style="color:#909399;">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'OrderQuery',
  computed: {
    canAssign() { return hasPermission('订单编辑'); },
    canStart() { return hasPermission('订单编辑'); },
    canComplete() { return hasPermission('订单编辑'); },
    canCancel() { return hasPermission('订单取消'); }
  },
  data() {
    return {
      loading: false,
      keyword: '',
      statusFilter: null,
      orderList: [],
      currentPage: 1,
      pageSize: 5,
      total: 0,
      assignDialogVisible: false,
      assignLoading: false,
      detailDialogVisible: false,
      currentOrder: null,
      driverVehicleList: [],
      assignForm: {
        orderId: null,
        orderNo: '',
        totalWeight: '',
        totalVolume: '',
        driverId: null
      }
    };
  },
  created() {
    this.loadOrders();
  },
  methods: {
    handleCommand(cmd, row) {
      switch (cmd) {
        case 'detail':   this.viewDetail(row);    break;
        case 'assign':   this.openAssignDialog(row); break;
        case 'start':    this.confirmStart(row);   break;
        case 'complete': this.confirmComplete(row); break;
        case 'cancel':   this.confirmCancel(row);  break;
      }
    },
    loadOrders() {
      this.loading = true;
      let url = '/api/logistics/vo/list';
      if (this.statusFilter !== null) {
        url += `?status=${this.statusFilter}`;
      }
      axios.get(url).then(res => {
        let data = res.data.data || [];
        // 前端搜索过滤
        if (this.keyword) {
          const kw = this.keyword.toLowerCase();
          data = data.filter(o =>
            (o.orderNo && o.orderNo.toLowerCase().includes(kw)) ||
            (o.sender && o.sender.contactName && o.sender.contactName.toLowerCase().includes(kw)) ||
            (o.receiver && o.receiver.contactName && o.receiver.contactName.toLowerCase().includes(kw)) ||
            (o.driver && o.driver.realName && o.driver.realName.toLowerCase().includes(kw))
          );
        }
        // 前端分页
        this.total = data.length;
        const start = (this.currentPage - 1) * this.pageSize;
        this.orderList = data.slice(start, start + this.pageSize);
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    openAssignDialog(row) {
      this.assignForm = {
        orderId: row.id,
        orderNo: row.orderNo,
        totalWeight: row.totalWeight,
        totalVolume: row.totalVolume,
        driverId: null
      };
      this.driverVehicleList = [];
      axios.get('/api/vehicle/driver-vehicles', { params: { weight: row.totalWeight, volume: row.totalVolume } })
        .then(res => { this.driverVehicleList = res.data.data || []; });
      this.assignDialogVisible = true;
    },
    submitAssign() {
      if (!this.assignForm.driverId) {
        this.$message.warning('请选择司机');
        return;
      }
      this.assignLoading = true;
      axios.post('/api/logistics/assign', null, {
        params: {
          orderId: this.assignForm.orderId,
          driverId: this.assignForm.driverId
        }
      }).then(res => {
        if (res.data && res.data.code === 200) {
          this.$message.success('指派成功');
          this.assignDialogVisible = false;
          this.loadOrders();
        } else {
          this.$message.error(res.data.message || '指派失败');
        }
      }).catch(err => {
        this.$message.error((err.response && err.response.data && err.response.data.message) || '指派失败');
      }).finally(() => { this.assignLoading = false; });
    },
    confirmStart(row) {
      this.$confirm('确认开始运输？货物将从货架格口扣减库存。').then(() => {
        axios.post(`/api/logistics/start/${row.id}`).then(res => {
          if (res.data && res.data.code === 200) {
            this.$message.success('已开始运输');
            this.loadOrders();
          } else {
            this.$message.error(res.data.message || '操作失败');
          }
        }).catch(err => {
          this.$message.error((err.response && err.response.data && err.response.data.message) || '操作失败');
        });
      }).catch(() => {});
    },
    confirmComplete(row) {
      this.$confirm('确认货物已送达？').then(() => {
        axios.post(`/api/logistics/complete/${row.id}`).then(res => {
          if (res.data && res.data.code === 200) {
            this.$message.success('订单已完成');
            this.loadOrders();
          } else {
            this.$message.error(res.data.message || '操作失败');
          }
        }).catch(err => {
          this.$message.error((err.response && err.response.data && err.response.data.message) || '操作失败');
        });
      }).catch(() => {});
    },
    confirmCancel(row) {
      const msg = row.status === 1
        ? '取消后将释放预占库存，确定取消吗？'
        : '确定取消该订单？';
      this.$confirm(msg).then(() => {
        axios.post(`/api/logistics/cancel/${row.id}`).then(res => {
          if (res.data && res.data.code === 200) {
            this.$message.success('订单已取消');
            this.loadOrders();
          } else {
            this.$message.error(res.data.message || '取消失败');
          }
        }).catch(err => {
          this.$message.error((err.response && err.response.data && err.response.data.message) || '取消失败');
        });
      }).catch(() => {});
    },
    viewDetail(row) {
      axios.get(`/api/logistics/vo/${row.id}`).then(res => {
        this.currentOrder = res.data.data;
        this.detailDialogVisible = true;
      }).catch(() => {
        this.$message.error('加载详情失败');
      });
    },
    getStatusType(status) {
      const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger' };
      return map[status] || 'info';
    },
    getCategoryText(cat) {
      const map = { 0: '微面', 1: '小货', 2: '中货', 3: '大货' };
      return map[cat] || '未知';
    },
    formatDateTime(dt) {
      if (!dt) return '—';
      return dt.replace('T', ' ');
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.loadOrders();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadOrders();
    }
  }
};
</script>

<style scoped>
.header-bar {
  margin-bottom: 20px;
}
.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
