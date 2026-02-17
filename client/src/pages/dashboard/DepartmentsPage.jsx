import { RoutePlaceholder } from "../../components/common";

/**
 * Departments list page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Departments"
      description="Department list placeholder."
      routePath="/dashboard/departments"
    />
  );
};

export default Component;
