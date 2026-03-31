# 0. 数据库设计

## 0.1 数据库表结构设计

### 0.1.1 开票公司表 (`company`)

| 字段名           | 类型     | 长度 | 是否为空 | 说明     | 备注         |
| ---------------- | -------- | ---- | -------- | -------- | ------------ |
| id               | BIGINT   | -    | NOT NULL | 主键ID   | 自增         |
| company_name     | VARCHAR  | 100  | NOT NULL | 公司名称 | 唯一         |
| tax_no           | VARCHAR  | 50   | NULL     | 公司税号 | -            |
| legal_person     | VARCHAR  | 50   | NULL     | 法人     | 新增字段     |
| register_address | VARCHAR  | 100  | NULL     | 注册地址 | -            |
| register_phone   | VARCHAR  | 50   | NULL     | 注册电话 | -            |
| bank_name        | VARCHAR  | 100  | NULL     | 银行名称 | -            |
| bank_account     | VARCHAR  | 100  | NULL     | 银行账号 | -            |
| contact_person   | VARCHAR  | 50   | NULL     | 联系人   | 新增字段     |
| contact_phone1   | VARCHAR  | 50   | NULL     | 电话1    | 新增字段     |
| remark1          | VARCHAR  | 100  | NULL     | 备注1    | -            |
| remark2          | VARCHAR  | 100  | NULL     | 备注2    | -            |
| remark3          | VARCHAR  | 100  | NULL     | 备注3    | -            |
| create_time      | DATETIME | -    | NOT NULL | 创建时间 | 默认当前时间 |
| update_time      | DATETIME | -    | NOT NULL | 更新时间 | 自动更新     |
| is_delete        | tinyint  | -    | NOT NULL | 是否删除 |              |

### 0.1.2 客户信息表 (`client`)

| 字段名           | 类型     | 长度 | 是否为空 | 说明       | 备注                             |
| ---------------- | -------- | ---- | -------- | ---------- | -------------------------------- |
| id               | BIGINT   | -    | NOT NULL | 主键ID     | 自增                             |
| company_name     | VARCHAR  | 100  | NOT NULL | 公司名称   | 唯一                             |
| tax_no           | VARCHAR  | 50   | NULL     | 公司税号   | -                                |
| legal_person     | VARCHAR  | 50   | NULL     | 法人       | 新增字段                         |
| register_address | VARCHAR  | 100  | NULL     | 注册地址   | -                                |
| register_phone   | VARCHAR  | 50   | NULL     | 注册电话   | -                                |
| bank_name        | VARCHAR  | 100  | NULL     | 银行名称   | -                                |
| bank_account     | VARCHAR  | 100  | NULL     | 银行账号   | -                                |
| user_name        | VARCHAR  | 50   | NULL     | 用户姓名   | 新增字段                         |
| user_phone       | VARCHAR  | 50   | NULL     | 用户电话   | 新增字段                         |
| email            | VARCHAR  | 100  | NULL     | 邮箱       | 新增字段                         |
| business_scope   | VARCHAR  | 150  | NULL     | 经营范围   | -                                |
| salesperson_id   | BIGINT   | -    | NULL     | 业务员ID   | 新增字段，逻辑外键关联employee表 |
| salesperson_name | VARCHAR  | 50   | NULL     | 业务员姓名 | 新增字段，冗余字段便于查询       |
| remark1          | VARCHAR  | 100  | NULL     | 备注1      | -                                |
| remark2          | VARCHAR  | 100  | NULL     | 备注2      | -                                |
| remark3          | VARCHAR  | 100  | NULL     | 备注3      | -                                |
| create_time      | DATETIME | -    | NOT NULL | 创建时间   | 默认当前时间                     |
| update_time      | DATETIME | -    | NOT NULL | 更新时间   | 自动更新                         |
| is_delete        | tinyint  | -    | NOT NULL | 是否删除   |                                  |

### 0.1.3 发票开票信息表 (`invoice_base`)

| 字段名              | 类型     | 长度 | 是否为空 | 说明         | 备注                                                   |
| ------------------- | -------- | ---- | -------- | ------------ | ------------------------------------------------------ |
| id                  | BIGINT   | -    | NOT NULL | 主键ID       | 自增                                                   |
| issuer_company_id   | BIGINT   | -    | NOT NULL | 开票公司ID   | 禁止使用外键，使用逻辑外键关联开票公司的ID             |
| issuer_client_id    | BIGINT   | -    | NOT NULL | 客户id       | 禁止使用外键，使用逻辑外键关联对应客户的ID             |
| issuer_company_name | VARCHAR  | 100  | NOT NULL | 开票单位名称 | -                                                      |
| issue_date          | DATE     | -    | NOT NULL | 开票日期     | -                                                      |
| amount              | DECIMAL  | 18,2 | NOT NULL | 开票金额     | 红字发票为负数                                         |
| invoice_no          | VARCHAR  | 100  | NOT NULL | 发票号码     | 唯一                                                   |
| invoice_type        | VARCHAR  | 50   | NULL     | 发票性质     | 普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他 |
| client_company_name | VARCHAR  | 150  | NOT NULL | 客户名称     | 备注由客户单位改为客户名称                             |
| client_person       | VARCHAR  | 50   | NULL     | 客户姓名     | -                                                      |
| issuer_id           | BIGINT   | -    | NULL     | 开票人ID     | 新增字段，逻辑外键关联employee表                       |
| issuer_name         | VARCHAR  | 50   | NULL     | 开票人姓名   | 新增字段，冗余字段便于查询                             |
| salesperson_id      | BIGINT   | -    | NULL     | 业务员ID     | 新增字段，逻辑外键关联employee表                       |
| salesperson_name    | VARCHAR  | 50   | NULL     | 业务员姓名   | 新增字段，冗余字段便于查询                             |
| mark                | VARCHAR  | 20   | NULL     | 标记         | 新增字段，000、DK3、DK4、DK5等                         |
| invoice_status      | VARCHAR  | 20   | NULL     | 发票状态     | 新增字段，蓝字发票、红字发票等                         |
| original_invoice_no | VARCHAR  | 100  | NULL     | 原发票号码   | 红字发票关联的原发票号码                               |
| remark1             | VARCHAR  | 100  | NULL     | 备注1        | -                                                      |
| remark2             | VARCHAR  | 100  | NULL     | 备注2        | -                                                      |
| remark3             | VARCHAR  | 100  | NULL     | 备注3        | -                                                      |
| create_time         | DATETIME | -    | NOT NULL | 创建时间     | 默认当前时间                                           |
| update_time         | DATETIME | -    | NOT NULL | 更新时间     | 自动更新                                               |
| is_delete           | tinyint  | -    | NOT NULL | 是否删除     | 逻辑删除                                               |

### 0.1.4 发票到款信息表 (`invoice_finish`)

| 字段名             | 类型     | 长度 | 是否为空 | 说明           | 备注                                         |
| ------------------ | -------- | ---- | -------- | -------------- | -------------------------------------------- |
| id                 | BIGINT   | -    | NOT NULL | 主键ID         | 自增                                         |
| invoice_base_id    | BIGINT   | -    | NOT NULL | 关联开票信息ID | 禁止使用外键，使用逻辑外键关联invoice_base表 |
| invoice_no         | VARCHAR  | 100  | NOT NULL | 发票号码       | 冗余字段便于查询                             |
| client_id          | BIGINT   | -    | NULL     | 客户ID         | 逻辑外键关联client表（可选）                 |
| client_company_name| VARCHAR  | 150  | NULL     | 客户名称       | 冗余字段便于查询                             |
| client_person      | VARCHAR  | 50   | NULL     | 客户姓名       | 冗余字段便于查询                             |
| paid_date          | DATE     | -    | NOT NULL | 到款日期       | -                                            |
| paid_amount        | DECIMAL  | 18,2 | NOT NULL | 到款金额       | -                                            |
| transfer_method    | VARCHAR  | 50   | NULL     | 转账方式       | 对公转账、微信、支付宝、现金、其他           |
| bank_transaction_id| BIGINT   | -    | NULL     | 关联银行收支ID | 逻辑外键关联bank_transaction表（可选，主要关联）|
| bank_transaction_no| VARCHAR  | 100  | NULL     | 银行收支编号   | 冗余字段便于查询和追溯                       |
| salesperson_id     | BIGINT   | -    | NULL     | 业务员ID       | 逻辑外键关联employee表                       |
| salesperson_name   | VARCHAR  | 50   | NULL     | 业务员姓名     | 冗余字段便于查询                             |
| remark1            | VARCHAR  | 100  | NULL     | 备注1          | 可用于记录其他关联的银行收支记录信息         |
| remark2            | VARCHAR  | 100  | NULL     | 备注2          | -                                            |
| remark3            | VARCHAR  | 100  | NULL     | 备注3          | -                                            |
| create_time        | DATETIME | -    | NOT NULL | 创建时间       | 默认当前时间                                 |
| update_time        | DATETIME | -    | NOT NULL | 更新时间       | 自动更新                                     |
| is_delete          | tinyint  | -    | NOT NULL | 是否删除       | 逻辑删除                                     |

**关联关系说明：**
- 一个发票到款记录主要关联一个银行收支记录（通过 `bank_transaction_id`）
- 如果一个发票对应多个银行收支记录（分次到款），可以创建多条 `invoice_finish` 记录，每条记录关联一个银行收支记录
- 如果存在其他关联关系，可在 `remark1` 中记录其他银行收支记录的ID或编号

### 0.1.5 供应商信息表 (`supplier`)

| 字段名           | 类型     | 长度 | 是否为空 | 说明     | 备注         |
| ---------------- | -------- | ---- | -------- | -------- | ------------ |
| id               | BIGINT   | -    | NOT NULL | 主键ID   | 自增         |
| company_name     | VARCHAR  | 100  | NOT NULL | 公司名称 | 唯一         |
| tax_no           | VARCHAR  | 50   | NULL     | 公司税号 | -            |
| legal_person     | VARCHAR  | 50   | NULL     | 法人     | -            |
| register_address | VARCHAR  | 100  | NULL     | 注册地址 | -            |
| register_phone   | VARCHAR  | 50   | NULL     | 注册电话 | -            |
| bank_name        | VARCHAR  | 100  | NULL     | 银行名称 | -            |
| bank_account     | VARCHAR  | 100  | NULL     | 银行账号 | -            |
| supplier_name    | VARCHAR  | 50   | NULL     | 供货姓名 | -            |
| supplier_phone   | VARCHAR  | 50   | NULL     | 供货电话 | -            |
| email            | VARCHAR  | 100  | NULL     | 邮箱     | -            |
| business_scope   | VARCHAR  | 150  | NULL     | 经营范围 | -            |
| remark1          | VARCHAR  | 100  | NULL     | 备注1    | -            |
| remark2          | VARCHAR  | 100  | NULL     | 备注2    | -            |
| remark3          | VARCHAR  | 100  | NULL     | 备注3    | -            |
| create_time      | DATETIME | -    | NOT NULL | 创建时间 | 默认当前时间 |
| update_time      | DATETIME | -    | NOT NULL | 更新时间 | 自动更新     |
| is_delete        | tinyint  | -    | NOT NULL | 是否删除 |              |

### 0.1.6 银行收支明细表 (`bank_transaction`)

| 字段名             | 类型     | 长度 | 是否为空 | 说明           | 备注                                         |
| ------------------ | -------- | ---- | -------- | -------------- | -------------------------------------------- |
| id                 | BIGINT   | -    | NOT NULL | 主键ID         | 自增                                         |
| company_id         | BIGINT   | -    | NOT NULL | 公司ID         | 逻辑外键关联company表                         |
| company_name       | VARCHAR  | 100  | NOT NULL | 公司名称       | 冗余字段便于查询                             |
| client_id          | BIGINT   | -    | NULL     | 客户ID         | 逻辑外键关联client表（可选）                  |
| client_company_name| VARCHAR  | 150  | NULL     | 客户名称       | 冗余字段便于查询                             |
| client_phone      | VARCHAR  | 50   | NULL     | 客户电话       | 冗余字段便于查询                             |
| salesperson_id     | BIGINT   | -    | NULL     | 业务员ID       | 逻辑外键关联employee表                       |
| salesperson_name   | VARCHAR  | 50   | NULL     | 业务员姓名     | 冗余字段便于查询                             |
| arrival_time       | DATETIME | -    | NOT NULL | 到账时间       | -                                            |
| amount             | DECIMAL  | 18,2 | NOT NULL | 到款金额       | -                                            |
| invoice_finish_id  | BIGINT   | -    | NULL     | 关联入账信息ID | 逻辑外键关联invoice_finish表（可选，主要关联）|
| invoice_no         | VARCHAR  | 100  | NULL     | 关联发票号码   | 冗余字段便于查询，支持多个发票号码用逗号分隔 |
| invoice_base_id    | BIGINT   | -    | NULL     | 关联开票信息ID | 逻辑外键关联invoice_base表（可选，冗余字段） |
| remark1            | VARCHAR  | 100  | NULL     | 备注1          | 可用于记录其他关联的发票到款记录信息         |
| remark2            | VARCHAR  | 100  | NULL     | 备注2          | -                                            |
| remark3            | VARCHAR  | 100  | NULL     | 备注3          | -                                            |
| create_time        | DATETIME | -    | NOT NULL | 创建时间       | 默认当前时间                                 |
| update_time        | DATETIME | -    | NOT NULL | 更新时间       | 自动更新                                     |
| is_delete          | tinyint  | -    | NOT NULL | 是否删除       | 逻辑删除                                     |

**关联关系说明：**
- 一个银行收支记录主要关联一个发票到款记录（通过 `invoice_finish_id`）
- 如果一个银行收支记录对应多个发票（一笔转账覆盖多张发票），可以在 `invoice_no` 字段中用逗号分隔多个发票号码，并在 `remark1` 中记录其他发票到款记录的ID
- 如果一个发票对应多个银行收支记录（分次到款），可以创建多条 `invoice_finish` 记录，每条记录关联一个银行收支记录

### 0.1.7 进项发票表 (`input_invoice`)

| 字段名           | 类型     | 长度 | 是否为空 | 说明         | 备注                                         |
| ---------------- | -------- | ---- | -------- | ------------ | -------------------------------------------- |
| id               | BIGINT   | -    | NOT NULL | 主键ID       | 自增                                         |
| company_id       | BIGINT   | -    | NOT NULL | 公司ID       | 逻辑外键关联company表                         |
| company_name     | VARCHAR  | 100  | NOT NULL | 公司名称     | 冗余字段便于查询                             |
| salesperson_id   | BIGINT   | -    | NULL     | 业务员ID     | 逻辑外键关联employee表                       |
| salesperson_name | VARCHAR  | 50   | NULL     | 业务员姓名   | 冗余字段便于查询                             |
| issue_date       | DATE     | -    | NOT NULL | 开票日期     | -                                            |
| amount           | DECIMAL  | 18,2 | NOT NULL | 开票金额     | -                                            |
| invoice_no       | VARCHAR  | 100  | NOT NULL | 发票号码     | 唯一                                         |
| supplier_id      | BIGINT   | -    | NULL     | 供货单位ID   | 逻辑外键关联supplier表（可选）                |
| supplier_name    | VARCHAR  | 100  | NOT NULL | 供货单位     | 冗余字段便于查询                             |
| supplier_contact| VARCHAR  | 50   | NULL     | 供货姓名     | 冗余字段便于查询                             |
| payment_date     | DATE     | -    | NULL     | 付款日期     | -                                            |
| payment_amount   | DECIMAL  | 18,2 | NULL     | 付款金额     | -                                            |
| invoice_type     | VARCHAR  | 50   | NULL     | 票类型       | 普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他 |
| invoice_purpose  | VARCHAR  | 50   | NULL     | 票用途       | 采购付款、费用报销、其他用途                 |
| is_accounted     | TINYINT  | -    | NULL     | 财务入账     | 0-否，1-是                                   |
| invoice_status   | VARCHAR  | 20   | NULL     | 票状态       | -                                            |
| remark1          | VARCHAR  | 100  | NULL     | 备注1        | -                                            |
| remark2          | VARCHAR  | 100  | NULL     | 备注2        | -                                            |
| remark3          | VARCHAR  | 100  | NULL     | 备注3        | -                                            |
| create_time      | DATETIME | -    | NOT NULL | 创建时间     | 默认当前时间                                 |
| update_time      | DATETIME | -    | NOT NULL | 更新时间     | 自动更新                                     |
| is_delete        | tinyint  | -    | NOT NULL | 是否删除     | 逻辑删除                                     |

### 0.1.8 员工信息表 (`employee`)

| 字段名        | 类型     | 长度 | 是否为空 | 说明         | 备注         |
| ------------- | -------- | ---- | -------- | ------------ | ------------ |
| id            | BIGINT   | -    | NOT NULL | 主键ID       | 自增         |
| employee_no   | VARCHAR  | 50   | NOT NULL | 工号         | 唯一         |
| company_id    | BIGINT   | -    | NOT NULL | 公司ID       | 逻辑外键关联company表 |
| company_name  | VARCHAR  | 100  | NOT NULL | 公司名称     | 冗余字段便于查询 |
| name          | VARCHAR  | 50   | NOT NULL | 员工姓名     | -            |
| gender        | VARCHAR  | 10   | NULL     | 性别         | 男、女       |
| birth_date    | DATE     | -    | NULL     | 出生年月     | -            |
| department    | VARCHAR  | 100  | NULL     | 部门名称     | -            |
| position      | VARCHAR  | 100  | NULL     | 岗位         | -            |
| phone         | VARCHAR  | 50   | NULL     | 联系电话     | -            |
| id_card       | VARCHAR  | 18   | NULL     | 身份证号     | -            |
| hire_date     | DATE     | -    | NULL     | 入职日期     | -            |
| regular_date  | DATE     | -    | NULL     | 转正日期     | -            |
| permission    | VARCHAR  | 50   | NULL     | 人员权限     | 查询功能、所有功能 |
| expiry_date   | DATE     | -    | NULL     | 有效期止     | -            |
| remark1       | VARCHAR  | 100  | NULL     | 备注1        | -            |
| create_time   | DATETIME | -    | NOT NULL | 创建时间     | 默认当前时间 |
| update_time   | DATETIME | -    | NOT NULL | 更新时间     | 自动更新     |
| is_delete     | tinyint  | -    | NOT NULL | 是否删除     |              |

### 0.1.9 转账方式配置表 (`transfer_method`)

| 字段名      | 类型     | 长度 | 是否为空 | 说明     | 备注         |
| ----------- | -------- | ---- | -------- | -------- | ------------ |
| id          | BIGINT   | -    | NOT NULL | 主键ID   | 自增         |
| method_name | VARCHAR  | 50   | NOT NULL | 转账方式 | 唯一，如：对公转账、微信、支付宝、现金、其他 |
| sort_order  | INT      | -    | NULL     | 排序顺序 | 用于控制显示顺序，数字越小越靠前 |
| is_enabled  | tinyint  | -    | NOT NULL | 是否启用 | 0-禁用，1-启用，默认1 |
| remark      | VARCHAR  | 200  | NULL     | 备注     | -            |
| create_time | DATETIME | -    | NOT NULL | 创建时间 | 默认当前时间 |
| update_time | DATETIME | -    | NOT NULL | 更新时间 | 自动更新     |
| is_delete   | tinyint  | -    | NOT NULL | 是否删除 | 逻辑删除     |

### 0.1.10 发票性质配置表 (`invoice_type`)

| 字段名      | 类型     | 长度 | 是否为空 | 说明     | 备注         |
| ----------- | -------- | ---- | -------- | -------- | ------------ |
| id          | BIGINT   | -    | NOT NULL | 主键ID   | 自增         |
| type_name   | VARCHAR  | 50   | NOT NULL | 发票性质 | 唯一，如：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他 |
| sort_order  | INT      | -    | NULL     | 排序顺序 | 用于控制显示顺序，数字越小越靠前 |
| is_enabled  | tinyint  | -    | NOT NULL | 是否启用 | 0-禁用，1-启用，默认1 |
| remark      | VARCHAR  | 200  | NULL     | 备注     | -            |
| create_time | DATETIME | -    | NOT NULL | 创建时间 | 默认当前时间 |
| update_time | DATETIME | -    | NOT NULL | 更新时间 | 自动更新     |
| is_delete   | tinyint  | -    | NOT NULL | 是否删除 | 逻辑删除     |

## 0.2 索引设计

### 0.2.1 开票公司表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 公司名称唯一索引（用于快速查找和去重）
UNIQUE KEY `uk_company_name` (`company_name`)

-- 公司税号索引（用于筛选查询）
KEY `idx_tax_no` (`tax_no`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.2 客户信息表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 公司名称唯一索引（用于快速查找和去重）
UNIQUE KEY `uk_company_name` (`company_name`)

-- 公司税号索引（用于筛选查询）
KEY `idx_tax_no` (`tax_no`)

-- 用户姓名索引（用于筛选查询）
KEY `idx_user_name` (`user_name`)

-- 用户电话索引（用于筛选查询）
KEY `idx_user_phone` (`user_phone`)

-- 邮箱索引（用于筛选查询）
KEY `idx_email` (`email`)

-- 业务员ID索引（用于关联查询）
KEY `idx_salesperson_id` (`salesperson_id`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.3 发票开票信息表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 发票号码唯一索引（保证发票号码全局唯一）
UNIQUE KEY `uk_invoice_no` (`invoice_no`)

-- 开票公司ID索引（加速按开票公司维度的查询和汇总）
KEY `idx_issuer_company_id` (`issuer_company_id`)

-- 开票单位索引（用于快速查找和筛选）
KEY `idx_issuer_company_name` (`issuer_company_name`)

-- 开票日期索引（时间段筛选和按日期统计的核心索引）
KEY `idx_issue_date` (`issue_date`)

-- 客户单位索引（用于快速检索指定客户的所有发票）
KEY `idx_client_company_name` (`client_company_name`)

-- 客户联系人索引（用于筛选查询）
KEY `idx_client_person` (`client_person`)

-- 发票性质索引（用于统计时快速区分发票类型）
KEY `idx_invoice_type` (`invoice_type`)

-- 原发票号码索引（用于红字发票关联查询）
KEY `idx_original_invoice_no` (`original_invoice_no`)

-- 开票人ID索引（用于关联查询）
KEY `idx_issuer_id` (`issuer_id`)

-- 业务员ID索引（用于关联查询）
KEY `idx_salesperson_id` (`salesperson_id`)

-- 标记索引（用于筛选查询）
KEY `idx_mark` (`mark`)

-- 发票状态索引（用于筛选查询）
KEY `idx_invoice_status` (`invoice_status`)

-- 复合索引：开票公司名称+开票日期（用于按公司和时间段查询，提升查询性能）
KEY `idx_issuer_date` (`issuer_company_name`, `issue_date`)

-- 复合索引：客户单位名称+开票日期（用于按客户和时间段查询）
KEY `idx_client_date` (`client_company_name`, `issue_date`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.4 发票到款信息表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 关联开票信息ID索引（用于快速关联查询）
KEY `idx_invoice_base_id` (`invoice_base_id`)

-- 发票号码索引（用于快速查找）
KEY `idx_invoice_no` (`invoice_no`)

-- 客户ID索引（用于关联查询）
KEY `idx_client_id` (`client_id`)

-- 业务员ID索引（用于关联查询）
KEY `idx_salesperson_id` (`salesperson_id`)

-- 银行收支ID索引（用于关联查询）
KEY `idx_bank_transaction_id` (`bank_transaction_id`)

-- 到款日期索引（用于时间段筛选）
KEY `idx_paid_date` (`paid_date`)

-- 转账方式索引（用于筛选查询）
KEY `idx_transfer_method` (`transfer_method`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.5 供应商信息表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 公司名称唯一索引（用于快速查找和去重）
UNIQUE KEY `uk_company_name` (`company_name`)

-- 公司税号索引（用于筛选查询）
KEY `idx_tax_no` (`tax_no`)

-- 供货姓名索引（用于筛选查询）
KEY `idx_supplier_name` (`supplier_name`)

-- 供货电话索引（用于筛选查询）
KEY `idx_supplier_phone` (`supplier_phone`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.7.1 进项发票表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 发票号码唯一索引（保证发票号码全局唯一）
UNIQUE KEY `uk_invoice_no` (`invoice_no`)

-- 公司ID索引（用于关联查询）
KEY `idx_company_id` (`company_id`)

-- 公司名称索引（用于筛选查询）
KEY `idx_company_name` (`company_name`)

-- 业务员ID索引（用于关联查询）
KEY `idx_salesperson_id` (`salesperson_id`)

-- 开票日期索引（用于时间段筛选）
KEY `idx_issue_date` (`issue_date`)

-- 开票金额索引（用于金额筛选）
KEY `idx_amount` (`amount`)

-- 票类型索引（用于筛选查询）
KEY `idx_invoice_type` (`invoice_type`)

-- 供货单位ID索引（用于关联查询）
KEY `idx_supplier_id` (`supplier_id`)

-- 供货单位索引（用于筛选查询）
KEY `idx_supplier_name` (`supplier_name`)

-- 票用途索引（用于筛选查询）
KEY `idx_invoice_purpose` (`invoice_purpose`)

-- 财务入账索引（用于筛选查询）
KEY `idx_is_accounted` (`is_accounted`)

-- 票状态索引（用于筛选查询）
KEY `idx_invoice_status` (`invoice_status`)

-- 付款日期索引（用于时间段筛选）
KEY `idx_payment_date` (`payment_date`)

-- 复合索引：公司ID+开票日期（用于按公司和时间段查询）
KEY `idx_company_issue_date` (`company_id`, `issue_date`)

-- 复合索引：供货单位+开票日期（用于按供货单位和时间段查询）
KEY `idx_supplier_issue_date` (`supplier_name`, `issue_date`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.6 银行收支明细表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 公司ID索引（用于关联查询）
KEY `idx_company_id` (`company_id`)

-- 客户ID索引（用于关联查询）
KEY `idx_client_id` (`client_id`)

-- 业务员ID索引（用于关联查询）
KEY `idx_salesperson_id` (`salesperson_id`)

-- 到账时间索引（用于时间段筛选）
KEY `idx_arrival_time` (`arrival_time`)

-- 关联入账信息ID索引（用于追溯）
KEY `idx_invoice_finish_id` (`invoice_finish_id`)

-- 关联开票信息ID索引（用于追溯）
KEY `idx_invoice_base_id` (`invoice_base_id`)

-- 发票号码索引（用于快速查找）
KEY `idx_invoice_no` (`invoice_no`)

-- 复合索引：公司ID+到账时间（用于按公司和时间段查询）
KEY `idx_company_arrival_time` (`company_id`, `arrival_time`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.8 员工信息表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 工号唯一索引（保证工号全局唯一）
UNIQUE KEY `uk_employee_no` (`employee_no`)

-- 公司ID索引（用于关联查询）
KEY `idx_company_id` (`company_id`)

-- 员工姓名索引（用于筛选查询）
KEY `idx_name` (`name`)

-- 部门名称索引（用于筛选查询）
KEY `idx_department` (`department`)

-- 人员权限索引（用于筛选查询）
KEY `idx_permission` (`permission`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.9 转账方式配置表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 转账方式名称唯一索引（保证转账方式名称唯一）
UNIQUE KEY `uk_method_name` (`method_name`)

-- 排序顺序索引（用于排序查询）
KEY `idx_sort_order` (`sort_order`)

-- 是否启用索引（用于筛选启用的转账方式）
KEY `idx_is_enabled` (`is_enabled`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

### 0.2.10 发票性质配置表索引

```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 发票性质名称唯一索引（保证发票性质名称唯一）
UNIQUE KEY `uk_type_name` (`type_name`)

-- 排序顺序索引（用于排序查询）
KEY `idx_sort_order` (`sort_order`)

-- 是否启用索引（用于筛选启用的发票性质）
KEY `idx_is_enabled` (`is_enabled`)

-- 逻辑删除索引（用于过滤已删除记录）
KEY `idx_is_delete` (`is_delete`)
```

## 0.3 表关系说明

### 0.3.1 关联关系图

```
公司信息 (company)
    ├── 开票信息 (invoice_base) [issuer_company_id]
    ├── 银行收支明细 (bank_transaction) [company_id]
    ├── 员工信息 (employee) [company_id]
    └── 进项发票 (input_invoice) [company_id]

客户信息 (client)
    ├── 开票信息 (invoice_base) [issuer_client_id]
    ├── 入账信息 (invoice_finish) [client_id]
    └── 银行收支明细 (bank_transaction) [client_id]

员工信息 (employee)
    ├── 客户信息 (client) [salesperson_id]
    ├── 开票信息 (invoice_base) [issuer_id, salesperson_id]
    ├── 入账信息 (invoice_finish) [salesperson_id]
    ├── 银行收支明细 (bank_transaction) [salesperson_id]
    └── 进项发票 (input_invoice) [salesperson_id]

开票信息 (invoice_base)
    └── 入账信息 (invoice_finish) [invoice_base_id]

入账信息 (invoice_finish)
    └── 银行收支明细 (bank_transaction) [bank_transaction_id]

银行收支明细 (bank_transaction)
    └── 入账信息 (invoice_finish) [invoice_finish_id]
    └── 开票信息 (invoice_base) [invoice_base_id]

转账方式配置 (transfer_method)
    ├── 入账信息 (invoice_finish) [transfer_method字段值引用]
    └── 银行收支明细 (bank_transaction) [transfer_method字段值引用，可选]

发票性质配置 (invoice_type)
    └── 开票信息 (invoice_base) [invoice_type字段值引用]
```

### 0.3.2 关联关系说明

1. **公司信息表 (company)**
   - 被开票信息表引用（开票单位）
   - 被银行收支明细表引用（公司）
   - 被员工信息表引用（所属公司）

2. **客户信息表 (client)**
   - 被开票信息表引用（客户）
   - 被入账信息表引用（客户，可选）
   - 被银行收支明细表引用（客户，可选）
   - 引用员工信息表（业务员）

3. **员工信息表 (employee)**
   - 被客户信息表引用（业务员）
   - 被开票信息表引用（开票人、业务员）
   - 被入账信息表引用（业务员）
   - 被银行收支明细表引用（业务员）
   - 引用公司信息表（所属公司）

4. **开票信息表 (invoice_base)**
   - 引用公司信息表（开票公司）
   - 引用客户信息表（客户）
   - 引用员工信息表（开票人、业务员）
   - 被入账信息表引用（开票信息）

5. **入账信息表 (invoice_finish)**
   - 引用开票信息表（开票信息）
   - 引用客户信息表（客户，可选）
   - 引用员工信息表（业务员）
   - 引用银行收支明细表（银行收支，可选，主要关联）
   - 支持一个发票对应多个银行收支记录（分次到款），通过创建多条记录实现

6. **银行收支明细表 (bank_transaction)**
   - 引用公司信息表（公司）
   - 引用客户信息表（客户，可选）
   - 引用员工信息表（业务员）
   - 引用入账信息表（入账信息，可选，主要关联）
   - 引用开票信息表（开票信息，可选，冗余字段）
   - 支持一个银行收支记录对应多个发票（一笔转账覆盖多张发票），通过 `invoice_no` 字段用逗号分隔多个发票号码

7. **供应商信息表 (supplier)**
   - 被进项发票表引用（供货单位）

8. **进项发票表 (input_invoice)**
   - 引用公司信息表（公司）
   - 引用员工信息表（业务员）
   - 引用供应商信息表（供货单位，可选）
   - 用于记录公司收到的进项发票信息

9. **转账方式配置表 (transfer_method)**
   - 被入账信息表引用（转账方式字段的值来源于此表）
   - 被银行收支明细表引用（转账方式字段的值来源于此表，可选）
   - 用于基础数据管理，管理员可以增删改转账方式选项

10. **发票性质配置表 (invoice_type)**
   - 被开票信息表引用（发票性质字段的值来源于此表）
   - 用于基础数据管理，管理员可以增删改发票性质选项

### 0.3.3 配置表使用说明

**转账方式配置表 (transfer_method)：**
- 用于管理系统中可用的转账方式选项
- 管理员可以通过增删改操作管理转账方式
- 默认数据：对公转账、微信、支付宝、现金、其他
- 在创建入账信息时，从该表获取可用的转账方式列表

**发票性质配置表 (invoice_type)：**
- 用于管理系统中可用的发票性质选项
- 管理员可以通过增删改操作管理发票性质
- 默认数据：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他
- 在创建发票信息时，从该表获取可用的发票性质列表

### 0.3.4 数据同步说明

**发票入账与银行收支明细的关联关系：**

**主要场景（一对一关系）：**
- 当创建 `invoice_finish` 记录时，系统可以自动创建对应的 `bank_transaction` 记录
- 字段映射关系：
  - `bank_transaction.company_id` ← `invoice_base.issuer_company_id`
  - `bank_transaction.company_name` ← `invoice_base.issuer_company_name`
  - `bank_transaction.client_id` ← `invoice_base.issuer_client_id`
  - `bank_transaction.client_company_name` ← `invoice_base.client_company_name`
  - `bank_transaction.client_phone` ← `client.user_phone` 或 `client.contact_phone`
  - `bank_transaction.salesperson_id` ← `invoice_finish.salesperson_id`
  - `bank_transaction.salesperson_name` ← `invoice_finish.salesperson_name`
  - `bank_transaction.arrival_time` ← `invoice_finish.paid_date`
  - `bank_transaction.amount` ← `invoice_finish.paid_amount`
  - `bank_transaction.invoice_finish_id` ← `invoice_finish.id`
  - `bank_transaction.invoice_no` ← `invoice_finish.invoice_no`
  - `bank_transaction.invoice_base_id` ← `invoice_base.id`
  - `bank_transaction.remark1-3` ← `invoice_finish.remark1-3`
  - `invoice_finish.bank_transaction_id` ← 新创建的 `bank_transaction.id`

**多对多关系处理方案：**

**场景1：一个发票对应多个银行收支记录（分次到款）**
- 创建多条 `invoice_finish` 记录，每条记录对应一次到款
- 每条 `invoice_finish` 记录关联一个 `bank_transaction` 记录
- 每条记录的 `paid_amount` 为本次到款金额，总和应等于发票总金额

**场景2：一个银行收支记录对应多个发票（一笔转账覆盖多张发票）**
- 在 `bank_transaction.invoice_no` 字段中用逗号分隔多个发票号码，如："INV001,INV002,INV003"
- `bank_transaction.invoice_finish_id` 关联主要发票的到款记录ID
- 在 `bank_transaction.remark1` 中记录其他发票到款记录的ID，如："其他关联发票：finish_id_2,finish_id_3"
- 对应的多个 `invoice_finish` 记录的 `bank_transaction_id` 都指向同一个 `bank_transaction.id`

**业务规则：**
- 主要关联关系通过 `invoice_finish.bank_transaction_id` 和 `bank_transaction.invoice_finish_id` 维护
- 次要关联关系通过冗余字段（`invoice_no`、`remark1`）记录
- 系统应提供双向查询功能：从发票到款记录查询关联的银行收支记录，从银行收支记录查询关联的发票到款记录

