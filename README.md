Career Command Center

A privacy-safe bilingual job application tracker demo for managing applications, stages, candidate portals, follow-ups and overall job-search progress.

Repository type: Public portfolio demo
Languages: English and Simplified Chinese
Data: Fictional sample data only
Authentication: Simulated Google sign-in
Cloud connection: Disabled in this public repository

Career Command Center is a personal job application management system designed to centralise application records, reduce missed follow-ups and provide a clearer overview of job-search activity.

This repository contains the public demonstration version of the project. It preserves the interface structure, visual design and core interactions of the private production version while replacing real authentication, cloud services and personal application records with fictional local data.

No real job application records, candidate portal links, personal documents, private email addresses or Supabase credentials are included in this repository.

Overview

Job applications are often distributed across LinkedIn, SEEK, company career websites, recruiter emails and separate candidate portals. This makes it difficult to remember:
* which roles have already been applied for;
* which candidate portal belongs to each application;
* when an application was submitted;
* whether a follow-up is required;
* how many applications have progressed, remained unanswered or been rejected;
* which platforms and role types generate better outcomes.

Career Command Center provides a central workspace for recording, reviewing and organising this information.

The application combines a dashboard, searchable application records, bilingual interface controls, local JSON backups and privacy-safe demonstration data.

Project Goals

The project was designed to:
* centralise job application records in one interface;
* track application stages and outcomes;
* preserve candidate portal links and application notes;
* reduce duplicate applications and missed follow-ups;
* provide dashboard-level job-search statistics;
* support both English and Chinese interfaces;
* separate private production data from the public portfolio version;
* allow local data backup and restoration;
* remain simple enough for regular personal use.

Public Demo and Private Version

This repository is a public demonstration environment.

The public demo and private production version share the same general interface structure and reusable application logic, but they use different authentication and data services.

Public demo

The public demo:
* uses fictional application records;
* uses simulated Google sign-in;
* stores demonstration data locally;
* does not connect to Supabase;
* does not contain real candidate portal links;
* does not contain private resumes or documents;
* can be safely reviewed as a portfolio project.

Private production version

The private version is maintained separately and may include:
* real application records;
* private candidate portal links;
* personal job-search notes;
* authenticated user access;
* cloud synchronisation;
* personal backup data.

The private production database and authentication configuration are not included in this repository.

Key Features

Bilingual Interface

The application supports:
* English;
* Simplified Chinese;
* interface language switching;
* bilingual labels across the login screen, dashboard and application list.

Dashboard

The dashboard provides an overview of job-search activity, including:
* total application records;
* current application stages;
* rejection and progress indicators;
* application distribution;
* recent activity;
* high-level job-search conversion information.

Application Management

Users can:
* create new application records;
* edit existing records;
* delete demonstration records;
* record company and position names;
* record location and work arrangement;
* record employment type;
* record application platform;
* store candidate portal links;
* record application dates;
* update application status;
* add rejection reasons;
* add additional notes.

Search and Filtering

The application supports:
* keyword search;
* company and position search;
* status filtering;
* employment-type filtering;
* platform filtering;
* sorting;
* grouping application records.

Local Data Management
* download demonstration records as JSON;
* upload compatible JSON backup files;
* restore local demonstration data;
* reset or modify fictional records without affecting any private database.

Simulated Authentication

The login interface preserves the structure of the production login experience.

Selecting the Google sign-in button:
* does not contact Google;
* does not use OAuth;
* does not connect to Supabase;
* opens a simulated demonstration account.

Interface Preview

Login

The login screen introduces the bilingual job application tracker and provides simulated access to the public demonstration account.

Dashboard

The dashboard summarises application volume, stages, outcomes and recent activity.

Applications

The application list supports searching, filtering, sorting, grouping and editing fictional application records.

Project Structure

career-command-demo/
├── assets/
│   └── Shared logos, icons and interface assets
├── docs/
│   └── images/
│       └── README screenshots and bilingual interface previews
├── src/
│   ├── jobTrackerApp.js
│   ├── jobTrackerCloud.js
│   ├── jobTrackerLogic.js
│   └── jobTrackerStyles.css
├── .gitignore
├── index.html
└── README.md

Main Files

index.html

The public demo entry point.

It contains the login cover and the main application page structure.

src/jobTrackerApp.js

Controls the main application interface and interaction flow, including:
* rendering;
* form interactions;
* dashboard updates;
* language switching;
* application list behaviour;
* modal controls;
* user actions.

src/jobTrackerCloud.js

Provides the public demo data layer.

In this repository, it:
* simulates authentication;
* loads fictional local data;
* avoids Supabase connections;
* replaces private cloud functionality;
* keeps the demonstration environment isolated from production data.

src/jobTrackerLogic.js

Contains reusable application logic, including:

* application statistics;
* filtering;
* sorting;
* grouping;
* record creation;
* record updates;
* data transformations.

src/jobTrackerStyles.css

Contains the shared interface styling, including:

* responsive layouts;
* dashboard styling;
* login screen styling;
* application cards and tables;
* forms and modal windows;
* bilingual interface states.

assets/

Contains shared visual assets, including:

* logos;
* icons;
* interface graphics.

docs/images/

Contains screenshots used in this README.

Architecture

The project separates reusable application logic from environment-specific data services.

User Interface
      ▼
jobTrackerApp.js
      ├── jobTrackerLogic.js
      │     ├── statistics
      │     ├── filtering
      │     ├── sorting
      │     └── record management
      └── jobTrackerCloud.js
            ├── simulated login
            ├── fictional local data
            └── JSON import/export

This separation allows the public demo to remain visually and functionally aligned with the private production version without exposing:
* personal job-search information;
* private authentication settings;
* database credentials;
* cloud configuration;
* sensitive candidate portal links.

Technology

The current public demo uses:
* HTML5;
* CSS3;
* JavaScript;
* local browser data;
* JSON import and export;
* responsive web design;
* bilingual interface logic;
* modular application scripts.

The public repository does not require:
* Supabase;
* Google OAuth;
* a backend server;
* a database account;
* private environment variables.

Running the Demo

Option 1: Open Directly

Download or clone the repository and open:

index.html

in a modern browser.

Option 2: Use a Local Development Server

Running a local server is recommended if the browser restricts local file behaviour.

For example, with Python: python3 -m http.server 8000

Then open: http://localhost:8000

Option 3: Clone with Git

git clone https://github.com/nigaray703-ops/career-command-demo.git
cd career-command-demo
python3 -m http.server 8000

Then open: http://localhost:8000

Demo Usage
1. Open the application.
2. Select English or Chinese.
3. Click the Google sign-in button.
4. Enter the simulated demonstration account.
5. Review dashboard statistics.
6. Search or filter application records.
7. Add, edit or delete fictional records.
8. Download the data as a JSON backup.
9. Upload a compatible demo JSON file to restore records.

The Google sign-in button is part of the demonstration interface only. It does not perform real Google authentication.

JSON Backup

The public demo supports local JSON backup and restoration.

This allows users to:
* download a copy of demonstration records;
* modify the demo without affecting the original repository;
* restore compatible sample data;
* test import and export behaviour.

Uploaded JSON files should follow the structure expected by the application.

Do not upload private job-search backups when using the public demo on a shared or public device.

Privacy and Security

This repository is designed as a privacy-safe portfolio demonstration.

It does not intentionally include:
* real job application records;
* real candidate portal URLs;
* personal email account data;
* resumes or cover letters;
* recruiter communications;
* Supabase project credentials;
* Google OAuth credentials;
* production environment variables;
* private API keys;
* production database exports.

Important

Do not commit any of the following to this repository:

.env
.env.local
Supabase service keys
Google OAuth secrets
real application backups
personal resumes
candidate portal credentials
private email addresses
production database exports

Before publishing changes, review:
* Git status;
* committed files;
* .gitignore;
* browser storage;
* screenshot content;
* JSON sample data;
* repository history.

Removing a sensitive file from the latest commit may not remove it from Git history. Credentials exposed in Git history should be revoked and replaced.

Data Disclaimer

All companies, job titles, dates, application statuses, portal links and notes shown in the public demo should be treated as fictional demonstration content.

Any resemblance to real applications or organisations is incidental unless explicitly stated otherwise.

The project is not affiliated with:

* Google;
* LinkedIn;
* SEEK;
* Supabase;
* any employer represented in fictional demo data.

Current Status

Public demo status: Functional and available for portfolio review.

The current version includes:
* bilingual login and application interfaces;
* simulated authentication;
* dashboard statistics;
* searchable application records;
* filtering, sorting and grouping;
* record creation and editing;
* record deletion;
* JSON import and export;
* responsive interface styling;
* fictional demonstration data.

The private production version continues to be maintained separately.

Planned Improvements

Potential future improvements include:
* stronger JSON import validation;
* clearer import error reporting;
* more detailed interview-stage tracking;
* follow-up reminders;
* improved mobile application cards;
* expanded conversion metrics;
* improved keyboard navigation;
* accessibility review;
* additional data visualisations;
* automated tests for core application logic;
* clearer separation between demonstration and production configuration.

These items are planned directions and may not yet be implemented.

Design Considerations

The project was developed around several product and workflow considerations.

Privacy by Design

The public version was created as a separate demonstration environment instead of publishing the real personal tracker.

Environment Separation

Authentication and cloud functionality are separated from reusable interface and business logic.

Daily Usability

The interface prioritises fast record updates, filtering and status review over unnecessary complexity.

Portability

JSON backup allows records to be moved or restored without requiring a permanent backend connection.

Bilingual Access

The interface supports both English and Chinese to improve usability across different working contexts.

Skills Demonstrated

This project demonstrates experience with:

* business process analysis;
* workflow design;
* requirements translation;
* interface prototyping;
* bilingual product design;
* JavaScript application logic;
* responsive web design;
* local data management;
* JSON import and export;
* data privacy planning;
* public and private environment separation;
* iterative interface improvement;
* Git and GitHub version control.

Repository Use

This repository is intended for:
* portfolio review;
* interface demonstration;
* learning and experimentation;
* code review;
* local testing.

It is not intended to store real personal job-search data.

Licence

No licence has currently been specified unless a LICENSE file is added to the repository.

Without an explicit licence, the source code remains protected by default copyright rules and should not be assumed to be available for unrestricted reuse, redistribution or commercial use.

中文说明

项目介绍

Career Command Center 是一个中英文求职申请追踪器，用于集中管理：

已投递职位；
* 已投递职位；
* 公司和岗位信息；
* 申请日期；
* 申请平台；
* 候选人中心链接；
* 当前申请状态；
* 被拒原因；
* 面试进度；
* 补充备注；
* 求职统计数据。

这个仓库是公开的 GitHub 演示版。

演示版保留了私人正式版的主要界面结构、视觉样式和核心交互，但只使用虚构示例数据。

本仓库不包含：
* 真实求职记录；
* 真实候选人中心链接；
* 个人简历；
* 招聘邮件；
* Supabase 登录配置；
* Google OAuth 配置；
* 私人数据库；
* 真实云端备份。

演示版功能

演示版目前支持：
* 中英文语言切换；
* 模拟 Google 登录；
* 查看首页仪表盘；
* 查看申请统计；
* 搜索公司或岗位；
* 按状态筛选申请；
* 排序和分组申请记录；
* 添加演示申请；
* 编辑演示申请；
* 删除演示申请；
* 下载 JSON 备份；
* 上传兼容的演示 JSON 数据；
* 响应式桌面和移动端界面。

点击“使用 Google 登录”后，只会进入演示账号，不会连接真实 Google 账号或 Supabase。

文件说明
* index.html：演示版入口，包含登录封面和主页面结构；
* src/jobTrackerApp.js：负责界面渲染和主要交互；
* src/jobTrackerCloud.js：负责模拟登录和本地虚构数据，不连接 Supabase；
* src/jobTrackerLogic.js：负责统计、筛选、排序、分组和记录管理；
* src/jobTrackerStyles.css：负责页面视觉样式和响应式布局；
* assets/：保存通用 Logo、图标和视觉资源；
* docs/images/：保存 README 使用的中英文界面截图。

使用方式

可以直接下载仓库并打开： index.html

也可以启动本地服务器： python3 -m http.server 8000

然后在浏览器中访问： http://localhost:8000

隐私说明

请不要向这个公开仓库提交：
* 真实求职数据；
* 真实候选人中心链接；
* 个人邮箱；
* 简历或求职信；
* 招聘人员联系方式；
* Supabase 密钥；
* Google OAuth 密钥；
* .env 文件；
* 私人 JSON 备份；
* 数据库导出文件。

公开演示版应始终只使用虚构示例数据。

项目状态

当前公开演示版已经可以用于 GitHub 作品集展示。

私人正式版与公开演示版分开维护，真实数据不会进入此公开仓库。
