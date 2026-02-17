import { RoutePlaceholder } from "../../components/common";

/**
 * User-details page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="User Details"
      description="User profile tabs placeholder."
      routePath="/dashboard/users/:userId"
    />
  );
};

export default Component;
