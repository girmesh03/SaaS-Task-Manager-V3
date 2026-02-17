import { RoutePlaceholder } from "../../components/common";

/**
 * Registration page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Sign Up"
      description="Customer organization registration placeholder."
      routePath="/register"
    />
  );
};

export default Component;
