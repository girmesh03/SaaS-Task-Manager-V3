import { RoutePlaceholder } from "../../components/common";

/**
 * Reset-password page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Reset Password"
      description="Password reset form placeholder."
      routePath="/reset-password"
    />
  );
};

export default Component;
