import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="shell pt-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">That page does not exist.</h1>
      <p className="mx-auto mt-4 max-w-prose text-sm text-muted">
        Check the address, or head back and pick a mode from the navigation.
      </p>
      <Link to="/" className="pill-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
