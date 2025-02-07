import React from "react";
import { useRouter } from "next/router";

const ErrorPage = () => {
  const router = useRouter();

  const { error } = router.query;
  return (
    <div>
      <h1>500</h1>
      <p>{error}</p>
    </div>
  );
};

export default ErrorPage;
