<template>
    <div class="course-card" @click="open">
        <div class="card-image">
            <UiImage :src="item.cover" class="cover-img"/>
            <div v-if="item.group_id || item.flashsale_id" class="activity-badge">
                {{ item.group_id ? '拼团' : '秒杀' }}
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">{{ item.title }}</h3>
            <div class="card-footer">
                <div class="price-group">
                    <Price :value="item.price" class="current-price"/>
                    <Price v-if="item.t_price" :value="item.t_price" through class="original-price"/>
                </div>
                <ClientOnly>
                    <div v-if="item.group_id || item.flashsale_id" class="countdown">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 3v4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <CountDown :time="item.end_time"/>
                    </div>
                </ClientOnly>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    item: Object
})

const open = () => {
    let path = ""
    if(["course","media","audio","video"].includes(props.item.type)){
        // 课程详情走专用页 /course_detail/[id]（调 /pc/course/detail/{id}）；
        // 通用 /detail/course/* 会请求 /pc/course/getById，后端无此接口会报参数类型错误。
        path = `/course_detail/${props.item.id}`
    } else if(props.item.type == "column"){
        path = `/detail/column/${props.item.id}`
    } else if(props.item.type == "live"){
        path = `/detail/live/${props.item.id}`
    }

    if(props.item.group_id){
        path = `${path}?group_id=${props.item.group_id}`
    }
    if(props.item.flashsale_id){
        path = `${path}?flashsale_id=${props.item.flashsale_id}`
    }

    navigateTo(path)
}
</script>

<style scoped>
.course-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.course-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-border-hover);
}

.card-image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: #f1f5f9;
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.course-card:hover .cover-img {
    transform: scale(1.05);
}

.activity-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 12px;
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: var(--radius-sm);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.card-content {
    padding: var(--space-md);
}

.card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-md) 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.price-group {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
}

.current-price {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-accent);
}

.original-price {
    font-size: 13px;
    color: var(--color-text-tertiary);
}

.countdown {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
}

.countdown svg {
    color: var(--color-text-tertiary);
}
</style>