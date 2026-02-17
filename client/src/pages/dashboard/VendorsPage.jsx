import { RoutePlaceholder } from "../../components/common";

/**
 * Vendors list page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Vendors"
      description="Vendor list placeholder."
      routePath="/dashboard/vendors"
    />
  );
};

export default Component;
