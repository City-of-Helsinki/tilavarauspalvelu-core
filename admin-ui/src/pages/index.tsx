import React from "react";
import App from "../App";

function SafeHydrate({ children }: { children: React.ReactNode }) {
  return (
    <div suppressHydrationWarning>
      {typeof document === "undefined" ? null : children}
    </div>
  );
}

export default function Index() {
  return (
    <SafeHydrate>
      <App />
    </SafeHydrate>
  );
}
