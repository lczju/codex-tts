# GitHub Pages 发布说明

仓库已经包含 GitHub Pages 自动发布工作流：

- 工作流文件：`.github/workflows/deploy-pages.yml`
- 发布目录：`web/`
- 发布方式：推送到默认分支后由 GitHub Actions 自动部署

## 使用方式

1. 把本地改动推送到 GitHub 默认分支
2. 打开仓库的 `Actions`，确认 `Deploy GitHub Pages` 运行成功
3. 打开仓库的 `Settings -> Pages`
4. 如果 GitHub 还没有自动切到 `GitHub Actions`，手动把 Source 设为 `GitHub Actions`
5. 访问站点地址：

```text
https://<你的用户名>.github.io/<你的仓库名>/
```

## 首次启用检查清单

如果页面还没有出来，按这个顺序检查：

1. 仓库默认分支是否是 `main` 或 `master`
2. `.github/workflows/deploy-pages.yml` 是否已经推送到远端
3. `Actions` 里 `Deploy GitHub Pages` 是否是绿色成功状态
4. `Settings -> Pages` 里的 Source 是否显示为 `GitHub Actions`
5. 仓库是否允许 GitHub Actions 运行

如果工作流成功但页面仍未刷新，通常再等 1 到 3 分钟即可。

## 当前站点结构

GitHub Pages 会把 `web/` 当成站点根目录发布，所以线上地址不需要再带 `/web/`。

当前正式入口只有一个：

- 首页：`/`

## 资源路径约定

页面现在使用新的单入口资源结构，请继续保持相对路径写法，例如：

- `./assets/css/app.css`
- `./assets/js/app.js`
- `./data/raw-samples.json`
- `./data/dataset-overview.json`
- `./data/benchmark-results.json`
