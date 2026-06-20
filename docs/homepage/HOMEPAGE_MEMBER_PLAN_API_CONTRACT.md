# 首页会员套餐接口契约

## 前端调用接口

- `GET /pc/homepage/member/plans`

## 返回结构

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "planCode": "vip_month",
      "planName": "VIP月卡",
      "memberType": "vip",
      "periodType": "month",
      "durationMonths": 1,
      "description": "适合按阶段学习，支持多月续费，权益按月叠加",
      "recommended": false,
      "displayPrice": 148.00,
      "displayOriginalPrice": 176.00,
      "price": 88.80,
      "minPurchaseQuantity": 2,
      "buttonText": "立即开通",
      "benefits": [
        {
          "benefitTitle": "专属内容访问",
          "benefitDescription": "解锁 VIP 课程、电子书与考试题库中的会员内容"
        },
        {
          "benefitTitle": "学习工具额度",
          "benefitDescription": "获得会员可用的工具使用次数与学习辅助能力"
        },
        {
          "benefitTitle": "会员身份标识",
          "benefitDescription": "个人中心展示 VIP 身份，到期前可继续续费叠加"
        }
      ]
    }
  ]
}
```

## 字段说明

### 套餐主字段

- `id`: 套餐 ID
- `planCode`: 套餐编码
- `planName`: 套餐名称
- `memberType`: `vip` / `small_class`
- `periodType`: `month` / `year`
- `durationMonths`: 套餐时长（月）
- `description`: 首页卡片描述
- `recommended`: 是否推荐
- `displayPrice`: 首页展示价
- `displayOriginalPrice`: 首页展示原价
- `price`: 单周期基础价格
- `minPurchaseQuantity`: 最小购买数量
- `buttonText`: 首页按钮文案

### 权益字段

- `benefits`: 权益列表
- `benefits[].benefitTitle`: 权益标题
- `benefits[].benefitDescription`: 权益描述

## 前端处理规则

前端当前会：

- `recommended=true` 时显示“推荐”
- `memberType=small_class` 时按钮文案优先显示“立即申请”
- `benefits` 最多展示前三条
- `displayOriginalPrice <= displayPrice` 时不显示划线原价

## 排序约定

后端返回顺序即首页展示顺序。

前端不再自行排序。
