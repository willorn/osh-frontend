# Proposal: course-recommend-detail-link-fix

## 背景

考试页等位置的「精品推荐」课程卡片（`CourseList.vue`）点击后跳转到通用详情页 `/detail/course/{id}`，该页会请求后端 `/pc/course/getById`。后端 course 模块并无 `getById` 接口，请求被 `@GetMapping("/{courseId}")` 捕获，`getById` 作为 Long 类型 `courseId` 解析失败，页面报「请求参数类型不匹配」。

## 目标

- 课程卡片点击跳转到课程专用详情页 `/course_detail/{id}`（调用 `/pc/course/detail/{id}`），与课程列表页行为一致。

## 非目标

- 不改后端接口。
- 不改通用详情页 `/detail/[type]/[id]` 对 book/column/live 等类型的处理。

## 用户影响

- 从精品推荐、搜索、列表等处点击课程卡片可正常进入课程详情，不再报参数类型错误。

## 风险

- 兼容性风险：低。仅修正课程类型的跳转目标，原链路对课程本就报错。
- 回滚风险：revert 本次 commit 即可。

## 验收标准

- [ ] 考试页「精品推荐」点击课程进入 `/course_detail/{id}` 且正常展示。
- [ ] 课程详情接口 `/pc/course/detail/{id}` 返回 200。

## 关联信息

- 组件：`components/CourseList.vue`
- 专用详情页：`pages/course_detail/[id].vue`
