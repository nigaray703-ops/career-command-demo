# Cloudflare Pages + Access 部署说明

目标链路：

`Private GitHub Repository -> Cloudflare Pages -> Cloudflare Access`

## 1. GitHub 私有仓库

1. 在 GitHub 创建一个 private repository，例如 `career-command-demo`。
2. 不要勾选自动创建 README、license 或 gitignore，因为本地仓库里已经有这些文件。
3. 把本地演示仓库推送到这个 private repository。

本地演示仓库路径：

```text
<你的本地项目路径>/demo-github
```

## 2. Cloudflare Pages

在 Cloudflare Dashboard 中：

1. 进入 `Workers & Pages`。
2. 选择 `Create application`。
3. 选择 `Pages`。
4. 选择 `Connect to Git`。
5. 授权并选择刚创建的 GitHub private repository。
6. 构建设置：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `/`
   - Root directory: `/`
7. 保存并部署。

## 3. 绑定自有子域名

建议先在 Cloudflare Pages 里绑定一个属于你 Cloudflare 账号的子域名，例如：

```text
jobs-demo.example.com
```

原因：Cloudflare Access 的标准 self-hosted application 需要用你 Cloudflare 账号里 active zone 下的域名/子域名来做访问控制。

## 4. Cloudflare Access

在 Cloudflare Zero Trust 中：

1. 进入 `Access` -> `Applications`。
2. 选择 `Add an application`。
3. 选择 `Self-hosted and private`。
4. 选择 `Add public hostname`。
5. Application domain 填刚绑定到 Pages 的自有子域名，例如：

```text
jobs-demo.example.com
```

6. Policy 建议：
   - Action: `Allow`
   - Include: 你的邮箱
7. 保存后，访问这个子域名时会先进入 Cloudflare Access 登录。

## 注意

- 这个仓库只适合放演示版假数据。
- 不要把真实求职记录、个人邮箱、简历、Supabase URL、Supabase key 或候选人中心真实链接提交到 GitHub。
- 如果以后要发布真实版本，也建议继续使用 private GitHub repository，并且用 Cloudflare Access 限制访问。
