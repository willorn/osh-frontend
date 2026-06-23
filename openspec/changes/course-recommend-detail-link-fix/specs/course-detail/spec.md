# Spec: Course Card Navigation

## ADDED Requirements

### Requirement: 课程卡片跳转课程专用详情页

系统 SHALL 在用户点击课程卡片（`CourseList`）时，跳转到课程专用详情页 `/course_detail/{id}`，而非通用详情页 `/detail/course/{id}`。

#### Scenario: 点击精品推荐课程

- GIVEN 用户在考试页「精品推荐」看到课程卡片
- WHEN 用户点击该课程卡片
- THEN 路由跳转到 `/course_detail/{id}`
- AND 页面通过 `/pc/course/detail/{id}` 加载课程详情并正常展示
- AND 不出现「请求参数类型不匹配」错误
