import { RoutePlaceholder } from "../../components/common";

/**
 * Vendor-details page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Vendor Details"
      description="Vendor detail placeholder."
      routePath="/dashboard/vendors/:vendorId"
    />
  );
};

export default Component;
