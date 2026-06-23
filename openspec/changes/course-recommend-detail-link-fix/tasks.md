# Tasks: course-recommend-detail-link-fix

## 准备

- [x] 复现报错：`/detail/course/{id}` → `/pc/course/getById` 参数类型不匹配。
- [x] 确认课程专用详情页 `/course_detail/[id]` 调用 `/pc/course/detail/{id}`。

## 实现

- [x] `CourseList.vue` 课程类型跳转改为 `/course_detail/{id}`。
- [x] 新增本 OpenSpec change 文档。

## 验证

- [ ] 考试页「精品推荐」点击课程进入 `/course_detail/{id}` 正常展示。
- [ ] 课程搜索/列表卡片点击正常进入详情。

## PR

- [x] PR 描述关联 `openspec/changes/course-recommend-detail-link-fix`。
- [ ] 填写验证结果。
