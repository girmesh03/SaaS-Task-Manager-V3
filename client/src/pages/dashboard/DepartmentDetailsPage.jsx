import { RoutePlaceholder } from "../../components/common";

/**
 * Department-details page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Department Details"
      description="Department details placeholder."
      routePath="/dashboard/departments/:departmentId"
    />
  );
};

export default Component;
