<template>
  <div class="detail-wrap">
    <!-- 返回栏 -->
    <div class="detail-topbar">
      <button class="back-btn" @click="$emit('back')">
        <span class="back-icon">←</span>
        返回列表
      </button>
      <div class="topbar-actions" v-if="question">
        <!-- 作者操作区 -->
        <template v-if="isQuestionOwner">
          <button class="btn-owner-action btn-edit" @click="openEditModal">
            ✏️ 编辑问题
          </button>
          <button
            v-if="question.status === 0 || question.status === 1"
            class="btn-owner-action btn-publish"
            :disabled="publishing"
            @click="handlePublish"
          >
            <span v-if="publishing">发布中...</span>
            <span v-else>🚀 发布问题</span>
          </button>
          <button class="btn-owner-action btn-delete" @click="confirmDelete">
            🗑️ 删除
          </button>
        </template>
        <button
          class="btn-follow"
          :class="{ active: question.isFollowed }"
          @click="toggleFollow"
          :disabled="!isLoggedIn"
        >
          <span v-if="question.isFollowed">✓ 已关注</span>
          <span v-else>⭐ 关注问题</span>
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="center-tip">
      <n-spin size="large" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 问题不存在 -->
    <n-empty v-else-if="!question" description="问题不存在或已被删除" style="padding:80px 0" size="large">
      <template #extra>
        <button class="btn-back-list" @click="$emit('back')">返回列表</button>
      </template>
    </n-empty>

    <template v-else>
      <!-- 问题主体 -->
      <div class="question-block">
        <!-- 草稿提示横幅 -->
        <div v-if="question.status === 0" class="draft-banner">
          <span class="draft-icon">📝</span>
          <span>此问题为草稿状态，仅自己可见。点击右上角「发布问题」后所有人可见。</span>
        </div>

        <div class="q-header">
          <div class="q-title-row">
            <span v-if="question.isPaidOnly === 1" class="badge paid">🔒 付费专属</span>
            <span v-else class="badge free">🔓 公开问题</span>
            <h1 class="q-title">{{ question.title || question.content }}</h1>
          </div>
          <div class="q-meta">
            <UserCard :user-id="question.userId" :username="question.userName" class="meta-user">
              <span class="user-avatar">{{ (question.userName || '?')[0] }}</span>
              {{ question.userName || `用户${question.userId}` }}
            </UserCard>
            <span v-if="question.resourceNo" class="meta-resource">
              <span class="resource-icon">📚</span>
              [{{ displayResourceType(question.resourceType) || '课程' }}] #{{ question.resourceNo }}
            </span>
            <span v-else-if="question.resourceType" class="meta-resource">
              <span class="resource-icon">📚</span>
              {{ displayResourceType(question.resourceType) }}
            </span>
            <span class="meta-time">
              <span class="time-icon">🕐</span>
              {{ question.createTime }}
            </span>
            <span class="meta-stat">👁 {{ question.viewCount || 0 }} 浏览</span>
            <span class="meta-stat">👥 {{ question.followCount || 0 }} 关注</span>
            <span class="status-badge" :class="getStatusClass(question.status)">
              {{ getStatusText(question.status) }}
            </span>
          </div>
          <div v-if="question.tags?.length" class="q-tags">
            <span v-for="tag in question.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        <div class="q-content">{{ question.content }}</div>
      </div>

      <!-- 回答列表 -->
      <div class="answers-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">💬</span>
            {{ (question.answers || []).length }} 个回答
          </h2>
          <div v-if="acceptedAnswer" class="accepted-summary">
            <span class="accepted-summary-badge">✓ 已采纳</span>
            <span>最佳回答已固定展示在最前面</span>
          </div>
        </div>

        <div v-if="!question.answers || question.answers.length === 0" class="no-answer">
          <n-empty description="暂无回答，快来抢沙发" size="large">
            <template #icon>
              <div style="font-size: 48px;">💭</div>
            </template>
          </n-empty>
        </div>

        <div v-else class="answer-list">
          <div
            v-for="ans in sortedAnswers"
            :key="ans.id"
            class="answer-card"
            :class="{ 'is-best': ans.isBest === 1 }"
          >
            <div v-if="ans.isBest === 1" class="best-ribbon">
              <span class="ribbon-text">✓ 最佳回答</span>
            </div>

            <div class="ans-header">
              <UserCard :user-id="ans.userId" :username="ans.userName" class="ans-user-info">
                <div class="ans-avatar">{{ (ans.userName || '?')[0] }}</div>
                <div class="ans-user-detail">
                  <div class="ans-username-row">
                    <span class="ans-username">{{ ans.userName || '匿名用户' }}</span>
                    <span v-if="ans.isBest === 1" class="accepted-chip">已采纳</span>
                  </div>
                  <span class="ans-time">{{ ans.createTime }}</span>
                </div>
              </UserCard>
              <div class="ans-actions">
                <button
                  class="btn-vote"
                  :class="{ active: ans.isVoted }"
                  @click="toggleVote(ans)"
                  :disabled="!isLoggedIn"
                >
                  <span class="vote-icon">👍</span>
                  <span class="vote-count">{{ ans.voteCount || 0 }}</span>
                </button>
                <button
                  v-if="isQuestionOwner && question.status !== 3 && ans.isBest !== 1"
                  class="btn-accept"
                  @click="acceptAnswer(ans)"
                >
                  ✓ 采纳
                </button>
                <button
                  v-if="isQuestionOwner && ans.isBest === 1"
                  class="btn-cancel-accept"
                  @click="cancelAccept(ans)"
                >
                  取消采纳
                </button>
              </div>
            </div>

            <div class="ans-content">{{ ans.content }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 回答区域 -->
    <div class="reply-section" v-if="question">
      <!-- 收起状态：显示「我要回答」按钮 -->
      <div v-if="!replyExpanded" class="reply-collapsed">
        <button class="btn-open-reply" @click="openReply">
          <span class="reply-btn-icon">✏️</span>
          我要回答
        </button>
        <span v-if="!isLoggedIn" class="reply-login-tip">（请先登录）</span>
      </div>

      <!-- 展开状态：显示输入框 -->
      <div v-else class="reply-expanded-box">
        <div class="reply-expanded-header">
          <span class="reply-expanded-title">✏️ 写下你的回答</span>
          <button class="btn-collapse-reply" @click="replyExpanded = false; replyContent = ''">✕ 收起</button>
        </div>
        <n-alert v-if="!isLoggedIn" type="warning" style="margin-bottom:12px">
          <template #icon><span style="font-size: 18px;">⚠️</span></template>
          请先登录后再回答问题
        </n-alert>
        <textarea
          ref="replyTextareaRef"
          v-model="replyContent"
          class="reply-textarea"
          placeholder="请输入你的专业回答，帮助提问者解决问题...（至少10个字符）"
          rows="5"
          maxlength="2000"
          :disabled="!isLoggedIn"
        />
        <div class="reply-actions">
          <span class="char-count" :class="{ warn: replyContent.length > 1800 }">
            {{ replyContent.length }}/2000
          </span>
          <div class="reply-btns">
            <button class="btn-cancel-reply" @click="replyExpanded = false; replyContent = ''">取消</button>
            <button
              class="btn-submit"
              :disabled="submitting || replyContent.trim().length < 10 || !isLoggedIn"
              @click="submitAnswer"
            >
              <span v-if="submitting">提交中...</span>
              <span v-else>✓ 提交回答</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 编辑问题弹窗 ===== -->
    <n-modal
      v-model:show="editModalVisible"
      preset="card"
      title="编辑问题"
      style="width: 760px; max-width: 95vw;"
      :segmented="{ content: 'soft', footer: 'soft' }"
      :mask-closable="false"
    >
      <n-form label-placement="left" label-width="90">
        <n-form-item label="问题类型">
          <n-radio-group v-model:value="editForm.isPaidOnly">
            <n-space>
              <n-radio value="0">🔓 公开问题（所有人可见）</n-radio>
              <n-radio value="1">🔒 付费专属（仅付费用户可见）</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="资源类型">
          <n-select
            v-model:value="editForm.resourceType"
            placeholder="请选择资源类型（可不选）"
            :options="resourceTypeOptions"
            clearable
          />
        </n-form-item>

        <n-form-item label="资源编号" v-if="editForm.resourceType">
          <n-input-number
            v-model:value="editForm.resourceNo"
            placeholder="请输入资源编号"
            :min="1"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="问题内容" required>
          <n-input
            v-model:value="editForm.content"
            type="textarea"
            placeholder="详细描述你的问题..."
            :autosize="{ minRows: 4, maxRows: 10 }"
            maxlength="200"
            show-count
          />
        </n-form-item>

        <n-form-item label="标签">
          <div style="width: 100%">
            <n-space wrap>
              <n-tag
                v-for="(tag, i) in editForm.tags"
                :key="i"
                closable
                type="success"
                @close="editForm.tags.splice(i, 1)"
              >
                {{ tag }}
              </n-tag>
            </n-space>
            <n-space style="margin-top: 10px">
              <n-input
                v-model:value="editNewTag"
                placeholder="输入标签后回车添加（最多5个）"
                style="width: 280px"
                maxlength="20"
                @keyup.enter="addEditTag"
              />
              <n-button @click="addEditTag" :disabled="editForm.tags.length >= 5">添加</n-button>
            </n-space>
          </div>
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button
            type="primary"
            :loading="editSaving"
            :disabled="!editForm.content.trim() || editForm.content.trim().length < 10"
            @click="saveEdit"
          >
            保存修改
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- ===== 删除确认弹窗 ===== -->
    <n-modal
      v-model:show="deleteModalVisible"
      preset="dialog"
      type="error"
      title="确认删除"
      content="删除后无法恢复，确定要删除这个问题吗？"
      positive-text="确认删除"
      negative-text="取消"
      :loading="deleting"
      @positive-click="doDelete"
      @negative-click="deleteModalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import {
  NModal, NForm, NFormItem, NInput, NInputNumber, NSelect,
  NRadioGroup, NRadio, NSpace, NButton, NTag,
} from 'naive-ui';
import {
  apiGetQuestionDetail, apiSubmitAnswer, apiFollowQuestion,
  apiCancelFollowQuestion, apiVoteAnswer, apiCancelVoteAnswer,
  apiSolveQuestion, apiCancelSolve, apiEditQuestion,
  apiPublishQuestion, apiDeleteQuestion,
} from '~/composables/Api/QuestionAnswer/qna.js';

const props = defineProps({ questionId: [String, Number] });
const emit = defineEmits(['back', 'deleted']);

const { message } = createDiscreteApi(['message']);

const loading = ref(false);
const question = ref(null);
const replyContent = ref('');
const replyExpanded = ref(false);
const replyTextareaRef = ref(null);
const submitting = ref(false);
const publishing = ref(false);
const deleting = ref(false);

// 编辑弹窗
const editModalVisible = ref(false);
const editSaving = ref(false);
const editNewTag = ref('');
const editForm = reactive({
  content: '',
  isPaidOnly: '0',
  resourceType: null,
  resourceNo: null,
  tags: [],
});

// 删除确认弹窗
const deleteModalVisible = ref(false);

// 与后端 ResourceTypeEnum 对齐：course / website / 电子书。
// 注意：
// 1. 课程统一传英文 code 'course'，后端有 'course' ↔ '课程' 的兼容查询。
// 2. 网站统一传英文 code 'website'，需后端 ResourceTypeEnum 已包含 WEBSITE。
// 3. 电子书目前在 book.js 仍以 '电子书' 入库，这里保持 '电子书'，避免编辑/筛选时与已存数据不匹配。
const resourceTypeOptions = [
  { label: '课程', value: 'course' },
  { label: '网站', value: 'website' },
  { label: '电子书', value: '电子书' },
];

// 资源类型展示映射：后端历史数据可能存的是 '课程/网站/电子书'，
// 也可能是新格式 'course/website/book'，统一渲染成中文 label。
const RESOURCE_TYPE_LABEL_MAP = {
  course: '课程',
  website: '网站',
  book: '电子书',
};

function displayResourceType(type) {
  if (!type) return '';
  return RESOURCE_TYPE_LABEL_MAP[type] || type;
}

// 用户信息（与 useAuth.js 保持一致，用 useState + useCookie）
const userState = useUser();

const isLoggedIn = computed(() => {
  if (!process.client) return false;
  // 与 course.js 保持一致：localStorage 优先
  const token = localStorage.getItem('token') || localStorage.getItem('Token');
  if (token) return true;
  try { return !!useCookie('token').value; } catch { return false; }
});

// 是否是问题作者
const isQuestionOwner = computed(() => {
  if (!isLoggedIn.value || !question.value) return false;
  // 后端明确返回 isOwner 字段时优先
  if (question.value.isOwner !== undefined) return !!question.value.isOwner;
  // 对比当前登录用户 id 与问题 userId
  const uid = userState.value?.id || userState.value?.userId;
  if (uid && question.value.userId) {
    return String(uid) === String(question.value.userId);
  }
  // 后端没有返回足够信息时，只要登录就显示（接口本身会做权限校验）
  return isLoggedIn.value;
});

const acceptedAnswer = computed(() => {
  return (question.value?.answers || []).find((item) => Number(item.isBest) === 1) || null;
});

const sortedAnswers = computed(() => {
  const list = [...(question.value?.answers || [])];
  return list.sort((a, b) => {
    const bestDiff = Number(b.isBest || 0) - Number(a.isBest || 0);
    if (bestDiff !== 0) return bestDiff;
    return Number(b.voteCount || 0) - Number(a.voteCount || 0);
  });
});

onMounted(loadDetail);

async function loadDetail() {
  if (!props.questionId) return;
  loading.value = true;
  try {
    const res = await apiGetQuestionDetail(props.questionId);
    if (res?.code === 200 && res.data) {
      question.value = res.data;
      // 调试：打印问题数据，确认 isOwner/userId 字段
      console.log('[QnA Detail] question data:', JSON.stringify({
        id: res.data.id,
        userId: res.data.userId,
        isOwner: res.data.isOwner,
        status: res.data.status,
      }));
      console.log('[QnA Detail] current user:', JSON.stringify(userState.value));
    } else {
      message.error(res?.msg || '加载失败');
    }
  } catch (error) {
    console.error('加载详情失败:', error);
    message.error('加载详情失败，请检查网络');
  } finally {
    loading.value = false;
  }
}

// ===== 状态文本/样式 =====
function getStatusText(status) {
  const map = { 0: '📝 草稿', 1: '✅ 已发布', 2: '💬 已回答', 3: '✓ 已解决' };
  return map[status] ?? '⏳ 待回答';
}
function getStatusClass(status) {
  const map = { 0: 'status-draft', 1: 'status-published', 2: 'status-answered', 3: 'solved' };
  return map[status] ?? 'pending';
}

// ===== 关注 =====
async function toggleFollow() {
  if (!isLoggedIn.value) { message.warning('请先登录'); return; }
  try {
    const fn = question.value.isFollowed ? apiCancelFollowQuestion : apiFollowQuestion;
    const res = await fn(question.value.id);
    if (res?.code === 200) {
      question.value.isFollowed = !question.value.isFollowed;
      question.value.followCount = (question.value.followCount || 0) + (question.value.isFollowed ? 1 : -1);
      message.success(question.value.isFollowed ? '✓ 已关注' : '已取消关注');
    } else {
      message.error(res?.msg || '操作失败');
    }
  } catch { message.error('操作失败'); }
}

// ===== 点赞 =====
async function toggleVote(ans) {
  if (!isLoggedIn.value) { message.warning('请先登录'); return; }
  try {
    const fn = ans.isVoted ? apiCancelVoteAnswer : apiVoteAnswer;
    const res = await fn(ans.id);
    if (res?.code === 200) {
      ans.isVoted = !ans.isVoted;
      ans.voteCount = (ans.voteCount || 0) + (ans.isVoted ? 1 : -1);
    } else {
      message.error(res?.msg || '操作失败');
    }
  } catch { message.error('操作失败'); }
}

// ===== 采纳 =====
async function acceptAnswer(ans) {
  try {
    const res = await apiSolveQuestion(question.value.id, ans.id);
    if (res?.code === 200) {
      message.success('✓ 已采纳为最佳回答');
      await loadDetail();
    } else {
      message.error(res?.msg || '操作失败');
    }
  } catch { message.error('操作失败'); }
}

async function cancelAccept(ans) {
  try {
    const res = await apiCancelSolve(question.value.id, ans.id);
    if (res?.code === 200) {
      message.success('已取消采纳');
      await loadDetail();
    } else {
      message.error(res?.msg || '操作失败');
    }
  } catch { message.error('操作失败'); }
}

// ===== 提交回答 =====
function openReply() {
  if (!isLoggedIn.value) { message.warning('请先登录后再回答'); return; }
  replyExpanded.value = true;
  nextTick(() => replyTextareaRef.value?.focus());
}

async function submitAnswer() {
  if (!isLoggedIn.value) { message.warning('请先登录'); return; }
  const content = replyContent.value.trim();
  if (!content) { message.warning('请输入回答内容'); return; }
  if (content.length < 10) { message.warning('回答内容至少需要10个字符'); return; }

  submitting.value = true;
  try {
    const res = await apiSubmitAnswer(question.value.id, content);
    if (res?.code === 200) {
      message.success('🎉 回答提交成功！');
      replyContent.value = '';
      replyExpanded.value = false;
      await loadDetail();
    } else {
      message.error(res?.msg || '提交失败');
    }
  } catch (e) {
    console.error('提交回答失败:', e);
    message.error(e?.data?.msg || e?.message || '提交失败，请检查网络');
  } finally {
    submitting.value = false;
  }
}

// 旧数据可能用中文存储（'课程' / '网站'），新版下拉 value 已经统一成英文 code
// （'course' / 'website'），这里把旧值映射到下拉的合法 value，保证编辑时下拉能正常选中。
// 电子书保持中文 '电子书'（与 BOOK_RESOURCE_TYPE / 下拉 value 一致），无需映射。
// 'book'（如未来 BOOK_RESOURCE_TYPE 改成英文）也归一为下拉的 '电子书'。
const RESOURCE_TYPE_LEGACY_MAP = {
  课程: 'course',
  网站: 'website',
  book: '电子书',
};

function normalizeEditResourceType(type) {
  if (!type) return null;
  return RESOURCE_TYPE_LEGACY_MAP[type] || type;
}

// ===== 编辑问题 =====
function openEditModal() {
  const q = question.value;
  editForm.content = q.content || '';
  editForm.isPaidOnly = String(q.isPaidOnly ?? '0');
  editForm.resourceType = normalizeEditResourceType(q.resourceType);
  editForm.resourceNo = q.resourceNo || null;
  editForm.tags = Array.isArray(q.tags) ? [...q.tags] : [];
  editNewTag.value = '';
  editModalVisible.value = true;
}

function addEditTag() {
  const t = editNewTag.value.trim();
  if (!t) return;
  if (editForm.tags.length >= 5) { message.warning('最多添加5个标签'); return; }
  if (editForm.tags.includes(t)) { message.warning('标签已存在'); return; }
  editForm.tags.push(t);
  editNewTag.value = '';
}

async function saveEdit() {
  if (!editForm.content.trim() || editForm.content.trim().length < 10) {
    message.warning('问题内容至少需要10个字符');
    return;
  }
  editSaving.value = true;
  try {
    const body = {
      questionId: question.value.id,
      content: editForm.content.trim(),
      isPaidOnly: editForm.isPaidOnly,
      resourceType: editForm.resourceType || '',
    };
    if (editForm.resourceNo) body.resourceNo = Number(editForm.resourceNo);
    if (editForm.tags.length > 0) body.tags = editForm.tags;

    const res = await apiEditQuestion(body);
    if (res?.code === 200) {
      message.success('✓ 修改已保存');
      editModalVisible.value = false;
      await loadDetail();
    } else {
      message.error(res?.msg || '保存失败');
    }
  } catch (e) {
    message.error(e?.data?.msg || '保存失败，请检查网络');
  } finally {
    editSaving.value = false;
  }
}

// ===== 发布问题 =====
async function handlePublish() {
  publishing.value = true;
  try {
    const res = await apiPublishQuestion(question.value.id);
    if (res?.code === 200) {
      message.success('🚀 问题已发布！');
      await loadDetail();
    } else {
      message.error(res?.msg || '发布失败');
    }
  } catch (e) {
    message.error(e?.data?.msg || '发布失败');
  } finally {
    publishing.value = false;
  }
}

// ===== 删除问题 =====
function confirmDelete() {
  deleteModalVisible.value = true;
}

async function doDelete() {
  deleting.value = true;
  try {
    const res = await apiDeleteQuestion(question.value.id);
    if (res?.code === 200) {
      message.success('问题已删除');
      deleteModalVisible.value = false;
      emit('deleted');
      emit('back');
    } else {
      message.error(res?.msg || '删除失败');
    }
  } catch (e) {
    message.error(e?.data?.msg || '删除失败');
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.detail-wrap {
  width: 100%;
  padding-bottom: 40px;
  box-sizing: border-box;
}

/* ===== 顶部栏 ===== */
.detail-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 0;
  flex-wrap: wrap;
  gap: 10px;
}
.back-btn {
  background: #fff;
  color: #18a058;
  border: 1px solid #18a058;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.back-btn:hover {
  background: #18a058;
  color: #fff;
  transform: translateX(-2px);
}
.back-icon { font-size: 16px; }

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 作者操作按钮 */
.btn-owner-action {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 5px;
}
.btn-edit {
  background: #f0f9ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
.btn-edit:hover {
  background: #1890ff;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(24, 144, 255, 0.3);
}
.btn-publish {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.btn-publish:hover:not(:disabled) {
  background: #52c41a;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(82, 196, 26, 0.3);
}
.btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-delete {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}
.btn-delete:hover {
  background: #ff4d4f;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(255, 77, 79, 0.3);
}

.btn-follow {
  border: 2px solid #18a058;
  color: #18a058;
  background: #fff;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-follow.active { background: #18a058; color: #fff; }
.btn-follow:hover {
  background: #18a058;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(24, 160, 88, 0.3);
}
.btn-follow:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ===== 加载/空状态 ===== */
.center-tip { padding: 80px 0; text-align: center; }
.loading-text { margin-top: 16px; font-size: 14px; color: #999; }
.btn-back-list {
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 16px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.3);
}
.btn-back-list:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.4);
}

/* ===== 草稿横幅 ===== */
.draft-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #856404;
  font-weight: 500;
}
.draft-icon { font-size: 18px; flex-shrink: 0; }

/* ===== 问题块 ===== */
.question-block {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 28px 32px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.q-header { margin-bottom: 20px; }
.q-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  flex-shrink: 0;
  margin-top: 4px;
  font-weight: 600;
}
.badge.paid { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
.badge.free { background: #e8f5e9; color: #18a058; border: 1px solid #18a058; }
.q-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}
.q-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #999;
  flex-wrap: wrap;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.meta-user {
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #18a058;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}
.meta-resource {
  color: #18a058;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.resource-icon, .time-icon { font-size: 14px; }
.meta-time { display: flex; align-items: center; gap: 4px; }
.meta-stat { display: flex; align-items: center; gap: 4px; }
.status-badge {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}
.status-badge.solved { background: #e8f5e9; color: #18a058; border: 1px solid #18a058; }
.status-badge.pending { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
.status-badge.status-draft { background: #f5f5f5; color: #999; border: 1px solid #d9d9d9; }
.status-badge.status-published { background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.status-badge.status-answered { background: #e8f5e9; color: #18a058; border: 1px solid #18a058; }
.q-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.tag {
  background: #f5f5f5;
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 13px;
  color: #666;
  border: 1px solid #e0e0e0;
}
.q-content {
  font-size: 16px;
  line-height: 1.9;
  color: #333;
  white-space: pre-wrap;
  padding: 16px 0;
}

/* ===== 回答区 ===== */
.answers-section { margin-bottom: 20px; }
.section-header {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.accepted-summary {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(24, 160, 88, 0.12), rgba(250, 204, 21, 0.12));
  color: #166534;
  font-size: 13px;
  font-weight: 600;
}
.accepted-summary-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #18a058;
  color: #fff;
  font-size: 12px;
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-icon { font-size: 24px; }
.no-answer {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 60px 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.answer-list { display: flex; flex-direction: column; gap: 12px; }
.answer-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 24px 28px;
  transition: all 0.2s;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.answer-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.answer-card.is-best {
  border-color: #18a058;
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.22), transparent 28%),
    linear-gradient(180deg, #f0fdf4 0%, #fff 80px);
  border-width: 2px;
  box-shadow: 0 12px 30px rgba(24, 160, 88, 0.14);
}
.best-ribbon {
  position: absolute;
  top: 0;
  right: 24px;
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff;
  padding: 6px 16px;
  border-radius: 0 0 8px 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.3);
}
.ans-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.ans-user-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.ans-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #18a058;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}
.ans-user-detail { display: flex; flex-direction: column; gap: 4px; }
.ans-username-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ans-username { font-weight: 600; color: #333; font-size: 15px; }
.accepted-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(24, 160, 88, 0.12);
  border: 1px solid rgba(24, 160, 88, 0.28);
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
}
.ans-time { font-size: 13px; color: #999; }
.ans-actions { display: flex; gap: 10px; }
.btn-vote {
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.btn-vote:hover { border-color: #18a058; color: #18a058; }
.btn-vote.active {
  background: #e8f5e9;
  border-color: #18a058;
  color: #18a058;
  font-weight: 600;
}
.btn-vote:disabled { opacity: 0.5; cursor: not-allowed; }
.vote-icon { font-size: 14px; }
.btn-accept {
  background: #18a058;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-accept:hover {
  background: #0e7a3e;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.3);
}
.btn-cancel-accept {
  background: #fff;
  color: #999;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel-accept:hover { border-color: #f5222d; color: #f5222d; }
.ans-content {
  font-size: 15px;
  line-height: 1.9;
  color: #333;
  white-space: pre-wrap;
}

/* ===== 回答区域 ===== */
.reply-section {
  margin-top: 20px;
  margin-bottom: 60px;
}

/* 收起状态 */
.reply-collapsed {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  border: 2px dashed #d9d9d9;
  padding: 20px 28px;
  transition: border-color 0.2s;
}
.reply-collapsed:hover { border-color: #18a058; }
.btn-open-reply {
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-open-reply:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 160, 88, 0.4);
}
.reply-btn-icon { font-size: 18px; }
.reply-login-tip { font-size: 13px; color: #999; }

/* 展开状态 */
.reply-expanded-box {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 24px 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.reply-expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.reply-expanded-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}
.btn-collapse-reply {
  background: none;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}
.btn-collapse-reply:hover { background: #f5f5f5; color: #333; }

.reply-textarea {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 15px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  line-height: 1.7;
  box-sizing: border-box;
  transition: all 0.2s;
  min-height: 120px;
}
.reply-textarea:hover { border-color: #40a9ff; }
.reply-textarea:focus {
  border-color: #18a058;
  box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.1);
}
.reply-textarea:disabled { background: #f5f5f5; cursor: not-allowed; }

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.char-count { font-size: 13px; color: #999; }
.char-count.warn { color: #f5222d; font-weight: 600; }
.reply-btns { display: flex; gap: 10px; }
.btn-cancel-reply {
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel-reply:hover { border-color: #999; color: #333; }
.btn-submit {
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 28px;
  font-size: 15px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.4);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
