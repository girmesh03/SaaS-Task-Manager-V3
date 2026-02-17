import { RoutePlaceholder } from "../../components/common";

/**
 * Phase 1 dashboard home placeholder page.
 *
 * @returns {JSX.Element} Home placeholder element.
 * @throws {never} This component does not throw.
 */
const Home = () => {
  return (
    <RoutePlaceholder
      title="Home"
      description="Dashboard home placeholder."
      routePath="/dashboard"
    />
  );
};

export default Home;
