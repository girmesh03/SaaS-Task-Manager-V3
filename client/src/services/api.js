/**
 * @file RTK Query API layer and canonical endpoint scaffolds.
 */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearCredentials, setCredentials } from "../redux/features/authSlice";
import { HTTP_STATUS } from "../utils/constants";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const AUTH_REFRESH_EXCLUDE_PATHS = Object.freeze([
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

const buildListQueryParams = (query = {}) => {
  const params = {};

  const appendValue = (key, value) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return;
      }

      params[key] = value.join(",");
      return;
    }

    params[key] = String(value);
  };

  Object.entries(query || {}).forEach(([key, value]) =>
    appendValue(key, value)
  );

  return params;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
});

const shouldSkipAuthRefresh = (endpointPath = "") => {
  if (!endpointPath) {
    return false;
  }

  if (endpointPath.includes("/auth/refresh")) {
    return true;
  }

  return AUTH_REFRESH_EXCLUDE_PATHS.some((excludedPath) =>
    endpointPath.includes(excludedPath)
  );
};

const normalizeApiSuccess = (payload) => {
  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "success")
  ) {
    const {
      success,
      message,
      error,
      details,
      pagination,
      meta,
      data,
      ...rest
    } = payload;
    const fallbackData = Object.keys(rest).length > 0 ? rest : null;

    return {
      success: Boolean(success),
      message: message || (success ? "Operation successful" : "Request failed"),
      data: data ?? fallbackData,
      pagination: pagination || null,
      error: error || null,
      details: details || null,
      meta: meta || null,
    };
  }

  return {
    success: true,
    message: "Operation successful",
    data: payload ?? null,
    pagination: null,
    error: null,
    details: null,
    meta: null,
  };
};

const normalizeApiErrorResult = (error) => {
  const status = Number(error?.status || error?.originalStatus || 0);
  const payload =
    error?.data && typeof error.data === "object" ? error.data : {};

  return {
    ...error,
    status,
    data: {
      success: false,
      message:
        payload?.message ||
        error?.error ||
        "Something went wrong. Please try again.",
      error: payload?.error || {
        type: payload?.code || "UNKNOWN_ERROR",
        code: payload?.code || "UNKNOWN_ERROR",
        statusCode: status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      details: payload?.details || null,
      meta: payload?.meta || null,
    },
  };
};

const normalizeBaseQueryResult = (result) => {
  if (result?.data !== undefined) {
    return {
      ...result,
      data: normalizeApiSuccess(result.data),
    };
  }

  if (result?.error) {
    return {
      ...result,
      error: normalizeApiErrorResult(result.error),
    };
  }

  return result;
};

const resolveAuthUser = (payload) => {
  const normalized = normalizeApiSuccess(payload);
  return normalized?.data?.user || normalized?.data?.profile || null;
};

const baseQueryWithRefresh = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === HTTP_STATUS.UNAUTHORIZED) {
    const endpointPath = typeof args === "string" ? args : args.url;
    const skipRefresh = shouldSkipAuthRefresh(endpointPath);

    if (!skipRefresh) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
        },
        api,
        extraOptions
      );

      const refreshUser = resolveAuthUser(refreshResult.data);
      if (refreshUser) {
        api.dispatch(setCredentials(refreshResult.data));
      }

      if (!refreshResult.error) {
        result = await rawBaseQuery(args, api, extraOptions);
        if (result.error?.status === HTTP_STATUS.UNAUTHORIZED) {
          api.dispatch(clearCredentials());
        }
      } else {
        api.dispatch(clearCredentials());
      }
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return normalizeBaseQueryResult(result);
};

/**
 * Canonical RTK Query API service.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRefresh,
  tagTypes: [
    "Auth",
    "Organization",
    "User",
    "Department",
    "Task",
    "TaskActivity",
    "TaskComment",
    "Material",
    "Vendor",
    "Attachment",
    "Notification",
    "Dashboard",
  ],
  endpoints: (builder) => ({
    // Auth
    registerAuth: builder.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    verifyEmail: builder.mutation({
      query: (body) => ({ url: "/auth/verify-email", method: "POST", body }),
    }),
    resendVerification: builder.mutation({
      query: (body) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body,
      }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),
    refreshToken: builder.mutation({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),

    // Organizations
    getOrganizations: builder.query({
      query: (query = {}) => ({
        url: "/organizations",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Organization"],
    }),

    // Users
    getUsers: builder.query({
      query: (query = {}) => ({
        url: "/users",
        params: buildListQueryParams(query),
      }),
      providesTags: ["User"],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    getUser: builder.query({
      query: (userId) => ({ url: `/users/${userId}` }),
      providesTags: (_result, _error, userId) => [{ type: "User", id: userId }],
    }),
    updateUser: builder.mutation({
      query: ({ userId, body }) => ({
        url: `/users/${userId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "User", id: userId },
        "User",
      ],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({ url: `/users/${userId}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
    restoreUser: builder.mutation({
      query: (userId) => ({ url: `/users/${userId}/restore`, method: "PATCH" }),
      invalidatesTags: ["User"],
    }),
    updateUserPreferences: builder.mutation({
      query: ({ userId, body }) => ({
        url: `/users/${userId}/preferences`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "User", id: userId },
        "User",
      ],
    }),
    updateUserSecurity: builder.mutation({
      query: ({ userId, body }) => ({
        url: `/users/${userId}/security`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "User", id: userId },
        "User",
      ],
    }),
    getUserActivity: builder.query({
      query: ({ userId, query = {} }) => ({
        url: `/users/${userId}/activity`,
        params: buildListQueryParams(query),
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: "User", id: `${userId}:activity` },
      ],
    }),
    getUserPerformance: builder.query({
      query: ({ userId, query = {} }) => ({
        url: `/users/${userId}/performance`,
        params: buildListQueryParams(query),
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: "User", id: `${userId}:performance` },
      ],
    }),

    // Departments
    getDepartments: builder.query({
      query: (query = {}) => ({
        url: "/departments",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Department"],
    }),
    createDepartment: builder.mutation({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      invalidatesTags: ["Department"],
    }),
    getDepartment: builder.query({
      query: (departmentId) => ({ url: `/departments/${departmentId}` }),
      providesTags: (_result, _error, departmentId) => [
        { type: "Department", id: departmentId },
      ],
    }),
    updateDepartment: builder.mutation({
      query: ({ departmentId, body }) => ({
        url: `/departments/${departmentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { departmentId }) => [
        { type: "Department", id: departmentId },
        "Department",
      ],
    }),
    deleteDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `/departments/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),
    restoreDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `/departments/${departmentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Department"],
    }),
    getDepartmentActivity: builder.query({
      query: ({ departmentId, query = {} }) => ({
        url: `/departments/${departmentId}/activity`,
        params: buildListQueryParams(query),
      }),
      providesTags: (_result, _error, { departmentId }) => [
        { type: "Department", id: `${departmentId}:activity` },
      ],
    }),
    getDepartmentDashboard: builder.query({
      query: (departmentId) => ({
        url: `/departments/${departmentId}/dashboard`,
      }),
      providesTags: (_result, _error, departmentId) => [
        { type: "Dashboard", id: `department:${departmentId}` },
      ],
    }),

    // Tasks
    getTasks: builder.query({
      query: (query = {}) => ({
        url: "/tasks",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Task"],
    }),
    createTask: builder.mutation({
      query: (body) => ({ url: "/tasks", method: "POST", body }),
      invalidatesTags: ["Task", "TaskActivity", "Notification"],
    }),
    getTask: builder.query({
      query: (taskId) => ({ url: `/tasks/${taskId}` }),
      providesTags: (_result, _error, taskId) => [{ type: "Task", id: taskId }],
    }),
    updateTask: builder.mutation({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
        "Task",
      ],
    }),
    deleteTask: builder.mutation({
      query: (taskId) => ({ url: `/tasks/${taskId}`, method: "DELETE" }),
      invalidatesTags: [
        "Task",
        "TaskActivity",
        "TaskComment",
        "Attachment",
        "Notification",
      ],
    }),
    restoreTask: builder.mutation({
      query: (taskId) => ({ url: `/tasks/${taskId}/restore`, method: "PATCH" }),
      invalidatesTags: [
        "Task",
        "TaskActivity",
        "TaskComment",
        "Attachment",
        "Notification",
      ],
    }),

    // Task activities
    getTaskActivities: builder.query({
      query: ({ taskId, query = {} }) => ({
        url: `/tasks/${taskId}/activities`,
        params: buildListQueryParams(query),
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: taskId },
      ],
    }),
    createTaskActivity: builder.mutation({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}/activities`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: taskId },
        { type: "Task", id: taskId },
        "Notification",
      ],
    }),
    getTaskActivity: builder.query({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: taskId },
      ],
    }),
    updateTaskActivity: builder.mutation({
      query: ({ taskId, activityId, body }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: taskId },
      ],
    }),
    deleteTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: taskId },
      ],
    }),
    restoreTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: taskId },
      ],
    }),

    // Task comments
    getTaskComments: builder.query({
      query: ({ taskId, query = {} }) => ({
        url: `/tasks/${taskId}/comments`,
        params: buildListQueryParams(query),
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: taskId },
      ],
    }),
    createTaskComment: builder.mutation({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: taskId },
        "Notification",
      ],
    }),
    getTaskComment: builder.query({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: taskId },
      ],
    }),
    updateTaskComment: builder.mutation({
      query: ({ taskId, commentId, body }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: taskId },
      ],
    }),
    deleteTaskComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: taskId },
      ],
    }),
    restoreTaskComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: taskId },
      ],
    }),

    // Materials
    getMaterials: builder.query({
      query: (query = {}) => ({
        url: "/materials",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Material"],
    }),
    createMaterial: builder.mutation({
      query: (body) => ({ url: "/materials", method: "POST", body }),
      invalidatesTags: ["Material"],
    }),
    getMaterial: builder.query({
      query: (materialId) => ({ url: `/materials/${materialId}` }),
      providesTags: (_result, _error, materialId) => [
        { type: "Material", id: materialId },
      ],
    }),
    updateMaterial: builder.mutation({
      query: ({ materialId, body }) => ({
        url: `/materials/${materialId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { materialId }) => [
        { type: "Material", id: materialId },
        "Material",
      ],
    }),
    deleteMaterial: builder.mutation({
      query: (materialId) => ({
        url: `/materials/${materialId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Material"],
    }),
    restoreMaterial: builder.mutation({
      query: (materialId) => ({
        url: `/materials/${materialId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Material"],
    }),
    restockMaterial: builder.mutation({
      query: ({ materialId, body }) => ({
        url: `/materials/${materialId}/restock`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { materialId }) => [
        { type: "Material", id: materialId },
        "Material",
      ],
    }),
    getMaterialUsage: builder.query({
      query: ({ materialId, query = {} }) => ({
        url: `/materials/${materialId}/usage`,
        params: buildListQueryParams(query),
      }),
      providesTags: (_result, _error, { materialId }) => [
        { type: "Material", id: `${materialId}:usage` },
      ],
    }),

    // Vendors
    getVendors: builder.query({
      query: (query = {}) => ({
        url: "/vendors",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Vendor"],
    }),
    createVendor: builder.mutation({
      query: (body) => ({ url: "/vendors", method: "POST", body }),
      invalidatesTags: ["Vendor"],
    }),
    getVendor: builder.query({
      query: (vendorId) => ({ url: `/vendors/${vendorId}` }),
      providesTags: (_result, _error, vendorId) => [
        { type: "Vendor", id: vendorId },
      ],
    }),
    updateVendor: builder.mutation({
      query: ({ vendorId, body }) => ({
        url: `/vendors/${vendorId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        "Vendor",
      ],
    }),
    contactVendor: builder.mutation({
      query: ({ vendorId, body }) => ({
        url: `/vendors/${vendorId}/contact`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
      ],
    }),
    deleteVendor: builder.mutation({
      query: (vendorId) => ({ url: `/vendors/${vendorId}`, method: "DELETE" }),
      invalidatesTags: ["Vendor"],
    }),
    restoreVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/vendors/${vendorId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Vendor"],
    }),

    // Attachments
    createAttachment: builder.mutation({
      query: (body) => ({ url: "/attachments", method: "POST", body }),
      invalidatesTags: ["Attachment"],
    }),
    deleteAttachment: builder.mutation({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attachment"],
    }),
    restoreAttachment: builder.mutation({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Attachment"],
    }),

    // Notifications
    getNotifications: builder.query({
      query: (query = {}) => ({
        url: "/notifications",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),

    // Dashboard
    getDashboardOverview: builder.query({
      query: (query = {}) => ({
        url: "/dashboard/overview",
        params: buildListQueryParams(query),
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useRegisterAuthMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetOrganizationsQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
  useUpdateUserPreferencesMutation,
  useUpdateUserSecurityMutation,
  useGetUserActivityQuery,
  useGetUserPerformanceQuery,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetDepartmentQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useRestoreDepartmentMutation,
  useGetDepartmentActivityQuery,
  useGetDepartmentDashboardQuery,
  useGetTasksQuery,
  useCreateTaskMutation,
  useGetTaskQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
  useGetTaskActivitiesQuery,
  useCreateTaskActivityMutation,
  useGetTaskActivityQuery,
  useUpdateTaskActivityMutation,
  useDeleteTaskActivityMutation,
  useRestoreTaskActivityMutation,
  useGetTaskCommentsQuery,
  useCreateTaskCommentMutation,
  useGetTaskCommentQuery,
  useUpdateTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useRestoreTaskCommentMutation,
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useGetMaterialQuery,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useRestoreMaterialMutation,
  useRestockMaterialMutation,
  useGetMaterialUsageQuery,
  useGetVendorsQuery,
  useCreateVendorMutation,
  useGetVendorQuery,
  useUpdateVendorMutation,
  useContactVendorMutation,
  useDeleteVendorMutation,
  useRestoreVendorMutation,
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
  useRestoreAttachmentMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useGetDashboardOverviewQuery,
} = api;

export default api;
