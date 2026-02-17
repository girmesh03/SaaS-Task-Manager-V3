import { RoutePlaceholder } from "../../components/common";

/**
 * Tasks list page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Tasks"
      description="Task list and filters placeholder."
      routePath="/dashboard/tasks"
    />
  );
};

export default Component;
