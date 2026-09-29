# 智能仓储物流管理系统

基于 Vue 2 与 Spring Boot 的前后端分离仓储物流管理系统，覆盖仓储基础管理、库存作业、物流订单、车辆与司机、财务统计及角色权限控制。

> 本仓库已移除本机数据库密码与 JWT 密钥。运行前请按下文创建本地配置文件，切勿提交该文件。

## 功能概览

- 用户注册、登录、密码重置与基于 JWT 的认证
- 多角色权限控制：超级管理员、仓管员、普通用户、司机
- 仓库、货架、商品、员工与操作日志管理
- 入库、出库、库存查询、库存预警与仓储利用率统计
- 物流订单创建、查询、指派、运输管理与地址簿
- 车辆、司机绩效和物流财务统计

## 技术栈

- 前端：Vue 2、Vue Router、Element UI、Axios、ECharts
- 后端：Java 8、Spring Boot 2.7、MyBatis-Plus、MySQL 8、Druid、JWT

## 目录结构

```text
warehouse-management-system/
├── frontend/                 # Vue 前端应用
├── backend/                  # Spring Boot 后端应用
├── database/                 # 数据库结构和演示数据
├── docs/                     # 项目报告、API 文档与设计资料
├── .gitignore
└── LICENSE
```

## 环境要求

- JDK 8 或更高版本
- Maven 3.6 或更高版本
- MySQL 8.0 或更高版本
- Node.js 14 或更高版本，npm 6 或更高版本

## 本地运行

### 1. 初始化数据库

创建数据库结构，再按需导入演示数据：

```bash
mysql -u root -p < database/init.sql
mysql -u root -p warehouse_db < database/sample_data.sql
```

### 2. 配置并启动后端

在 `backend` 目录中复制配置模板为本地配置文件：

```powershell
Copy-Item src/main/resources/application.yml.example src/main/resources/application.yml
```

设置数据库连接和 JWT 密钥。PowerShell 示例：

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "你的 MySQL 密码"
$env:JWT_SECRET = "请替换为足够随机的本地密钥"
mvn spring-boot:run
```

后端默认监听 `http://localhost:8888/api`。

### 3. 启动前端

另开一个终端，在 `frontend` 目录执行：

```bash
npm ci
npm run serve
```

前端默认访问地址为 `http://localhost:8080`，开发服务器会将 `/api` 请求代理到后端 `http://localhost:8888`。

## 演示账号

应用启动后会自动创建以下账号，初始密码均为 `123456`：

| 角色 | 用户名 |
| --- | --- |
| 超级管理员 | `superadmin` |
| 仓管员 | `keeper` |
| 普通用户 | `admin` |
| 司机 | `driver1` |

导入 `database/sample_data.sql` 后，也可使用其中定义的测试账号。

## 文档

- [项目报告](docs/项目报告.md)
- [API 测试文档](docs/API测试文档.md)
- [基础管理功能规划](docs/基础管理功能规划文档.md)
- [后端基础操作分析](docs/后端基础操作功能分析报告.md)
- [格口管理模型设计](docs/格口管理模型设计文档.md)
- [格口管理功能实现总结](docs/格口管理功能实现总结.md)
- [格口管理使用指南](docs/格口管理功能使用指南.md)

## 许可证

本项目采用 [MIT License](LICENSE)。
