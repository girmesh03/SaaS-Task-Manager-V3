import { RoutePlaceholder } from "../../components/common";

/**
 * Users list page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Users"
      description="User list and management placeholder."
      routePath="/dashboard/users"
    />
  );
};

export default Component;
