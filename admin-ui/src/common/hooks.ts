import React from "react";
import { useLocation } from "react-router-dom";

// NOTE: This can be removed when moving to react-router version 6, since it has the same functionality
export const useQueryParams = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
};
