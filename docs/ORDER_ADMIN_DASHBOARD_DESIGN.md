# 管理端订单看板与订单管理接口方案

## 页面入口

- 订单看板：`/admin/order-dashboard`
- 订单管理：`/admin/orders`
- 前端权限：`order:dashboard`、`order:list`、`order:manage` 或 `*:*:*`

## 订单看板

看板面向管理员和运营，首屏优先回答「今天卖了多少、订单是否正常、积分抵扣是否健康、有没有需要处理的风险」。

核心指标：

- 今日流水：实收金额，展示较昨日涨跌。
- 支付订单：支付成功订单数。
- 支付转化率：进入结算到支付成功。
- 积分抵扣：抵扣金额、积分使用率。
- 待支付金额：待用户完成支付的订单金额。
- 待处理订单：超时未支付、履约异常、金额不一致等。

图表模块：

- 每日流水组合图：实收金额、积分抵扣、待支付金额按天对照。
- 支付结构环图：微信支付、现金+积分、纯积分、免费订单占比。
- 下单转化漏斗：进入结算、创建订单、拉起支付、支付成功、履约完成。
- 积分消费分布：课程、工具、电子书、拼团/秒杀的积分消耗。
- 商品贡献排行：按实收金额排序，同时显示订单数和积分抵扣。
- 待处理风险：支付成功未履约、金额不一致、超时未关闭、积分扣减异常。

## 订单管理

订单管理页面向客服、财务和运营排查，重点是筛选、对账、追踪支付与履约状态。

筛选条件：

- 关键词：订单号、商品名称、用户。
- 订单状态：待支付、已支付、已关闭、履约异常。
- 商品类型：课程、电子书、工具套餐、拼团、秒杀。
- 支付方式：微信支付、现金+积分、纯积分、免费订单。
- 时间范围：按订单创建时间筛选。

表格字段：

- 订单号、创建时间。
- 商品名称、商品类型。
- 用户。
- 原价、实收金额、积分抵扣金额。
- 积分消耗、积分抵扣金额。
- 支付方式、订单状态、支付时间。
- 操作：详情、支付流水、关闭订单、重新履约。

## 后端接口建议

### 1. 订单看板聚合接口

`GET /pc/admin/order/dashboard`

权限：`order:dashboard`

Query：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| range | string | 否 | `7d`、`30d`、`month`、`quarter` |
| startDate | string | 否 | 自定义开始日期，格式 `yyyy-MM-dd` |
| endDate | string | 否 | 自定义结束日期，格式 `yyyy-MM-dd` |

Response data：

```json
{
  "metrics": [
    {
      "label": "今日流水",
      "value": "¥1,404",
      "change": "+18.4%",
      "changeType": "up",
      "note": "按今日支付时间"
    }
  ],
  "statusCards": [
    { "label": "已支付", "value": 8, "status": "PAID" }
  ],
  "dailyRevenue": [
    {
      "day": "06-11",
      "cash": 666,
      "points": 80,
      "pending": 69
    }
  ],
  "paymentMix": [
    { "label": "微信支付", "value": 50, "count": 4, "payType": "WECHAT" }
  ],
  "funnel": [
    { "label": "进入结算", "count": 884, "rate": 100 }
  ],
  "pointsSummary": {
    "deductAmount": "¥219",
    "usedPoints": "21,900",
    "usageRate": "50%"
  },
  "pointsSources": [
    { "label": "课程", "rate": 68.5, "value": "15,000", "productType": "COURSE" }
  ],
  "topProducts": [
    { "rank": 1, "name": "AI 编程实战课", "orders": 2, "points": "100", "amount": "498" }
  ],
  "risks": [
    { "label": "支付成功未履约", "desc": "需要补偿权益发放", "count": 1, "riskType": "FULFILL_FAILED" }
  ]
}
```

### 2. 订单分页接口

`GET /pc/admin/order/page`

权限：`order:list`

Query：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| pageNum | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页条数，默认 10 |
| keyword | string | 否 | 订单号、商品名、用户昵称/ID |
| status | string | 否 | `PENDING`、`PAID`、`CLOSED`、`FULFILL_FAILED` |
| productType | string | 否 | `COURSE`、`BOOK`、`TOOL`、`GROUP`、`SECKILL` |
| payType | string | 否 | `WECHAT`、`CASH_POINTS`、`POINTS`、`FREE` |
| startTime | string | 否 | 创建时间起点 |
| endTime | string | 否 | 创建时间终点 |

Response data：

```json
{
  "total": 12,
  "rows": [
    {
      "orderNo": "O202606110001",
      "productName": "AI 编程实战课",
      "productType": "COURSE",
      "userId": 10001,
      "userName": "张同学",
      "status": "PAID",
      "payType": "CASH_POINTS",
      "originalAmount": 299,
      "cashAmount": 239,
      "pointsAmount": 6000,
      "pointsDeductAmount": 60,
      "createdTime": "2026-06-11 14:28:00",
      "paidTime": "2026-06-11 14:30:00",
      "fulfillmentStatus": "FULFILLED"
    }
  ]
}
```

### 3. 订单详情接口

`GET /pc/admin/order/{orderNo}`

权限：`order:detail`

Response data：

```json
{
  "orderNo": "O202606110001",
  "productName": "AI 编程实战课",
  "productType": "COURSE",
  "userId": 10001,
  "userName": "张同学",
  "status": "PAID",
  "payType": "CASH_POINTS",
  "originalAmount": 299,
  "cashAmount": 239,
  "pointsAmount": 6000,
  "pointsDeductAmount": 60,
  "createdTime": "2026-06-11 14:28:00",
  "paidTime": "2026-06-11 14:30:00",
  "fulfillmentStatus": "FULFILLED",
  "payment": {
    "paymentNo": "P202606110001",
    "channelCode": "wxpay",
    "paymentStatus": "SUCCESS",
    "platformTradeNo": "420000000000"
  },
  "fulfillmentLogs": [
    {
      "status": "SUCCESS",
      "message": "课程权限已开通",
      "createdTime": "2026-06-11 14:30:03"
    }
  ],
  "operationLogs": [
    {
      "operatorId": 1,
      "operatorName": "admin",
      "action": "FULFILL_RETRY",
      "remark": "重新履约",
      "createdTime": "2026-06-11 15:01:00"
    }
  ]
}
```

### 4. 支付流水接口

`GET /pc/admin/order/{orderNo}/payment`

权限：`payment:detail`

Response data：

```json
{
  "orderNo": "O202606110001",
  "paymentNo": "P202606110001",
  "channelCode": "wxpay",
  "paymentStatus": "SUCCESS",
  "requestAmount": 239,
  "paidAmount": 239,
  "platformTradeNo": "420000000000",
  "createdTime": "2026-06-11 14:28:02",
  "paidTime": "2026-06-11 14:30:00",
  "notifyLogs": [
    {
      "id": 1,
      "signValid": true,
      "processStatus": "SUCCESS",
      "rawBody": "{}",
      "createdTime": "2026-06-11 14:30:01"
    }
  ]
}
```

### 5. 关闭待支付订单

`POST /pc/admin/order/{orderNo}/close`

权限：`order:close`

Body：

```json
{
  "reason": "用户长时间未支付，运营手动关闭"
}
```

要求：

- 仅允许关闭 `PENDING` 订单。
- 同步关闭支付流水。
- 如果订单已支付，必须拒绝并返回明确错误。
- 写入管理员操作日志。

### 6. 重新履约

`POST /pc/admin/order/{orderNo}/fulfill/retry`

权限：`order:fulfill:retry`

Body：

```json
{
  "reason": "首次履约异常，人工重试"
}
```

要求：

- 仅允许处理 `PAID` 或 `FULFILL_FAILED` 订单。
- 重试必须幂等，已有权益不得重复发放。
- 写入履约日志和管理员操作日志。

### 7. 订单导出

`GET /pc/admin/order/export`

权限：`order:export`

Query：同订单分页接口。

返回：Excel 文件流，字段与订单分页列表保持一致。

## 数据口径

- 流水金额：按支付成功时间统计实收现金金额。
- 积分抵扣：按订单实际抵扣积分和抵扣金额统计。
- 免费订单：现金金额与积分抵扣均为 0 的已履约订单。
- 支付转化率：支付成功订单数 / 进入结算次数。
- 履约完成率：履约完成订单数 / 支付成功订单数。
- 待支付金额：待支付订单当前应付现金金额汇总。

## 权限与审计

- 页面入口只对具备订单权限的管理员展示。
- 订单详情和支付流水建议拆分权限：`order:detail`、`payment:detail`。
- 关闭订单、重新履约必须记录操作日志，包含管理员 ID、订单号、操作前后状态、原因。
- 金额不一致、签名失败、重复回调、履约失败应进入风险队列，避免只在日志中沉没。

## 前端临时实现说明

- 当前前端页面先使用 `composables/orderAdmin.mjs` 中的模拟数据。
- 后续接入真实接口时，优先新增 `composables/Api/Admin/orderAdmin.js` 封装请求。
- 保持页面字段名与上面的接口响应一致，减少替换成本。
