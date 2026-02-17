import { RoutePlaceholder } from "../../components/common";

/**
 * Forgot-password page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Forgot Password"
      description="Password recovery request placeholder."
      routePath="/forgot-password"
    />
  );
};

export default Component;
