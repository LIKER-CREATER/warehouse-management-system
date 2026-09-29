<template>
  <div>
    <div class="header-bar">
      <h1>司机业绩</h1>
      <el-button type="primary" size="small" icon="el-icon-view" @click="handleExport" :disabled="!canExport">导出报表</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-orders">
        <div class="stat-icon"><i class="el-icon-box"></i></div>
        <div class="stat-info">
          <div class="stat-label">总单量</div>
          <div class="stat-value">{{ stats.totalOrders }}</div>
        </div>
      </div>
      <div class="stat-card stat-profit">
        <div class="stat-icon"><i class="el-icon-wallet"></i></div>
        <div class="stat-info">
          <div class="stat-label">总收益</div>
          <div class="stat-value" style="color:#67C23A;">
            ¥{{ stats.totalProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2}) }}
          </div>
        </div>
      </div>
      <div class="stat-card stat-avg">
        <div class="stat-icon"><i class="el-icon-data-line"></i></div>
        <div class="stat-info">
          <div class="stat-label">单均</div>
          <div class="stat-value" style="color:#409EFF;">
            ¥{{ stats.avgProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2}) }}
          </div>
        </div>
      </div>
      <div class="stat-card stat-month">
        <div class="stat-icon"><i class="el-icon-calendar"></i></div>
        <div class="stat-info">
          <div class="stat-label">统计月</div>
          <div class="stat-value">{{ currentMonth }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row" v-if="!isDriverView">
      <div class="chart-card">
        <div class="chart-title">近6月收益趋势</div>
        <div ref="barChart" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">车型收益占比</div>
        <div ref="pieChart" class="chart-container"></div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <el-select v-model="selectedMonth" placeholder="选择月份" size="small" style="width:150px" @change="onFilterChange">
          <el-option v-for="m in monthOptions" :key="m" :label="m" :value="m" />
        </el-select>
        <el-select v-if="!isDriverView" v-model="selectedDriverId" placeholder="全部司机" size="small" clearable style="width:160px" @change="onFilterChange">
          <el-option v-for="d in driverOptions" :key="d.id" :label="d.name + ' - ' + d.phone" :value="d.id" />
        </el-select>
      </div>
    </div>

    <!-- 绩效总览（仅管理员可见） -->
    <div class="table-card" v-if="!isDriverView">
      <div class="section-header">
        <span class="section-title">绩效总览</span>
        <el-tag size="small" type="info">{{ selectedMonth }}</el-tag>
      </div>
      <div class="performance-grid" v-loading="loading">
        <div
          class="perf-card"
          v-for="item in performanceList"
          :key="item.driverId">
          <div class="perf-card-header">
            <div class="perf-avatar">{{ (item.driverName || '司').charAt(0) }}</div>
            <div class="perf-name-info">
              <div class="perf-driver-name">{{ item.driverName }}</div>
              <div class="perf-phone">{{ item.driverPhone || '-' }}</div>
            </div>
            <div class="perf-badge">
              <el-tag type="primary" size="mini">{{ item.month }}</el-tag>
            </div>
          </div>
          <div class="perf-card-body">
            <div class="perf-stat">
              <div class="perf-stat-label">完成单量</div>
              <div class="perf-stat-value">{{ item.orderCount || 0 }} <span class="perf-unit">单</span></div>
            </div>
            <div class="perf-stat">
              <div class="perf-stat-label">创造收益</div>
              <div class="perf-stat-value text-profit">¥{{ item.totalProfit != null ? parseFloat(item.totalProfit).toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '0.00' }}</div>
            </div>
          </div>
          <div class="perf-card-footer">
            <span class="perf-update-time">
              <i class="el-icon-time"></i>
              {{ item.lastUpdateTime ? formatDate(item.lastUpdateTime) : '-' }}
            </span>
          </div>
        </div>
        <div class="perf-empty" v-if="!loading && performanceList.length === 0">
          <i class="el-icon-folder-opened"></i>
          <p>暂无绩效数据</p>
        </div>
      </div>

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

    <!-- 司机个人业绩（司机视图） -->
    <div class="table-card" v-else>
      <div class="section-header">
        <span class="section-title">我的业绩明细</span>
        <el-tag size="small" type="info">{{ selectedMonth }}</el-tag>
      </div>
      <el-table
        :data="performanceList"
        border
        stripe
        v-loading="loading"
        :header-cell-style="{background:'#f5f7fa', color:'#606266'}">
        <el-table-column prop="month" label="统计月份" width="120" align="center" />
        <el-table-column prop="orderCount" label="完成单量" width="110" align="center">
          <template slot-scope="scope">
            <el-tag type="primary" size="small">{{ scope.row.orderCount || 0 }} 单</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalProfit" label="创造收益(元)" width="150" align="right">
          <template slot-scope="scope">
            <span class="text-profit-bold">
              ¥{{ scope.row.totalProfit != null ? parseFloat(scope.row.totalProfit).toLocaleString('zh-CN', {minimumFractionDigits: 2}) : '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdateTime" label="更新时间" width="160" align="center">
          <template slot-scope="scope">
            {{ scope.row.lastUpdateTime ? formatDate(scope.row.lastUpdateTime) : '-' }}
          </template>
        </el-table-column>
      </el-table>
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

  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';
import { hasPermission } from '@/utils/permission';

export default {
  name: 'DriverPerformance',
  computed: {
    isDriverView() {
      const user = this.getCurrentUser();
      return user && user.role === 3;
    },
    canExport() {
      return hasPermission('司机绩效管理');
    },
    currentMonth() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
  },
  data() {
    return {
      loading: false,
      selectedMonth: '',
      monthOptions: [],
      selectedDriverId: null,
      driverOptions: [],
      performanceList: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      stats: {
        totalOrders: 0,
        totalProfit: 0,
        avgProfit: 0
      }
    };
  },
  mounted() {
    this.generateMonthOptions();
    this.loadDrivers();
    this.loadData();
    this.loadChartData();
  },
  beforeDestroy() {
    if (this.barChart) { this.barChart.dispose(); this.barChart = null; }
    if (this.pieChart) { this.pieChart.dispose(); this.pieChart = null; }
  },
  methods: {
    getCurrentUser() {
      try {
        return JSON.parse(localStorage.getItem('user-info') || '{}');
      } catch { return {}; }
    },
    generateMonthOptions() {
      const now = new Date();
      const options = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        options.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
      }
      this.monthOptions = options;
      this.selectedMonth = options[0];
    },
    loadDrivers() {
      axios.get('/api/driver-performance/drivers').then(res => {
        this.driverOptions = res.data.data || [];
      });
    },
    loadData() {
      this.loading = true;
      const params = new URLSearchParams();
      if (this.selectedMonth) params.append('month', this.selectedMonth);
      const queryString = params.toString();

      const apiCall = this.isDriverView && !this.selectedDriverId
        ? axios.get(`/api/driver-performance/detail/${this.getCurrentUser().id}`, { params: { month: this.selectedMonth } })
            .then(res => {
              const data = res.data.data;
              if (data && data.performanceList) {
                return { data: { data: data.performanceList } };
              }
              return { data: { data: [] } };
            })
        : axios.get(`/api/driver-performance/list-by-month${queryString ? '?' + queryString : ''}`);

      apiCall.then(res => {
        let list = res.data.data || [];
        // 司机只能看自己
        if (this.isDriverView) {
          const myId = this.getCurrentUser().id;
          list = list.filter(p => p.driverId === myId);
        }
        if (this.selectedDriverId) {
          list = list.filter(p => p.driverId === this.selectedDriverId);
        }
        this.totalCount = list.length;
        const start = (this.currentPage - 1) * this.pageSize;
        this.performanceList = list.slice(start, start + this.pageSize);

        // 统计
        this.stats.totalOrders = list.reduce((s, p) => s + (p.orderCount || 0), 0);
        this.stats.totalProfit = list.reduce((s, p) => s + parseFloat(p.totalProfit || 0), 0);
        this.stats.avgProfit = this.stats.totalOrders > 0 ? this.stats.totalProfit / this.stats.totalOrders : 0;

        this.loading = false;
      }).catch(() => { this.loading = false; });
    },
    loadChartData() {
      if (this.isDriverView) return;
      const months = this.monthOptions.slice(0, 6);
      const requests = months.map(m =>
        axios.get('/api/driver-performance/list-by-month?month=' + m)
          .then(res => res.data.data || [])
      );
      Promise.all(requests).then(results => {
        let merged = results.flat();
        if (this.selectedDriverId) {
          merged = merged.filter(p => p.driverId === this.selectedDriverId);
        }
        this.$nextTick(() => this.renderOverviewCharts(merged));
      });
    },
    renderOverviewCharts(list) {
      // 柱状图：近6月趋势
      if (!this.$refs.barChart) return;
      if (this.barChart) this.barChart.dispose();
      this.barChart = echarts.init(this.$refs.barChart);
      const trend = this.getAggregatedTrend(list);
      this.barChart.setOption({
        color: ['#6366f1'],
        tooltip: { trigger: 'axis', formatter: params => `${params[0].name}<br/><b>¥${params[0].value.toLocaleString()}</b>` },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: trend.map(t => t.month), axisLabel: { fontSize: 11 } },
        yAxis: { type: 'value', axisLabel: { formatter: v => '¥' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) } },
        series: [{ name: '收益', type: 'bar', data: trend.map(t => t.profit), barWidth: '50%', itemStyle: { borderRadius: [6, 6, 0, 0] } }]
      });

      // 饼图：车型占比
      if (this.$refs.pieChart) {
        if (this.pieChart) this.pieChart.dispose();
        this.pieChart = echarts.init(this.$refs.pieChart);
        const vehicleData = this.getVehicleProfitData(list);
        this.pieChart.setOption({
          tooltip: { trigger: 'item', formatter: p => `${p.name}<br/>¥${p.value.toLocaleString()} (${p.percent}%)` },
          legend: { bottom: 0, textStyle: { fontSize: 11 } },
          color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          series: [{ name: '车型收益', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
              label: { show: false },
              emphasis: { label: { show: true, fontWeight: 'bold' } },
              data: vehicleData
          }]
        });
      }

      // 响应式
      window.addEventListener('resize', () => {
        if (this.barChart) this.barChart.resize();
        if (this.pieChart) this.pieChart.resize();
      }, { once: true });
    },
    getAggregatedTrend(list) {
      // 按月份聚合
      const map = {};
      list.forEach(p => {
        if (!map[p.month]) map[p.month] = 0;
        map[p.month] += parseFloat(p.totalProfit || 0);
      });
      return Object.entries(map).sort().map(([month, profit]) => ({ month, profit }));
    },
    getVehicleProfitData(list) {
      // 简化处理：用 orderCount 作为车型分布代理
      const cats = ['微面', '小货', '中货', '大货'];
      const profits = [0, 0, 0, 0];
      const counts = [0, 0, 0, 0];
      list.forEach((p, i) => {
        const idx = i % 4;
        profits[idx] += parseFloat(p.totalProfit || 0);
        counts[idx] += p.orderCount || 0;
      });
      return cats.map((cat, i) => ({ name: cat, value: Math.max(profits[i], 0) }));
    },
    onFilterChange() {
      this.currentPage = 1;
      this.loadData();
      this.loadChartData();
    },
    handleExport() {
      this.loading = true;
      const params = new URLSearchParams();
      if (this.selectedMonth) params.append('month', this.selectedMonth);
      if (this.selectedDriverId) params.append('driverId', this.selectedDriverId);
      const qs = params.toString();

      const request = this.isDriverView
        ? axios.get(`/api/driver-performance/detail/${this.getCurrentUser().id}`, { params: { month: this.selectedMonth } }).then(res => {
            const data = res.data.data;
            return data && data.performanceList ? data.performanceList : [];
          })
        : axios.get(`/api/driver-performance/list-by-month${qs ? '?' + qs : ''}`).then(res => res.data.data || []);

      request.then(list => {
        this.loading = false;
        const allData = Array.isArray(list) ? list : [];
        const previewHtml = this.buildPreviewHtml(allData);
        const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }).catch(() => { this.loading = false; });
    },
    buildPreviewHtml(list) {
      const user = this.getCurrentUser();
      const isDriver = user && user.role === 3;
      const month = this.selectedMonth || this.currentMonth;
      const stats = this.stats;
      const pad = n => String(n).padStart(2, '0');
      const fmtMoney = v => (v != null ? parseFloat(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '0.00');
      const fmtDate = dt => {
        if (!dt) return '-';
        const d = new Date(dt);
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      const rows = list.map(p => `
        <tr>
          ${!isDriver ? `<td>${p.driverName || '-'}</td><td>${p.driverPhone || '-'}</td>` : ''}
          <td>${p.month || '-'}</td>
          <td class="c">${p.orderCount || 0}</td>
          <td class="r">¥${fmtMoney(p.totalProfit)}</td>
          <td class="c">${fmtDate(p.lastUpdateTime)}</td>
        </tr>`).join('');

      return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>司机业绩报表 - ${month}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: "PingFang SC","Microsoft YaHei",sans-serif; padding: 40px; color: #000; background: #fff; }
  .card { max-width: 900px; margin: 0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #000; padding-bottom:16px; }
  .header h1 { font-size:20px; font-weight:700; color:#000; }
  .header .meta { font-size:12px; color:#444; text-align:right; line-height:1.8; }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .stat { border:1px solid #ccc; border-radius:4px; padding:14px 12px; text-align:center; }
  .stat-label { font-size:11px; color:#555; margin-bottom:4px; }
  .stat-value { font-size:18px; font-weight:700; color:#000; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { background:#eee; color:#000; padding:10px 8px; text-align:left; font-weight:700; border:1px solid #ccc; }
  td { padding:10px 8px; border:1px solid #ccc; }
  .c { text-align:center; }
  .r { text-align:right; font-weight:700; }
  .footer { margin-top:20px; display:flex; justify-content:space-between; align-items:center; }
  .footer span { font-size:11px; color:#555; }
  .btn { display:inline-block; padding:8px 20px; background:#000; color:#fff; border:none; border-radius:3px; font-size:13px; cursor:pointer; text-decoration:none; }
  @media print {
    body { padding: 20px; }
    .btn { display: none; }
    .stat { border:1px solid #000; }
    th { background:#ddd !important; -webkit-print-color-adjust: exact; }
    td { border:1px solid #000; }
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div><h1>司机业绩报表</h1><div style="font-size:12px;color:#555;margin-top:3px;">${isDriver ? '个人业绩' : '全司机绩效总览'}</div></div>
    <div class="meta">
      <div>统计月份：<strong>${month}</strong></div>
      <div>生成时间：<strong>${fmtDate(new Date())}</strong></div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-label">总单量</div><div class="stat-value">${stats.totalOrders}</div></div>
    <div class="stat"><div class="stat-label">总收益</div><div class="stat-value">¥${fmtMoney(stats.totalProfit)}</div></div>
    <div class="stat"><div class="stat-label">单均</div><div class="stat-value">¥${fmtMoney(stats.avgProfit)}</div></div>
    <div class="stat"><div class="stat-label">统计月</div><div class="stat-value">${month}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        ${!isDriver ? '<th>司机姓名</th><th>联系电话</th>' : ''}
        <th>统计月份</th><th class="c">完成单量</th><th class="r">创造收益(元)</th><th class="c">更新时间</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>共 ${list.length} 条记录</span>
    <button class="btn" onclick="window.print()">打印 / 另存为 PDF</button>
  </div>
</div>
</body>
</html>`;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}
.stat-orders .stat-icon { background: linear-gradient(135deg, #409EFF, #66b1ff); }
.stat-profit .stat-icon { background: linear-gradient(135deg, #67C23A, #85ce61); }
.stat-avg .stat-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-month .stat-icon { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
.stat-info { flex: 1; }
.stat-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 20px; font-weight: 700; color: #303133; }

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}
.chart-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 16px; }
.chart-container { height: 220px; }

.filter-bar {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
}
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.table-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.text-profit-bold { color: #67C23A; font-weight: 700; }

.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 绩效总览卡片网格 */
.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.perf-card {
  background: #f9fafb;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.perf-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.12);
  transform: translateY(-2px);
}
.perf-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.perf-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.perf-name-info { flex: 1; min-width: 0; }
.perf-driver-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.perf-phone {
  font-size: 11px;
  color: #909399;
  margin-top: 1px;
}
.perf-badge { flex-shrink: 0; }
.perf-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.perf-stat {
  background: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  border: 1px solid #f0f0f0;
}
.perf-stat-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 3px;
}
.perf-stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
}
.perf-unit {
  font-size: 11px;
  font-weight: 400;
  color: #909399;
}
.text-profit { color: #67C23A; }
.perf-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
}
.perf-update-time {
  font-size: 11px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 3px;
}
.perf-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
  color: #c0c4cc;
}
.perf-empty i { font-size: 40px; margin-bottom: 8px; display: block; }
.perf-empty p { font-size: 14px; margin: 0; }

@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .stats-row { grid-template-columns: 1fr; }
}
</style>
