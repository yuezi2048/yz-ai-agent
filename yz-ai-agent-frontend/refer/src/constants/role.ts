// 管理员角色枚举
export const ADMIN_ROLE_ENUM = {
    FINANCE_USER: "districtAdmin",
    BUSINESS_USER: "provinceAdmin",
    SUPER_ADMIN: "superAdmin",
} as const;

// 管理员角色文本映射
export const ADMIN_ROLE_MAP: Record<string, string> = {
    districtAdmin: "区县级管理员",
    provinceAdmin: "省级管理员",
    superAdmin: "超级管理员",
};

// 管理员角色选项映射
export const ADMIN_ROLE_OPTIONS = Object.keys(ADMIN_ROLE_MAP).map((key) => {
    return {
        label: ADMIN_ROLE_MAP[key],
        value: key,
    };
});
