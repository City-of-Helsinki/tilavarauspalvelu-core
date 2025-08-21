import { createClient } from "@/common/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { TermsOfUseDocument, type TermsOfUseQuery, type TermsOfUseQueryVariables, TermsType } from "@gql/gql-types";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { Sanitize } from "common/src/components/Sanitize";
import { H1 } from "common/styled";
import { Button, ButtonVariant, IconArrowLeft } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";
import styled from "styled-components";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl, ctx.req);

  const genericTermsId = params?.id;
  const { data } = await apolloClient.query<TermsOfUseQuery, TermsOfUseQueryVariables>({
    query: TermsOfUseDocument,
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });
  const genericTerms = data.termsOfUse?.edges?.map((n) => n?.node).find((n) => n?.pk === genericTermsId);
  if (genericTerms == null) {
    return {
      props: {
        ...commonProps,
        genericTerms: null,
      },
      notFound: true,
    };
  }
  return {
    props: {
      ...commonProps,
      genericTerms,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: var(--spacing-l);
`;

const GenericTerms = ({ genericTerms }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  if (genericTerms == null) {
    return <div>404</div>;
  }

  const lang = convertLanguageCode(i18n.language);
  const title = getTranslationSafe(genericTerms, "name", lang);
  const text = getTranslationSafe(genericTerms, "text", lang);

  return (
    <>
      <H1>{title}</H1>
      <Sanitize html={text} />
      <ButtonContainer>
        <Button
          title="Takaisin"
          variant={ButtonVariant.Primary}
          onClick={() => window.history.back()}
          iconStart={<IconArrowLeft />}
        >
          {t("common:prev")}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default GenericTerms;
