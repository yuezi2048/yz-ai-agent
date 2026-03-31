import ACCESS_ENUM from '@/access/accessEnum';

/**
 * 权限校验
 * @param loginUser  当前登录用户
 * @param needAccess 路由或接口要求的权限
 * @returns boolean  是否放行
 */
const checkAccess = (
    loginUser: API.LoginUserVO,
    needAccess = ACCESS_ENUM.NOT_LOGIN
): boolean => {
    // 1. 白名单：无需任何权限
    if (needAccess === ACCESS_ENUM.NOT_LOGIN) return true;

    // 2. 取出用户真实角色（没登录就是 NOT_LOGIN）
    const userRole = loginUser?.permissionCode ?? ACCESS_ENUM.NOT_LOGIN;

    // 3. 普通用户 仅需登录即可
    if (needAccess === ACCESS_ENUM.USER) {
        return userRole !== ACCESS_ENUM.NOT_LOGIN;
    }

    // 4. 权限校验：支持独立角色权限
    // - 财务岗位（FINANCE_USER）：只能访问财务相关模块
    // - 业务岗位（BUSINESS_USER）：只能访问业务相关模块
    // - 管理员（SUPER_ADMIN）：可以访问所有模块
    
    // 管理员可以访问所有权限
    if (userRole === ACCESS_ENUM.SUPER_ADMIN) {
        return true;
    }
    
    // 财务岗位和业务岗位只能访问自己专属的模块
    // 如果路由要求财务岗位权限，只有财务岗位和管理员可以访问
    if (needAccess === ACCESS_ENUM.FINANCE_USER) {
        return userRole === ACCESS_ENUM.FINANCE_USER || userRole === ACCESS_ENUM.SUPER_ADMIN;
    }
    
    // 如果路由要求业务岗位权限，只有业务岗位和管理员可以访问
    if (needAccess === ACCESS_ENUM.BUSINESS_USER) {
        return userRole === ACCESS_ENUM.BUSINESS_USER || userRole === ACCESS_ENUM.SUPER_ADMIN;
    }
    
    // 如果路由要求管理员权限，只有管理员可以访问
    if (needAccess === ACCESS_ENUM.SUPER_ADMIN) {
        return userRole === ACCESS_ENUM.SUPER_ADMIN;
    }
    
    // 其他情况拒绝访问
    return false;
};

export default checkAccess;
