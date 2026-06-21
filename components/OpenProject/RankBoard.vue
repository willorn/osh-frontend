<template>
  <div class="rank-board">
    <div class="rank-header">
      <span class="rank-title">🏆 排行榜</span>
      <div class="rank-controls">
        <!-- 维度切换 -->
        <n-button-group size="small">
          <n-button
            :type="rankType === 'star' ? 'primary' : 'default'"
            @click="switchType('star')"
          >⭐ Star</n-button>
          <n-button
            :type="rankType === 'fork' ? 'primary' : 'default'"
            @click="switchType('fork')"
          >🍴 Fork</n-button>
        </n-button-group>
        <!-- 周期切换 -->
        <n-button-group size="small" style="margin-left:8px">
          <n-button
            :type="period === 7 ? 'primary' : 'default'"
            @click="switchPeriod(7)"
          >近7天</n-button>
          <n-button
            :type="period === 30 ? 'primary' : 'default'"
            @click="switchPeriod(30)"
          >近30天</n-button>
        </n-button-group>
      </div>
    </div>

    <div v-if="loading" class="rank-loading"><n-spin size="small" /></div>
    <div v-else-if="list.length === 0" class="rank-empty">暂无数据</div>
    <div v-else class="rank-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="rank-item"
        @click="emit('select', item)"
      >
        <!-- 排名徽章 -->
        <div class="rank-badge" :class="badgeClass(item.rank)">
          {{ item.rank }}
        </div>

        <!-- 项目信息 -->
        <div class="rank-info">
          <div class="rank-name">{{ item.projectName }}</div>
          <div class="rank-desc">{{ item.projectDesc || '-' }}</div>
        </div>

        <!-- 增量 -->
        <div class="rank-increment">
          <span class="increment-val">
            +{{ rankType === 'star' ? item.starIncrement : item.forkIncrement }}
          </span>
          <span class="increment-label">{{ rankType === 'star' ? 'Stars' : 'Forks' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { NButtonGroup, NButton, NSpin } from 'naive-ui'

const emit = defineEmits(['select'])

const rankType = ref('star')
const period   = ref(7)
const list     = ref([])
const loading  = ref(false)

async function loadRank() {
  loading.value = true
  try {
    const res = await apiGetOpenProjectRank(rankType.value, period.value, 10)
    list.value = res?.data || res || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function switchType(type) {
  rankType.value = type
  loadRank()
}

function switchPeriod(p) {
  period.value = p
  loadRank()
}

function badgeClass(rank) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

onMounted(loadRank)
</script>

<style scoped>
.rank-board {
  background: rgba(255, 255, 255, 0.76);
  border-radius: 8px;
  border: 1px solid rgba(20, 184, 166, 0.18);
  overflow: hidden;
  box-shadow: 0 18px 46px rgba(8, 40, 50, 0.12);
  backdrop-filter: blur(16px);
}

.rank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(20, 184, 166, 0.16);
  background: linear-gradient(135deg, rgba(17, 94, 89, 0.92), rgba(14, 116, 144, 0.78));
}

.rank-title {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 72px;
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.35;
  white-space: nowrap;
}

.rank-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
}

.rank-header :deep(.n-button) {
  --n-color: rgba(255, 255, 255, 0.15) !important;
  --n-color-hover: rgba(255, 255, 255, 0.24) !important;
  --n-text-color: #f8fafc !important;
  --n-border: 1px solid rgba(255, 255, 255, 0.20) !important;
}

.rank-loading, .rank-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  color: #5f7780;
  font-size: 13px;
}

.rank-list { padding: 6px 0; }

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  border-bottom: 1px solid rgba(31, 111, 124, 0.10);
}
.rank-item:last-child { border-bottom: none; }
.rank-item:hover { background: rgba(204, 251, 241, 0.42); transform: translateX(2px); }

.rank-badge {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  background: #e2e8f0;
  color: #536570;
}
.rank-badge.gold { background: #fef3c7; color: #b45309; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12); }
.rank-badge.silver { background: #e8eef5; color: #526575; box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.10); }
.rank-badge.bronze { background: #ffedd5; color: #c2410c; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.10); }

.rank-info {
  flex: 1;
  min-width: 0;
}
.rank-name {
  font-size: 13px;
  font-weight: 700;
  color: #17313a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-desc {
  font-size: 11px;
  color: #6f838b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.rank-increment {
  flex-shrink: 0;
  text-align: right;
}
.increment-val {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #0f9f6e;
}
.increment-label {
  font-size: 11px;
  color: #78909a;
}
</style>
