import { RoutePlaceholder } from "../../components/common";

/**
 * Task-details page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Task Details"
      description="Task details tabs placeholder."
      routePath="/dashboard/tasks/:taskId"
    />
  );
};

export default Component;
