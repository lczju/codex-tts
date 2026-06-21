# GitHub Pages 发布说明

仓库已经加入 GitHub Pages 自动发布工作流：

- 工作流文件：`.github/workflows/deploy-pages.yml`
- 发布目录：`web/`
- 发布方式：推送到默认分支后由 GitHub Actions 自动部署

推荐使用方式：

1. 把本地改动 push 到 GitHub 默认分支
2. 打开仓库的 `Actions`，确认 `Deploy GitHub Pages` 运行成功
3. 打开仓库的 `Settings -> Pages`
4. 如果 GitHub 还没有自动切到 Actions 发布，手动把 Source 设为 `GitHub Actions`
5. 访问站点地址：

```text
https://<你的用户名>.github.io/<你的仓库名>/
```

当前这套前端会把 `web/` 当成站点根目录发布，所以线上地址不需要再带 `/web/`：

- 首页：`/`
- 数据集页：`/dataset.html`

如果后续修改页面资源，请继续保持相对路径写法，例如：

- `./styles.css`
- `./app.js`
- `./data/raw-samples.json`
