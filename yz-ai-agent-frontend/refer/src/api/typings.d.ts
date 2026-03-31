declare namespace API {
  type BankTransaction_ = {
    /** 到款金额 */
    amount?: number;
    /** 到账时间 */
    arrivalTime?: string;
    /** 余额（冗余字段便于查询） */
    balance?: number;
    /** 客户名称（冗余字段便于查询） */
    clientCompanyName?: string;
    /** 客户ID（逻辑外键关联client表，可选） */
    clientId?: number;
    /** 客户姓名（冗余字段便于查询） */
    clientPerson?: string;
    /** 客户电话（冗余字段便于查询） */
    clientPhone?: string;
    /** 公司ID（逻辑外键关联company表） */
    companyId?: number;
    /** 公司名称（冗余字段便于查询） */
    companyName?: string;
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 关联开票信息ID（逻辑外键关联invoice_base表，可选，冗余字段） */
    invoiceBaseId?: number;
    /** 关联入账信息ID（逻辑外键关联invoice_finish表，可选，主要关联） */
    invoiceFinishId?: number;
    /** 关联发票号码（冗余字段便于查询，支持多个发票号码用逗号分隔） */
    invoiceNo?: string;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 备注1（可用于记录其他关联的发票到款记录信息） */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID（逻辑外键关联employee表） */
    salespersonId?: number;
    /** 业务员姓名（冗余字段便于查询） */
    salespersonName?: string;
    /** 收款方式 */
    transferMethod?: string;
    /** 唯一标识 */
    uniqueKey?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type BankTransactionAddDto_ = {
    /** 必填，到款金额 */
    amount: number;
    /** 必填，到账时间，格式：yyyy-MM-dd HH:mm:ss 或 yyyy-MM-dd */
    arrivalTime: string;
    /** 可选，客户名称，如果提供，会自动关联客户ID */
    clientCompanyName?: string;
    clientId?: number;
    /** 可选，客户电话 */
    clientPhone?: string;
    companyId?: number;
    /** 必填，公司名称，会自动关联公司ID */
    companyName: string;
    /** 可选，关联发票号码（多个发票号码用逗号分隔） */
    invoiceNo?: string[];
    /** 可选，备注1 */
    remark1?: string;
    /** 可选，备注2 */
    remark2?: string;
    /** 可选，备注3 */
    remark3?: string;
    /** 可选，业务员ID，如果提供，会自动关联业务员ID */
    salespersonId?: number;
    /** 可选，业务员姓名，如果提供，会自动关联业务员ID */
    salespersonName?: string;
    /** 收款方式 */
    transferMethod?: string;
    /** 可选，客户名称 */
    userName?: string;
  };

  type BankTransactionRelatedInvoiceVO = {
    /** 到款金额 */
    amount?: number;
    /** 到账时间 */
    arrivalTime?: string;
    /** 主键ID */
    id?: number;
    /** 备注1（可用于记录其他关联的发票到款记录信息） */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 收款方式 */
    transferMethod?: string;
    /** 唯一标识 */
    uniqueKey?: string;
  };

  type BankTransactionRemainingAmountVO_ = {
    /** 银行收支记录原始金额（amount > 0） */
    bankTransactionAmount?: number;
    /** 银行收支记录ID */
    bankTransactionId?: number;
    /** 剩余可用金额 = bankTransactionAmount - usedAmount，最小为 0 */
    remainingAmount?: number;
    /** 已使用金额（关联的 invoice_finish 中 paid_amount 总和，is_delete=0） */
    usedAmount?: number;
  };

  type BankTransactionSyncInvoiceDTO = {
    /** 银行收支记录ID数组 */
    bankTransactionIds: number[];
    /** 到款日期 */
    paidDate?: string;
    /** 转账方式 */
    transferMethod?: string;
  };

  type BankTransactionSyncInvoiceVO = {
    /** 失败的记录数 */
    failCount?: number;
    /** 处理结果详情列表 */
    results?: SyncResultItemVO[];
    /** 成功处理的记录数 */
    successCount?: number;
  };

  type BankTransactionUpdateDto = {
    /** 必填，到款金额 */
    amount: number;
    /** 必填，到账时间，格式：yyyy-MM-dd HH:mm:ss 或 yyyy-MM-dd */
    arrivalTime: string;
    /** 可选，客户名称，如果提供，会自动关联客户ID */
    clientCompanyName?: string;
    /** 可选，客户电话 */
    clientPhone?: string;
    companyId?: number;
    /** 必填，公司名称，会自动关联公司ID */
    companyName: string;
    id?: number;
    /** 可选，关联发票号码（多个发票号码用逗号分隔） */
    invoiceNo?: string;
    /** 可选，备注1 */
    remark1?: string;
    /** 可选，备注2 */
    remark2?: string;
    /** 可选，备注3 */
    remark3?: string;
    salespersonId?: number;
    /** 可选，业务员姓名，如果提供，会自动关联业务员ID */
    salespersonName?: string;
    /** 可选，收款方式 */
    transferMethod?: string;
    /** 可选，客户名称 */
    userName?: string;
  };

  type BankTransactionWithInvoicesDTO = {
    bankTransactionId?: number;
  };

  type BankTransactionWithInvoicesVO_ = {
    /** 银行收支记录金额 */
    bankTransactionAmount?: number;
    /** 银行收支记录ID */
    bankTransactionId?: number;
    /** 关联的发票信息列表 */
    invoiceList?: InvoiceDetailVO_[];
  };

  type banktrascationUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type BaseResponse = {
    code?: number;
    data?: Record<string, any>;
    message?: string;
  };

  type BaseResponseBankTransactionRemainingAmountVO_ = {
    code?: number;
    data?: BankTransactionRemainingAmountVO_;
    message?: string;
  };

  type BaseResponseBankTransactionSyncInvoiceVO_ = {
    code?: number;
    data?: BankTransactionSyncInvoiceVO;
    message?: string;
  };

  type BaseResponseBankTransactionWithInvoicesVO_ = {
    code?: number;
    data?: BankTransactionWithInvoicesVO_;
    message?: string;
  };

  type BaseResponseBoolean_ = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseClient_ = {
    code?: number;
    data?: Client_;
    message?: string;
  };

  type BaseResponseClientPageVo_ = {
    code?: number;
    data?: ClientPageVo;
    message?: string;
  };

  type BaseResponseCompanyInvoiceStatisticsVO_ = {
    code?: number;
    data?: CompanyInvoiceStatisticsVO;
    message?: string;
  };

  type BaseResponseCompanyPageVO_ = {
    code?: number;
    data?: CompanyPageVO;
    message?: string;
  };

  type BaseResponseEmployeePageVO_ = {
    code?: number;
    data?: EmployeePageVO;
    message?: string;
  };

  type BaseResponseExcelImportResultVO_ = {
    code?: number;
    data?: ExcelImportResultVO;
    message?: string;
  };

  type BaseResponseExistsCompanyVo_ = {
    code?: number;
    data?: ExistsCompanyVo;
    message?: string;
  };

  type BaseResponseExistsVo_ = {
    code?: number;
    data?: ExistsVo;
    message?: string;
  };

  type BaseResponseExistsVoEmployee_ = {
    code?: number;
    data?: ExistsVoEmployee;
    message?: string;
  };

  type BaseResponseExistsVoSupplier_ = {
    code?: number;
    data?: ExistsVoSupplier;
    message?: string;
  };

  type BaseResponseInputPaymentRelatedVo_ = {
    code?: number;
    data?: InputPaymentRelatedVo;
    message?: string;
  };

  type BaseResponseInputPaymentResultVo_ = {
    code?: number;
    data?: InputPaymentResultVo;
    message?: string;
  };

  type BaseResponseInputVoicePageVO_ = {
    code?: number;
    data?: InputVoicePageVO;
    message?: string;
  };

  type BaseResponseInvoiceBase_ = {
    code?: number;
    data?: InvoiceBase_;
    message?: string;
  };

  type BaseResponseInvoiceFinishPageVO_ = {
    code?: number;
    data?: InvoiceFinishPageVO;
    message?: string;
  };

  type BaseResponseInvoicePageVO_ = {
    code?: number;
    data?: InvoicePageVO;
    message?: string;
  };

  type BaseResponseInvoicePurposePageVO_ = {
    code?: number;
    data?: InvoicePurposePageVO;
    message?: string;
  };

  type BaseResponseInvoiceTypePageVO_ = {
    code?: number;
    data?: InvoiceTypePageVO;
    message?: string;
  };

  type BaseResponseList_ = {
    code?: number;
    data?: Record<string, any>[];
    message?: string;
  };

  type BaseResponseListBankTransactionRelatedInvoiceVO_ = {
    code?: number;
    data?: BankTransactionRelatedInvoiceVO[];
    message?: string;
  };

  type BaseResponseListCompanyIdNameVO_ = {
    code?: number;
    data?: CompanyIdNameVO[];
    message?: string;
  };

  type BaseResponseListEmployeeBasicInfoVO_ = {
    code?: number;
    data?: EmployeeBasicInfoVO[];
    message?: string;
  };

  type BaseResponseListLong_ = {
    code?: number;
    data?: number[];
    message?: string;
  };

  type BaseResponseListString_ = {
    code?: number;
    data?: string[];
    message?: string;
  };

  type BaseResponseListUserNameByCompanyNameVo_ = {
    code?: number;
    data?: UserNameByCompanyNameVo[];
    message?: string;
  };

  type BaseResponseLoginUserVO_ = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseMarkPageVO_ = {
    code?: number;
    data?: MarkPageVO;
    message?: string;
  };

  type BaseResponsePermissionPageVO_ = {
    code?: number;
    data?: PermissionPageVO;
    message?: string;
  };

  type BaseResponseSetString_ = {
    code?: number;
    data?: string[];
    message?: string;
  };

  type BaseResponseSupplierPageVO_ = {
    code?: number;
    data?: SupplierPageVO;
    message?: string;
  };

  type BaseResponseTransactionPageVO_ = {
    code?: number;
    data?: TransactionPageVO;
    message?: string;
  };

  type BaseResponseTransferMethodPageVo_ = {
    code?: number;
    data?: TransferMethodPageVo;
    message?: string;
  };

  type Client_ = {
    /** 银行账号 */
    bankAccount?: string;
    /** 银行名称 */
    bankName?: string;
    /** 经营范围 */
    businessScope?: string;
    /** 公司名称 */
    companyName?: string;
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 邮箱 */
    email?: string;
    /** 主键ID */
    id?: number;
    /** 是否删除：0-未删除，1-已删除 */
    isDelete?: number;
    /** 法人 */
    legalPerson?: string;
    /** 注册地址 */
    registerAddress?: string;
    /** 注册电话 */
    registerPhone?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID（逻辑外键关联employee表） */
    salespersonId?: number;
    /** 业务员姓名（冗余字段便于查询） */
    salespersonName?: string;
    /** 公司税号 */
    taxNo?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
    /** 用户姓名 */
    userName?: string;
    /** 用户电话 */
    userPhone?: string;
  };

  type ClientAddDto = {
    bankAccount?: string;
    bankName?: string;
    businessScope?: string;
    companyName?: string;
    email?: string;
    legalPerson?: string;
    registerAddress?: string;
    registerPhone?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    salespersonName?: string;
    taxNo?: string;
    userName?: string;
    userPhone?: string;
  };

  type ClientPageDto = {
    bankAccount?: string;
    bankName?: string;
    companyName?: string;
    current?: number;
    email?: string;
    id?: number;
    legalPerson?: string;
    pageSize?: number;
    registerAddress?: string;
    registerPhone?: string;
    salespersonId?: number;
    salespersonName?: string;
    sortField?: string;
    sortOrder?: string;
    taxNo?: string;
    userName?: string;
    userPhone?: string;
  };

  type ClientPageVo = {
    current?: number;
    pages?: number;
    records?: Client_[];
    size?: number;
    total?: number;
  };

  type ClientUpdateDto = {
    bankAccount?: string;
    bankName?: string;
    businessScope?: string;
    companyName?: string;
    email?: string;
    id?: number;
    legalPerson?: string;
    registerAddress?: string;
    registerPhone?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    salespersonName?: string;
    taxNo?: string;
    userName?: string;
    userPhone?: string;
  };

  type clientUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type Company = {
    bankAccount?: string;
    bankName?: string;
    companyName?: string;
    contactPerson?: string;
    contactPhone1?: string;
    createTime?: string;
    createdBy?: string;
    id?: number;
    isDelete?: number;
    isEnabled?: number;
    legalPerson?: string;
    registerAddress?: string;
    registerPhone?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    sortOrder?: number;
    taxNo?: string;
    updateTime?: string;
    updatedBy?: string;
  };

  type CompanyAddDto = {
    bankAccount?: string;
    bankName?: string;
    companyName?: string;
    contactPerson?: string;
    contactPhone1?: string;
    isEnabled?: number;
    legalPerson?: string;
    registerAddress?: string;
    registerPhone?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    sortOrder?: number;
    taxNo?: string;
  };

  type CompanyExistsRequest = {
    companyName?: string;
  };

  type CompanyIdNameVO = {
    companyName?: string;
    id?: number;
  };

  type CompanyInvoiceStatisticsVO = {
    /** 各公司发票收款明细统计列表 */
    statistics?: CompanyStatisticsItem[];
    summary?: CompanyStatisticsSummary;
  };

  type CompanyNameDto = {
    companyName?: string;
  };

  type CompanyPageDTO = {
    bankAccount?: string;
    bankName?: string;
    companyIds?: string[];
    companyName?: string;
    contactPerson?: string;
    contactPhone1?: string;
    current?: number;
    id?: number;
    isEnabled?: number;
    legalPerson?: string;
    pageSize?: number;
    registerAddress?: string;
    registerPhone?: string;
    sortField?: string;
    sortOrder?: string;
    taxNo?: string;
  };

  type CompanyPageVO = {
    current?: number;
    pages?: number;
    records?: Company[];
    size?: number;
    total?: number;
  };

  type CompanyStatisticsItem = {
    /** 公司ID */
    companyId?: number;
    /** 公司名称 */
    companyName?: string;
    /** 发票张数 */
    invoiceCount?: number;
    /** 已到款发票张数 */
    paidInvoiceCount?: number;
    /** 开票金额（该公司所有发票金额总和，含正负） */
    totalInvoiceAmount?: number;
    /** 收款金额（该公司所有到款金额总和） */
    totalPaidAmount?: number;
    /** 欠款金额（开票金额 - 收款金额） */
    unpaidAmount?: number;
    /** 未到款发票张数 */
    unpaidInvoiceCount?: number;
  };

  type CompanyStatisticsSummary = {
    /** 总开票金额（所有公司） */
    totalInvoiceAmount?: number;
    /** 总发票张数 */
    totalInvoiceCount?: number;
    /** 总收款金额（所有公司） */
    totalPaidAmount?: number;
    /** 总已到款发票张数 */
    totalPaidInvoiceCount?: number;
    /** 总欠款金额（所有公司） */
    totalUnpaidAmount?: number;
    /** 总未到款发票张数 */
    totalUnpaidInvoiceCount?: number;
  };

  type CompanyUpdateDto = {
    bankAccount?: string;
    bankName?: string;
    companyName?: string;
    contactPerson?: string;
    contactPhone1?: string;
    id?: number;
    isEnabled?: number;
    legalPerson?: string;
    registerAddress?: string;
    registerPhone?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    sortOrder?: number;
    taxNo?: string;
  };

  type companyUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type DataStatisticsQueryDTO = {
    /** 公司ID数组 */
    companyIds?: number[];
    /** 结束日期 */
    endDate?: string;
    /** 业务员名称 */
    salespersonName?: string;
    /** 开始日期 */
    startDate?: string;
    /** 年份 */
    year?: number;
  };

  type DeleteRequest = {
    id?: number;
  };

  type EmployeeAddDTO = {
    /** 年龄 */
    age?: number;
    /** 出生年月 */
    birthDate?: string;
    /** 公司ID */
    companyId: number;
    /** 公司名称 */
    companyName?: string;
    /** 部门名称 */
    department?: string;
    /** 最高学历 */
    educationLevel?: string;
    /** 学历类型 */
    educationType?: string;
    /** 邮箱/Cmail */
    email?: string;
    /** 紧急联系人姓名 */
    emergencyContactName?: string;
    /** 紧急联系人电话 */
    emergencyContactPhone?: string;
    /** 紧急联系人关系 */
    emergencyContactRelation?: string;
    /** 工号 */
    employeeNo: string;
    /** 有效期止 */
    expiryDate?: string;
    /** 首次参保日期 */
    firstInsuranceDate?: string;
    /** 性别 */
    gender?: string;
    /** 毕业院校 */
    graduationSchool?: string;
    /** 入职日期 */
    hireDate?: string;
    /** 户籍地址 */
    householdAddress?: string;
    /** 户口性质 */
    householdType?: string;
    /** 身份证号 */
    idCard?: string;
    /** 专业 */
    major?: string;
    /** 婚姻状况 */
    maritalStatus?: string;
    /** 员工姓名 */
    name: string;
    /** 籍贯 */
    nativePlace?: string;
    /** 密码 */
    password?: string;
    /** 人员权限描述 */
    permission?: string;
    /** 权限ID */
    permissionId?: number;
    /** 联系电话 */
    phone?: string;
    /** 岗位 */
    position?: string;
    /** 转正日期 */
    regularDate?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 现居住地 */
    residenceAddress?: string;
  };

  type EmployeeBasicInfoVO = {
    companyId?: number;
    companyName?: string;
    employeeNo?: string;
    id?: number;
    name?: string;
  };

  type EmployeePageVO = {
    current?: number;
    pages?: number;
    records?: EmployeeVO[];
    size?: number;
    total?: number;
  };

  type EmployeePermissionUpdateDTO = {
    /** 岗位到期时间 */
    expiryDate: string;
    /** 员工ID */
    id: number;
    /** 人员权限 */
    permission: string;
    /** 人员权限编码 */
    permissionCode: string;
    permissionId?: number;
  };

  type EmployeeQueryDTO = {
    /** 公司ID */
    companyId?: number;
    /** 公司ID列表 */
    companyIds?: number[];
    /** 公司名称 */
    companyName?: string;
    /** 当前页码 */
    current?: number;
    /** 部门名称 */
    department?: string;
    /** 工号 */
    employeeNo?: string;
    /** 入职日期范围-结束 */
    hireDateEnd?: string;
    /** 入职日期范围-开始 */
    hireDateStart?: string;
    /** 序号 */
    id?: number;
    /** 员工姓名 */
    name?: string;
    /** 每页数量 */
    pageSize?: number;
    /** 人员权限 */
    permission?: string;
    /** 岗位 */
    position?: string;
    /** 转正日期范围-结束 */
    regularDateEnd?: string;
    /** 转正日期范围-开始 */
    regularDateStart?: string;
    sortField?: string;
    sortOrder?: string;
  };

  type EmployeeUpdateDTO = {
    /** 年龄 */
    age?: number;
    /** 出生年月 */
    birthDate?: string;
    /** 公司ID */
    companyId: number;
    /** 公司名称 */
    companyName?: string;
    /** 部门名称 */
    department?: string;
    /** 最高学历 */
    educationLevel?: string;
    /** 学历类型 */
    educationType?: string;
    /** 邮箱/Cmail */
    email?: string;
    /** 紧急联系人姓名 */
    emergencyContactName?: string;
    /** 紧急联系人电话 */
    emergencyContactPhone?: string;
    /** 紧急联系人关系 */
    emergencyContactRelation?: string;
    /** 工号 */
    employeeNo: string;
    /** 有效期止 */
    expiryDate?: string;
    /** 首次参保日期 */
    firstInsuranceDate?: string;
    /** 性别 */
    gender?: string;
    /** 毕业院校 */
    graduationSchool?: string;
    /** 入职日期 */
    hireDate?: string;
    /** 户籍地址 */
    householdAddress?: string;
    /** 户口性质 */
    householdType?: string;
    /** 员工ID */
    id: number;
    /** 身份证号 */
    idCard?: string;
    /** 专业 */
    major?: string;
    /** 婚姻状况 */
    maritalStatus?: string;
    /** 员工姓名 */
    name: string;
    /** 籍贯 */
    nativePlace?: string;
    /** 密码 */
    password?: string;
    /** 人员权限描述 */
    permission?: string;
    /** 权限ID */
    permissionId?: number;
    /** 联系电话 */
    phone?: string;
    /** 岗位 */
    position?: string;
    /** 转正日期 */
    regularDate?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 现居住地 */
    residenceAddress?: string;
  };

  type employeeUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type EmployeeVO = {
    /** 年龄 */
    age?: number;
    /** 出生年月 */
    birthDate?: string;
    /** 公司ID */
    companyId?: number;
    /** 公司名称 */
    companyName?: string;
    /** 创建时间 */
    createTime?: string;
    /** 部门名称 */
    department?: string;
    /** 学历 */
    educationLevel?: string;
    /** 学习形式 */
    educationType?: string;
    /** 邮件 */
    email?: string;
    /** 紧急联系人姓名 */
    emergencyContactName?: string;
    /** 紧急联系人电话 */
    emergencyContactPhone?: string;
    /** 紧急联系人关系 */
    emergencyContactRelation?: string;
    /** 工号 */
    employeeNo?: string;
    /** 有效期止 */
    expiryDate?: string;
    /** 首次参保年月 */
    firstInsuranceDate?: string;
    /** 性别 */
    gender?: string;
    /** 毕业院校 */
    graduationSchool?: string;
    /** 入职日期 */
    hireDate?: string;
    /** 户籍地址 */
    householdAddress?: string;
    /** 户口性质 */
    householdType?: string;
    /** 员工ID */
    id?: number;
    /** 身份证号 */
    idCard?: string;
    /** 专业 */
    major?: string;
    /** 婚姻状况 */
    maritalStatus?: string;
    /** 员工姓名 */
    name?: string;
    /** 籍贯 */
    nativePlace?: string;
    /** 人员权限 */
    permission?: string;
    /** 联系电话 */
    phone?: string;
    /** 岗位 */
    position?: string;
    /** 转正日期 */
    regularDate?: string;
    /** 备注1 */
    remark1?: string;
    /** 居住地址 */
    residenceAddress?: string;
    /** 更新时间 */
    updateTime?: string;
  };

  type ExcelImportResultVO = {
    failCount?: number;
    failRecords?: Record<string, any>[];
    successCount?: number;
    totalCount?: number;
  };

  type ExistsCompanyVo = {
    companyAccount?: string;
    companyName?: string;
    exists?: boolean;
    id?: number;
  };

  type ExistsRequest = {
    companyName?: string;
    userName?: string;
  };

  type ExistsRequestEployee = {
    name?: string;
  };

  type ExistsRequestSupplier = {
    companyName?: string;
    supplierName?: string;
  };

  type ExistsVo = {
    clientId?: number[];
    exists?: boolean;
  };

  type ExistsVoEmployee = {
    employeeId?: number[];
    exists?: boolean;
  };

  type ExistsVoSupplier = {
    exists?: boolean;
    supplierId?: number[];
  };

  type getAllEmployeeBasicInfoUsingGETParams = {
    /** companyName */
    companyName?: string;
  };

  type getClientByIdUsingGETParams = {
    /** id */
    id: number;
  };

  type InputInvoice_ = {
    /** 开票金额 */
    amount?: number;
    /** 公司ID（逻辑外键关联company表） */
    companyId?: number;
    /** 公司名称（冗余字段便于查询） */
    companyName?: string;
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 发票号码 */
    invoiceNo?: string;
    /** 票用途：采购付款、费用报销、其他用途 */
    invoicePurpose?: string;
    /** 票状态 */
    invoiceStatus?: string;
    /** 票类型：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他 */
    invoiceType?: string;
    /** 财务入账：0-否，1-是 */
    isAccounted?: number;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 开票日期 */
    issueDate?: string;
    /** 付款金额 */
    paymentAmount?: number;
    /** 付款日期 */
    paymentDate?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID（逻辑外键关联employee表） */
    salespersonId?: number;
    /** 业务员姓名（冗余字段便于查询） */
    salespersonName?: string;
    /** 供货姓名（冗余字段便于查询） */
    supplierContact?: string;
    /** 供货单位ID（逻辑外键关联supplier表，可选） */
    supplierId?: number;
    /** 供货单位（冗余字段便于查询） */
    supplierName?: string;
    /** 唯一标识 */
    uniqueKey?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type InputInvoiceAddDTO = {
    amount?: number;
    companyId?: number;
    id?: number;
    invoiceNo?: string;
    invoicePurpose?: string;
    invoiceStatus?: string;
    invoiceType?: string;
    isAccounted?: number;
    issueDate?: string;
    paymentAmount?: number;
    paymentDate?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    salespersonName?: string;
    supplierContact?: string;
    supplierId?: number;
    supplierName?: string;
  };

  type inputInvoiceUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type InputPaymentDto = {
    bankTransactionId?: number;
    id?: number;
    inputInvoiceId?: number;
    paymentAmount?: number;
    paymentDate?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    supplierId?: number;
    transferMethod?: string;
  };

  type InputPaymentQueryDto = {
    inputInvoiceId?: number;
  };

  type InputPaymentRelatedVo = {
    /** 关联银行收支列表 */
    bankIdList?: string[];
    /** 出账金额列表 */
    paidAmountList?: number[];
    /** 出账日期列表 */
    paidDateList?: string[];
  };

  type InputPaymentResultDetailVO = {
    bankTransactionId?: number;
    inputInvoiceId?: number;
    inputInvoicePaymentId?: number;
    message?: string;
    success?: boolean;
  };

  type InputPaymentResultVo = {
    failCount?: number;
    results?: InputPaymentResultDetailVO[];
    successCount?: number;
  };

  type InputVoicePageDTO = {
    companyId?: number;
    companyIds?: number[];
    companyName?: string;
    current?: number;
    endDate?: string;
    invoicePurpose?: string;
    invoicePurposes?: string[];
    invoiceStatus?: string;
    invoiceType?: string;
    invoiceTypes?: string[];
    isAccounted?: number;
    maxAmount?: number;
    minAmount?: number;
    pageSize?: number;
    salespersonId?: number;
    salespersonName?: string;
    sortField?: string;
    sortOrder?: string;
    startDate?: string;
    supplierId?: number;
    supplierName?: string;
  };

  type InputVoicePageVO = {
    current?: number;
    pages?: number;
    records?: InputInvoice_[];
    size?: number;
    total?: number;
  };

  type InvoiceAddDto = {
    amount?: number;
    clientCompanyName?: string;
    clientPerson?: string;
    invoiceNo?: string;
    invoiceStatus?: string;
    invoiceType?: string;
    issueDate?: string;
    issuerClientId?: number;
    issuerCompanyId?: number;
    issuerId?: number;
    issuerName?: string;
    mark?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    salespersonName?: string;
  };

  type InvoiceBase_ = {
    /** 开票金额（红字发票为负数） */
    amount?: number;
    /** 客户名称 */
    clientCompanyName?: string;
    /** 客户姓名 */
    clientPerson?: string;
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 发票号码 */
    invoiceNo?: string;
    /** 发票状态：蓝字发票、红字发票等 */
    invoiceStatus?: string;
    /** 发票性质：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他 */
    invoiceType?: string;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 开票日期 */
    issueDate?: string;
    /** 客户ID（逻辑外键） */
    issuerClientId?: number;
    /** 开票公司ID（逻辑外键） */
    issuerCompanyId?: number;
    /** 开票单位名称 */
    issuerCompanyName?: string;
    /** 开票人ID（逻辑外键关联employee表） */
    issuerId?: number;
    /** 开票人姓名（冗余字段便于查询） */
    issuerName?: string;
    /** 标记：000、DK3、DK4、DK5等 */
    mark?: string;
    /** 原发票号码（红字发票关联的原发票号码） */
    originalInvoiceNo?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID（逻辑外键关联employee表） */
    salespersonId?: number;
    /** 业务员姓名（冗余字段便于查询） */
    salespersonName?: string;
    /** 唯一标识 */
    uniqueKey?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type InvoiceBaseId = {
    id?: number;
  };

  type InvoiceDetailVO_ = {
    /** 发票开票信息ID */
    invoiceBaseId?: number;
    /** 发票到款记录ID */
    invoiceFinishId?: number;
    /** 发票号码 */
    invoiceNo?: string;
    /** 入账金额 */
    paidAmount?: number;
    /** 到账日期，格式：yyyy-MM-dd */
    paidDate?: string;
    /** 转账方式 */
    transferMethod?: string;
  };

  type InvoiceFinish_ = {
    /** 关联银行收支ID（逻辑外键关联bank_transaction表，可选，主要关联） */
    bankTransactionId?: number;
    /** 银行收支编号（冗余字段便于查询和追溯） */
    bankTransactionNo?: string;
    /** 客户名称（冗余字段便于查询） */
    clientCompanyName?: string;
    /** 客户ID（逻辑外键关联client表，可选） */
    clientId?: number;
    /** 客户姓名（冗余字段便于查询） */
    clientPerson?: string;
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 关联开票信息ID（逻辑外键） */
    invoiceBaseId?: number;
    /** 发票号码（冗余字段便于查询） */
    invoiceNo?: string;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 到款金额 */
    paidAmount?: number;
    /** 到款日期 */
    paidDate?: string;
    /** 备注1（可用于记录其他关联的银行收支记录信息） */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID（逻辑外键关联employee表） */
    salespersonId?: number;
    /** 业务员姓名（冗余字段便于查询） */
    salespersonName?: string;
    /** 转账方式：对公转账、微信、支付宝、现金、其他 */
    transferMethod?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type InvoiceFinishPageDto = {
    current?: number;
    invoiceNo?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    transferMethod?: string;
  };

  type InvoiceFinishPageVO = {
    current?: number;
    pages?: number;
    records?: InvoiceFinish_[];
    size?: number;
    total?: number;
  };

  type invoiceFinishUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type InvoiceItem = {
    /** 开票金额 */
    amount?: number;
    /** 关联银行收支列表 */
    bankIdList?: string[];
    /** 客户名称 */
    clientCompanyName?: string;
    /** 客户姓名 */
    clientPerson?: string;
    /** 创建时间 */
    createTime?: string;
    /** 发票ID */
    id?: number;
    /** 发票号码 */
    invoiceNo?: string;
    /** 发票状态：unpaid(未到款)、paid(已到款)、redInvoice(红字发票)、redInvoiceCreated(已冲红) */
    invoiceStatus?: string;
    /** 发票类型 */
    invoiceType?: string;
    /** 开票日期 */
    issueDate?: string;
    /** 开票公司ID */
    issuerCompanyId?: number;
    /** 开票单位 */
    issuerCompanyName?: string;
    /** 开票人ID */
    issuerId?: number;
    /** 开票人 */
    issuerName?: string;
    /** 标号 */
    mark?: string;
    /** 原发票号码（红字发票关联的原发票） */
    originalInvoiceNo?: string;
    /** 最新的到款金额 */
    paidAmount?: number;
    /** 付款记录数量 */
    paidAmountCount?: number;
    /** 入账金额列表 */
    paidAmountList?: number[];
    /** 最新的到款日期 */
    paidDate?: string;
    /** 到账日期列表 */
    paidDateList?: string[];
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID */
    salespersonId?: number;
    /** 业务员 */
    salespersonName?: string;
    /** 序号 */
    serialNo?: number;
    totalAmount?: number;
    /** 入账金额总和（所有关联的到款记录之和） */
    totalPaidAmount?: number;
    /** 转账方式 */
    transferMethod?: string;
    /** 唯一标识 */
    uniqueKey?: string;
    /** 更新时间 */
    updateTime?: string;
  };

  type InvoicePageDto = {
    clientCompanyName?: string;
    clientPerson?: string;
    current?: number;
    endDate?: string;
    invoiceNo?: string;
    invoiceTypes?: string[];
    issuerCompanyIds?: number[];
    issuerCompanyNames?: string[];
    issuerId?: number;
    issuerName?: string;
    markValues?: string[];
    maxAmount?: number;
    minAmount?: number;
    owed?: boolean;
    pageSize?: number;
    salespersonId?: number;
    salespersonName?: string;
    sortField?: string;
    sortOrder?: string;
    startDate?: string;
  };

  type InvoicePageVO = {
    current?: number;
    pages?: number;
    records?: InvoiceItem[];
    size?: number;
    statistics?: InvoiceStatistics;
    total?: number;
  };

  type InvoicePaymentDto = {
    /** 关联银行收支ID */
    bankTransactionId?: number;
    /** 发票到款信息ID */
    id?: number;
    /** 发票开票信息ID */
    invoiceBaseId: number;
    /** 到款金额 */
    paidAmount: number;
    /** 到款日期（YYYY-MM-DD） */
    paidDate: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 业务员ID */
    salespersonId?: number;
    /** 转账方式（对公转账/微信/支付宝/现金/其他），默认：对公转账 */
    transferMethod?: string;
  };

  type InvoicePurposeDTO = {
    isEnabled?: number;
    purposeName?: string;
    remark?: string;
    sortOrder?: number;
  };

  type InvoicePurposeItemVO = {
    createTime?: string;
    id?: number;
    isEnabled?: number;
    purposeName?: string;
    remark?: string;
    sortOrder?: string;
    updateTime?: string;
  };

  type InvoicePurposePageDTO = {
    /** 当前页码 */
    current?: number;
    isEnabledList?: number[];
    /** 每页数量 */
    pageSize?: number;
    purposeNames?: string[];
    /** 排序字段 */
    sortField?: string;
    /** 排序顺序 */
    sortOrder?: string;
  };

  type InvoicePurposePageVO = {
    current?: number;
    invoicePurposeItemVOList?: InvoicePurposeItemVO[];
    pages?: number;
    size?: number;
    total?: number;
  };

  type InvoicePurposeUpateDTO = {
    id?: number;
    isEnabled?: number;
    purposeName?: string;
    remark?: string;
    sortOrder?: number;
  };

  type InvoiceStatistics = {
    redInvoiceCount?: number;
    totalAmount?: number;
    totalPaidAmount?: number;
  };

  type InvoiceType_ = {
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 是否启用：0-禁用，1-启用 */
    isEnabled?: number;
    /** 备注 */
    remark?: string;
    /** 排序顺序（用于控制显示顺序，数字越小越靠前） */
    sortOrder?: number;
    /** 发票性质：普票1%、专票1%、专票13%、普票13%、专票6%、普票6%、其他 */
    typeName?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type InvoiceTypeDTO = {
    isEnabled?: number;
    remark?: string;
    sortOrder?: number;
    typeName?: string;
  };

  type InvoiceTypePageDTO = {
    current?: number;
    isEnabledList?: number[];
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    typeNames?: string[];
  };

  type InvoiceTypePageVO = {
    current?: number;
    pages?: number;
    records?: InvoiceType_[];
    size?: number;
    total?: number;
  };

  type InvoiceUpdateDto = {
    amount?: number;
    clientCompanyName?: string;
    clientPerson?: string;
    id?: number;
    invoiceNo?: string;
    invoiceStatus?: string;
    invoiceType?: string;
    issueDate?: string;
    issuerClientId?: number;
    issuerCompanyId?: number;
    issuerId?: number;
    issuerName?: string;
    key?: string;
    mark?: string;
    remark1?: string;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    salespersonName?: string;
  };

  type InvoiceUpdateDTO = {
    id?: number;
    isEnabled?: number;
    remark?: string;
    sortOrder?: number;
    typeName?: string;
  };

  type invoiceUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type LoginUserVO = {
    companyId?: number;
    createTime?: string;
    employeeNo?: string;
    id?: number;
    name?: string;
    permission?: string;
    permissionCode?: string;
    updateTime?: string;
  };

  type MarkConfig_ = {
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 是否启用：0-禁用，1-启用 */
    isEnabled?: number;
    /** 标记标签（用于显示，如果不提供则使用mark_value） */
    markLabel?: string;
    /** 标记值：000、DK3、DK4、DK5、DK10、DK13等 */
    markValue?: string;
    /** 备注 */
    remark?: string;
    /** 排序顺序（用于控制显示顺序，数字越小越靠前） */
    sortOrder?: number;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type MarkConfigUpdateDTO = {
    id?: number;
    isEnabled?: number;
    markLabel?: string;
    markValue?: string;
    remark?: string;
    sortOrder?: number;
  };

  type MarkDTO = {
    isEnabled?: number;
    markLabel?: string;
    markValue?: string;
    remark?: string;
    sortOrder?: number;
  };

  type MarkPageDTO = {
    current?: number;
    isEnabledList?: number[];
    markValues?: string[];
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
  };

  type MarkPageVO = {
    current?: number;
    pages?: number;
    records?: MarkConfig_[];
    size?: number;
    total?: number;
  };

  type PermissionDTO = {
    isEnabled?: number;
    permissionCode?: string;
    permissionName?: string;
    remark?: string;
    sortOrder?: number;
  };

  type PermissionItemVO = {
    createTime?: string;
    id?: number;
    isEnabled?: number;
    permissionCode?: string;
    permissionName?: string;
    remark?: string;
    sortOrder?: number;
    updateTime?: string;
  };

  type PermissionPageDTO = {
    /** 当前页码 */
    current?: number;
    /** 是否启用 */
    isEnabledList?: number[];
    /** 每页数量 */
    pageSize?: number;
    permissionNames?: string[];
    /** 排序字段 */
    sortField?: string;
    /** 排列顺序 */
    sortOrder?: string;
  };

  type PermissionPageVO = {
    current?: number;
    pages?: number;
    permissionItemVOList?: PermissionItemVO[];
    size?: number;
    total?: number;
  };

  type PermissionUpateDTO = {
    id?: number;
    isEnabled?: number;
    permissionCode?: string;
    permissionName?: string;
    remark?: string;
    sortOrder?: number;
  };

  type RedInvoiceDtoDTO = {
    /** 客户单位 */
    clientCompanyName?: string;
    /** 客户联系人 */
    clientPerson?: string;
    /** 发票号码 */
    invoiceNo?: string;
    /** 发票性质 */
    invoiceType?: string;
    /** 开票日期 */
    issueDate?: string;
    /** 开票公司ID */
    issuerCompanyId?: number;
    /** 原发票ID */
    originalInvoiceId?: number;
    remark1?: string;
    remark2?: string;
    remark3?: string;
  };

  type sipplierUploadUsingPOSTParams = {
    /** overwrite */
    overwrite?: boolean;
  };

  type Supplier_ = {
    /** 银行账号 */
    bankAccount?: string;
    /** 银行名称 */
    bankName?: string;
    /** 经营范围 */
    businessScope?: string;
    /** 公司名称 */
    companyName?: string;
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 邮箱 */
    email?: string;
    /** 主键ID */
    id?: number;
    /** 是否删除：0-未删除，1-已删除 */
    isDelete?: number;
    /** 法人 */
    legalPerson?: string;
    /** 注册地址 */
    registerAddress?: string;
    /** 注册电话 */
    registerPhone?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 供货姓名 */
    supplierName?: string;
    /** 供货电话 */
    supplierPhone?: string;
    /** 公司税号 */
    taxNo?: string;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type SupplierAddDTO = {
    /** 银行账号 */
    bankAccount?: string;
    /** 银行名称 */
    bankName?: string;
    /** 经营范围 */
    businessScope?: string;
    /** 公司名称 */
    companyName: string;
    /** 邮箱 */
    email?: string;
    /** 法人 */
    legalPerson?: string;
    /** 注册地址 */
    registerAddress?: string;
    /** 注册电话 */
    registerPhone?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 供货姓名 */
    supplierName?: string;
    /** 供货电话 */
    supplierPhone?: string;
    /** 公司税号 */
    taxNo?: string;
  };

  type SupplierPageVO = {
    current?: number;
    pages?: number;
    records?: Supplier_[];
    size?: number;
    total?: number;
  };

  type SupplierQueryDTO = {
    businessScope?: string;
    /** 公司名称 */
    companyName?: string;
    /** 当前页码 */
    current?: number;
    id?: number;
    legalPerson?: string;
    /** 每页数量 */
    pageSize?: number;
    registerAddress?: string;
    sortField?: string;
    sortOrder?: string;
    /** 供货姓名 */
    supplierName?: string;
    /** 供货电话 */
    supplierPhone?: string;
    /** 公司税号 */
    taxNo?: string;
  };

  type SupplierUpdateDTO = {
    /** 银行账号 */
    bankAccount?: string;
    /** 银行名称 */
    bankName?: string;
    /** 经营范围 */
    businessScope?: string;
    /** 公司名称 */
    companyName: string;
    /** 邮箱 */
    email?: string;
    id?: number;
    /** 法人 */
    legalPerson?: string;
    /** 注册地址 */
    registerAddress?: string;
    /** 注册电话 */
    registerPhone?: string;
    /** 备注1 */
    remark1?: string;
    /** 备注2 */
    remark2?: string;
    /** 备注3 */
    remark3?: string;
    /** 供货姓名 */
    supplierName?: string;
    /** 供货电话 */
    supplierPhone?: string;
    /** 公司税号 */
    taxNo?: string;
  };

  type SyncResultItemVO = {
    /** 银行收支记录ID */
    bankTransactionId?: number;
    /** 创建的发票到款记录ID数组 */
    invoiceFinishIds?: number[];
    /** 处理消息 */
    message?: string;
    /** 是否成功 */
    success?: boolean;
  };

  type TransactionPageDTO = {
    amount?: number;
    clientCompanyName?: string;
    clientId?: number;
    companyId?: number;
    companyIds?: number[];
    companyName?: string;
    current?: number;
    endTime?: string;
    invoiceNo?: string;
    isAccounted?: boolean;
    isFinished?: boolean;
    maxAmount?: number;
    minAmount?: number;
    pageSize?: number;
    remark2?: string;
    remark3?: string;
    salespersonId?: number;
    salespersonName?: string;
    sortField?: string;
    sortOrder?: string;
    startTime?: string;
    userName?: string;
  };

  type TransactionPageVO = {
    current?: number;
    pages?: number;
    records?: BankTransaction_[];
    size?: number;
    total?: number;
  };

  type TransferMethod_ = {
    /** 创建时间 */
    createTime?: string;
    createdBy?: string;
    /** 主键ID */
    id?: number;
    /** 是否删除：0-未删除，1-已删除（逻辑删除） */
    isDelete?: number;
    /** 是否启用：0-禁用，1-启用 */
    isEnabled?: number;
    /** 转账方式：对公转账、微信、支付宝、现金、其他 */
    methodName?: string;
    /** 备注 */
    remark?: string;
    /** 排序顺序（用于控制显示顺序，数字越小越靠前） */
    sortOrder?: number;
    /** 更新时间 */
    updateTime?: string;
    updatedBy?: string;
  };

  type TransferMethodDTO = {
    isEnabled?: number;
    methodName?: string;
    remark?: string;
    sortOrder?: number;
  };

  type TransferMethodPageDTO = {
    current?: number;
    isEnabledList?: number[];
    methodNames?: string[];
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
  };

  type TransferMethodPageVo = {
    current?: number;
    pages?: number;
    records?: TransferMethod_[];
    size?: number;
    total?: number;
  };

  type TransferMethodUpdateDTO = {
    id?: number;
    isEnabled?: number;
    methodName?: string;
    remark?: string;
    sortOrder?: number;
  };

  type UpdatePasswordRequest = {
    id?: number;
    newPassword?: string;
    oldPassword?: string;
  };

  type UserLoginRequest = {
    employeeNo?: string;
    password?: string;
  };

  type UserNameByCompanyNameVo = {
    id?: number;
    userName?: string;
  };
}
