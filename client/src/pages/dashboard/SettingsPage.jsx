import { RoutePlaceholder } from "../../components/common";

/**
 * Settings page placeholder.
 *
 * @returns {JSX.Element} Page placeholder element.
 * @throws {never} This component does not throw.
 */
const Component = () => {
  return (
    <RoutePlaceholder
      title="Settings"
      description="Settings tabs placeholder."
      routePath="/dashboard/settings"
    />
  );
};

export default Component;
