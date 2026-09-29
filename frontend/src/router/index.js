import Vue from 'vue'
import VueRouter from 'vue-router'

// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackChunkName: "register" */ '../views/Register.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import(/* webpackChunkName: "forgot-password" */ '../views/ForgotPassword.vue')
  },
  {
    path: '/',
    name: 'MainLayout',
    component: () => import(/* webpackChunkName: "main" */ '../views/MainLayout.vue'),
    meta: { requiresAuth: true }, // 添加一个元字段，表示这个路由需要认证
    redirect: '/warehouse', // 默认显示仓库管理页面
    children: [
      {
        path: 'warehouse',
        name: 'Warehouse',
        component: () => import(/* webpackChunkName: "warehouse" */ '../views/Warehouse.vue')
      },
      {
        path: 'shelf',
        name: 'Shelf',
        component: () => import(/* webpackChunkName: "shelf" */ '../views/Shelf.vue')
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import(/* webpackChunkName: "product" */ '../views/Product.vue')
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import(/* webpackChunkName: "inventory" */ '../views/Inventory.vue')
      },
      // 库存分析相关路由
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ '../views/Dashboard.vue')
      },
      {
        path: 'area-statistics',
        name: 'AreaStatistics',
        component: () => import(/* webpackChunkName: "area-statistics" */ '../views/AreaStatistics.vue')
      },
      {
        path: 'log',
        name: 'Log',
        component: () => import(/* webpackChunkName: "log" */ '../views/Log.vue')
      },
      {
        path: 'staff',
        name: 'Staff',
        component: () => import(/* webpackChunkName: "staff" */ '../views/Staff.vue')
      },
      {
        path: 'stock-in',
        name: 'StockIn',
        component: () => import(/* webpackChunkName: "stock-in" */ '../views/StockIn.vue')
      },
      {
        path: 'stock-out',
        name: 'StockOut',
        component: () => import(/* webpackChunkName: "stock-out" */ '../views/StockOut.vue')
      },
      {
        path: 'warehouse-utilization',
        name: 'WarehouseUtilization',
        component: () => import(/* webpackChunkName: "warehouse-utilization" */ '../views/WarehouseUtilization.vue')
      },
      // 物流管理相关路由
      {
        path: 'order-create',
        name: 'OrderCreate',
        component: () => import(/* webpackChunkName: "order-create" */ '../views/OrderCreate.vue')
      },
      {
        path: 'order-query',
        name: 'OrderQuery',
        component: () => import(/* webpackChunkName: "order-query" */ '../views/OrderQuery.vue')
      },
      {
        path: 'logistics-order',
        name: 'LogisticsOrder',
        component: () => import(/* webpackChunkName: "logistics-order" */ '../views/LogisticsOrder.vue')
      },
      {
        path: 'vehicle',
        name: 'Vehicle',
        component: () => import(/* webpackChunkName: "vehicle" */ '../views/Vehicle.vue')
      },
      {
        path: 'address-book',
        name: 'AddressBook',
        component: () => import(/* webpackChunkName: "address-book" */ '../views/AddressBook.vue')
      },
      {
        path: 'logistics-finance',
        name: 'LogisticsFinance',
        component: () => import(/* webpackChunkName: "logistics-finance" */ '../views/LogisticsFinance.vue')
      },
      {
        path: 'driver-performance',
        name: 'DriverPerformance',
        component: () => import(/* webpackChunkName: "driver-performance" */ '../views/DriverPerformance.vue')
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 添加全局前置导航守卫
router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('user-token');

  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!loggedIn) {
      // 如果用户未登录，则重定向到登录页面
      next('/login');
    } else {
      // 如果用户已登录，则允许访问
      next();
    }
  } else {
    // 如果路由不需要认证（例如登录页本身），则直接放行
    next();
  }
});

export default router
