import { RoutePlaceholder } from "../../components/common";

/**
 * Material-details page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Material Details"
      description="Material detail and usage placeholder."
      routePath="/dashboard/materials/:materialId"
    />
  );
};

export default Component;
