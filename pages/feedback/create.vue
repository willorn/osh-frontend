<template>
  <div class="page-wrapper">
    <div class="breadcrumb-box">
      <n-breadcrumb>
        <n-breadcrumb-item>
          <nuxt-link to="/">首页</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          <nuxt-link to="/feedback/list">反馈列表</nuxt-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>提交反馈</n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="form-container">
      <h1 class="page-title">✍️ 提交反馈</h1>
      <p class="page-desc">请尽量完整描述问题，我们会持续跟进处理。</p>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <!-- 分类选择 -->
        <n-form-item label="反馈类型" path="categoryId">
          <div class="feedback-type-field">
            <n-select
              v-model:value="form.categoryId"
              class="feedback-select"
              :options="categorySelectOptions"
              placeholder="请选择反馈类型"
              clearable
              @update:value="handleCategorySelect"
            />
            <div v-if="currentCategoryDescription" class="type-helper-desc">{{ currentCategoryDescription }}</div>
          </div>
        </n-form-item>

        <!-- 标题 -->
        <n-form-item label="标题" path="title">
          <n-input
            v-model:value="form.title"
            placeholder="请输入标题（最多128字符）"
            maxlength="128"
            show-count
          />
        </n-form-item>

        <!-- 内容 -->
        <n-form-item label="问题描述" path="content">
          <n-input
            v-model:value="form.content"
            type="textarea"
            :rows="8"
            placeholder="请详细描述你遇到的问题或诉求（最多1000字符）"
            maxlength="1000"
            show-count
          />
        </n-form-item>

        <!-- 图片上传 -->
        <n-form-item label="上传图片">
          <div class="image-upload-container">
            <div v-if="feedbackImages.length > 0" class="images-preview">
              <div v-for="(img, index) in feedbackImages" :key="index" class="image-preview-item">
                <img :src="img.preview" alt="预览图" />
                <div class="image-actions">
                  <n-button size="tiny" type="error" @click="removeFeedbackImage(index)">
                    删除
                  </n-button>
                </div>
              </div>
            </div>
            <n-upload
              v-if="feedbackImages.length < 9"
              :custom-request="handleFeedbackImageUpload"
              :show-file-list="false"
              :multiple="false"
              accept="image/*"
              class="upload-dragger-wrapper"
              @before-upload="beforeUploadCheck"
            >
              <n-upload-dragger>
                <div class="upload-dragger-content">
                  <n-icon size="24" :depth="3">
                    <Camera />
                  </n-icon>
                  <div class="upload-text">点击选择图片</div>
                  <div class="upload-hint">或将照片拖到这里，单次最多可选9张</div>
                </div>
              </n-upload-dragger>
            </n-upload>
            <div class="upload-tip">支持 JPG、PNG 等格式，单张不超过 3MB</div>
          </div>
        </n-form-item>

        <n-form-item label="反馈标签" path="tagIds">
          <n-select
            v-model:value="selectedTagKeys"
            multiple
            clearable
            filterable
            tag
            max-tag-count="responsive"
            :options="tagOptions"
            :on-create="handleCreateTagOption"
            placeholder="选择已有标签，或输入新标签后回车（最多 3 个）"
            @update:value="handleTagSelect"
          />
        </n-form-item>

        <!-- 提交按钮 -->
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleSubmit" :loading="submitting || resolvingTags">
              提交反馈
            </n-button>
            <n-button @click="handleSaveDraft">
              保存草稿
            </n-button>
            <n-button @click="handleReset">
              重置
            </n-button>
            <n-button @click="$router.back()">
              返回
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NForm, NFormItem, NInput, NButton, NSpace, NBreadcrumb, NBreadcrumbItem, NSelect, NUpload, NUploadDragger, NIcon } from 'naive-ui'
import { Camera } from '@vicons/ionicons5'
import {
  apiGetFeedbackCategories,
  apiGetFeedbackTags,
  apiCreateFeedbackTag,
  apiCreateFeedback,
  assertAssistantResponseSuccess,
  resolveFeedbackCategoryIcon,
  resolveFeedbackErrorMessage
} from '~/composables/assistant'
import { sortFeedbackTags } from '~/composables/feedbackTag'
import { useHasAuth, useUser } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const user = useUser()
const MAX_FEEDBACK_TAG_COUNT = 3

const categories = ref([])
const tags = ref([])
const formRef = ref(null)
const submitting = ref(false)
const resolvingTags = ref(false)
const selectedTagKeys = ref([])
const feedbackImages = ref([])
const uploadingFiles = ref(new Set()) // 用于跟踪正在处理的文件
const processedFiles = ref(new Set()) // 用于跟踪已处理过的文件（永久记录）
const form = ref({
  categoryId: null,
  title: '',
  content: '',
  pagePath: '',
  tagIds: [],
  images: []
})

const categorySelectOptions = computed(() => categories.value.map(category => ({
  label: `${resolveFeedbackCategoryIcon(category)} ${category.name}`,
  value: category.id,
})))

const tagOptions = computed(() => tags.value.map(tag => ({
  label: tag.name,
  value: buildExistingTagKey(tag.id),
})))

const currentCategoryDescription = computed(() => categories.value
  .find(category => category.id === form.value.categoryId)?.description || '')

const draftStorageKey = computed(() => {
  const currentUserId = user.value?.id || user.value?.userId || user.value?.uid
  if (currentUserId) {
    return `feedback_draft_${currentUserId}`
  }

  const tokenValue = useCookie('token').value
  if (tokenValue) {
    return `feedback_draft_token_${tokenValue.slice(-12)}`
  }

  return 'feedback_draft_guest'
})

const rules = {
  categoryId: { 
    required: true, 
    message: '请选择反馈类型', 
    trigger: 'change',
    validator: (rule, value) => {
      if (value === null || value === undefined || value === '') {
        return new Error('请选择反馈类型')
      }
      return true
    }
  },
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 128, message: '标题不能超过128字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { max: 1000, message: '内容不能超过1000字符', trigger: 'blur' }
  ]
}

onMounted(async () => {
  useHasAuth()
  await loadCategories()
  await loadTags()
  loadDraft()
  
  // 自动填充页面路径
  if (process.client) {
    form.value.pagePath = resolveFeedbackSourcePath()
  }
})

async function loadCategories() {
  try {
    const res = await apiGetFeedbackCategories()
    categories.value = res.data || []
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载分类失败'))
    console.error('加载分类失败:', error)
  }
}

async function loadTags() {
  try {
    const res = await apiGetFeedbackTags()
    tags.value = sortFeedbackTags(res.data || [])
  } catch (error) {
    message.error(resolveFeedbackErrorMessage(error, '加载标签失败'))
    console.error('加载标签失败:', error)
  }
}

function loadDraft() {
  if (process.client) {
    const draft = localStorage.getItem(draftStorageKey.value)
    if (draft) {
      try {
        const draftData = JSON.parse(draft)
        form.value = { ...form.value, ...draftData }
        const draftTagIds = Array.isArray(form.value.tagIds) ? form.value.tagIds : []
        selectedTagKeys.value = normalizeSelectedTags(draftTagIds.map(buildExistingTagKey), false)
        syncFormTagIdsFromSelectedKeys()
        message.info('已加载草稿')
      } catch (error) {
        console.error('加载草稿失败:', error)
      }
    }
  }
}

function handleSaveDraft() {
  if (process.client) {
    localStorage.setItem(draftStorageKey.value, JSON.stringify(form.value))
    message.success('草稿已保存')
  }
}

// 上传前检查（在 custom-request 之前执行）
function beforeUploadCheck({ file }) {
  // 生成文件唯一标识
  const fileKey = `${file.name}_${file.size}_${file.lastModified}`

  // 如果已经处理过，直接拒绝
  if (processedFiles.value.has(fileKey)) {
    console.log('[重复检测] 文件已处理过，拒绝:', fileKey)
    return false
  }

  // 如果正在处理，拒绝
  if (uploadingFiles.value.has(fileKey)) {
    console.log('[重复检测] 文件正在处理中，拒绝:', fileKey)
    return false
  }

  // 检查数量
  if (feedbackImages.value.length >= 9) {
    message.warning('最多只能上传9张图片')
    return false
  }

  // 检查大小
  if (file.size > 3 * 1024 * 1024) {
    message.error('图片大小不能超过3MB')
    return false
  }

  // 检查类型
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件')
    return false
  }

  // 检查重复（文件名 + 大小 + 修改时间）
  const isDuplicate = feedbackImages.value.some(img =>
    img.file.name === file.name &&
    img.file.size === file.size &&
    img.file.lastModified === file.lastModified
  )

  if (isDuplicate) {
    console.log('[重复检测] 图片已在列表中，拒绝:', fileKey)
    message.warning('该图片已添加，请勿重复上传')
    return false
  }

  console.log('[上传检查] 通过，允许处理:', fileKey)
  return true
}

// 处理反馈图片选择（不立即上传）
async function handleFeedbackImageUpload({ file }) {
  // 生成文件唯一标识
  const fileKey = `${file.file.name}_${file.file.size}_${file.file.lastModified}`

  console.log('[开始处理] 文件:', fileKey)

  // 三重检查：已处理过的文件
  if (processedFiles.value.has(fileKey)) {
    console.log('[终止] 文件已处理过:', fileKey)
    return
  }

  // 三重检查：正在处理的文件
  if (uploadingFiles.value.has(fileKey)) {
    console.log('[终止] 文件正在处理中:', fileKey)
    return
  }

  // 三重检查：已在预览列表中的文件
  const isDuplicate = feedbackImages.value.some(img =>
    img.file.name === file.file.name &&
    img.file.size === file.file.size &&
    img.file.lastModified === file.file.lastModified
  )
  if (isDuplicate) {
    console.log('[终止] 文件已在预览列表:', fileKey)
    return
  }

  // 立即标记为正在处理（在任何异步操作前）
  uploadingFiles.value.add(fileKey)
  processedFiles.value.add(fileKey)
  console.log('[已标记] 正在处理:', fileKey)

  try {
    // 生成预览图（使用FileReader转base64）
    const preview = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('[读取成功] 文件:', fileKey)
        resolve(e.target.result)
      }
      reader.onerror = () => {
        console.log('[读取失败] 文件:', fileKey)
        reject(new Error('图片读取失败'))
      }
      reader.readAsDataURL(file.file)
    })

    // 最后一次检查（防止在异步期间被其他调用添加）
    const finalCheck = feedbackImages.value.some(img =>
      img.file.name === file.file.name &&
      img.file.size === file.file.size &&
      img.file.lastModified === file.file.lastModified
    )

    if (finalCheck) {
      console.log('[终止] 异步期间已被添加:', fileKey)
      return
    }

    feedbackImages.value.push({
      file: file.file,
      preview: preview
    })
    console.log('[成功添加] 图片到列表:', fileKey, '当前数量:', feedbackImages.value.length)
    message.success('图片已添加')
  } catch (error) {
    console.error('[处理失败]', fileKey, error)
    message.error('图片读取失败')
    // 失败时从已处理列表移除，允许重试
    processedFiles.value.delete(fileKey)
  } finally {
    // 移除处理中标记
    uploadingFiles.value.delete(fileKey)
    console.log('[处理完成] 移除处理标记:', fileKey)
  }
}

// 移除反馈图片
function removeFeedbackImage(index) {
  const removed = feedbackImages.value[index]
  if (removed && removed.file) {
    // 从已处理列表中移除，允许重新添加
    const fileKey = `${removed.file.name}_${removed.file.size}_${removed.file.lastModified}`
    processedFiles.value.delete(fileKey)
    console.log('[删除图片] 已从处理记录移除:', fileKey)
  }
  feedbackImages.value.splice(index, 1)
}

// 获取Token（参考 assistant.js 的 assistantHeaders 逻辑）
function getToken() {
  if (!process.client) {
    return ''
  }

  try {
    // 优先从 cookie 获取
    const cookieToken = useCookie('token')
    let tokenValue = cookieToken.value

    // 如果 cookie 中没有，从 localStorage 获取
    if (!tokenValue) {
      tokenValue = localStorage.getItem('token') || localStorage.getItem('Token')
    }

    return tokenValue || ''
  } catch (e) {
    console.error('获取 token 失败:', e)
    return ''
  }
}

// 批量上传图片
async function uploadFeedbackImages(imageItems) {
  if (!imageItems.length) {
    return []
  }

  message.loading('正在上传图片...', { key: 'uploadImages' })
  try {
    return await Promise.all(imageItems.map(uploadSingleFeedbackImage))
  } finally {
    message.destroyAll()
  }
}

// 上传单张图片
async function uploadSingleFeedbackImage(imageItem, index) {
  const formData = new FormData()
  formData.append('file', imageItem.file)
  formData.append('type', 'image')

  const token = getToken()

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? {
          'Authorization': `Bearer ${token}`,
          'token': token
        } : {})
      }
    })

    const result = await response.json()
    if (result.code !== 200) {
      throw new Error(result.msg || '图片上传失败')
    }
    if (!result.data?.url) {
      throw new Error('上传接口未返回图片地址')
    }
    return result.data.url
  } catch (error) {
    message.error(`第 ${index + 1} 张图片上传失败: ${error.message}`)
    throw error
  }
}

async function handleSubmit() {
  try {
    const token = useCookie('token')
    if (!token.value) {
      return useHasAuth()
    }

    await formRef.value?.validate()
    await resolvePendingTagNamesFromForm()
    submitting.value = true
    syncFormTagIdsFromSelectedKeys()

    // 上传图片
    const uploadedImageUrls = await uploadFeedbackImages(feedbackImages.value)

    const createdFeedback = assertAssistantResponseSuccess(
      await apiCreateFeedback({
        categoryId: form.value.categoryId,
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        pagePath: form.value.pagePath,
        tagIds: form.value.tagIds,
        images: uploadedImageUrls
      }),
      '提交反馈失败'
    )

    // 清除草稿
    if (process.client) {
      localStorage.removeItem(draftStorageKey.value)
    }

    message.success('提交成功')

    if (createdFeedback?.id) {
      await router.push(`/feedback/detail/${createdFeedback.id}?created=1`)
      return
    }
    await router.push('/feedback/list?mode=mine')
  } catch (error) {
    if (Array.isArray(error)) {
      return
    }
    console.error('提交反馈失败:', error)
    message.error(resolveFeedbackErrorMessage(error, '提交失败'))
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value?.restoreValidation()
  selectedTagKeys.value = []
  feedbackImages.value = []
  uploadingFiles.value.clear() // 清空处理中标记
  processedFiles.value.clear() // 清空已处理记录
  form.value = {
    categoryId: null,
    title: '',
    content: '',
    pagePath: form.value.pagePath,
    tagIds: [],
    images: []
  }
  console.log('[重置表单] 已清空所有图片标记')
}

function handleCategorySelect(categoryId) {
  form.value.categoryId = categoryId
  formRef.value?.restoreValidation()
}

function handleTagSelect(tagKeys) {
  selectedTagKeys.value = normalizeSelectedTags(tagKeys, true)
  syncFormTagIdsFromSelectedKeys()
}

function handleCreateTagOption(inputValue) {
  const tagName = inputValue.trim()
  if (!tagName) {
    return false
  }
  if (selectedTagKeys.value.length >= MAX_FEEDBACK_TAG_COUNT) {
    message.warning(`反馈最多选择 ${MAX_FEEDBACK_TAG_COUNT} 个标签`)
    return false
  }
  const existingTag = tags.value.find(tag => tag.name === tagName)
  if (existingTag) {
    return {
      label: existingTag.name,
      value: buildExistingTagKey(existingTag.id),
    }
  }
  return {
    label: tagName,
    value: buildPendingTagKey(tagName),
  }
}

function normalizeSelectedTags(tagKeys, showWarning) {
  const selectedTagKeys = Array.isArray(tagKeys) ? tagKeys : []
  if (selectedTagKeys.length <= MAX_FEEDBACK_TAG_COUNT) {
    return selectedTagKeys
  }
  if (showWarning) {
    message.warning(`反馈最多选择 ${MAX_FEEDBACK_TAG_COUNT} 个标签`)
  }
  return selectedTagKeys.slice(0, MAX_FEEDBACK_TAG_COUNT)
}

watch(
  () => selectedTagKeys.value,
  async (tagKeys) => {
    const pendingTagNames = tagKeys
      .filter(isPendingTagKey)
      .map(parsePendingTagName)
      .filter(Boolean)
    if (pendingTagNames.length === 0) {
      return
    }
    try {
      await resolvePendingTagNames(pendingTagNames)
    } catch (error) {
      message.error(resolveFeedbackErrorMessage(error, '创建标签失败'))
      selectedTagKeys.value = selectedTagKeys.value.filter(tagKey => !isPendingTagKey(tagKey))
      syncFormTagIdsFromSelectedKeys()
    }
  }
)

async function resolvePendingTagNames(tagNames) {
  resolvingTags.value = true
  const uniqueTagNames = [...new Set(tagNames)]
  try {
    const createdTags = await Promise.all(uniqueTagNames.map(createOrGetTagByName))
    const tagIdMap = createdTags.reduce((result, tag) => {
      result[tag.name] = tag.id
      return result
    }, {})
    tags.value = mergeFeedbackTags(tags.value, createdTags)
    selectedTagKeys.value = normalizeSelectedTags(selectedTagKeys.value.map(tagKey => {
      if (!isPendingTagKey(tagKey)) {
        return tagKey
      }
      return buildExistingTagKey(tagIdMap[parsePendingTagName(tagKey)])
    }).filter(Boolean), false)
    syncFormTagIdsFromSelectedKeys()
  } finally {
    resolvingTags.value = false
  }
}

async function createOrGetTagByName(tagName) {
  const existingTag = tags.value.find(tag => tag.name === tagName)
  if (existingTag) {
    return existingTag
  }
  const response = await apiCreateFeedbackTag({ name: tagName })
  return assertAssistantResponseSuccess(response, '创建标签失败')
}

function mergeFeedbackTags(currentTags, nextTags) {
  const tagMap = [...currentTags, ...nextTags].reduce((result, tag) => {
    result[tag.id] = tag
    return result
  }, {})
  return sortFeedbackTags(Object.values(tagMap))
}

async function resolvePendingTagNamesFromForm() {
  const pendingTagNames = selectedTagKeys.value
    .filter(isPendingTagKey)
    .map(parsePendingTagName)
    .filter(Boolean)
  if (resolvingTags.value) {
    await waitForTagResolving()
  }
  if (pendingTagNames.length === 0 || resolvingTags.value) {
    return
  }
  await resolvePendingTagNames(pendingTagNames)
}

function waitForTagResolving() {
  return new Promise(resolve => {
    const timer = setInterval(() => {
      if (!resolvingTags.value) {
        clearInterval(timer)
        resolve()
      }
    }, 50)
  })
}

function syncFormTagIdsFromSelectedKeys() {
  form.value.tagIds = selectedTagKeys.value
    .filter(isExistingTagKey)
    .map(parseExistingTagId)
    .filter(tagId => Number.isFinite(tagId))
}

function buildExistingTagKey(tagId) {
  return `id:${tagId}`
}

function buildPendingTagKey(tagName) {
  return `name:${tagName}`
}

function isExistingTagKey(tagKey) {
  return typeof tagKey === 'string' && tagKey.startsWith('id:')
}

function isPendingTagKey(tagKey) {
  return typeof tagKey === 'string' && tagKey.startsWith('name:')
}

function parseExistingTagId(tagKey) {
  return Number(tagKey.replace('id:', ''))
}

function parsePendingTagName(tagKey) {
  return tagKey.replace('name:', '').trim()
}

function resolveFeedbackSourcePath() {
  if (!process.client) {
    return route.fullPath || '/feedback/create'
  }

  const referrer = document.referrer
  if (!referrer) {
    return route.fullPath || '/feedback/create'
  }

  try {
    const referrerUrl = new URL(referrer)
    if (referrerUrl.origin !== window.location.origin) {
      return route.fullPath || '/feedback/create'
    }
    return `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}` || route.fullPath || '/feedback/create'
  } catch (error) {
    return route.fullPath || '/feedback/create'
  }
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  padding: 24px 20px;
  background: #f8f9fa;
  min-height: calc(100vh - 40px);
}

.breadcrumb-box {
  margin-bottom: 20px;
}

.form-container {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 32px 0;
}

.feedback-type-field {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.type-helper-desc {
  display: block;
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}

:deep(.feedback-select .n-base-selection) {
  border-radius: 12px;
  min-height: 40px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: none;
}

:deep(.feedback-select .n-base-selection-label) {
  min-height: 40px;
  display: flex;
  align-items: center;
}

:deep(.feedback-select .n-base-selection-input) {
  min-height: 40px;
  display: flex;
  align-items: center;
}

:deep(.feedback-select .n-base-selection:hover) {
  border-color: #94a3b8;
}

:deep(.feedback-select.n-base-select--focus .n-base-selection),
:deep(.feedback-select .n-base-selection.n-base-selection--active) {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* 图片上传样式 */
.image-upload-container {
  width: 100%;
}

.images-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.image-preview-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}

.upload-dragger-wrapper {
  width: 100%;
}

.upload-dragger-content {
  text-align: center;
  padding: 8px 24px;
}

.upload-dragger-content .n-icon {
  color: #94a3b8;
  margin-bottom: 2px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: #18a0fb;
  margin-bottom: 0;
  line-height: 1.3;
}

.upload-hint {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.3;
}

.upload-hint .highlight {
  color: #18a0fb;
  font-weight: 600;
}

.upload-count {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

:deep(.n-upload-dragger) {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.3s ease;
}

:deep(.n-upload-dragger:hover) {
  border-color: #18a0fb;
  background: #f0f9ff;
}

:deep(.n-upload-dragger.n-upload-dragger--disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px 12px;
  }
  
  .form-container {
    padding: 24px 16px;
  }
}
</style>
