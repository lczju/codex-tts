# guizang-ppt-skill 部署说明

## 位置

该 skill 已安装到项目目录：

- `D:\codex\project0\.codex\skills\guizang-ppt-skill`

这样做的目的：

- 跟随项目一起管理，而不是只装在全局 `~/.codex/skills`
- 便于后续直接提交、备份或在其他机器上复用

## 来源

- GitHub: `op7418/guizang-ppt-skill`
- 安装方式：使用 Codex `skill-installer` 的 `install-skill-from-github.py`

## 启用方式

安装完成后，通常需要重启 Codex，才能让新 skill 被重新发现。

如果后续要更新这个 skill，可以再次执行安装脚本覆盖到同一路径，或先删除项目内旧目录后重新安装。
