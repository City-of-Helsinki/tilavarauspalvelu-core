import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { successToast } from "common/src/common/toast";

export function useToastIfQueryParam({
  key,
  successMessage,
}: {
  key: string;
  successMessage: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const removeTimeUpdatedParam = () => {
      // TODO this could be changed to useSearchParams instead of router
      const { pathname, query } = router;
      // NOTE ParsedQuery is a Record<string, string>
      const params = new URLSearchParams(query as Record<string, string>);
      params.delete(key);

      router.replace(
        {
          pathname,
          query: params.toString(),
        },
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );
    };
    const q = router.query;

    if (q[key]) {
      successToast({
        text: successMessage,
      });
      removeTimeUpdatedParam();
    }
  }, [router, t, key, successMessage]);
}
