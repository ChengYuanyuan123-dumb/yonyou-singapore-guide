# Yonyou Singapore 新人指南

解压后双击 `index.html` 即可预览。网站为静态 HTML、CSS 和 JavaScript，无需安装依赖或构建。在线字体和外部地图需要网络，主要内容和教程截图随源码提供。

公开网站：https://chengyuanyuan123-dumb.github.io/yonyou-singapore-guide/

## 编辑内容

- `data/en.js` 管理英文界面和教程翻译。新增或更改中文文案时，在该文件同步维护对应英文。门店路线由 `app.js` 按楼层、已核实区域和铺位组合生成。

- `data/dining.js` 管理美食地图。每家门店只占一个主分类。更新 `name`、`unit`、`floor`、`zone` 后，同步核对 `source`、可选的 `zoneSource` 和 `checked`。区域缺少可核实来源时把 `zone` 留空。支持 `East Wing`、`North Wing`、`West Wing` 和 `Fountain Court`。
- `data/office.js` 管理 Wi‑Fi 名称、友空间步骤、请假说明、打印机参数与教程截图。截图位于 `assets/tutorial/`。公开指南的 Wi‑Fi 密码由办公室通过内部渠道发放。
- `index.html` 管理报到地址、时间、首日清单、账号开通提示和导航。样式在 `styles.css`，交互在 `app.js`。
- 2026-11-19 核对门店 60 家。咖啡、中餐、西餐、日本菜、简餐、甜品各 10 家。48 家附已核实分区，12 家按楼层和铺位查找。楼层示意用于定位区域，进入商场后可看现场导视或打开室内楼层图。

## 更新发布

把本目录内容上传至静态托管服务，站点根目录应直接包含 `index.html`。例如在 Cloudflare Pages 中选择 Direct Upload，上传解压后的站点目录。更新当前 Sites 部署时，把文件同步到该项目的静态 `dist/` 目录，再保存和发布新版本。

照片 [Suntec city tower, Singapore.jpg](https://commons.wikimedia.org/wiki/File:Suntec_city_tower,_Singapore.jpg) 由 ProjectManhattan 拍摄，按 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) 使用。文件为 Wikimedia 缩略图，网站以 CSS 裁切显示并叠加渐变与标记。
