import { onRequest as __api_v1_admin_licenses_ts_onRequest } from "C:\\personal-projects\\invent2025-1\\license-api\\functions\\api\\v1\\admin\\licenses.ts"
import { onRequest as __api_v1_quota_check_ts_onRequest } from "C:\\personal-projects\\invent2025-1\\license-api\\functions\\api\\v1\\quota-check.ts"

export const routes = [
    {
      routePath: "/api/v1/admin/licenses",
      mountPath: "/api/v1/admin",
      method: "",
      middlewares: [],
      modules: [__api_v1_admin_licenses_ts_onRequest],
    },
  {
      routePath: "/api/v1/quota-check",
      mountPath: "/api/v1",
      method: "",
      middlewares: [],
      modules: [__api_v1_quota_check_ts_onRequest],
    },
  ]