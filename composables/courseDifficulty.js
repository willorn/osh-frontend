/** 课程难度：与 osh_course.difficulty 对齐（level 为适用人群等级，勿混用） */
export const COURSE_DIFFICULTY_OPTIONS = Object.freeze([
  { label: '新手入门', value: 1, icon: '🌱', tone: 'beginner' },
  { label: '基础巩固', value: 2, icon: '📘', tone: 'intermediate' },
  { label: '能力提升', value: 3, icon: '🚀', tone: 'advanced' },
])

const DIFFICULTY_MAP = new Map(
  COURSE_DIFFICULTY_OPTIONS.map((item) => [item.value, item]),
)

export function normalizeCourseDifficulty(level) {
  const n = Number(level)
  if (!Number.isFinite(n) || n < 1 || n > 3) return null
  return n
}

export function courseDifficultyMeta(level) {
  const normalized = normalizeCourseDifficulty(level)
  if (!normalized) return null
  return DIFFICULTY_MAP.get(normalized) || null
}

export function courseDifficultyLabel(level) {
  return courseDifficultyMeta(level)?.label || ''
}
