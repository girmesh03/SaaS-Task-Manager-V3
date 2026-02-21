import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  DepartmentsPageContent,
} from "../../components/department";
import { useAuthorization } from "../../hooks";
import { selectResourceViewState } from "../../redux/features";
import { useGetDepartmentsQuery, useGetUsersQuery } from "../../services/api";
import { PAGINATION_DEFAULTS } from "../../utils/constants";
import { toastApiError } from "../../utils/errorHandling";
import { hasValue } from "../../utils/helpers";

const RESOURCE_KEY = "departments";
const TOOLBAR_DEPARTMENT_LIMIT = 8;
const DEFAULT_FILTERS = {
  departmentId: "",
  status: "",
  managerId: "",
  memberCountMin: "",
  memberCountMax: "",
  createdFrom: "",
  createdTo: "",
  organizationId: "",
};

/**
 * Departments page container that owns fetch/loading/error orchestration.
 *
 * @returns {JSX.Element} Departments page.
 * @throws {never} Component rendering does not throw.
 */
const DepartmentsPage = () => {
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

    return can("Department", "read", { target: crossDepartmentTarget });
  }, [authUser, can, crossDepartmentTarget]);

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      includeDeleted,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.managerId ? { managerId: filters.managerId } : {}),
      ...(hasValue(filters.memberCountMin)
        ? { memberCountMin: Number(filters.memberCountMin) }
        : {}),
      ...(hasValue(filters.memberCountMax)
        ? { memberCountMax: Number(filters.memberCountMax) }
        : {}),
      ...(filters.createdFrom ? { createdFrom: filters.createdFrom } : {}),
      ...(filters.createdTo ? { createdTo: filters.createdTo } : {}),
      ...(filters.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
    }),
    [
      filters.createdFrom,
      filters.createdTo,
      filters.departmentId,
      filters.managerId,
      filters.memberCountMax,
      filters.memberCountMin,
      filters.organizationId,
      filters.status,
      includeDeleted,
      limit,
      page,
      sortBy,
      sortOrder,
    ],
  );

  const {
    data: departmentsResponse,
    isFetching: isDepartmentsFetching,
    error: departmentsError,
  } = useGetDepartmentsQuery(queryArgs);
  const { data: toolbarDepartmentsResponse, isFetching: isToolbarDepartmentsFetching } =
    useGetDepartmentsQuery(
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
  const { data: usersResponse } = useGetUsersQuery({
    page: 1,
    limit: 100,
    includeDeleted: false,
    includeInactive: true,
  });

  useEffect(() => {
    if (departmentsError) {
      toastApiError(departmentsError);
    }
  }, [departmentsError]);

  return (
    <DepartmentsPageContent
      departmentsResponse={departmentsResponse}
      toolbarDepartmentsResponse={toolbarDepartmentsResponse}
      toolbarDepartmentPage={toolbarDepartmentPage}
      isDepartmentsFetching={isDepartmentsFetching}
      isToolbarDepartmentsFetching={isToolbarDepartmentsFetching}
      usersResponse={usersResponse}
      onToolbarDepartmentPageChange={setToolbarDepartmentPage}
      onToolbarDepartmentFilterOpen={() =>
        setIsToolbarDepartmentFilterOpen(true)
      }
    />
  );
};

export default DepartmentsPage;
