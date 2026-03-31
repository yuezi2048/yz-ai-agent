-- ============================================
-- 发票管理系统数据库建表SQL
-- ============================================

-- 1. 开票公司表
CREATE TABLE IF NOT EXISTS `company`
(
    `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `company_name`     VARCHAR(100) NOT NULL COMMENT '公司名称',
    `tax_no`           VARCHAR(50)  NULL COMMENT '公司税号',
    `legal_person`     VARCHAR(50)  NULL COMMENT '法人',
    `register_address` VARCHAR(100) NULL COMMENT '注册地址',
    `register_phone`   VARCHAR(50)  NULL COMMENT '注册电话',
    `bank_name`        VARCHAR(100) NULL COMMENT '银行名称',
    `bank_account`     VARCHAR(100) NULL COMMENT '银行账号',
    `contact_person`   VARCHAR(50)  NULL COMMENT '联系人',
    `contact_phone1`   VARCHAR(50)  NULL COMMENT '电话1',
    `remark1`          VARCHAR(100) NULL COMMENT '备注1',
    `remark2`          VARCHAR(100) NULL COMMENT '备注2',
    `remark3`          VARCHAR(100) NULL COMMENT '备注3',
    `create_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`        TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_company_name` (`company_name`),
    KEY `idx_tax_no` (`tax_no`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='开票公司表';

-- 2. 客户信息表
CREATE TABLE IF NOT EXISTS `client`
(
    `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `company_name`     VARCHAR(100) NOT NULL COMMENT '公司名称',
    `tax_no`           VARCHAR(50)  NULL COMMENT '公司税号',
    `legal_person`     VARCHAR(50)  NULL COMMENT '法人',
    `register_address` VARCHAR(100) NULL COMMENT '注册地址',
    `register_phone`   VARCHAR(50)  NULL COMMENT '注册电话',
    `bank_name`        VARCHAR(100) NULL COMMENT '银行名称',
    `bank_account`     VARCHAR(100) NULL COMMENT '银行账号',
    `user_name`        VARCHAR(50)  NULL COMMENT '用户姓名',
    `user_phone`       VARCHAR(50)  NULL COMMENT '用户电话',
    `email`            VARCHAR(100) NULL COMMENT '邮箱',
    `business_scope`   VARCHAR(150) NULL COMMENT '经营范围',
    `salesperson_id`   BIGINT       NULL COMMENT '业务员ID（逻辑外键关联employee表）',
    `salesperson_name` VARCHAR(50)  NULL COMMENT '业务员姓名（冗余字段便于查询）',
    `remark1`          VARCHAR(100) NULL COMMENT '备注1',
    `remark2`          VARCHAR(100) NULL COMMENT '备注2',
    `remark3`          VARCHAR(100) NULL COMMENT '备注3',
    `create_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`        TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_company_name` (`company_name`),
    KEY `idx_tax_no` (`tax_no`),
    KEY `idx_user_name` (`user_name`),
    KEY `idx_user_phone` (`user_phone`),
    KEY `idx_email` (`email`),
    KEY `idx_salesperson_id` (`salesperson_id`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='客户信息表';

-- 3. 发票开票信息表
CREATE TABLE IF NOT EXISTS `invoice_base`
(
    `id`                  BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `issuer_company_id`   BIGINT         NOT NULL COMMENT '开票公司ID（逻辑外键）',
    `issuer_client_id`    BIGINT         NOT NULL COMMENT '客户ID（逻辑外键）',
    `issuer_company_name` VARCHAR(100)   NOT NULL COMMENT '开票单位名称',
    `issue_date`          DATE           NOT NULL COMMENT '开票日期',
    `amount`              DECIMAL(18, 2) NOT NULL COMMENT '开票金额（红字发票为负数）',
    `invoice_no`          VARCHAR(100)   NOT NULL COMMENT '发票号码',
    `invoice_type`        VARCHAR(50)    NULL COMMENT '发票性质：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他',
    `client_company_name` VARCHAR(150)   NOT NULL COMMENT '客户名称',
    `client_person`       VARCHAR(50)    NULL COMMENT '客户姓名',
    `issuer_id`           BIGINT         NULL COMMENT '开票人ID（逻辑外键关联employee表）',
    `issuer_name`         VARCHAR(50)    NULL COMMENT '开票人姓名（冗余字段便于查询）',
    `salesperson_id`      BIGINT         NULL COMMENT '业务员ID（逻辑外键关联employee表）',
    `salesperson_name`    VARCHAR(50)    NULL COMMENT '业务员姓名（冗余字段便于查询）',
    `mark`                VARCHAR(20)    NULL COMMENT '标记：000、DK3、DK4、DK5等',
    `invoice_status`      VARCHAR(20)    NULL COMMENT '发票状态：蓝字发票、红字发票等',
    `original_invoice_no` VARCHAR(100)   NULL COMMENT '原发票号码（红字发票关联的原发票号码）',
    `remark1`             VARCHAR(100)   NULL COMMENT '备注1',
    `remark2`             VARCHAR(100)   NULL COMMENT '备注2',
    `remark3`             VARCHAR(100)   NULL COMMENT '备注3',
    `create_time`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`           TINYINT        NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_invoice_no` (`invoice_no`),
    KEY `idx_issuer_company_id` (`issuer_company_id`),
    KEY `idx_issuer_company_name` (`issuer_company_name`),
    KEY `idx_issue_date` (`issue_date`),
    KEY `idx_client_company_name` (`client_company_name`),
    KEY `idx_client_person` (`client_person`),
    KEY `idx_invoice_type` (`invoice_type`),
    KEY `idx_original_invoice_no` (`original_invoice_no`),
    KEY `idx_issuer_id` (`issuer_id`),
    KEY `idx_salesperson_id` (`salesperson_id`),
    KEY `idx_mark` (`mark`),
    KEY `idx_invoice_status` (`invoice_status`),
    KEY `idx_issuer_date` (`issuer_company_name`, `issue_date`),
    KEY `idx_client_date` (`client_company_name`, `issue_date`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='发票开票信息表';

-- 4. 发票到款信息表
CREATE TABLE IF NOT EXISTS `invoice_finish`
(
    `id`                  BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `invoice_base_id`     BIGINT         NOT NULL COMMENT '关联开票信息ID（逻辑外键）',
    `invoice_no`          VARCHAR(100)   NOT NULL COMMENT '发票号码（冗余字段便于查询）',
    `client_id`           BIGINT         NULL COMMENT '客户ID（逻辑外键关联client表，可选）',
    `client_company_name` VARCHAR(150)   NULL COMMENT '客户名称（冗余字段便于查询）',
    `client_person`       VARCHAR(50)    NULL COMMENT '客户姓名（冗余字段便于查询）',
    `paid_date`           DATE           NOT NULL COMMENT '到款日期',
    `paid_amount`         DECIMAL(18, 2) NOT NULL COMMENT '到款金额',
    `transfer_method`     VARCHAR(50)    NULL COMMENT '转账方式：对公转账、微信、支付宝、现金、其他',
    `bank_transaction_id` BIGINT         NULL COMMENT '关联银行收支ID（逻辑外键关联bank_transaction表，可选，主要关联）',
    `bank_transaction_no` VARCHAR(100)   NULL COMMENT '银行收支编号（冗余字段便于查询和追溯）',
    `salesperson_id`      BIGINT         NULL COMMENT '业务员ID（逻辑外键关联employee表）',
    `salesperson_name`    VARCHAR(50)    NULL COMMENT '业务员姓名（冗余字段便于查询）',
    `remark1`             VARCHAR(100)   NULL COMMENT '备注1（可用于记录其他关联的银行收支记录信息）',
    `remark2`             VARCHAR(100)   NULL COMMENT '备注2',
    `remark3`             VARCHAR(100)   NULL COMMENT '备注3',
    `create_time`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`           TINYINT        NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    KEY `idx_invoice_base_id` (`invoice_base_id`),
    KEY `idx_invoice_no` (`invoice_no`),
    KEY `idx_client_id` (`client_id`),
    KEY `idx_salesperson_id` (`salesperson_id`),
    KEY `idx_bank_transaction_id` (`bank_transaction_id`),
    KEY `idx_paid_date` (`paid_date`),
    KEY `idx_transfer_method` (`transfer_method`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='发票到款信息表';

-- 5. 供应商信息表
CREATE TABLE IF NOT EXISTS `supplier`
(
    `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `company_name`     VARCHAR(100) NOT NULL COMMENT '公司名称',
    `tax_no`           VARCHAR(50)  NULL COMMENT '公司税号',
    `legal_person`     VARCHAR(50)  NULL COMMENT '法人',
    `register_address` VARCHAR(100) NULL COMMENT '注册地址',
    `register_phone`   VARCHAR(50)  NULL COMMENT '注册电话',
    `bank_name`        VARCHAR(100) NULL COMMENT '银行名称',
    `bank_account`     VARCHAR(100) NULL COMMENT '银行账号',
    `supplier_name`    VARCHAR(50)  NULL COMMENT '供货姓名',
    `supplier_phone`   VARCHAR(50)  NULL COMMENT '供货电话',
    `email`            VARCHAR(100) NULL COMMENT '邮箱',
    `business_scope`   VARCHAR(150) NULL COMMENT '经营范围',
    `remark1`          VARCHAR(100) NULL COMMENT '备注1',
    `remark2`          VARCHAR(100) NULL COMMENT '备注2',
    `remark3`          VARCHAR(100) NULL COMMENT '备注3',
    `create_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`        TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    KEY `idx_company_name` (`company_name`),
    KEY `idx_tax_no` (`tax_no`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='供应商信息表';

-- 6. 银行收支明细表
CREATE TABLE IF NOT EXISTS `bank_transaction`
(
    `id`                  BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `company_id`          BIGINT         NOT NULL COMMENT '公司ID（逻辑外键关联company表）',
    `company_name`        VARCHAR(100)   NOT NULL COMMENT '公司名称（冗余字段便于查询）',
    `client_id`           BIGINT         NULL COMMENT '客户ID（逻辑外键关联client表，可选）',
    `client_company_name` VARCHAR(150)   NULL COMMENT '客户名称（冗余字段便于查询）',
    `client_phone`        VARCHAR(50)    NULL COMMENT '客户电话（冗余字段便于查询）',
    `salesperson_id`      BIGINT         NULL COMMENT '业务员ID（逻辑外键关联employee表）',
    `salesperson_name`    VARCHAR(50)    NULL COMMENT '业务员姓名（冗余字段便于查询）',
    `arrival_time`        DATETIME       NOT NULL COMMENT '到账时间',
    `amount`              DECIMAL(18, 2) NOT NULL COMMENT '到款金额',
    `invoice_finish_id`   BIGINT         NULL COMMENT '关联入账信息ID（逻辑外键关联invoice_finish表，可选，主要关联）',
    `invoice_no`          VARCHAR(200)   NULL COMMENT '关联发票号码（冗余字段便于查询，支持多个发票号码用逗号分隔）',
    `invoice_base_id`     BIGINT         NULL COMMENT '关联开票信息ID（逻辑外键关联invoice_base表，可选，冗余字段）',
    `remark1`             VARCHAR(100)   NULL COMMENT '备注1（可用于记录其他关联的发票到款记录信息）',
    `remark2`             VARCHAR(100)   NULL COMMENT '备注2',
    `remark3`             VARCHAR(100)   NULL COMMENT '备注3',
    `create_time`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`           TINYINT        NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    KEY `idx_company_id` (`company_id`),
    KEY `idx_client_id` (`client_id`),
    KEY `idx_salesperson_id` (`salesperson_id`),
    KEY `idx_arrival_time` (`arrival_time`),
    KEY `idx_invoice_finish_id` (`invoice_finish_id`),
    KEY `idx_invoice_base_id` (`invoice_base_id`),
    KEY `idx_invoice_no` (`invoice_no`),
    KEY `idx_company_arrival_time` (`company_id`, `arrival_time`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='银行收支明细表';

-- 7. 员工信息表
CREATE TABLE IF NOT EXISTS `employee`
(
    `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `employee_no`  VARCHAR(50)  NOT NULL COMMENT '工号',
    `company_id`   BIGINT       NOT NULL COMMENT '公司ID（逻辑外键关联company表）',
    `company_name` VARCHAR(100) NOT NULL COMMENT '公司名称（冗余字段便于查询）',
    `name`         VARCHAR(50)  NOT NULL COMMENT '员工姓名',
    `gender`       VARCHAR(10)  NULL COMMENT '性别：男、女',
    `birth_date`   DATE         NULL COMMENT '出生年月',
    `department`   VARCHAR(100) NULL COMMENT '部门名称',
    `position`     VARCHAR(100) NULL COMMENT '岗位',
    `phone`        VARCHAR(50)  NULL COMMENT '联系电话',
    `id_card`      VARCHAR(18)  NULL COMMENT '身份证号',
    `hire_date`    DATE         NULL COMMENT '入职日期',
    `regular_date` DATE         NULL COMMENT '转正日期',
    `permission`   VARCHAR(50)  NULL COMMENT '人员权限：查询功能、所有功能',
    `expiry_date`  DATE         NULL COMMENT '有效期止',
    `remark1`      VARCHAR(100) NULL COMMENT '备注1',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`    TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_no` (`employee_no`),
    KEY `idx_company_id` (`company_id`),
    KEY `idx_name` (`name`),
    KEY `idx_department` (`department`),
    KEY `idx_permission` (`permission`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='员工信息表';

-- 8. 转账方式配置表
CREATE TABLE IF NOT EXISTS `transfer_method`
(
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `method_name` VARCHAR(50)  NOT NULL COMMENT '转账方式：对公转账、微信、支付宝、现金、其他',
    `sort_order`  INT          NULL COMMENT '排序顺序（用于控制显示顺序，数字越小越靠前）',
    `is_enabled`  TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
    `remark`      VARCHAR(200) NULL COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_method_name` (`method_name`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_is_enabled` (`is_enabled`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='转账方式配置表';

-- 7. 进项发票表
CREATE TABLE IF NOT EXISTS `input_invoice`
(
    `id`               BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `company_id`       BIGINT         NOT NULL COMMENT '公司ID（逻辑外键关联company表）',
    `company_name`     VARCHAR(100)   NOT NULL COMMENT '公司名称（冗余字段便于查询）',
    `salesperson_id`   BIGINT         NULL COMMENT '业务员ID（逻辑外键关联employee表）',
    `salesperson_name` VARCHAR(50)    NULL COMMENT '业务员姓名（冗余字段便于查询）',
    `issue_date`       DATE           NOT NULL COMMENT '开票日期',
    `amount`           DECIMAL(18, 2) NOT NULL COMMENT '开票金额',
    `invoice_no`       VARCHAR(100)   NOT NULL COMMENT '发票号码',
    `supplier_id`      BIGINT         NULL COMMENT '供货单位ID（逻辑外键关联supplier表，可选）',
    `supplier_name`    VARCHAR(100)   NOT NULL COMMENT '供货单位（冗余字段便于查询）',
    `supplier_contact` VARCHAR(50)    NULL COMMENT '供货姓名（冗余字段便于查询）',
    `payment_date`     DATE           NULL COMMENT '付款日期',
    `payment_amount`   DECIMAL(18, 2) NULL COMMENT '付款金额',
    `invoice_type`     VARCHAR(50)    NULL COMMENT '票类型：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他',
    `invoice_purpose`  VARCHAR(50)    NULL COMMENT '票用途：采购付款、费用报销、其他用途',
    `is_accounted`     TINYINT        NULL COMMENT '财务入账：0-否，1-是',
    `invoice_status`   VARCHAR(20)    NULL COMMENT '票状态',
    `remark1`          VARCHAR(100)   NULL COMMENT '备注1',
    `remark2`          VARCHAR(100)   NULL COMMENT '备注2',
    `remark3`          VARCHAR(100)   NULL COMMENT '备注3',
    `create_time`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`        TINYINT        NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_invoice_no` (`invoice_no`),
    KEY `idx_company_id` (`company_id`),
    KEY `idx_company_name` (`company_name`),
    KEY `idx_salesperson_id` (`salesperson_id`),
    KEY `idx_issue_date` (`issue_date`),
    KEY `idx_amount` (`amount`),
    KEY `idx_invoice_type` (`invoice_type`),
    KEY `idx_supplier_id` (`supplier_id`),
    KEY `idx_supplier_name` (`supplier_name`),
    KEY `idx_invoice_purpose` (`invoice_purpose`),
    KEY `idx_is_accounted` (`is_accounted`),
    KEY `idx_invoice_status` (`invoice_status`),
    KEY `idx_payment_date` (`payment_date`),
    KEY `idx_company_issue_date` (`company_id`, `issue_date`),
    KEY `idx_supplier_issue_date` (`supplier_name`, `issue_date`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='进项发票表';

-- 8. 员工信息表
CREATE TABLE IF NOT EXISTS `employee`
(
    `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `employee_no`  VARCHAR(50)  NOT NULL COMMENT '工号',
    `company_id`   BIGINT       NOT NULL COMMENT '公司ID（逻辑外键关联company表）',
    `company_name` VARCHAR(100) NOT NULL COMMENT '公司名称（冗余字段便于查询）',
    `name`         VARCHAR(50)  NOT NULL COMMENT '员工姓名',
    `gender`       VARCHAR(10)  NULL COMMENT '性别：男、女',
    `birth_date`   DATE         NULL COMMENT '出生年月',
    `department`   VARCHAR(100) NULL COMMENT '部门名称',
    `position`     VARCHAR(100) NULL COMMENT '岗位',
    `phone`        VARCHAR(50)  NULL COMMENT '联系电话',
    `id_card`      VARCHAR(18)  NULL COMMENT '身份证号',
    `hire_date`    DATE         NULL COMMENT '入职日期',
    `regular_date` DATE         NULL COMMENT '转正日期',
    `permission`   VARCHAR(50)  NULL COMMENT '人员权限：查询功能、所有功能',
    `expiry_date`  DATE         NULL COMMENT '有效期止',
    `remark1`      VARCHAR(100) NULL COMMENT '备注1',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`    TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_no` (`employee_no`),
    KEY `idx_company_id` (`company_id`),
    KEY `idx_name` (`name`),
    KEY `idx_department` (`department`),
    KEY `idx_permission` (`permission`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='员工信息表';

-- 9. 转账方式配置表
CREATE TABLE IF NOT EXISTS `transfer_method`
(
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `method_name` VARCHAR(50)  NOT NULL COMMENT '转账方式：对公转账、微信、支付宝、现金、其他',
    `sort_order`  INT          NULL COMMENT '排序顺序（用于控制显示顺序，数字越小越靠前）',
    `is_enabled`  TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
    `remark`      VARCHAR(200) NULL COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_method_name` (`method_name`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_is_enabled` (`is_enabled`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='转账方式配置表';

-- 10. 发票性质配置表
CREATE TABLE IF NOT EXISTS `invoice_type`
(
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `type_name`   VARCHAR(50)  NOT NULL COMMENT '发票性质：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他',
    `sort_order`  INT          NULL COMMENT '排序顺序（用于控制显示顺序，数字越小越靠前）',
    `is_enabled`  TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
    `remark`      VARCHAR(200) NULL COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_type_name` (`type_name`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_is_enabled` (`is_enabled`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='发票性质配置表';

-- ============================================
-- 假数据插入SQL
-- ============================================

-- 1. 插入开票公司数据（5家九华云相关公司）
INSERT INTO `company` (`company_name`, `tax_no`, `legal_person`, `register_address`, `register_phone`, `bank_name`,
                       `bank_account`, `contact_person`, `contact_phone1`, `remark1`, `remark2`, `remark3`)
VALUES ('九华云科技有限公司', '91110000MA01234567', '张三', '北京市海淀区中关村大街1号', '010-88888888', '中国工商银行',
        '6222021234567890123', '李四', '13800138001', '总公司', NULL, NULL),
       ('九华云信息技术有限公司', '91110000MA01234568', '王五', '北京市朝阳区建国路88号', '010-88888889',
        '中国建设银行', '6222021234567890124', '赵六', '13800138002', '子公司', NULL, NULL),
       ('九华云数据服务有限公司', '91110000MA01234569', '孙七', '上海市浦东新区世纪大道100号', '021-66666666',
        '中国银行', '6222021234567890125', '周八', '13800138003', '子公司', NULL, NULL),
       ('九华云网络科技有限公司', '91110000MA01234570', '吴九', '深圳市南山区科技园南路2号', '0755-88888888',
        '招商银行', '6222021234567890126', '郑十', '13800138004', '子公司', NULL, NULL),
       ('九华云智能科技有限公司', '91110000MA01234571', '钱一', '杭州市西湖区文三路259号', '0571-88888888',
        '中国农业银行', '6222021234567890127', '陈二', '13800138005', '子公司', NULL, NULL);

-- 2. 插入员工数据（每个公司至少2名员工）
INSERT INTO `employee` (`employee_no`, `company_id`, `company_name`, `name`, `gender`, `birth_date`, `department`,
                        `position`, `phone`, `id_card`, `hire_date`, `regular_date`, `permission`, `expiry_date`,
                        `remark1`)
VALUES ('JH001', 1, '九华云科技有限公司', '张经理', '男', '1980-01-01', '销售部', '销售经理', '13900139001',
        '110101198001011234', '2020-01-01', '2020-04-01', '所有功能', '2025-12-31', NULL),
       ('JH002', 1, '九华云科技有限公司', '李会计', '女', '1985-05-15', '财务部', '会计', '13900139002',
        '110101198505151234', '2020-02-01', '2020-05-01', '所有功能', '2025-12-31', NULL),
       ('JH003', 2, '九华云信息技术有限公司', '王业务', '男', '1990-03-20', '销售部', '业务员', '13900139003',
        '110101199003201234', '2021-01-01', '2021-04-01', '所有功能', '2025-12-31', NULL),
       ('JH004', 2, '九华云信息技术有限公司', '赵出纳', '女', '1988-08-10', '财务部', '出纳', '13900139004',
        '110101198808101234', '2021-02-01', '2021-05-01', '所有功能', '2025-12-31', NULL),
       ('JH005', 3, '九华云数据服务有限公司', '孙销售', '男', '1992-06-25', '销售部', '业务员', '13900139005',
        '110101199206251234', '2022-01-01', '2022-04-01', '所有功能', '2025-12-31', NULL),
       ('JH006', 3, '九华云数据服务有限公司', '周财务', '女', '1987-11-30', '财务部', '会计', '13900139006',
        '110101198711301234', '2022-02-01', '2022-05-01', '所有功能', '2025-12-31', NULL),
       ('JH007', 4, '九华云网络科技有限公司', '吴业务', '男', '1991-04-15', '销售部', '业务员', '13900139007',
        '110101199104151234', '2023-01-01', '2023-04-01', '所有功能', '2025-12-31', NULL),
       ('JH008', 4, '九华云网络科技有限公司', '郑会计', '女', '1989-09-20', '财务部', '会计', '13900139008',
        '110101198909201234', '2023-02-01', '2023-05-01', '所有功能', '2025-12-31', NULL),
       ('JH009', 5, '九华云智能科技有限公司', '钱销售', '男', '1993-07-05', '销售部', '业务员', '13900139009',
        '110101199307051234', '2024-01-01', '2024-04-01', '所有功能', '2025-12-31', NULL),
       ('JH010', 5, '九华云智能科技有限公司', '陈财务', '女', '1990-12-25', '财务部', '会计', '13900139010',
        '110101199012251234', '2024-02-01', '2024-05-01', '所有功能', '2025-12-31', NULL);

-- 3. 插入客户数据（20条，包含长安大学信息学院，同一家公司不同用户）
INSERT INTO `client` (`company_name`, `tax_no`, `legal_person`, `register_address`, `register_phone`, `bank_name`,
                      `bank_account`, `user_name`, `user_phone`, `email`, `business_scope`, `salesperson_id`,
                      `salesperson_name`, `remark1`, `remark2`, `remark3`)
VALUES ('长安大学信息学院', '91610000123456789X', '刘院长', '陕西省西安市雁塔区长安中路75号', '029-82334567',
        '中国工商银行', '6222021234567890001', '刘老师', '13991234567', 'liu@chd.edu.cn', '教育服务', 1, '张经理', NULL,
        NULL, NULL),
       ('长安大学信息学院', '91610000123456789X', '刘院长', '陕西省西安市雁塔区长安中路75号', '029-82334567',
        '中国工商银行', '6222021234567890001', '王老师', '13991234568', 'wang@chd.edu.cn', '教育服务', 1, '张经理',
        NULL, NULL, NULL),
       ('长安大学信息学院', '91610000123456789X', '刘院长', '陕西省西安市雁塔区长安中路75号', '029-82334567',
        '中国工商银行', '6222021234567890001', '李老师', '13991234569', 'li@chd.edu.cn', '教育服务', 3, '王业务', NULL,
        NULL, NULL),
       ('北京科技有限公司', '91110000123456789A', '张总', '北京市海淀区中关村大街10号', '010-12345678', '中国建设银行',
        '6222021234567890002', '张经理', '13800138011', 'zhang@bjtech.com', '软件开发', 1, '张经理', NULL, NULL, NULL),
       ('北京科技有限公司', '91110000123456789A', '张总', '北京市海淀区中关村大街10号', '010-12345678', '中国建设银行',
        '6222021234567890002', '李主管', '13800138012', 'li@bjtech.com', '软件开发', 1, '张经理', NULL, NULL, NULL),
       ('上海贸易有限公司', '91310000123456789B', '王总', '上海市黄浦区南京东路100号', '021-12345678', '中国银行',
        '6222021234567890003', '王经理', '13900139011', 'wang@shanghai.com', '贸易', 3, '王业务', NULL, NULL, NULL),
       ('上海贸易有限公司', '91310000123456789B', '王总', '上海市黄浦区南京东路100号', '021-12345678', '中国银行',
        '6222021234567890003', '赵主管', '13900139012', 'zhao@shanghai.com', '贸易', 3, '王业务', NULL, NULL, NULL),
       ('深圳电子科技有限公司', '91440300123456789C', '李总', '深圳市南山区科技园北区1号', '0755-12345678', '招商银行',
        '6222021234567890004', '李经理', '13700137011', 'li@sztech.com', '电子产品', 5, '孙销售', NULL, NULL, NULL),
       ('深圳电子科技有限公司', '91440300123456789C', '李总', '深圳市南山区科技园北区1号', '0755-12345678', '招商银行',
        '6222021234567890004', '周主管', '13700137012', 'zhou@sztech.com', '电子产品', 5, '孙销售', NULL, NULL, NULL),
       ('杭州互联网科技有限公司', '91330100123456789D', '赵总', '杭州市西湖区文三路200号', '0571-12345678',
        '中国农业银行', '6222021234567890005', '赵经理', '13600136011', 'zhao@hztech.com', '互联网服务', 7, '吴业务',
        NULL, NULL, NULL),
       ('杭州互联网科技有限公司', '91330100123456789D', '赵总', '杭州市西湖区文三路200号', '0571-12345678',
        '中国农业银行', '6222021234567890005', '钱主管', '13600136012', 'qian@hztech.com', '互联网服务', 7, '吴业务',
        NULL, NULL, NULL),
       ('广州制造有限公司', '91440100123456789E', '孙总', '广州市天河区天河路100号', '020-12345678', '中国工商银行',
        '6222021234567890006', '孙经理', '13500135011', 'sun@gztech.com', '制造业', 9, '钱销售', NULL, NULL, NULL),
       ('广州制造有限公司', '91440100123456789E', '孙总', '广州市天河区天河路100号', '020-12345678', '中国工商银行',
        '6222021234567890006', '周主管', '13500135012', 'zhou@gztech.com', '制造业', 9, '钱销售', NULL, NULL, NULL),
       ('成都软件有限公司', '91510100123456789F', '吴总', '成都市高新区天府大道1000号', '028-12345678', '中国建设银行',
        '6222021234567890007', '吴经理', '13400134011', 'wu@cdtech.com', '软件开发', 1, '张经理', NULL, NULL, NULL),
       ('成都软件有限公司', '91510100123456789F', '吴总', '成都市高新区天府大道1000号', '028-12345678', '中国建设银行',
        '6222021234567890007', '郑主管', '13400134012', 'zheng@cdtech.com', '软件开发', 1, '张经理', NULL, NULL, NULL),
       ('西安工程有限公司', '91610100123456789G', '郑总', '西安市雁塔区科技路100号', '029-12345678', '中国银行',
        '6222021234567890008', '郑经理', '13300133011', 'zheng@xatech.com', '工程服务', 3, '王业务', NULL, NULL, NULL),
       ('西安工程有限公司', '91610100123456789G', '郑总', '西安市雁塔区科技路100号', '029-12345678', '中国银行',
        '6222021234567890008', '钱主管', '13300133012', 'qian@xatech.com', '工程服务', 3, '王业务', NULL, NULL, NULL),
       ('南京咨询有限公司', '91320100123456789H', '钱总', '南京市鼓楼区中山路100号', '025-12345678', '招商银行',
        '6222021234567890009', '钱经理', '13200132011', 'qian@njtech.com', '咨询服务', 5, '孙销售', NULL, NULL, NULL),
       ('南京咨询有限公司', '91320100123456789H', '钱总', '南京市鼓楼区中山路100号', '025-12345678', '招商银行',
        '6222021234567890009', '陈主管', '13200132012', 'chen@njtech.com', '咨询服务', 5, '孙销售', NULL, NULL, NULL),
       ('武汉物流有限公司', '91420100123456789I', '陈总', '武汉市洪山区珞喻路100号', '027-12345678', '中国农业银行',
        '6222021234567890010', '陈经理', '13100131011', 'chen@whtech.com', '物流服务', 7, '吴业务', NULL, NULL, NULL);

-- 4. 插入供应商数据（5条）
INSERT INTO `supplier` (`company_name`, `tax_no`, `legal_person`, `register_address`, `register_phone`, `bank_name`,
                        `bank_account`, `supplier_name`, `supplier_phone`, `email`, `business_scope`, `remark1`,
                        `remark2`, `remark3`)
VALUES ('北京供应商有限公司', '91110000987654321A', '供应商一', '北京市朝阳区建国路1号', '010-87654321', '中国工商银行',
        '6222029876543210001', '供一', '13987654321', 'gong1@supplier.com', '原材料供应', NULL, NULL, NULL),
       ('上海供应商有限公司', '91310000987654321B', '供应商二', '上海市浦东新区世纪大道1号', '021-87654321',
        '中国建设银行', '6222029876543210002', '供二', '13987654322', 'gong2@supplier.com', '设备供应', NULL, NULL,
        NULL),
       ('深圳供应商有限公司', '91440300987654321C', '供应商三', '深圳市南山区科技园1号', '0755-87654321', '招商银行',
        '6222029876543210003', '供三', '13987654323', 'gong3@supplier.com', '技术服务', NULL, NULL, NULL),
       ('杭州供应商有限公司', '91330100987654321D', '供应商四', '杭州市西湖区文三路1号', '0571-87654321',
        '中国农业银行', '6222029876543210004', '供四', '13987654324', 'gong4@supplier.com', '软件供应', NULL, NULL,
        NULL),
       ('广州供应商有限公司', '91440100987654321E', '供应商五', '广州市天河区天河路1号', '020-87654321', '中国银行',
        '6222029876543210005', '供五', '13987654325', 'gong5@supplier.com', '咨询服务', NULL, NULL, NULL);

-- 5. 插入配置表数据
INSERT INTO `transfer_method` (`method_name`, `sort_order`, `is_enabled`, `remark`)
VALUES ('对公转账', 1, 1, '默认转账方式'),
       ('微信', 2, 1, NULL),
       ('支付宝', 3, 1, NULL),
       ('现金', 4, 1, NULL),
       ('其他', 5, 1, NULL);

INSERT INTO `invoice_type` (`type_name`, `sort_order`, `is_enabled`, `remark`)
VALUES ('普票1%', 1, 1, NULL),
       ('专票1%', 2, 1, NULL),
       ('专票13%', 3, 1, NULL),
       ('普票13%', 4, 1, NULL),
       ('专票6%', 5, 1, NULL),
       ('普票6%', 6, 1, NULL),
       ('其他', 7, 1, NULL);

-- 6. 插入发票开票信息（50条）
INSERT INTO `invoice_base` (`issuer_company_id`, `issuer_client_id`, `issuer_company_name`, `issue_date`, `amount`,
                            `invoice_no`, `invoice_type`, `client_company_name`, `client_person`, `issuer_id`,
                            `issuer_name`, `salesperson_id`, `salesperson_name`, `mark`, `invoice_status`,
                            `original_invoice_no`, `remark1`, `remark2`, `remark3`)
VALUES
-- 2024年1月发票（10条）
(1, 1, '九华云科技有限公司', '2024-01-05', 50000.00, 'INV202401001', '专票13%', '长安大学信息学院', '刘老师', 1,
 '张经理', 1, '张经理', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 2, '九华云科技有限公司', '2024-01-10', 30000.00, 'INV202401002', '普票1%', '长安大学信息学院', '王老师', 1,
 '张经理', 1, '张经理', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 4, '九华云科技有限公司', '2024-01-15', 80000.00, 'INV202401003', '专票13%', '北京科技有限公司', '张经理', 1,
 '张经理', 1, '张经理', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 6, '九华云信息技术有限公司', '2024-01-20', 60000.00, 'INV202401004', '专票6%', '上海贸易有限公司', '王经理', 3,
 '王业务', 3, '王业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 8, '九华云信息技术有限公司', '2024-01-25', 40000.00, 'INV202401005', '普票6%', '深圳电子科技有限公司', '李经理', 3,
 '王业务', 3, '王业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 10, '九华云数据服务有限公司', '2024-01-28', 70000.00, 'INV202401006', '专票13%', '杭州互联网科技有限公司', '赵经理',
 5, '孙销售', 5, '孙销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 12, '九华云数据服务有限公司', '2024-01-30', 45000.00, 'INV202401007', '普票1%', '广州制造有限公司', '孙经理', 5,
 '孙销售', 5, '孙销售', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 14, '九华云网络科技有限公司', '2024-01-31', 55000.00, 'INV202401008', '专票6%', '成都软件有限公司', '吴经理', 7,
 '吴业务', 7, '吴业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 16, '九华云网络科技有限公司', '2024-01-31', 35000.00, 'INV202401009', '普票6%', '西安工程有限公司', '郑经理', 7,
 '吴业务', 7, '吴业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(5, 18, '九华云智能科技有限公司', '2024-01-31', 65000.00, 'INV202401010', '专票13%', '南京咨询有限公司', '钱经理', 9,
 '钱销售', 9, '钱销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
-- 2024年2月发票（10条）
(1, 1, '九华云科技有限公司', '2024-02-05', 52000.00, 'INV202402001', '专票13%', '长安大学信息学院', '刘老师', 1,
 '张经理', 1, '张经理', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 3, '九华云科技有限公司', '2024-02-10', 32000.00, 'INV202402002', '普票1%', '长安大学信息学院', '李老师', 1,
 '张经理', 1, '张经理', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 5, '九华云科技有限公司', '2024-02-15', 82000.00, 'INV202402003', '专票13%', '北京科技有限公司', '李主管', 1,
 '张经理', 1, '张经理', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 7, '九华云信息技术有限公司', '2024-02-20', 62000.00, 'INV202402004', '专票6%', '上海贸易有限公司', '赵主管', 3,
 '王业务', 3, '王业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 9, '九华云信息技术有限公司', '2024-02-25', 42000.00, 'INV202402005', '普票6%', '深圳电子科技有限公司', '周主管', 3,
 '王业务', 3, '王业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 11, '九华云数据服务有限公司', '2024-02-28', 72000.00, 'INV202402006', '专票13%', '杭州互联网科技有限公司', '钱主管',
 5, '孙销售', 5, '孙销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 13, '九华云数据服务有限公司', '2024-02-29', 46000.00, 'INV202402007', '普票1%', '广州制造有限公司', '周主管', 5,
 '孙销售', 5, '孙销售', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 15, '九华云网络科技有限公司', '2024-02-29', 56000.00, 'INV202402008', '专票6%', '成都软件有限公司', '郑主管', 7,
 '吴业务', 7, '吴业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 17, '九华云网络科技有限公司', '2024-02-29', 36000.00, 'INV202402009', '普票6%', '西安工程有限公司', '钱主管', 7,
 '吴业务', 7, '吴业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(5, 19, '九华云智能科技有限公司', '2024-02-29', 66000.00, 'INV202402010', '专票13%', '南京咨询有限公司', '陈主管', 9,
 '钱销售', 9, '钱销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
-- 2024年3月发票（10条）
(1, 1, '九华云科技有限公司', '2024-03-05', 54000.00, 'INV202403001', '专票13%', '长安大学信息学院', '刘老师', 1,
 '张经理', 1, '张经理', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 2, '九华云科技有限公司', '2024-03-10', 34000.00, 'INV202403002', '普票1%', '长安大学信息学院', '王老师', 1,
 '张经理', 1, '张经理', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 4, '九华云科技有限公司', '2024-03-15', 84000.00, 'INV202403003', '专票13%', '北京科技有限公司', '张经理', 1,
 '张经理', 1, '张经理', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 6, '九华云信息技术有限公司', '2024-03-20', 64000.00, 'INV202403004', '专票6%', '上海贸易有限公司', '王经理', 3,
 '王业务', 3, '王业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 8, '九华云信息技术有限公司', '2024-03-25', 44000.00, 'INV202403005', '普票6%', '深圳电子科技有限公司', '李经理', 3,
 '王业务', 3, '王业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 10, '九华云数据服务有限公司', '2024-03-28', 74000.00, 'INV202403006', '专票13%', '杭州互联网科技有限公司', '赵经理',
 5, '孙销售', 5, '孙销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 12, '九华云数据服务有限公司', '2024-03-30', 47000.00, 'INV202403007', '普票1%', '广州制造有限公司', '孙经理', 5,
 '孙销售', 5, '孙销售', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 14, '九华云网络科技有限公司', '2024-03-31', 57000.00, 'INV202403008', '专票6%', '成都软件有限公司', '吴经理', 7,
 '吴业务', 7, '吴业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 16, '九华云网络科技有限公司', '2024-03-31', 37000.00, 'INV202403009', '普票6%', '西安工程有限公司', '郑经理', 7,
 '吴业务', 7, '吴业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(5, 18, '九华云智能科技有限公司', '2024-03-31', 67000.00, 'INV202403010', '专票13%', '南京咨询有限公司', '钱经理', 9,
 '钱销售', 9, '钱销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
-- 2024年4月发票（10条）
(1, 1, '九华云科技有限公司', '2024-04-05', 56000.00, 'INV202404001', '专票13%', '长安大学信息学院', '刘老师', 1,
 '张经理', 1, '张经理', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 2, '九华云科技有限公司', '2024-04-10', 36000.00, 'INV202404002', '普票1%', '长安大学信息学院', '王老师', 1,
 '张经理', 1, '张经理', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 4, '九华云科技有限公司', '2024-04-15', 86000.00, 'INV202404003', '专票13%', '北京科技有限公司', '张经理', 1,
 '张经理', 1, '张经理', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 6, '九华云信息技术有限公司', '2024-04-20', 66000.00, 'INV202404004', '专票6%', '上海贸易有限公司', '王经理', 3,
 '王业务', 3, '王业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 8, '九华云信息技术有限公司', '2024-04-25', 46000.00, 'INV202404005', '普票6%', '深圳电子科技有限公司', '李经理', 3,
 '王业务', 3, '王业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 10, '九华云数据服务有限公司', '2024-04-28', 76000.00, 'INV202404006', '专票13%', '杭州互联网科技有限公司', '赵经理',
 5, '孙销售', 5, '孙销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 12, '九华云数据服务有限公司', '2024-04-30', 48000.00, 'INV202404007', '普票1%', '广州制造有限公司', '孙经理', 5,
 '孙销售', 5, '孙销售', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 14, '九华云网络科技有限公司', '2024-04-30', 58000.00, 'INV202404008', '专票6%', '成都软件有限公司', '吴经理', 7,
 '吴业务', 7, '吴业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 16, '九华云网络科技有限公司', '2024-04-30', 38000.00, 'INV202404009', '普票6%', '西安工程有限公司', '郑经理', 7,
 '吴业务', 7, '吴业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(5, 18, '九华云智能科技有限公司', '2024-04-30', 68000.00, 'INV202404010', '专票13%', '南京咨询有限公司', '钱经理', 9,
 '钱销售', 9, '钱销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
-- 2024年5月发票（10条）
(1, 1, '九华云科技有限公司', '2024-05-05', 58000.00, 'INV202405001', '专票13%', '长安大学信息学院', '刘老师', 1,
 '张经理', 1, '张经理', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 2, '九华云科技有限公司', '2024-05-10', 38000.00, 'INV202405002', '普票1%', '长安大学信息学院', '王老师', 1,
 '张经理', 1, '张经理', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(1, 4, '九华云科技有限公司', '2024-05-15', 88000.00, 'INV202405003', '专票13%', '北京科技有限公司', '张经理', 1,
 '张经理', 1, '张经理', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 6, '九华云信息技术有限公司', '2024-05-20', 68000.00, 'INV202405004', '专票6%', '上海贸易有限公司', '王经理', 3,
 '王业务', 3, '王业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(2, 8, '九华云信息技术有限公司', '2024-05-25', 48000.00, 'INV202405005', '普票6%', '深圳电子科技有限公司', '李经理', 3,
 '王业务', 3, '王业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 10, '九华云数据服务有限公司', '2024-05-28', 78000.00, 'INV202405006', '专票13%', '杭州互联网科技有限公司', '赵经理',
 5, '孙销售', 5, '孙销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL),
(3, 12, '九华云数据服务有限公司', '2024-05-30', 49000.00, 'INV202405007', '普票1%', '广州制造有限公司', '孙经理', 5,
 '孙销售', 5, '孙销售', 'DK5', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 14, '九华云网络科技有限公司', '2024-05-31', 59000.00, 'INV202405008', '专票6%', '成都软件有限公司', '吴经理', 7,
 '吴业务', 7, '吴业务', '000', '蓝字发票', NULL, NULL, NULL, NULL),
(4, 16, '九华云网络科技有限公司', '2024-05-31', 39000.00, 'INV202405009', '普票6%', '西安工程有限公司', '郑经理', 7,
 '吴业务', 7, '吴业务', 'DK3', '蓝字发票', NULL, NULL, NULL, NULL),
(5, 18, '九华云智能科技有限公司', '2024-05-31', 69000.00, 'INV202405010', '专票13%', '南京咨询有限公司', '钱经理', 9,
 '钱销售', 9, '钱销售', 'DK4', '蓝字发票', NULL, NULL, NULL, NULL);

-- 7. 插入发票到款信息（部分发票已到款，部分未到款，部分分次到款）
INSERT INTO `invoice_finish` (`invoice_base_id`, `invoice_no`, `client_id`, `client_company_name`, `client_person`,
                              `paid_date`, `paid_amount`, `transfer_method`, `bank_transaction_id`,
                              `bank_transaction_no`, `salesperson_id`, `salesperson_name`, `remark1`, `remark2`,
                              `remark3`)
VALUES
-- 1月发票到款（部分一次性到款，部分分次到款）
(1, 'INV202401001', 1, '长安大学信息学院', '刘老师', '2024-01-10', 50000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(2, 'INV202401002', 2, '长安大学信息学院', '王老师', '2024-01-15', 15000.00, '微信', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(2, 'INV202401002', 2, '长安大学信息学院', '王老师', '2024-01-20', 15000.00, '微信', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(3, 'INV202401003', 4, '北京科技有限公司', '张经理', '2024-01-20', 80000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(4, 'INV202401004', 6, '上海贸易有限公司', '王经理', '2024-01-25', 60000.00, '对公转账', NULL, NULL, 3, '王业务', NULL,
 NULL, NULL),
(5, 'INV202401005', 8, '深圳电子科技有限公司', '李经理', '2024-01-30', 40000.00, '支付宝', NULL, NULL, 3, '王业务',
 NULL, NULL, NULL),
-- 2月发票到款
(11, 'INV202402001', 1, '长安大学信息学院', '刘老师', '2024-02-10', 52000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(12, 'INV202402002', 3, '长安大学信息学院', '李老师', '2024-02-15', 32000.00, '微信', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(13, 'INV202402003', 5, '北京科技有限公司', '李主管', '2024-02-20', 82000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(14, 'INV202402004', 7, '上海贸易有限公司', '赵主管', '2024-02-25', 62000.00, '对公转账', NULL, NULL, 3, '王业务', NULL,
 NULL, NULL),
(15, 'INV202402005', 9, '深圳电子科技有限公司', '周主管', '2024-02-28', 42000.00, '支付宝', NULL, NULL, 3, '王业务',
 NULL, NULL, NULL),
-- 3月发票到款（部分分次到款）
(21, 'INV202403001', 1, '长安大学信息学院', '刘老师', '2024-03-10', 30000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(21, 'INV202403001', 1, '长安大学信息学院', '刘老师', '2024-03-15', 24000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(22, 'INV202403002', 2, '长安大学信息学院', '王老师', '2024-03-12', 34000.00, '微信', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(23, 'INV202403003', 4, '北京科技有限公司', '张经理', '2024-03-20', 84000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(24, 'INV202403004', 6, '上海贸易有限公司', '王经理', '2024-03-25', 64000.00, '对公转账', NULL, NULL, 3, '王业务', NULL,
 NULL, NULL),
-- 4月发票到款
(31, 'INV202404001', 1, '长安大学信息学院', '刘老师', '2024-04-10', 56000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(32, 'INV202404002', 2, '长安大学信息学院', '王老师', '2024-04-15', 36000.00, '微信', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(33, 'INV202404003', 4, '北京科技有限公司', '张经理', '2024-04-20', 86000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(34, 'INV202404004', 6, '上海贸易有限公司', '王经理', '2024-04-25', 66000.00, '对公转账', NULL, NULL, 3, '王业务', NULL,
 NULL, NULL),
(35, 'INV202404005', 8, '深圳电子科技有限公司', '李经理', '2024-04-30', 46000.00, '支付宝', NULL, NULL, 3, '王业务',
 NULL, NULL, NULL),
-- 5月发票到款（部分未到款）
(41, 'INV202405001', 1, '长安大学信息学院', '刘老师', '2024-05-10', 58000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(42, 'INV202405002', 2, '长安大学信息学院', '王老师', '2024-05-15', 38000.00, '微信', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL),
(43, 'INV202405003', 4, '北京科技有限公司', '张经理', '2024-05-20', 88000.00, '对公转账', NULL, NULL, 1, '张经理', NULL,
 NULL, NULL);

-- 8. 插入银行收支明细（体现一次转账对应多个发票的情况）
INSERT INTO `bank_transaction` (`company_id`, `company_name`, `client_id`, `client_company_name`, `client_phone`,
                                `salesperson_id`, `salesperson_name`, `arrival_time`, `amount`, `invoice_finish_id`,
                                `invoice_no`, `invoice_base_id`, `remark1`, `remark2`, `remark3`)
VALUES
-- 一对一关系（正常情况）
(1, '九华云科技有限公司', 1, '长安大学信息学院', '13991234567', 1, '张经理', '2024-01-10 10:00:00', 50000.00, 1,
 'INV202401001', 1, NULL, NULL, NULL),
(1, '九华云科技有限公司', 4, '北京科技有限公司', '13800138011', 1, '张经理', '2024-01-20 14:30:00', 80000.00, 4,
 'INV202401003', 3, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 6, '上海贸易有限公司', '13900139011', 3, '王业务', '2024-01-25 16:00:00', 60000.00, 5,
 'INV202401004', 4, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 8, '深圳电子科技有限公司', '13700137011', 3, '王业务', '2024-01-30 11:00:00', 40000.00, 6,
 'INV202401005', 5, NULL, NULL, NULL),
-- 一对多关系：一次转账对应多个发票（重点场景）
(1, '九华云科技有限公司', 1, '长安大学信息学院', '13991234567', 1, '张经理', '2024-02-10 09:00:00', 84000.00, 7,
 'INV202402001,INV202402002', 11, '关联发票到款记录：finish_id_7,finish_id_8', NULL, NULL),
(1, '九华云科技有限公司', 4, '北京科技有限公司', '13800138011', 1, '张经理', '2024-02-20 15:00:00', 82000.00, 9,
 'INV202402003', 13, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 7, '上海贸易有限公司', '13900139012', 3, '王业务', '2024-02-25 10:30:00', 62000.00, 10,
 'INV202402004', 14, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 9, '深圳电子科技有限公司', '13700137012', 3, '王业务', '2024-02-28 13:00:00', 42000.00,
 11, 'INV202402005', 15, NULL, NULL, NULL),
-- 一对多关系：一次转账对应多个发票（分次到款的情况）
(1, '九华云科技有限公司', 1, '长安大学信息学院', '13991234567', 1, '张经理', '2024-03-10 08:00:00', 30000.00, 12,
 'INV202403001', 21, NULL, NULL, NULL),
(1, '九华云科技有限公司', 1, '长安大学信息学院', '13991234567', 1, '张经理', '2024-03-15 14:00:00', 24000.00, 13,
 'INV202403001', 21, NULL, NULL, NULL),
(1, '九华云科技有限公司', 2, '长安大学信息学院', '13991234568', 1, '张经理', '2024-03-12 11:00:00', 34000.00, 14,
 'INV202403002', 22, NULL, NULL, NULL),
(1, '九华云科技有限公司', 4, '北京科技有限公司', '13800138011', 1, '张经理', '2024-03-20 16:00:00', 84000.00, 15,
 'INV202403003', 23, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 6, '上海贸易有限公司', '13900139011', 3, '王业务', '2024-03-25 09:30:00', 64000.00, 16,
 'INV202403004', 24, NULL, NULL, NULL),
-- 一对多关系：一次大额转账对应多个发票（重点场景）
(1, '九华云科技有限公司', 1, '长安大学信息学院', '13991234567', 1, '张经理', '2024-04-10 10:00:00', 92000.00, 17,
 'INV202404001,INV202404002', 31, '关联发票到款记录：finish_id_17,finish_id_18', NULL, NULL),
(1, '九华云科技有限公司', 4, '北京科技有限公司', '13800138011', 1, '张经理', '2024-04-20 15:00:00', 86000.00, 19,
 'INV202404003', 33, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 6, '上海贸易有限公司', '13900139011', 3, '王业务', '2024-04-25 11:00:00', 66000.00, 20,
 'INV202404004', 34, NULL, NULL, NULL),
(2, '九华云信息技术有限公司', 8, '深圳电子科技有限公司', '13700137011', 3, '王业务', '2024-04-30 13:30:00', 46000.00,
 21, 'INV202404005', 35, NULL, NULL, NULL),
-- 5月银行收支
(1, '九华云科技有限公司', 1, '长安大学信息学院', '13991234567', 1, '张经理', '2024-05-10 09:00:00', 58000.00, 22,
 'INV202405001', 41, NULL, NULL, NULL),
(1, '九华云科技有限公司', 2, '长安大学信息学院', '13991234568', 1, '张经理', '2024-05-15 14:00:00', 38000.00, 23,
 'INV202405002', 42, NULL, NULL, NULL),
(1, '九华云科技有限公司', 4, '北京科技有限公司', '13800138011', 1, '张经理', '2024-05-20 16:00:00', 88000.00, 24,
 'INV202405003', 43, NULL, NULL, NULL);

-- 9. 更新发票到款记录的bank_transaction_id（建立关联）
UPDATE `invoice_finish`
SET `bank_transaction_id` = 1,
    `bank_transaction_no` = 'BT202401001'
WHERE `id` = 1;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 2,
    `bank_transaction_no` = 'BT202401002'
WHERE `id` = 4;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 3,
    `bank_transaction_no` = 'BT202401003'
WHERE `id` = 5;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 4,
    `bank_transaction_no` = 'BT202401004'
WHERE `id` = 6;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 5,
    `bank_transaction_no` = 'BT202402001'
WHERE `id` = 7;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 5,
    `bank_transaction_no` = 'BT202402001'
WHERE `id` = 8;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 6,
    `bank_transaction_no` = 'BT202402002'
WHERE `id` = 9;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 7,
    `bank_transaction_no` = 'BT202402003'
WHERE `id` = 10;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 8,
    `bank_transaction_no` = 'BT202402004'
WHERE `id` = 11;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 9,
    `bank_transaction_no` = 'BT202403001'
WHERE `id` = 12;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 10,
    `bank_transaction_no` = 'BT202403002'
WHERE `id` = 13;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 11,
    `bank_transaction_no` = 'BT202403003'
WHERE `id` = 14;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 12,
    `bank_transaction_no` = 'BT202403004'
WHERE `id` = 15;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 13,
    `bank_transaction_no` = 'BT202403005'
WHERE `id` = 16;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 14,
    `bank_transaction_no` = 'BT202404001'
WHERE `id` = 17;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 14,
    `bank_transaction_no` = 'BT202404001'
WHERE `id` = 18;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 15,
    `bank_transaction_no` = 'BT202404002'
WHERE `id` = 19;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 16,
    `bank_transaction_no` = 'BT202404003'
WHERE `id` = 20;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 17,
    `bank_transaction_no` = 'BT202404004'
WHERE `id` = 21;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 18,
    `bank_transaction_no` = 'BT202405001'
WHERE `id` = 22;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 19,
    `bank_transaction_no` = 'BT202405002'
WHERE `id` = 23;
UPDATE `invoice_finish`
SET `bank_transaction_id` = 20,
    `bank_transaction_no` = 'BT202405003'
WHERE `id` = 24;

-- 10. 插入进项发票数据（10条）
INSERT INTO `input_invoice` (`company_id`, `company_name`, `salesperson_id`, `salesperson_name`, `issue_date`, `amount`,
                             `invoice_no`, `supplier_id`, `supplier_name`, `supplier_contact`, `payment_date`,
                             `payment_amount`, `invoice_type`, `invoice_purpose`, `is_accounted`, `invoice_status`,
                             `remark1`, `remark2`, `remark3`)
VALUES (1, '九华云科技有限公司', 1, '张经理', '2024-01-10', 20000.00, 'INP202401001', 1, '北京供应商有限公司', '供一',
        '2024-01-15', 20000.00, '专票13%', '采购付款', 1, '已入账', NULL, NULL, NULL),
       (1, '九华云科技有限公司', 1, '张经理', '2024-02-10', 25000.00, 'INP202402001', 2, '上海供应商有限公司', '供二',
        '2024-02-15', 25000.00, '专票13%', '采购付款', 1, '已入账', NULL, NULL, NULL),
       (2, '九华云信息技术有限公司', 3, '王业务', '2024-03-10', 30000.00, 'INP202403001', 3, '深圳供应商有限公司',
        '供三', '2024-03-15', 30000.00, '专票6%', '费用报销', 1, '已入账', NULL, NULL, NULL),
       (2, '九华云信息技术有限公司', 3, '王业务', '2024-04-10', 35000.00, 'INP202404001', 4, '杭州供应商有限公司',
        '供四', '2024-04-15', 35000.00, '普票1%', '采购付款', 0, '未入账', NULL, NULL, NULL),
       (3, '九华云数据服务有限公司', 5, '孙销售', '2024-05-10', 40000.00, 'INP202405001', 5, '广州供应商有限公司',
        '供五', '2024-05-15', 40000.00, '专票13%', '采购付款', 1, '已入账', NULL, NULL, NULL),
       (3, '九华云数据服务有限公司', 5, '孙销售', '2024-01-20', 22000.00, 'INP202401002', 1, '北京供应商有限公司',
        '供一', '2024-01-25', 22000.00, '专票13%', '费用报销', 1, '已入账', NULL, NULL, NULL),
       (4, '九华云网络科技有限公司', 7, '吴业务', '2024-02-20', 27000.00, 'INP202402002', 2, '上海供应商有限公司',
        '供二', '2024-02-25', 27000.00, '专票6%', '采购付款', 1, '已入账', NULL, NULL, NULL),
       (4, '九华云网络科技有限公司', 7, '吴业务', '2024-03-20', 32000.00, 'INP202403002', 3, '深圳供应商有限公司',
        '供三', '2024-03-25', 32000.00, '普票1%', '费用报销', 0, '未入账', NULL, NULL, NULL),
       (5, '九华云智能科技有限公司', 9, '钱销售', '2024-04-20', 37000.00, 'INP202404002', 4, '杭州供应商有限公司',
        '供四', '2024-04-25', 37000.00, '专票13%', '采购付款', 1, '已入账', NULL, NULL, NULL),
       (5, '九华云智能科技有限公司', 9, '钱销售', '2024-05-20', 42000.00, 'INP202405002', 5, '广州供应商有限公司',
        '供五', NULL, NULL, '专票6%', '其他用途', 0, '未付款', NULL, NULL, NULL);


-- ============================================
-- 标记配置表（新增）
-- ============================================

-- 11. 标记配置表
CREATE TABLE IF NOT EXISTS `mark_config`
(
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `mark_value`  VARCHAR(20)  NOT NULL COMMENT '标记值：000、DK3、DK4、DK5、DK10、DK13等',
    `mark_label`  VARCHAR(50)  NULL COMMENT '标记标签（用于显示，如果不提供则使用mark_value）',
    `sort_order`  INT          NULL COMMENT '排序顺序（用于控制显示顺序，数字越小越靠前）',
    `is_enabled`  TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
    `remark`      VARCHAR(200) NULL COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_mark_value` (`mark_value`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_is_enabled` (`is_enabled`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='标记配置表';

-- 插入标记配置初始数据
INSERT INTO `mark_config` (`mark_value`, `mark_label`, `sort_order`, `is_enabled`, `remark`)
VALUES ('000', '000', 1, 1, '默认标记'),
       ('DK3', 'DK3', 2, 1, NULL),
       ('DK4', 'DK4', 3, 1, NULL),
       ('DK5', 'DK5', 4, 1, NULL),
       ('DK10', 'DK10', 5, 1, NULL),
       ('DK13', 'DK13', 6, 1, NULL);


ALTER TABLE `employee`
    ADD COLUMN `password` VARCHAR(255) NULL COMMENT '员工密码';

UPDATE `employee`
SET employee.password = '2908a66ab48a729318d9a680fb1a1f7f'
WHERE `is_delete` = 0;

-- 修复唯一索引和逻辑删除的冲突
-- 修改 invoice_type 表的唯一索引
ALTER TABLE `invoice_type` DROP INDEX `uk_type_name`;
ALTER TABLE `invoice_type` ADD UNIQUE INDEX `uk_type_name` (`type_name`, `is_delete`);

-- 修改 employee 表的唯一索引
ALTER TABLE `employee` DROP INDEX `uk_employee_no`;
ALTER TABLE `employee` ADD UNIQUE INDEX `uk_employee_no` (`employee_no`, `is_delete`);

-- 修改 transfer_method 表的唯一索引
ALTER TABLE `transfer_method` DROP INDEX `uk_method_name`;
ALTER TABLE `transfer_method` ADD UNIQUE INDEX `uk_method_name` (`method_name`, `is_delete`);

-- 修改 mark_config 表的唯一索引
ALTER TABLE `mark_config` DROP INDEX `uk_mark_value`;
ALTER TABLE `mark_config` ADD UNIQUE INDEX `uk_mark_value` (`mark_value`, `is_delete`);

-- 修改 invoice_base 表的唯一索引
ALTER TABLE `invoice_base` DROP INDEX `uk_invoice_no`;
ALTER TABLE `invoice_base` ADD UNIQUE INDEX `uk_invoice_no` (`invoice_no`, `is_delete`);

-- 修改 input_invoice 表的唯一索引
ALTER TABLE `input_invoice` DROP INDEX `uk_invoice_no`;
ALTER TABLE `input_invoice` ADD UNIQUE INDEX `uk_invoice_no` (`invoice_no`, `is_delete`);



-- 修改所有表的 is_delete 字段类型为 BIGINT
ALTER TABLE `company` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除';
ALTER TABLE `client` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除';
ALTER TABLE `invoice_base` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';
ALTER TABLE `invoice_finish` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';
ALTER TABLE `supplier` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除';
ALTER TABLE `bank_transaction` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';
ALTER TABLE `employee` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除';
ALTER TABLE `transfer_method` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';
ALTER TABLE `input_invoice` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';
ALTER TABLE `invoice_type` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除';
ALTER TABLE `mark_config` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';

-- 为发票开票信息表增加关键发票唯一序号字段和唯一索引（不直接修改原始建表结构，方便迁移）
-- ALTER TABLE `invoice_base`
--     ADD COLUMN `unique_key` VARCHAR(50) NOT NULL COMMENT '关键发票唯一序号（例如：XP20260101XXXX）';

-- ALTER TABLE `invoice_base`
--     ADD UNIQUE INDEX `uk_unique_key` (`unique_key`, `is_delete`);

-- ============================================
-- 进票用途配置表和权限管理配置表（新增）
-- ============================================

-- 12. 进票用途配置表
CREATE TABLE IF NOT EXISTS `invoice_purpose`
(
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `purpose_name` VARCHAR(50)  NOT NULL COMMENT '进票用途名称：采购付款、费用报销、其他用途',
    `sort_order`  INT          NULL COMMENT '排序顺序（用于控制显示顺序，数字越小越靠前）',
    `is_enabled`  TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
    `remark`      VARCHAR(200) NULL COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_purpose_name` (`purpose_name`, `is_delete`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_is_enabled` (`is_enabled`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='进票用途配置表';

-- 13. 权限管理配置表
CREATE TABLE IF NOT EXISTS `permission`
(
    `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `permission_name` VARCHAR(50)  NOT NULL COMMENT '权限名称：财务岗位、业务岗位、管理员',
    `permission_code` VARCHAR(50)  NULL COMMENT '权限代码：用于系统内部识别，如：FINANCE、BUSINESS、ADMIN',
    `sort_order`     INT          NULL COMMENT '排序顺序（用于控制显示顺序，数字越小越靠前）',
    `is_enabled`     TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
    `remark`         VARCHAR(200) NULL COMMENT '备注',
    `create_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_permission_name` (`permission_name`, `is_delete`),
    UNIQUE KEY `uk_permission_code` (`permission_code`, `is_delete`),
    KEY `idx_sort_order` (`sort_order`),
    KEY `idx_is_enabled` (`is_enabled`),
    KEY `idx_is_delete` (`is_delete`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='权限管理配置表';

-- 插入进票用途初始数据
INSERT INTO `invoice_purpose` (`purpose_name`, `sort_order`, `is_enabled`, `remark`)
VALUES ('采购付款', 1, 1, NULL),
       ('费用报销', 2, 1, NULL),
       ('其他用途', 3, 1, NULL);

-- 插入权限管理初始数据
INSERT INTO `permission` (`permission_name`, `permission_code`, `sort_order`, `is_enabled`, `remark`)
VALUES ('财务岗位', 'FINANCE', 1, 1, NULL),
       ('业务岗位', 'BUSINESS', 2, 1, NULL),
       ('管理员', 'ADMIN', 3, 1, NULL);

-- ============================================
-- 为员工表和进项发票表增加关联字段（不直接修改原始建表结构，方便迁移）
-- ============================================

-- 为员工表增加权限ID字段
ALTER TABLE `employee`
    ADD COLUMN `permission_id` BIGINT NULL COMMENT '权限ID（逻辑外键关联permission表）';

-- 为员工表增加权限ID索引
ALTER TABLE `employee`
    ADD KEY `idx_permission_id` (`permission_id`);

-- 为进项发票表增加进票用途ID字段
ALTER TABLE `input_invoice`
    ADD COLUMN `invoice_purpose_id` BIGINT NULL COMMENT '进票用途ID（逻辑外键关联invoice_purpose表）';

-- 为进项发票表增加进票用途ID索引
ALTER TABLE `input_invoice`
    ADD KEY `idx_invoice_purpose_id` (`invoice_purpose_id`);

-- 修改进票用途表的唯一索引（支持逻辑删除）
ALTER TABLE `invoice_purpose` DROP INDEX `uk_purpose_name`;
ALTER TABLE `invoice_purpose` ADD UNIQUE INDEX `uk_purpose_name` (`purpose_name`, `is_delete`);

-- 修改权限管理表的唯一索引（支持逻辑删除）
ALTER TABLE `permission` DROP INDEX `uk_permission_name`;
ALTER TABLE `permission` ADD UNIQUE INDEX `uk_permission_name` (`permission_name`, `is_delete`);
ALTER TABLE `permission` DROP INDEX `uk_permission_code`;
ALTER TABLE `permission` ADD UNIQUE INDEX `uk_permission_code` (`permission_code`, `is_delete`);

-- 修改进票用途表的is_delete字段类型为BIGINT
ALTER TABLE `invoice_purpose` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';

-- 修改权限管理表的is_delete字段类型为BIGINT
ALTER TABLE `permission` MODIFY COLUMN `is_delete` BIGINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除（逻辑删除）';

-- ============================================
-- 接口更新 - 数据库修改
-- ============================================

-- 1. 销项发票（invoice_base）表：添加unique_key字段和唯一索引
-- 注意：先添加字段（允许NULL），然后为现有数据生成唯一unique_key，最后添加唯一索引
ALTER TABLE `invoice_base`
    ADD COLUMN `unique_key` VARCHAR(50) NULL COMMENT '关键发票唯一序号（格式：XP+yyyymmdd+4位序号，共14位）' AFTER `id`;

-- 为现有数据生成唯一的unique_key值（格式：XP+yyyymmdd+4位序号）
-- 使用ID的后4位确保唯一性，如果ID不足4位则前面补0
UPDATE `invoice_base`
SET `unique_key` = CONCAT('XP', DATE_FORMAT(COALESCE(issue_date, create_time), '%Y%m%d'), LPAD(MOD(id, 10000), 4, '0'))
WHERE `unique_key` IS NULL;

-- 将unique_key字段改为NOT NULL
ALTER TABLE `invoice_base`
    MODIFY COLUMN `unique_key` VARCHAR(50) NOT NULL COMMENT '关键发票唯一序号（格式：XP+yyyymmdd+4位序号，共14位）';

-- 添加唯一索引
ALTER TABLE `invoice_base`
    ADD UNIQUE KEY `uk_unique_key` (`unique_key`, `is_delete`);

-- 2. 银行收支（bank_transaction）表：添加unique_key字段和唯一索引
-- 注意：先添加字段（允许NULL），然后为现有数据生成唯一unique_key，最后添加唯一索引
ALTER TABLE `bank_transaction`
    ADD COLUMN `unique_key` VARCHAR(50) NULL COMMENT '银行收支唯一序号（格式：YH+yyyymmdd+4位序号，共14位）' AFTER `id`;

-- 为现有数据生成唯一的unique_key值（格式：YH+yyyymmdd+4位序号）
-- 使用ID的后4位确保唯一性，如果ID不足4位则前面补0
UPDATE `bank_transaction`
SET `unique_key` = CONCAT('YH', DATE_FORMAT(COALESCE(arrival_time, create_time), '%Y%m%d'), LPAD(MOD(id, 10000), 4, '0'))
WHERE `unique_key` IS NULL;

-- 将unique_key字段改为NOT NULL
ALTER TABLE `bank_transaction`
    MODIFY COLUMN `unique_key` VARCHAR(50) NOT NULL COMMENT '银行收支唯一序号（格式：YH+yyyymmdd+4位序号，共14位）';

-- 添加唯一索引
ALTER TABLE `bank_transaction`
    ADD UNIQUE KEY `uk_unique_key` (`unique_key`, `is_delete`);

-- 3. 进项发票（input_invoice）表：添加unique_key字段、转账方式字段和唯一索引
-- 注意：先添加字段（允许NULL），然后为现有数据生成唯一unique_key，最后添加唯一索引
ALTER TABLE `input_invoice`
    ADD COLUMN `unique_key` VARCHAR(50) NULL COMMENT '进项发票唯一序号（格式：JP+yyyymmdd+4位序号，共14位）' AFTER `id`,
    ADD COLUMN `transfer_method_id` BIGINT NULL COMMENT '转账方式ID（逻辑外键关联transfer_method表）' AFTER `payment_amount`,
    ADD COLUMN `transfer_method` VARCHAR(50) NULL COMMENT '转账方式名称（冗余字段便于查询）' AFTER `transfer_method_id`;

-- 为现有数据生成唯一的unique_key值（格式：JP+yyyymmdd+4位序号）
-- 使用ID的后4位确保唯一性，如果ID不足4位则前面补0
UPDATE `input_invoice`
SET `unique_key` = CONCAT('JP', DATE_FORMAT(COALESCE(issue_date, create_time), '%Y%m%d'), LPAD(MOD(id, 10000), 4, '0'))
WHERE `unique_key` IS NULL;

-- 将unique_key字段改为NOT NULL
ALTER TABLE `input_invoice`
    MODIFY COLUMN `unique_key` VARCHAR(50) NOT NULL COMMENT '进项发票唯一序号（格式：JP+yyyymmdd+4位序号，共14位）';

-- 添加唯一索引和其他索引
ALTER TABLE `input_invoice`
    ADD UNIQUE KEY `uk_unique_key` (`unique_key`, `is_delete`),
    ADD KEY `idx_transfer_method_id` (`transfer_method_id`);

-- 4. 客户信息表（client）：更新remark2字段注释
ALTER TABLE `client`
    MODIFY COLUMN `remark2` VARCHAR(100) NULL COMMENT '备注2（微信号，临时）';

-- 5. 供应商信息表（supplier）：更新remark2字段注释
ALTER TABLE `supplier`
    MODIFY COLUMN `remark2` VARCHAR(100) NULL COMMENT '备注2（微信号，临时）';

-- ============================================
-- 员工信息表扩展字段（2024年更新）
-- ============================================

-- 6. 员工信息表（employee）：添加新字段
ALTER TABLE `employee`
    ADD COLUMN `age` INT NULL COMMENT '年龄（根据出生日期自动计算）' AFTER `birth_date`,
    ADD COLUMN `household_type` VARCHAR(20) NULL COMMENT '户口性质：城镇、农村、其他' AFTER `id_card`,
    ADD COLUMN `marital_status` VARCHAR(20) NULL COMMENT '婚育状况：未婚、已婚、离异、其他' AFTER `household_type`,
    ADD COLUMN `native_place` VARCHAR(100) NULL COMMENT '籍贯' AFTER `marital_status`,
    ADD COLUMN `household_address` VARCHAR(200) NULL COMMENT '户籍地址' AFTER `native_place`,
    ADD COLUMN `residence_address` VARCHAR(200) NULL COMMENT '居住地址' AFTER `household_address`,
    ADD COLUMN `first_insurance_date` DATE NULL COMMENT '首次参保年月（格式：YYYY-MM，存储时使用日期类型，只取年月部分）' AFTER `residence_address`,
    ADD COLUMN `email` VARCHAR(100) NULL COMMENT '邮件' AFTER `first_insurance_date`,
    ADD COLUMN `emergency_contact_name` VARCHAR(50) NULL COMMENT '紧急联系人姓名' AFTER `expiry_date`,
    ADD COLUMN `emergency_contact_relation` VARCHAR(20) NULL COMMENT '紧急联系人关系：家属、朋友、其他' AFTER `emergency_contact_name`,
    ADD COLUMN `emergency_contact_phone` VARCHAR(50) NULL COMMENT '紧急联系人联系电话' AFTER `emergency_contact_relation`,
    ADD COLUMN `education_level` VARCHAR(20) NULL COMMENT '学历：大专、大专以下、本科、本科以上' AFTER `emergency_contact_phone`,
    ADD COLUMN `education_type` VARCHAR(20) NULL COMMENT '学习形式：全日制、自考、成考、其他' AFTER `education_level`,
    ADD COLUMN `graduation_school` VARCHAR(100) NULL COMMENT '毕业院校' AFTER `education_type`,
    ADD COLUMN `major` VARCHAR(100) NULL COMMENT '专业' AFTER `graduation_school`,
    ADD KEY `idx_hire_date` (`hire_date`),
    ADD KEY `idx_regular_date` (`regular_date`);

-- 注意：如果表中已存在以下字段，需要先检查再添加
-- password VARCHAR(50) - 登录密码（加密存储）
-- permission_id BIGINT - 权限ID（逻辑外键关联permission表）

-- ============================================
-- 为所有表添加系统录入人员字段（2024年更新）
-- 用于记录数据的创建者和最后更新者
-- ============================================

-- 1. 开票公司表（company）：添加系统录入人员字段
ALTER TABLE `company`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 2. 客户信息表（client）：添加系统录入人员字段
ALTER TABLE `client`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 3. 发票开票信息表（invoice_base）：添加系统录入人员字段
ALTER TABLE `invoice_base`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 4. 发票到款信息表（invoice_finish）：添加系统录入人员字段
ALTER TABLE `invoice_finish`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 5. 供应商信息表（supplier）：添加系统录入人员字段
ALTER TABLE `supplier`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 6. 银行收支明细表（bank_transaction）：添加系统录入人员字段
ALTER TABLE `bank_transaction`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 7. 员工信息表（employee）：添加系统录入人员字段
ALTER TABLE `employee`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 8. 转账方式配置表（transfer_method）：添加系统录入人员字段
ALTER TABLE `transfer_method`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 9. 进项发票表（input_invoice）：添加系统录入人员字段
ALTER TABLE `input_invoice`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 10. 发票性质配置表（invoice_type）：添加系统录入人员字段
ALTER TABLE `invoice_type`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 11. 标记配置表（mark_config）：添加系统录入人员字段
ALTER TABLE `mark_config`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 12. 进票用途配置表（invoice_purpose）：添加系统录入人员字段
ALTER TABLE `invoice_purpose`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 13. 权限管理配置表（permission）：添加系统录入人员字段
ALTER TABLE `permission`
    ADD COLUMN `created_by` VARCHAR(50) NULL COMMENT '创建人（系统录入人员，默认当前登录人）' AFTER `update_time`,
    ADD COLUMN `updated_by` VARCHAR(50) NULL COMMENT '更新人（系统录入人员，默认当前登录人）' AFTER `created_by`,
    ADD KEY `idx_created_by` (`created_by`),
    ADD KEY `idx_updated_by` (`updated_by`);

-- 注意：
-- 1. created_by 字段：在创建记录时自动填充当前登录人的姓名（通过AOP统一处理）
-- 2. updated_by 字段：在更新记录时自动填充当前登录人的姓名（通过AOP统一处理）
-- 3. 删除操作（逻辑删除）时，updated_by 也会更新为当前登录人
-- 4. 建议使用AOP切面统一处理，避免在每个接口中重复编写赋值逻辑