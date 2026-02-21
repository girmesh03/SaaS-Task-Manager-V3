import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { UsersPageContent } from "../../components/user";
import { useAuthorization } from "../../hooks";
import { selectResourceViewState } from "../../redux/features";
import { useGetDepartmentsQuery, useGetUsersQuery } from "../../services/api";
import { PAGINATION_DEFAULTS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";

const RESOURCE_KEY = "users";
const TOOLBAR_DEPARTMENT_LIMIT = 8;
const DEFAULT_FILTERS = {
  role: "",
  status: "",
  departmentIds: [],
  joinedFrom: "",
  joinedTo: "",
  includeInactive: false,
};

/**
 * Users page container that owns fetch/loading/error orchestration.
 *
 * @returns {JSX.Element} Users page.
 * @throws {never} Component rendering does not throw.
 */
const UsersPage = () => {
  const { can, user: authUser } = useAuthorization();
  const [toolbarDepartmentPage, setToolbarDepartmentPage] = useState(
    PAGINATION_DEFAULTS.PAGE,
  );
  const [isToolbarDepartmentFilterOpen, setIsToolbarDepartmentFilterOpen] =
    useState(false);
  const viewState = useSelector(selectResourceViewState(RESOURCE_KEY));
  const page = viewState.page || PAGINATION_DEFAULTS.PAGE;
  const limit = viewState.limit || PAGINATION_DEFAULTS.LIMIT;
  const sortBy = viewState.sortBy || PAGINATION_DEFAULTS.SORT_BY;
  const sortOrder = viewState.sortOrder || PAGINATION_DEFAULTS.SORT_ORDER;
  const includeDeleted = Boolean(viewState.includeDeleted);
  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      ...(viewState.filters || {}),
    }),
    [viewState.filters],
  );
  const crossDepartmentTarget = useMemo(
    () => ({
      organization: authUser?.organization,
      department: "__cross_department__",
    }),
    [authUser?.organization],
  );
  const canUseDepartmentSwitcher = useMemo(() => {
    if (!authUser) {
      return false;
    }

    return can("User", "read", { target: crossDepartmentTarget });
  }, [authUser, can, crossDepartmentTarget]);
  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted,
      includeInactive: Boolean(filters.includeInactive),
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.joinedFrom ? { joinedFrom: filters.joinedFrom } : {}),
      ...(filters.joinedTo ? { joinedTo: filters.joinedTo } : {}),
      ...(Array.isArray(filters.departmentIds) && filters.departmentIds.length
        ? { departmentId: filters.departmentIds }
        : {}),
    }),
    [
      filters.departmentIds,
      filters.includeInactive,
      filters.joinedFrom,
      filters.joinedTo,
      filters.role,
      filters.status,
      includeDeleted,
      limit,
      page,
      sortBy,
      sortOrder,
    ],
  );

  const {
    data: usersResponse,
    isFetching: isUsersFetching,
    error: usersError,
  } = useGetUsersQuery(queryArgs);
  const {
    data: departmentsResponse,
    error: departmentsError,
  } = useGetDepartmentsQuery({
    page: 1,
    limit: 100,
    includeDeleted: false,
    sortBy: "name",
    sortOrder: "asc",
  });
  const {
    data: toolbarDepartmentsResponse,
    isFetching: isToolbarDepartmentsFetching,
    error: toolbarDepartmentsError,
  } = useGetDepartmentsQuery(
    {
      page: toolbarDepartmentPage,
      limit: TOOLBAR_DEPARTMENT_LIMIT,
      includeDeleted: false,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      skip: !canUseDepartmentSwitcher || !isToolbarDepartmentFilterOpen,
    },
  );

  useEffect(() => {
    if (usersError) {
      toastApiError(usersError);
    }
  }, [usersError]);

  useEffect(() => {
    if (departmentsError) {
      toastApiError(departmentsError);
    }
  }, [departmentsError]);

  useEffect(() => {
    if (toolbarDepartmentsError) {
      toastApiError(toolbarDepartmentsError);
    }
  }, [toolbarDepartmentsError]);

  return (
    <UsersPageContent
      usersResponse={usersResponse}
      departmentsResponse={departmentsResponse}
      toolbarDepartmentsResponse={toolbarDepartmentsResponse}
      toolbarDepartmentPage={toolbarDepartmentPage}
      isUsersFetching={isUsersFetching}
      isToolbarDepartmentsFetching={isToolbarDepartmentsFetching}
      onToolbarDepartmentPageChange={setToolbarDepartmentPage}
      onToolbarDepartmentFilterOpen={() => setIsToolbarDepartmentFilterOpen(true)}
    />
  );
};

export default UsersPage;
