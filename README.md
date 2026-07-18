# Career Command Center Demo

这是求职申请追踪器的 GitHub 演示版。界面结构、视觉样式和主要交互保持与最终成品一致，但仓库只包含虚构示例数据，不包含真实求职记录、真实候选人中心链接或 Supabase 登录配置。

## 内容

- `index.html`：演示版入口，保留最终版登录封面和主界面结构
- `src/jobTrackerApp.js`：最终版应用交互逻辑
- `src/jobTrackerCloud.js`：演示用假登录与本地假数据，不连接 Supabase
- `src/jobTrackerLogic.js`：统计、筛选、排序、创建记录等通用逻辑
- `src/jobTrackerStyles.css`：最终版页面样式
- `assets/`：通用 logo 与图标资源
- `docs/images/`：GitHub README 展示用中英文界面对比图

## 界面预览

### 登录封面 / Login

![Career Command Center bilingual login preview](docs/images/career-command-demo-login-zh-en.png)

### 首页仪表盘 / Dashboard

![Career Command Center bilingual dashboard preview](docs/images/career-command-demo-dashboard-zh-en.png)

### 申请列表 / Applications

![Career Command Center bilingual applications preview](docs/images/career-command-demo-applications-zh-en.png)

## 使用方式

直接用浏览器打开 `index.html` 即可查看演示版。点击“使用 Google 登录”会进入演示账号，不会连接真实 Google 或 Supabase。

演示版支持：

- 中英文语言切换
- 查看仪表盘统计
- 搜索、筛选、排序、分组申请列表
- 添加、编辑、删除演示申请
- 下载/上传演示数据 JSON

## 隐私说明

本演示版只使用假数据。请不要把真实求职记录、真实候选人中心链接、个人邮箱、简历或云端配置提交到这个仓库。
