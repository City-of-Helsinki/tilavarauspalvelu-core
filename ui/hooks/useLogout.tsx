import { useRouter } from "next/router";
import { useLocalStorage } from "react-use";
import { authenticationLogoutApiRoute } from "../modules/const";

type Output = {
  shouldLogout: boolean;
  removeShouldLogout: () => void;
  logout: () => void;
};

export const useLogout = (): Output => {
  const router = useRouter();
  const [shouldLogout, setShouldLogout, removeShouldLogout] = useLocalStorage(
    "shouldLogout",
    false
  );

  const logout = () => {
    setShouldLogout(true);
    router.push(authenticationLogoutApiRoute);
  };

  return { shouldLogout, removeShouldLogout, logout };
};
