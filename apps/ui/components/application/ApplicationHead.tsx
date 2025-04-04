import { ApplicationStatusChoice, Maybe } from "@/gql/gql-types";
import { Flex, H1 } from "common/styled";
import { ApplicationStatusLabel } from "common/src/components/statuses";

export function ApplicationHead({
  status,
  title,
  subTitle,
}: {
  status: Maybe<ApplicationStatusChoice> | undefined;
  title: string;
  subTitle?: string;
}): JSX.Element {
  return (
    <Flex
      $direction="row"
      $alignItems="flex-start"
      $justifyContent="space-between"
      $wrap="wrap"
    >
      <div>
        <H1 $noMargin>{title}</H1>
        {subTitle && <p>{subTitle}</p>}
      </div>
      <ApplicationStatusLabel status={status} user="customer" />
    </Flex>
  );
}
