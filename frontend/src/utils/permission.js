/**
 * 权限工具函数
 * 用于检查用户是否有权限执行特定操作
 */

// 权限等级定义
const PERMISSION_LEVELS = {
  // level 0: 仅超级管理员
  SUPER_ADMIN_ONLY: 0,
  // level 1: 超级管理员 + 仓管员
  ADMIN_AND_KEEPER: 1,
  // level 2: 仓管员/普通用户/司机（不含普通用户，但含司机）
  KEEPER_AND_DRIVER: 2,
  // level 3: 所有人（含普通用户）
  ALL_USERS: 3
};

// 权限名称到权限等级的映射
const PERMISSION_MAP = {
  // === 商品管理 ===
  '商品查询': PERMISSION_LEVELS.ALL_USERS,
  '商品新增': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '商品修改': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '商品删除': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,

  // === 仓库管理 ===
  '仓库查询': PERMISSION_LEVELS.ALL_USERS,
  '仓库新增': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '仓库修改': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '仓库删除': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,

  // === 货架管理 ===
  '货架查询': PERMISSION_LEVELS.ALL_USERS,
  '货架新增': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '货架修改': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '货架删除': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,

  // === 用户管理 ===
  '用户查询': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,
  '用户新增': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,
  '用户修改': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,
  '用户删除': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,

  // === 库存管理 ===
  '库存查询': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '库存统计': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 入库操作 ===
  '商品入库': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 操作日志 ===
  '操作日志查询': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,

  // === 车辆管理 ===
  '车辆查询': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '车辆新增': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '车辆修改': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '车辆删除': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,
  '车辆绑定司机': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 通讯录 ===
  '通讯录查看': PERMISSION_LEVELS.KEEPER_AND_DRIVER,
  '通讯录新增': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '通讯录修改': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '通讯录删除': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 物流订单 ===
  '订单查询': PERMISSION_LEVELS.ALL_USERS,
  '订单创建': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '订单编辑': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '订单取消': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '订单删除': PERMISSION_LEVELS.SUPER_ADMIN_ONLY,

  // === 物流财务 ===
  '财务查看': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '财务操作': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 司机绩效 ===
  '司机绩效查看': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '司机绩效管理': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 入库出库 ===
  '入库操作': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '出库操作': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 兼容旧权限名称（映射到新权限）===
  '物流订单新增': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '物流订单查询': PERMISSION_LEVELS.ALL_USERS,
  '司机绩效查询': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '费用录入': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '费用审核': PERMISSION_LEVELS.ADMIN_AND_KEEPER,
  '结算确认': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 区域统计 ===
  '区域统计查看': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 仓库利用率 ===
  '仓库利用率查看': PERMISSION_LEVELS.ADMIN_AND_KEEPER,

  // === 仪表盘 ===
  '仪表盘查看': PERMISSION_LEVELS.ALL_USERS
};

/**
 * 获取当前用户的角色
 * @returns {number|null} 用户角色：0=超级管理员，1=仓管员，2=普通用户，null=未登录
 */
export function getCurrentUserRole() {
  try {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.role !== undefined ? user.role : null;
    }
    return null;
  } catch (e) {
    console.error('获取用户角色失败:', e);
    return null;
  }
}

/**
 * 检查用户是否有指定权限
 * @param {string} permissionName 权限名称
 * @param {number|null} userRole 用户角色，如果不提供则从localStorage获取
 * @returns {boolean} 是否有权限
 */
export function hasPermission(permissionName, userRole = null) {
  // 获取用户角色
  if (userRole === null) {
    userRole = getCurrentUserRole();
  }
  
  // 未登录用户无权限
  if (userRole === null) {
    return false;
  }
  
  // 超级管理员拥有所有权限
  if (userRole === 0) {
    return true;
  }
  
  // 如果权限未定义，默认允许（向后兼容）
  if (!Object.prototype.hasOwnProperty.call(PERMISSION_MAP, permissionName)) {
    console.warn(`权限 "${permissionName}" 未定义，默认允许访问`);
    return true;
  }
  
  // 获取权限等级
  const permissionLevel = PERMISSION_MAP[permissionName];
  
  // 根据权限等级判断
  switch (permissionLevel) {
    case PERMISSION_LEVELS.SUPER_ADMIN_ONLY:
      // 仅超级管理员（已经在上面处理了）
      return false;

    case PERMISSION_LEVELS.ADMIN_AND_KEEPER:
      // 超级管理员 + 仓管员（超级管理员已经在上面处理了）
      return userRole === 1;

    case PERMISSION_LEVELS.KEEPER_AND_DRIVER:
      // 仓管员/普通用户/司机（role >= 1），不含普通用户（role=2）
      // 超级管理员在上面已返回true，所以这里 role === 1 (仓管员) 或 role >= 3 (司机)
      return userRole === 1 || userRole >= 3;

    case PERMISSION_LEVELS.ALL_USERS:
      // 所有人
      return true;

    default:
      return false;
  }
}

/**
 * 检查用户是否为超级管理员
 * @param {number|null} userRole 用户角色
 * @returns {boolean}
 */
export function isSuperAdmin(userRole = null) {
  if (userRole === null) {
    userRole = getCurrentUserRole();
  }
  return userRole === 0;
}

/**
 * 检查用户是否为仓管员或超级管理员
 * @param {number|null} userRole 用户角色
 * @returns {boolean}
 */
export function isAdminOrKeeper(userRole = null) {
  if (userRole === null) {
    userRole = getCurrentUserRole();
  }
  return userRole === 0 || userRole === 1;
}

/**
 * 检查用户是否为司机及以上（含仓管员）
 * @param {number|null} userRole 用户角色
 * @returns {boolean}
 */
export function isKeeperOrDriver(userRole = null) {
  if (userRole === null) {
    userRole = getCurrentUserRole();
  }
  return userRole === 0 || userRole === 1 || userRole === 3;
}

