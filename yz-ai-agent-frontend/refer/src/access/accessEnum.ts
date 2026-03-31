/**
 * 权限定义
 */
const ACCESS_ENUM = {
  NOT_LOGIN: "notLogin",
  USER: 'USER',                      // 普通用户（可能拓展）
  FINANCE_USER: 'FINANCE',   // 财务岗位
  BUSINESS_USER: 'BUSINESS',   // 业务岗位
  SUPER_ADMIN: 'ADMIN',         // 管理员
};

export default ACCESS_ENUM;
