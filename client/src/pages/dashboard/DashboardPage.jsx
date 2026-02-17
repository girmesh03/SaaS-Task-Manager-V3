import { RoutePlaceholder } from "../../components/common";

/**
 * Dashboard overview page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Dashboard"
      description="Analytics dashboard placeholder."
      routePath="/dashboard"
    />
  );
};

export default Component;
