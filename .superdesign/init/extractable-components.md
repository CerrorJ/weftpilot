# 可提取组件

- 应用侧栏：index.html；布局；当前页面和任务数量为状态，其余文字、图标和品牌图为固定视觉。
- 顶部栏：index.html；布局；当前页面标题为状态。
- 页面标题：src/app.js 的 heading；基础组件；标题、副标题、操作区和眉题。
- 弹窗：src/app.js 的 modal；基础组件；标题、内容、页脚和步骤。
- 任务抽屉：src/app.js 的 renderDrawer；布局；当前任务、Run 和审批状态。
- 状态徽章：src/app.js 的 badge；基础组件；状态值，文字与图标成对显示。
- 进度条：src/app.js 的 prog；基础组件；明确的步骤完成数量。
- 品牌标志：assets/brand/mark.svg；固定素材，禁止以其他图形替代。
