// @ts-ignore
/* eslint-disable */
import request from "@/request";

/** 银行收支明细文件的导入 POST /api/file/banktranscation/upload */
export async function banktrascationUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.banktrascationUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/banktranscation/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 下载收支明细导入模板 GET /api/file/banktrascation/download */
export async function downloadBankTrascationTemplateUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/banktrascation/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 下载客户信息模板 GET /api/file/client/download */
export async function downloadClientUsingGet(options?: { [key: string]: any }) {
  return request<any>("/api/file/client/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 客户文件的导入 POST /api/file/client/upload */
export async function clientUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.clientUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/client/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 公司文件的导入 POST /api/file/compamy/upload */
export async function companyUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.companyUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/compamy/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 下载公司信息模板 GET /api/file/company/download */
export async function downloadCpmpanyUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/company/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 下载收员工导入模板 GET /api/file/employee/download */
export async function downloadEmployeeTemplateUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/employee/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 员工文件的导入 POST /api/file/employee/upload */
export async function employeeUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.employeeUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/employee/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 下载进项发票信息模板 GET /api/file/inputinvoice/download */
export async function downloadInputInvoiceTemplateUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/inputinvoice/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 进项发票文件的导入 POST /api/file/inputinvoice/upload */
export async function sipplierUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.sipplierUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/inputinvoice/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 下载发票信息 GET /api/file/invoicebase/download */
export async function downloadInvoiceBaseUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/invoicebase/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 发票文件的导入 POST /api/file/invoicebase/upload */
export async function invoiceUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.invoiceUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/invoicebase/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 下载到款记录导入模板 GET /api/file/invoicefinish/download */
export async function downloadInvoiceFinishTemplateUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/invoicefinish/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 到款文件的导入 POST /api/file/invoicefinish/upload */
export async function invoiceFinishUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.invoiceFinishUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/invoicefinish/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 下载供应商信息模板 GET /api/file/supplier/download */
export async function downloadSupplierUsingGet(options?: {
  [key: string]: any;
}) {
  return request<any>("/api/file/supplier/download", {
    method: "GET",
    ...(options || {}),
  });
}

/** 供应商文件的导入 POST /api/file/supplier/upload */
export async function inputInvoiceUploadUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.inputInvoiceUploadUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.BaseResponseExcelImportResultVO_>(
    "/api/file/supplier/upload",
    {
      method: "POST",
      params: {
        ...params,
      },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}
