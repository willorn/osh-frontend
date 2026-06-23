# Design: course-recommend-detail-link-fix

## 问题定位

- `CourseList.vue` 的 `open()` 对 `course/media/audio/video` 类型跳转 `/detail/course/{id}`。
- `/detail/[type]/[id].vue` 通过 `usegetByIdDetailApi(type)` 请求 `/${type}/getById`，即 `/pc/course/getById`。
- 后端 `OshCourseController` 仅有 `/pc/course/detail/{id}`，无 `getById`；`/pc/course/getById` 被 `CourseManageController` 的 `@GetMapping("/{courseId}")` 匹配，`getById` 无法转 Long → 报错。

## 方案

将 `CourseList.vue` 中课程类型的跳转目标改为 `/course_detail/{id}`，与 `pages/course/[page].vue` 课程列表卡片一致。课程专用详情页通过 `useCourseDetailApi` 调 `/pc/course/detail/{id}`，数据结构与课程模块匹配。

## 备选方案

- 修改 `usegetByIdDetailApi` 为课程走 `/course/detail/{id}`：通用详情页数据结构与课程模块返回不兼容，无法直接渲染，未采用。

## 影响面

- 仅 `CourseList.vue` 课程类型跳转路径，column/live 等不变。
