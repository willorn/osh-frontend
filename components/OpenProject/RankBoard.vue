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
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
}

.rank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.rank-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.rank-controls {
  display: flex;
  align-items: center;
}

.rank-loading, .rank-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  color: #999;
  font-size: 13px;
}

.rank-list { padding: 4px 0; }

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}
.rank-item:last-child { border-bottom: none; }
.rank-item:hover { background: #f0f5ff; }

/* 排名徽章 */
.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  background: #e5e7eb;
  color: #6b7280;
}
.rank-badge.gold   { background: #fef3c7; color: #d97706; }
.rank-badge.silver { background: #f1f5f9; color: #64748b; }
.rank-badge.bronze { background: #fef2e8; color: #c2410c; }

.rank-info {
  flex: 1;
  min-width: 0;
}
.rank-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-desc {
  font-size: 11px;
  color: #9ca3af;
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
  font-weight: 700;
  color: #16a34a;
}
.increment-label {
  font-size: 11px;
  color: #9ca3af;
}
</style>
