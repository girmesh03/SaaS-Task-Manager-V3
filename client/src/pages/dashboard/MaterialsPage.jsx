import { RoutePlaceholder } from "../../components/common";

/**
 * Materials list page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Materials"
      description="Material inventory placeholder."
      routePath="/dashboard/materials"
    />
  );
};

export default Component;
