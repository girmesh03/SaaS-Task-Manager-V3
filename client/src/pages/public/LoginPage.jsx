import { RoutePlaceholder } from "../../components/common";

/**
 * Login page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Log In"
      description="Authentication placeholder for email and password sign-in."
      routePath="/login"
    />
  );
};

export default Component;
