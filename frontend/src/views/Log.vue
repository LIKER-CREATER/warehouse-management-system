<template>
  <div>
    <div class="header-bar">
      <h1>操作日志</h1>
      <el-button
        type="danger"
        class="clear-btn"
        @click="handleClearAll"
        :disabled="logData.length === 0"
      >
        一键清空
      </el-button>
    </div>
    <el-table :data="logData" border style="width: 100%">
      <el-table-column prop="userId" label="操作用户" :formatter="formatUsername" width="150"></el-table-column>
      <el-table-column prop="operationTypeId" label="操作类型" :formatter="formatOperationType"></el-table-column>
      <el-table-column prop="description" label="详情"></el-table-column>
      <el-table-column prop="operationStatus" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.operationStatus === '成功' ? 'success' : 'danger'" disable-transitions>
            {{ scope.row.operationStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operationTime" label="操作时间" :formatter="formatDate" width="160"></el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="danger"
            class="table-action-btn table-action-delete"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
        <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[6]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalLogs">
        </el-pagination>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';

export default {
  name: 'Log',
  data() {
    return {
      logData: [],
      currentPage: 1,
      pageSize: 6,
      totalLogs: 0,
      userMap: {} // 用户ID到用户名的映射
    };
  },
  created() {
    this.fetchUsers();
    this.fetchLogs();
  },
  methods: {
    fetchUsers() {
      // 获取所有用户，创建ID到用户名的映射
      axios.get('/api/user/list').then(res => {
        if (res.data && res.data.code === 200 && res.data.data) {
          const userMap = {};
          res.data.data.forEach(user => {
            userMap[user.id] = user.username || `用户${user.id}`;
          });
          this.userMap = userMap;
        }
      }).catch(error => {
        console.error('获取用户列表失败:', error);
      });
    },
    fetchLogs() {
      axios.get(`/api/log/page?current=${this.currentPage}&size=${this.pageSize}`).then(res => {
        this.logData = res.data.data.records;
        this.totalLogs = res.data.data.total;
      });
    },
    formatUsername(row, column, cellValue) {
      // 根据用户ID返回用户名
      return this.userMap[cellValue] || `用户${cellValue}`;
    },
    formatDate(row, column, cellValue) {
      return cellValue ? moment(cellValue).format('YYYY-MM-DD HH:mm:ss') : '';
    },
    formatOperationType(row) {
      // 操作类型ID到名称的映射（与 operation_type 表一致）
      const operationTypeMap = {
        1:  '用户登录',
        2:  '添加用户',
        3:  '删除用户',
        4:  '修改用户',
        5:  '添加仓库',
        6:  '删除仓库',
        7:  '修改仓库',
        8:  '添加货架',
        9:  '删除货架',
        10: '修改货架',
        11: '添加商品',
        12: '删除商品',
        13: '修改商品',
        14: '执行入库操作',
        15: '执行出库操作',
        16: '商品库存查询',
        17: '库存统计',
        18: '查询操作日志',
        19: '添加车辆',
        20: '删除车辆',
        21: '修改车辆',
        22: '绑定司机',
        23: '创建物流订单',
        24: '指派物流',
        25: '开始运输',
        26: '完成物流订单',
        27: '取消物流订单',
        28: '添加地址',
        29: '删除地址',
        30: '修改地址',
        31: '录入运费收入',
        32: '录入费用支出',
        33: '提交结算审核',
        34: '确认订单结算'
      };
      return operationTypeMap[row.operationTypeId] || `未知类型(${row.operationTypeId})`;
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchLogs();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchLogs();
    },
    // 删除单条日志
    handleDelete(id) {
      this.$confirm('确认删除该条日志记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 对应后端 DELETE /api/log/delete/{id}
        axios.delete(`/api/log/delete/${id}`).then(() => {
          this.$message.success('删除成功');
          this.fetchLogs();
        }).catch(() => {
          this.$message.error('删除失败，请稍后重试');
        });
      }).catch(() => {});
    },
    // 一键清空所有日志
    handleClearAll() {
      this.$confirm('此操作将清空所有操作日志，是否继续？', '严重操作提示', {
        confirmButtonText: '清空日志',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete('/api/log/clear').then(() => {
          this.$message.success('已清空所有日志');
          this.currentPage = 1;
          this.fetchLogs();
        }).catch(() => {
          this.$message.error('清空失败，请稍后重试');
        });
      }).catch(() => {});
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.table-action-btn {
  min-width: 62px;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  border-width: 1px;
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

.clear-btn {
  border-radius: 999px;
  padding: 10px 24px;
  font-weight: 600;
  box-shadow: 0 14px 30px rgba(99, 102, 241, 0.35);
  font-size: 14px;
}
</style>