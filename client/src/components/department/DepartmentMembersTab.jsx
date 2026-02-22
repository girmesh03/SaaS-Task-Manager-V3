import { useMemo } from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import { MuiDataGrid, MuiEmptyState, MuiFilterButton, MuiLoading } from "../reusable";
import { createDepartmentMemberColumns } from "../columns";
import { useTimezone } from "../../hooks";

/**
 * Department details Members tab.
 *
 * @param {{
 *   members: Array<Record<string, unknown>>;
 *   isMembersFetching: boolean;
 * }} props - Component props.
 * @returns {JSX.Element} Members tab.
 * @throws {never} This component does not throw.
 */
const DepartmentMembersTab = ({ members, isMembersFetching }) => {
  const { formatDateTime } = useTimezone();
  const memberColumns = useMemo(
    () => createDepartmentMemberColumns({ formatDateTime }),
    [formatDateTime],
  );

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" justifyContent="flex-end">
        <MuiFilterButton activeCount={0} />
      </Stack>
      {isMembersFetching ? (
        <MuiLoading message="Loading department members..." />
      ) : members.length === 0 ? (
        <MuiEmptyState
          message="No members found"
          secondaryMessage="This department has no active member records."
        />
      ) : (
        <MuiDataGrid
          autoHeight
          rows={members}
          columns={memberColumns}
          getRowId={(row) => row.id}
          hideFooterPagination
        />
      )}
    </Stack>
  );
};

DepartmentMembersTab.propTypes = {
  members: PropTypes.arrayOf(PropTypes.object),
  isMembersFetching: PropTypes.bool,
};

DepartmentMembersTab.defaultProps = {
  members: [],
  isMembersFetching: false,
};

export default DepartmentMembersTab;

