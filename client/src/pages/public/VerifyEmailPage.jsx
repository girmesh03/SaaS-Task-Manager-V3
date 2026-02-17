import { RoutePlaceholder } from "../../components/common";

/**
 * Verify-email page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Verify Email"
      description="Initial onboarding verification placeholder."
      routePath="/verify-email"
    />
  );
};

export default Component;
