<template>
  <el-container class="layout-shell" style="height: 100%;">
    <el-aside
      :width="isCollapse ? '96px' : '260px'"
      class="layout-aside"
      :class="{ 'is-collapsed': isCollapse }">
        <div class="aside-inner surface-card">
          <div class="brand-block">
          <div class="brand-logo">
            <span>仓</span>
          </div>
          <transition name="fade">
            <div class="brand-meta" v-if="!isCollapse">
              <p class="brand-name">仓储管理</p>
            </div>
          </transition>
          <el-tooltip :content="isCollapse ? '展开导航' : '收起导航'" placement="right">
            <el-button
              :class="['collapse-switch', { 'is-mini': isCollapse }]"
              size="mini"
              type="text"
              circle
              @click="toggleCollapse">
              <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
            </el-button>
          </el-tooltip>
      </div>

        <div class="nav-scroll-wrapper" ref="navWrapper" @scroll="handleNavScroll">
          <div class="nav-scroll-btn nav-scroll-btn--top" v-show="showTopBtn" @click="scrollNav(-1)">
            <i class="el-icon-arrow-up"></i>
          </div>
          <el-menu
            :default-active="$route.path"
            class="nav-menu"
            :collapse="isCollapse"
            router>
          <el-submenu index="/basic">
            <template slot="title">
              <i class="el-icon-menu"></i>
              <span slot="title">基础编辑</span>
            </template>
          <el-menu-item index="/warehouse">仓库管理</el-menu-item>
          <el-menu-item index="/shelf">货架管理</el-menu-item>
          <el-menu-item index="/product">商品管理</el-menu-item>
          <el-menu-item index="/inventory">库存管理</el-menu-item>
          <el-menu-item index="/vehicle" :disabled="!canAccessVehicle">车辆管理</el-menu-item>
        </el-submenu>
        <el-submenu index="/logistics-manage" :disabled="!canAccessOrder">
            <template slot="title">
              <i class="el-icon-truck"></i>
              <span slot="title">物流管理</span>
            </template>
          <el-menu-item index="/order-query" :disabled="!canQueryOrder">订单查询</el-menu-item>
          <el-menu-item index="/logistics-order" :disabled="!canViewLogisticsOrder">物流订单</el-menu-item>
          <el-menu-item index="/address-book" :disabled="!canAccessAddressBook">地址列表</el-menu-item>
          <el-menu-item index="/logistics-finance" :disabled="!canAccessFinance">费用明细</el-menu-item>
          <el-menu-item index="/driver-performance" :disabled="!canViewDriverPerformance">司机业绩</el-menu-item>
        </el-submenu>
        <el-submenu index="/stock" :disabled="!canAccessStock">
            <template slot="title">
              <i class="el-icon-box"></i>
              <span slot="title">库存操作</span>
            </template>
          <el-menu-item index="/stock-in" :disabled="!canStockIn">商品入库</el-menu-item>
          <el-menu-item index="/stock-out" :disabled="!canStockOut">商品出库</el-menu-item>
          <el-menu-item index="/warehouse-utilization" :disabled="!canAccessWarehouseUtil">仓库利用率</el-menu-item>
        </el-submenu>
        <el-submenu index="/analysis" :disabled="!canAccessAnalysis">
            <template slot="title">
              <i class="el-icon-data-analysis"></i>
              <span slot="title">库存分析</span>
            </template>
          <el-menu-item index="/dashboard" :disabled="!canAccessDashboard">运营看板</el-menu-item>
          <el-menu-item index="/area-statistics" :disabled="!canAccessAnalysis">分类统计</el-menu-item>
        </el-submenu>
          <el-menu-item index="/log" :disabled="!canViewLog">
            <i class="el-icon-document"></i>
            <span slot="title">日志记录</span>
          </el-menu-item>
          <el-menu-item index="/staff" :disabled="!canViewStaff">
            <i class="el-icon-user"></i>
            <span slot="title">人员管理</span>
          </el-menu-item>
      </el-menu>
          <div class="nav-scroll-btn nav-scroll-btn--bottom" v-show="showBottomBtn" @click="scrollNav(1)">
            <i class="el-icon-arrow-down"></i>
          </div>
        </div>
      </div>
    </el-aside>

    <el-container class="layout-main">
      <el-header class="main-header surface-card">
        <div class="header-title">
          <div class="title-row">
            <h1>仓储管理系统</h1>
          </div>
        </div>
        <div class="user-info surface-card" :class="roleColorClass">
          <el-dropdown>
            <span class="el-dropdown-link">
              <span class="user-avatar" :class="roleIconClass">
                <i class="el-icon-user-solid"></i>
              </span>
              <span class="user-meta">
                <strong>{{ currentUser.username || '用户' }}</strong>
                <small>{{ roleLabel }}</small>
              </span>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="page-stage">
        <div class="content-stage surface-card">
        <router-view></router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { hasPermission } from '@/utils/permission';

export default {
  name: 'MainLayout',
  computed: {
    currentUser() {
      try {
        const raw = localStorage.getItem('user-info');
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.error('解析用户信息失败', e);
        return {};
      }
    },
    roleLabel() {
      const map = { 0: '超级管理员', 1: '仓管员', 2: '普通用户', 3: '司机' };
      return map[this.currentUser.role] || '访客';
    },
    roleColorClass() {
      const map = { 0: 'role-super', 1: 'role-admin', 2: 'role-user', 3: 'role-driver' };
      return map[this.currentUser.role] || 'role-guest';
    },
    roleIconClass() {
      const map = { 0: 'icon-super', 1: 'icon-admin', 2: 'icon-user', 3: 'icon-driver' };
      return map[this.currentUser.role] || 'icon-guest';
    },
    canStockIn() {
      return hasPermission('入库操作');
    },
    canStockOut() {
      return hasPermission('出库操作');
    },
    canAccessWarehouseUtil() {
      return hasPermission('仓库利用率查看');
    },
    canViewLog() {
      return hasPermission('操作日志查询');
    },
    canViewStaff() {
      return hasPermission('用户查询');
    },
    canAccessStock() {
      return hasPermission('库存查询');
    },
    canAccessAnalysis() {
      return hasPermission('区域统计查看');
    },
    canAccessOrder() {
      return hasPermission('订单查询');
    },
    canViewLogisticsOrder() {
      return hasPermission('订单查询');
    },
    canCreateOrder() {
      return hasPermission('订单创建');
    },
    canQueryOrder() {
      return hasPermission('订单查询');
    },
    canAccessAddressBook() {
      return hasPermission('通讯录查看');
    },
    canAccessVehicle() {
      return hasPermission('车辆查询');
    },
    canAccessFinance() {
      return hasPermission('财务查看');
    },
    canViewDriverPerformance() {
      return hasPermission('司机绩效查看');
    },
    canAccessDashboard() {
      return hasPermission('仪表盘查看');
    }
  },
  data() {
    return {
      isCollapse: false,
      showTopBtn: false,
      showBottomBtn: false
    };
  },
  updated() {
    this.checkNavScroll();
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
    },
    logout() {
      localStorage.removeItem('user-token');
      localStorage.removeItem('user-info');
      this.$router.push('/login');
    },
    scrollNav(direction) {
      const el = this.$refs.navWrapper;
      if (!el) return;
      const step = 200;
      el.scrollBy({ top: direction * step, behavior: 'smooth' });
    },
    handleNavScroll() {
      this.checkNavScroll();
    },
    checkNavScroll() {
      const el = this.$refs.navWrapper;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      this.showTopBtn = scrollTop > 0;
      this.showBottomBtn = scrollTop + clientHeight < scrollHeight - 1;
    }
  }
};
</script>

<style scoped>
.layout-shell {
  background: transparent;
  height: 100vh;
  overflow: hidden;
}

.layout-aside {
  padding: 20px 0;
  padding-left: 10px;
  background: transparent;
  transition: width 0.35s ease;
  overflow: hidden;
}

.layout-aside.is-collapsed {
  padding: 24px 0;
}

.aside-inner {
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  padding: 16px 10px;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 35px 70px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.brand-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.layout-aside.is-collapsed .brand-block {
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.brand-logo {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #60a5fa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  box-shadow: 0 15px 25px rgba(99, 102, 241, 0.4);
  flex-shrink: 0;
}

.brand-meta {
  flex: 1;
}

.brand-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.nav-scroll-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.nav-scroll-btn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(96, 165, 250, 0.9));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transition: all 0.25s ease;
}

.nav-scroll-btn:hover {
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
}

.nav-scroll-btn--top {
  top: 8px;
}

.nav-scroll-btn--bottom {
  bottom: 8px;
}

.collapse-switch {
  color: #6366f1;
  min-width: 44px;
  height: 44px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(96, 165, 250, 0.12));
  border: 1px solid rgba(99, 102, 241, 0.15);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.collapse-switch.is-mini {
  min-width: 38px;
  height: 38px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.15);
}

.nav-menu {
  flex: 1;
  border: none;
  background: transparent;
  padding-top: 8px;
  overflow-y: auto;
  scrollbar-width: none;
}

.nav-menu::-webkit-scrollbar {
  display: none;
}

.nav-menu ::v-deep(.el-menu-item),
.nav-menu ::v-deep(.el-submenu__title) {
  height: 46px;
  line-height: 46px;
  border-radius: 14px;
  margin: 4px 6px;
  color: #475569;
  font-weight: 500;
}

.nav-menu ::v-deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(96, 165, 250, 0.25));
  box-shadow: 0 15px 35px rgba(99, 102, 241, 0.2);
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu__title span),
.nav-menu ::v-deep(.el-menu--collapse .el-menu-item span) {
  display: none;
}

.layout-main {
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-header {
  margin: 24px 24px 0 24px;
  border-radius: 24px;
  padding: 35px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  flex-direction: column;
}

.title-row h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
}

.title-sub {
  font-size: 14px;
  color: #64748b;
}

.user-info {
  padding: 6px 14px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* 角色色调（保持与整体浅色风格一致） */
.user-info.role-super {
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(96,165,250,0.15));
  border-color: rgba(99,102,241,0.35);
}

.user-info.role-admin {
  background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.12));
  border-color: rgba(16,185,129,0.35);
}

.user-info.role-user {
  background: linear-gradient(135deg, rgba(59,130,246,0.10), rgba(59,130,246,0.16));
  border-color: rgba(59,130,246,0.28);
}

.user-info.role-driver {
  background: linear-gradient(135deg, rgba(249,115,22,0.10), rgba(249,115,22,0.16));
  border-color: rgba(249,115,22,0.28);
}

.user-info.role-guest {
  background: rgba(248, 250, 252, 0.9);
  border-color: rgba(226, 232, 240, 0.8);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}

.user-avatar i {
  line-height: 1;
}

/* 角色图标色（仅影响头像背景） */
.user-avatar.icon-super {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  box-shadow: 0 10px 20px rgba(172, 64, 197, 0.28);
}

.user-avatar.icon-admin {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow: 0 10px 20px rgba(16,185,129,0.22);
}

.user-avatar.icon-user {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.24);
}

.user-avatar.icon-driver {
  background: linear-gradient(135deg, #f97316, #fb923c);
  box-shadow: 0 10px 20px rgba(249, 115, 22, 0.24);
}

.user-avatar.icon-guest {
  background: #94a3b8;
  box-shadow: 0 8px 16px rgba(148,163,184,0.18);
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #475569;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-meta strong {
  font-size: 14px;
  color: #0f172a;
}

.user-meta small {
  font-size: 12px;
  color: #94a3b8;
}

.page-stage {
  padding: 24px 32px 24px;
  flex: 1;
  overflow: hidden;
}

.content-stage {
  height: 100%;
  padding: 18px;
  border-radius: 30px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 40px 80px rgba(15, 23, 42, 0.08);
  overflow: auto;
  scrollbar-width: none; /* Firefox */
}

.content-stage::-webkit-scrollbar {
  display: none; /* WebKit */
}

.el-menu-item.is-disabled,
.el-submenu.is-disabled .el-submenu__title {
  cursor: not-allowed !important;
  opacity: 0.45;
  filter: grayscale(0.2);
}

.el-menu-item.is-disabled:hover,
.el-submenu.is-disabled .el-submenu__title:hover {
  background-color: transparent !important;
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu .el-menu),
.nav-menu ::v-deep(.el-menu--popup) {
  background: #ffffff !important;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.nav-menu ::v-deep(.el-menu--popup .el-menu-item) {
  color: #475569 !important;
  background: transparent !important;
  border-radius: 8px;
  margin: 2px 6px;
  height: 40px;
  line-height: 40px;
}

.nav-menu ::v-deep(.el-menu--popup .el-menu-item:hover) {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
}

.nav-menu ::v-deep(.el-menu--popup .el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(96, 165, 250, 0.22)) !important;
  color: #6366f1 !important;
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu .el-menu-item) {
  color: #475569 !important;
  background: transparent !important;
  border-radius: 8px;
  margin: 2px 6px;
  height: 40px;
  line-height: 40px;
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu .el-menu-item:hover) {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu .el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(96, 165, 250, 0.22)) !important;
  color: #6366f1 !important;
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu__title) {
  color: #475569 !important;
  background: transparent !important;
  border-radius: 14px;
  margin: 4px 6px;
}

.nav-menu ::v-deep(.el-menu--collapse .el-submenu__title:hover) {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
}

@media (max-width: 1024px) {
  .layout-shell {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  .layout-aside {
    width: 100% !important;
  }
  .aside-inner {
    flex-direction: row;
    align-items: center;
    height: auto;
  }
  .nav-menu {
    flex: 1;
  }
  .content-stage {
    padding: 20px;
    border-radius: 24px;
  }
  .main-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

<style>
.el-menu--popup {
  background: rgba(255, 255, 255, 0.97) !important;
  border-radius: 16px !important;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12) !important;
  backdrop-filter: blur(10px);
  padding: 6px 0 !important;
}

.el-menu--popup .el-menu-item {
  color: #475569 !important;
  background: transparent !important;
  border-radius: 10px !important;
  margin: 3px 8px !important;
  height: 40px !important;
  line-height: 40px !important;
  font-weight: 500 !important;
}

.el-menu--popup .el-menu-item:hover {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
}

.el-menu--popup .el-menu-item.is-active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(96, 165, 250, 0.22)) !important;
  color: #6366f1 !important;
}
</style>

