<template>
  <div>
    <div class="header-bar">
      <h1>费用明细</h1>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-revenue">
        <div class="stat-icon"><i class="el-icon-arrow-up"></i></div>
        <div class="stat-info">
          <div class="stat-label">总营收</div>
          <div class="stat-value">¥{{ stats.totalRevenue.toLocaleString('zh-CN', {minimumFractionDigits: 2}) }}</div>
        </div>
      </div>
      <div class="stat-card stat-cost">
        <div class="stat-icon"><i class="el-icon-arrow-down"></i></div>
        <div class="stat-info">
          <div class="stat-label">总成本</div>
          <div class="stat-value">¥{{ stats.totalCost.toLocaleString('zh-CN', {minimumFractionDigits: 2}) }}</div>
        </div>
      </div>
      <div class="stat-card stat-profit">
        <div class="stat-icon"><i class="el-icon-wallet"></i></div>
        <div class="stat-info">
          <div class="stat-label">实际利润</div>
          <div class="stat-value" :style="{color: stats.actualProfit >= 0 ? '#67C23A' : '#F56C6C'}">
            ¥{{ stats.actualProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2}) }}
          </div>
        </div>
      </div>
      <div class="stat-card stat-count">
        <div class="stat-icon"><i class="el-icon-document"></i></div>
        <div class="stat-info">
          <div class="stat-label">订单总数</div>
          <div class="stat-value">{{ stats.totalOrders }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <el-radio-group v-model="statusFilter" size="small" @change="loadData">
          <el-radio-button :label="null">全部</el-radio-button>
          <el-radio-button :label="0">未结</el-radio-button>
          <el-radio-button :label="1">待审</el-radio-button>
          <el-radio-button :label="2">已结</el-radio-button>
        </el-radio-group>
        <el-select v-model="orderStatusFilter" placeholder="全部订单状态" size="small" clearable @change="loadData" style="width:130px;">
          <el-option :value="0" label="待指派" />
          <el-option :value="1" label="已指派" />
          <el-option :value="2" label="运输中" />
          <el-option :value="3" label="已完成" />
          <el-option :value="4" label="已取消" />
        </el-select>
        <div class="date-range">
          <el-date-picker
            v-model="dateRangeStart"
            type="date"
            placeholder="开始日期"
            size="small"
            value-format="yyyy-MM-dd"
            style="width: 130px;"
            @change="loadData" />
          <span class="date-sep">至</span>
          <el-date-picker
            v-model="dateRangeEnd"
            type="date"
            placeholder="结束日期"
            size="small"
            value-format="yyyy-MM-dd"
            style="width: 130px;"
            @change="loadData" />
        </div>
      </div>
    </div>

    <!-- 费用总览表格 -->
    <div class="table-card">
      <el-table :data="financeList" border stripe v-loading="loading" :header-cell-style="{background:'#f5f7fa', color:'#606266'}">
        <el-table-column prop="orderNo" label="运单号" min-width="140" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <i class="el-icon-document table-icon"></i>{{ scope.row.orderNo }}
          </template>
        </el-table-column>
        <el-table-column prop="totalRevenue" label="总营收(元)" width="120" align="right">
          <template slot-scope="scope">
            <span class="amount revenue">{{ scope.row.totalRevenue != null ? '¥' + scope.row.totalRevenue.toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '¥0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalCost" label="总成本(元)" width="120" align="right">
          <template slot-scope="scope">
            <span class="amount cost">{{ scope.row.totalCost != null ? '¥' + scope.row.totalCost.toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '¥0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualProfit" label="实际利润(元)" width="120" align="right">
          <template slot-scope="scope">
            <span class="amount" :class="scope.row.actualProfit >= 0 ? 'profit' : 'loss'">
              {{ scope.row.actualProfit != null ? '¥' + scope.row.actualProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '¥0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="settlementStatusText" label="结算状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.settlementStatus)" size="small">{{ scope.row.settlementStatusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderStatusText" label="订单状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="getOrderStatusType(scope.row.orderStatus)" size="small">{{ scope.row.orderStatusText || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="140" align="center">
          <template slot-scope="scope">
            {{ scope.row.updateTime ? formatDate(scope.row.updateTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-dropdown trigger="click" @command="cmd => handleCommand(cmd, scope.row)" style="display:inline-block; text-align:center; width:100%;">
              <span style="display:inline-block; text-align:center; width:100%; cursor:pointer; color:#409EFF;">
                操作 <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown" style="text-align:left;">
                <el-dropdown-item command="detail" icon="el-icon-view">查看详情</el-dropdown-item>
                <el-dropdown-item
                  v-if="scope.row.settlementStatus === 0"
                  command="addFare"
                  icon="el-icon-plus"
                  :disabled="!canOperate">+ 运费</el-dropdown-item>
                <el-dropdown-item
                  v-if="scope.row.settlementStatus === 0"
                  command="addExpense"
                  icon="el-icon-minus"
                  :disabled="!canOperate">+ 支出</el-dropdown-item>
                <el-dropdown-item
                  v-if="scope.row.settlementStatus === 0"
                  command="submitAudit"
                  icon="el-icon-s-check"
                  :disabled="!canOperate"
                  divided>提交审核</el-dropdown-item>
                <el-dropdown-item
                  v-if="scope.row.settlementStatus === 1"
                  command="confirmSettle"
                  icon="el-icon-circle-check"
                  :disabled="!canOperate"
                  divided>确认结算</el-dropdown-item>
                <el-dropdown-item
                  v-if="scope.row.settlementStatus === 2"
                  disabled
                  icon="el-icon-lock">
                  已锁定
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="totalCount > pageSize">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="totalCount" />
      </div>
    </div>

    <!-- 费用明细对话框 -->
    <el-dialog :title="'费用明细 - ' + (currentFinance ? currentFinance.orderNo : '')" :visible.sync="detailDialogVisible" width="880px" top="4vh" :modal="false">
      <div class="detail-summary" v-if="currentFinance">
        <span>总营收: <strong class="text-revenue">¥{{ currentFinance.totalRevenue != null ? currentFinance.totalRevenue.toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '0.00' }}</strong></span>
        <span>总成本: <strong class="text-cost">¥{{ currentFinance.totalCost != null ? currentFinance.totalCost.toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '0.00' }}</strong></span>
        <span>实际利润: <strong :class="currentFinance.actualProfit >= 0 ? 'text-revenue' : 'text-cost'">¥{{ currentFinance.actualProfit != null ? currentFinance.actualProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '0.00' }}</strong></span>
      </div>
      <div class="detail-driver-info" v-if="currentFinance">
        <span class="driver-info-item">
          <i class="el-icon-user-solid"></i>
          <span>司机：{{ currentFinance.driverName || '—' }}</span>
        </span>
        <span class="driver-info-item">
          <i class="el-icon-postcard"></i>
          <span>车牌号：{{ currentFinance.vehiclePlateNumber || '—' }}</span>
        </span>
        <span class="driver-info-item">
          <i class="el-icon-phone"></i>
          <span>联系电话：{{ currentFinance.driverPhone || '—' }}</span>
        </span>
      </div>
      <el-table :data="detailList" border size="small" :header-cell-style="{background:'#f5f7fa', color:'#606266'}" class="detail-table">
        <el-table-column prop="itemName" label="项目名称" min-width="160" />
        <el-table-column prop="amount" label="金额(元)" width="120" align="right">
          <template slot-scope="scope">
            <span :class="scope.row.direction === 1 ? 'text-revenue' : 'text-cost'">
              {{ scope.row.direction === 1 ? '+' : '-' }}¥{{ scope.row.amount != null ? parseFloat(scope.row.amount).toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="directionText" label="收支" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.direction === 1 ? 'success' : 'warning'" size="small">{{ scope.row.directionText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="80" align="center" v-if="currentFinance && currentFinance.settlementStatus !== 2">
          <template slot-scope="scope">
            <el-button size="mini" type="danger" icon="el-icon-delete" circle style="padding:5px 6px;" @click="deleteDetail(scope.row)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 添加费用对话框 -->
    <el-dialog :title="addForm.direction === 1 ? '录入运费收入' : '录入费用支出'" :visible.sync="addDialogVisible" width="460px" :modal="false">
      <el-form :model="addForm" label-width="100px" size="small">
        <el-form-item label="收支类型">
          <el-radio-group v-model="addForm.direction" :disabled="!!addForm.typeLock">
            <el-radio :label="1">收入</el-radio>
            <el-radio :label="0">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="addForm.itemName" :placeholder="addForm.direction === 1 ? '如：运费收入、客户付款' : '如：燃油费、高速费、过桥费'" clearable />
        </el-form-item>
        <el-form-item label="金额(元)">
          <el-input-number v-model="addForm.amount" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" placeholder="选填，可输入发票号等" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addDialogVisible=false" size="small">取消</el-button>
        <el-button type="primary" @click="submitExpense" size="small">确认添加</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'LogisticsFinance',
  computed: {
    canOperate() { return hasPermission('财务操作'); }
  },
  data() {
    return {
      loading: false,
      statusFilter: null,
      orderStatusFilter: null,
      dateRangeStart: null,
      dateRangeEnd: null,
      financeList: [],
      detailDialogVisible: false,
      addDialogVisible: false,
      currentFinance: null,
      detailList: [],
      addForm: { direction: 0, itemName: '', amount: 0, remark: '', typeLock: false },
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      stats: {
        totalRevenue: 0,
        totalCost: 0,
        actualProfit: 0,
        totalOrders: 0
      }
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      const params = new URLSearchParams();
      if (this.statusFilter !== null) params.append('settlementStatus', this.statusFilter);
      if (this.orderStatusFilter !== null) params.append('orderStatus', this.orderStatusFilter);
      if (this.dateRangeStart) params.append('startDate', this.dateRangeStart);
      if (this.dateRangeEnd) params.append('endDate', this.dateRangeEnd);
      const queryString = params.toString();
      axios.get(`/api/order-finance/list${queryString ? '?' + queryString : ''}`).then(res => {
        const list = (res.data.data || []).map(f => ({
          ...f,
          settlementStatusText: this.getStatusText(f.settlementStatus)
        }));
        this.totalCount = list.length;
        const start = (this.currentPage - 1) * this.pageSize;
        this.financeList = list.slice(start, start + this.pageSize);
        // 统计：只有"已结"的订单才计入营收/成本/利润汇总
        const settledList = list.filter(f => f.settlementStatus === 2);
        this.stats.totalOrders = list.length;
        this.stats.totalRevenue = (settledList.reduce((s, f) => s + parseFloat(f.totalRevenue || 0), 0));
        this.stats.totalCost = (settledList.reduce((s, f) => s + parseFloat(f.totalCost || 0), 0));
        this.stats.actualProfit = (settledList.reduce((s, f) => s + parseFloat(f.actualProfit || 0), 0));
        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    handleCommand(cmd, row) {
      switch (cmd) {
        case 'detail':      this.viewDetails(row);   break;
        case 'addFare':     this.addExpense(row, 1);  break;
        case 'addExpense':  this.addExpense(row, 0);  break;
        case 'submitAudit': this.submitAudit(row);   break;
        case 'confirmSettle': this.confirmSettle(row); break;
      }
    },
    viewDetails(row) {
      this.currentFinance = row;
      axios.get(`/api/finance-detail/list/${row.id}`).then(res => {
        this.detailList = (res.data.data || []).map(d => ({
          ...d,
          directionText: d.direction === 1 ? '收入' : '支出'
        }));
        this.detailDialogVisible = true;
      });
    },
    addExpense(row, direction) {
      this.currentFinance = row;
      this.addForm = {
        direction: direction,
        typeLock: direction === 1,
        itemName: direction === 1 ? '运费收入' : '',
        amount: direction === 1 ? (row.totalRevenue || 0) : 0,
        remark: ''
      };
      this.addDialogVisible = true;
    },
    submitExpense() {
      if (!this.addForm.itemName) { this.$message.warning('请填写项目名称'); return; }
      if (!this.addForm.amount || this.addForm.amount <= 0) { this.$message.warning('金额必须大于0'); return; }
      axios.post('/api/finance-detail/add', {
        financeId: this.currentFinance.id,
        itemName: this.addForm.itemName,
        amount: this.addForm.amount,
        direction: this.addForm.direction,
        remark: this.addForm.remark
      }).then(() => {
        this.$message.success('添加成功');
        this.addDialogVisible = false;
        this.loadData();
      }).catch(err => {
        const data = err.response && err.response.data;
        this.$message.error((data && data.msg) || (data && data.message) || '添加失败');
      });
    },
    deleteDetail(row) {
      this.$confirm('确认删除该费用明细？').then(() => {
        axios.delete(`/api/finance-detail/delete/${row.id}`).then(() => {
          this.$message.success('删除成功');
          this.viewDetails(this.currentFinance);
          this.loadData();
        }).catch(err => {
          const data = err.response && err.response.data;
          this.$message.error((data && data.msg) || (data && data.message) || '删除失败');
        });
      });
    },
    submitAudit(row) {
      this.$confirm('确认提交结算审核？提交后将进入"待审"状态。').then(() => {
        axios.post(`/api/order-finance/submit-audit/${row.orderId}`).then(() => {
          this.$message.success('已提交审核');
          this.loadData();
        }).catch(err => {
          const data = err.response && err.response.data;
          this.$message.error((data && data.msg) || (data && data.message) || '提交失败');
        });
      });
    },
    confirmSettle(row) {
      this.$confirm('确认结算？结算后该订单的费用明细将被锁定，无法再修改。', '结算确认', {
        confirmButtonText: '确认结算',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.post(`/api/order-finance/confirm/${row.orderId}`).then(() => {
          this.$message.success('结算成功');
          this.loadData();
        }).catch(err => {
          const data = err.response && err.response.data;
          this.$message.error((data && data.msg) || (data && data.message) || '结算失败');
        });
      });
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.loadData();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadData();
    },
    getStatusType(status) {
      return { 0: 'info', 1: 'warning', 2: 'success' }[status] || 'info';
    },
    getOrderStatusType(status) {
      return { 0: 'gray', 1: 'blue', 2: 'orange', 3: 'green', 4: 'danger' }[status] || 'info';
    },
    getStatusText(status) {
      return { 0: '未结', 1: '待审', 2: '已结' }[status] || '未知';
    },
    formatDate(dt) {
      if (!dt) return '-';
      const d = new Date(dt);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
};
</script>

<style scoped>
.header-bar {
  margin-bottom: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
}
.stat-revenue .stat-icon { background: linear-gradient(135deg, #67C23A, #85ce61); }
.stat-cost .stat-icon { background: linear-gradient(135deg, #F56C6C, #f89898); }
.stat-profit .stat-icon { background: linear-gradient(135deg, #409EFF, #66b1ff); }
.stat-count .stat-icon { background: linear-gradient(135deg, #909399, #b1b3b8); }
.stat-info { flex: 1; }
.stat-label { font-size: 12px; color: #909399; margin-bottom: 2px; }
.stat-value { font-size: 18px; font-weight: 700; color: #303133; }

.filter-bar {
  background: #fff;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
}
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.date-range { display: flex; align-items: center; gap: 6px; }
.date-sep { color: #909399; font-size: 13px; flex-shrink: 0; }

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}

/* 紧凑表格行 */
.table-card .el-table td,
.table-card .el-table th { padding: 6px 0; }
.table-card .el-table .cell { padding: 0 8px; }
.detail-table.el-table td,
.detail-table.el-table th { padding: 5px 0; }
.detail-table.el-table .cell { padding: 0 8px; }

.amount { font-weight: 600; font-family: 'PingFang SC', monospace; }
.table-icon { margin-right: 5px; color: #409EFF; font-size: 12px; vertical-align: middle; }
.revenue { color: #67C23A; }
.cost { color: #F56C6C; }
.profit { color: #67C23A; }
.loss { color: #F56C6C; }

.locked-text { font-size: 12px; color: #c0c4cc; }
.locked-text i { margin-right: 2px; }

.pagination-wrap { margin-top: 10px; display: flex; justify-content: flex-end; }

.detail-summary {
  display: flex;
  gap: 20px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 13px;
}
.text-revenue { color: #67C23A; }
.text-cost { color: #F56C6C; }

.detail-driver-info {
  display: flex;
  gap: 18px;
  padding: 8px 14px;
  background: #e6f0ff;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #303133;
}
.driver-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.driver-info-item i { color: #409EFF; }

@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .stats-row { grid-template-columns: 1fr; }
}
</style>
