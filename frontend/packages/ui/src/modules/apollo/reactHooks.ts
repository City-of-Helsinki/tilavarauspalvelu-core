/// The generated GraphQL hooks import Apollo from here (see graphql.config.ts).
///
/// Next.js builds the proxy middleware with the "react-server" condition. With it @apollo/client/react
/// resolves to a version without skipToken, but the generated suspense hooks use it.
/// The middleware imports the generated enums, so the build fails without this file.
/// skipToken is Symbol.for("apollo.skipToken") in Apollo, so this is the same value.
import type { SkipToken } from "@apollo/client/react";

export * from "@apollo/client/react";

export const skipToken: SkipToken = Symbol.for("apollo.skipToken") as SkipToken;
