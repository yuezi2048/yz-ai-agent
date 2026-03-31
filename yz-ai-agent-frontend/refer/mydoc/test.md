分析7张表的结构关系，并给出需要添加的关联字段建议。

## 表结构关系分析

### 一、表关系图

```
公司信息 (company)
    ├── 开票信息 (invoice_base) [开票单位]
    ├── 银行收支明细 (bank_transaction) [公司名称]
    └── 员工信息 (employee) [公司名称]

客户信息 (client)
    ├── 开票信息 (invoice_base) [客户名称、客户姓名]
    ├── 入账信息 (invoice_finish) [客户名称、客户姓名]
    └── 银行收支明细 (bank_transaction) [客户名称、客户电话]

员工信息 (employee)
    ├── 开票信息 (invoice_base) [开票人、业务员]
    ├── 入账信息 (invoice_finish) [业务员]
    ├── 银行收支明细 (bank_transaction) [业务员]
    └── 客户信息 (client) [业务员]

供应商信息 (supplier)
    └── (暂无直接关联，但可能需要用于采购等扩展功能)

开票信息 (invoice_base)
    └── 入账信息 (invoice_finish) [发票号码]
```

### 二、各表详细分析与需要添加的字段

#### 1. 公司信息表 (company)

**现有字段：**
- 公司名称、公司税号、法人、注册地址、注册电话、银行名称、银行账号、联系人、电话1、备注1-3

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
create_time DATETIME DEFAULT CURRENT_TIMESTAMP  -- 创建时间
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- 更新时间
is_delete TINYINT DEFAULT 0  -- 逻辑删除标记
```

**关联关系：**
- 被 `invoice_base` 引用（开票单位）
- 被 `bank_transaction` 引用（公司名称）
- 被 `employee` 引用（公司名称）

---

#### 2. 客户信息表 (client)

**现有字段：**
- 公司名称、公司税号、法人、注册地址、注册电话、银行名称、银行账号、用户姓名、用户电话、邮箱、经营范围、业务员、备注1-3

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
salesperson_id BIGINT  -- 业务员ID（关联员工表）
salesperson_name VARCHAR(50)  -- 业务员姓名（冗余字段，便于查询）
create_time DATETIME DEFAULT CURRENT_TIMESTAMP
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
is_delete TINYINT DEFAULT 0
```

**关联关系：**
- `salesperson_id` → `employee.id`（业务员）
- 被 `invoice_base` 引用（客户信息）
- 被 `invoice_finish` 引用（客户信息）
- 被 `bank_transaction` 引用（客户信息）

---

#### 3. 供应商信息表 (supplier)

**现有字段：**
- 公司名称、公司税号、法人、注册地址、注册电话、银行名称、银行账号、联系人、电话1、邮箱、经营范围、备注1-3

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
create_time DATETIME DEFAULT CURRENT_TIMESTAMP
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
is_delete TINYINT DEFAULT 0
```

**关联关系：**
- 当前无直接关联，预留扩展

---

#### 4. 开票信息表 (invoice_base)

**现有字段：**
- 开票日期、开票金额、发票号码、客户名称、客户姓名、开票人、标记、发票性质、发票状态、备注1-3

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
issuer_company_id BIGINT NOT NULL  -- 开票公司ID（关联公司表）
issuer_company_name VARCHAR(100) NOT NULL  -- 开票公司名称（冗余字段）
client_id BIGINT NOT NULL  -- 客户ID（关联客户表）
client_company_name VARCHAR(150) NOT NULL  -- 客户公司名称（冗余字段）
client_person VARCHAR(50)  -- 客户姓名（冗余字段）
issuer_id BIGINT  -- 开票人ID（关联员工表）
issuer_name VARCHAR(50)  -- 开票人姓名（冗余字段）
salesperson_id BIGINT  -- 业务员ID（关联员工表）
salesperson_name VARCHAR(50)  -- 业务员姓名（冗余字段）
mark VARCHAR(20)  -- 标记（000、DK3、DK4、DK5等）
invoice_type VARCHAR(50)  -- 发票性质
invoice_status VARCHAR(20)  -- 发票状态（未到款、已到款、红字发票、已冲红）
original_invoice_no VARCHAR(100)  -- 原发票号码（红字发票关联）
amount DECIMAL(18,2) NOT NULL  -- 开票金额（红字发票为负数）
create_time DATETIME DEFAULT CURRENT_TIMESTAMP
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
is_delete TINYINT DEFAULT 0
```

**关联关系：**
- `issuer_company_id` → `company.id`（开票公司）
- `client_id` → `client.id`（客户）
- `issuer_id` → `employee.id`（开票人）
- `salesperson_id` → `employee.id`（业务员）
- 被 `invoice_finish` 引用（通过发票号码或ID）

**索引建议：**
```sql
UNIQUE KEY uk_invoice_no (invoice_no)  -- 发票号码唯一索引
KEY idx_issuer_company_id (issuer_company_id)
KEY idx_client_id (client_id)
KEY idx_issuer_id (issuer_id)
KEY idx_salesperson_id (salesperson_id)
KEY idx_issue_date (issue_date)
KEY idx_invoice_status (invoice_status)
KEY idx_mark (mark)
KEY idx_original_invoice_no (original_invoice_no)
```

---

#### 5. 入账（到款信息）表 (invoice_finish)

**现有字段：**
- 发票号码、客户名称、客户姓名、到款日期、到款金额、转账方式、业务员、备注1-3

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
invoice_base_id BIGINT NOT NULL  -- 关联开票信息ID（关联开票表）
invoice_no VARCHAR(100) NOT NULL  -- 发票号码（冗余字段，便于查询）
client_id BIGINT  -- 客户ID（关联客户表，可选，因为可以从invoice_base获取）
client_company_name VARCHAR(150)  -- 客户公司名称（冗余字段）
client_person VARCHAR(50)  -- 客户姓名（冗余字段）
salesperson_id BIGINT  -- 业务员ID（关联员工表）
salesperson_name VARCHAR(50)  -- 业务员姓名（冗余字段）
paid_date DATE NOT NULL  -- 到款日期
paid_amount DECIMAL(18,2) NOT NULL  -- 到款金额
transfer_method VARCHAR(50)  -- 转账方式
create_time DATETIME DEFAULT CURRENT_TIMESTAMP
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
is_delete TINYINT DEFAULT 0
```

**关联关系：**
- `invoice_base_id` → `invoice_base.id`（开票信息）
- `client_id` → `client.id`（客户，可选）
- `salesperson_id` → `employee.id`（业务员）

**索引建议：**
```sql
KEY idx_invoice_base_id (invoice_base_id)
KEY idx_invoice_no (invoice_no)
KEY idx_client_id (client_id)
KEY idx_salesperson_id (salesperson_id)
KEY idx_paid_date (paid_date)
KEY idx_transfer_method (transfer_method)
```

---

#### 6. 银行收支明细表 (bank_transaction)

**现有字段：**
- 公司名称、到账时间、到款金额、客户名称、客户电话、业务员、备注1-3

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
company_id BIGINT NOT NULL  -- 公司ID（关联公司表）
company_name VARCHAR(100) NOT NULL  -- 公司名称（冗余字段）
client_id BIGINT  -- 客户ID（关联客户表，可选）
client_company_name VARCHAR(150)  -- 客户公司名称（冗余字段）
client_phone VARCHAR(50)  -- 客户电话（冗余字段）
salesperson_id BIGINT  -- 业务员ID（关联员工表）
salesperson_name VARCHAR(50)  -- 业务员姓名（冗余字段）
arrival_time DATETIME NOT NULL  -- 到账时间
amount DECIMAL(18,2) NOT NULL  -- 到款金额
invoice_finish_id BIGINT  -- 关联入账信息ID（可选，用于追溯）
invoice_no VARCHAR(100)  -- 关联发票号码（可选，用于追溯）
create_time DATETIME DEFAULT CURRENT_TIMESTAMP
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
is_delete TINYINT DEFAULT 0
```

**关联关系：**
- `company_id` → `company.id`（公司）
- `client_id` → `client.id`（客户，可选）
- `salesperson_id` → `employee.id`（业务员）
- `invoice_finish_id` → `invoice_finish.id`（入账信息，可选，用于追溯）

**索引建议：**
```sql
KEY idx_company_id (company_id)
KEY idx_client_id (client_id)
KEY idx_salesperson_id (salesperson_id)
KEY idx_arrival_time (arrival_time)
KEY idx_invoice_finish_id (invoice_finish_id)
```

---

#### 7. 员工信息表 (employee)

**现有字段：**
- 员工姓名、工号、公司名称、性别、出生年月、年龄、部门名称、岗位、联系电话、身份证号、入职日期、转正日期、人员权限、有效期止、备注1

**需要添加的字段：**
```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT  -- 主键ID（必须）
employee_no VARCHAR(50) UNIQUE  -- 工号（唯一）
company_id BIGINT NOT NULL  -- 公司ID（关联公司表）
company_name VARCHAR(100) NOT NULL  -- 公司名称（冗余字段）
name VARCHAR(50) NOT NULL  -- 员工姓名
gender VARCHAR(10)  -- 性别（男、女）
birth_date DATE  -- 出生年月
age INT  -- 年龄（可计算字段，建议不存储，通过出生年月计算）
department VARCHAR(100)  -- 部门名称
position VARCHAR(100)  -- 岗位
phone VARCHAR(50)  -- 联系电话
id_card VARCHAR(18)  -- 身份证号
hire_date DATE  -- 入职日期
regular_date DATE  -- 转正日期
permission VARCHAR(50)  -- 人员权限（查询功能、所有功能）
expiry_date DATE  -- 有效期止
create_time DATETIME DEFAULT CURRENT_TIMESTAMP
update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
is_delete TINYINT DEFAULT 0
```

**关联关系：**
- `company_id` → `company.id`（公司）
- 被 `client` 引用（业务员）
- 被 `invoice_base` 引用（开票人、业务员）
- 被 `invoice_finish` 引用（业务员）
- 被 `bank_transaction` 引用（业务员）

**索引建议：**
```sql
UNIQUE KEY uk_employee_no (employee_no)  -- 工号唯一索引
KEY idx_company_id (company_id)
KEY idx_name (name)
KEY idx_department (department)
KEY idx_permission (permission)
```

---

### 三、关联关系总结表

| 主表             | 关联字段          | 关联表         | 关联类型 | 说明             |
| ---------------- | ----------------- | -------------- | -------- | ---------------- |
| invoice_base     | issuer_company_id | company        | 多对一   | 开票公司         |
| invoice_base     | client_id         | client         | 多对一   | 客户             |
| invoice_base     | issuer_id         | employee       | 多对一   | 开票人           |
| invoice_base     | salesperson_id    | employee       | 多对一   | 业务员           |
| invoice_finish   | invoice_base_id   | invoice_base   | 多对一   | 开票信息         |
| invoice_finish   | client_id         | client         | 多对一   | 客户（可选）     |
| invoice_finish   | salesperson_id    | employee       | 多对一   | 业务员           |
| bank_transaction | company_id        | company        | 多对一   | 公司             |
| bank_transaction | client_id         | client         | 多对一   | 客户（可选）     |
| bank_transaction | salesperson_id    | employee       | 多对一   | 业务员           |
| bank_transaction | invoice_finish_id | invoice_finish | 多对一   | 入账信息（可选） |
| client           | salesperson_id    | employee       | 多对一   | 业务员           |
| employee         | company_id        | company        | 多对一   | 所属公司         |

---

### 四、重要设计建议

#### 1. 冗余字段策略
- 公司名称、客户名称、员工姓名等常用查询字段建议冗余存储，提升查询性能
- 业务员姓名、开票人姓名等建议冗余，避免频繁关联查询

#### 2. 逻辑删除
- 所有表建议添加 `is_delete` 字段，使用逻辑删除

#### 3. 时间字段
- 所有表建议添加 `create_time` 和 `update_time`

#### 4. 外键策略
- 建议使用逻辑外键（不创建数据库外键约束），通过应用层维护数据一致性

#### 5. 特殊字段处理
- `invoice_base.original_invoice_no`：用于红字发票关联原发票
- `invoice_base.amount`：红字发票为负数
- `bank_transaction.invoice_finish_id`：用于追溯发票入账来源

#### 6. 索引优化
- 所有外键字段建议添加索引
- 常用查询字段（如日期、状态、标记）建议添加索引
- 唯一字段（如发票号码、工号）建议添加唯一索引

---

### 五、数据同步建议

#### 发票入账自动同步到银行收支明细
当创建 `invoice_finish` 记录时，自动创建 `bank_transaction` 记录：

```sql
-- 伪代码示例
INSERT INTO bank_transaction (
    company_id, company_name,
    client_id, client_company_name, client_phone,
    salesperson_id, salesperson_name,
    arrival_time, amount,
    invoice_finish_id, invoice_no,
    remark1, remark2, remark3
) 
SELECT 
    ib.issuer_company_id, ib.issuer_company_name,
    ib.client_id, ib.client_company_name, c.user_phone,
    if.salesperson_id, if.salesperson_name,
    if.paid_date, if.paid_amount,
    if.id, if.invoice_no,
    if.remark1, if.remark2, if.remark3
FROM invoice_finish if
JOIN invoice_base ib ON if.invoice_base_id = ib.id
LEFT JOIN client c ON ib.client_id = c.id
WHERE if.id = ?;
```

---

以上为表结构关系分析与字段建议。建议按此设计进行数据库表结构设计。