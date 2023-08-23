import { signOut as signOutAuth } from "next-auth/react";
import { authenticationLogoutApiRoute } from "../../modules/const";
import { type Session } from "next-auth";

export default function signOut({ session }: { session: Session }) {
  const origin = typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : '';
  const callbackUrl = `${origin}${authenticationLogoutApiRoute}?token=${session.accessToken}`
  signOutAuth({ callbackUrl });
};
