import { ApplicationStatusChoice, Maybe } from "@/gql/gql-types";
import { Flex, H1 } from "common/styled";
import { ApplicationStatusLabel } from "common/src/components/statuses";

export function ApplicationHead({
  status,
  title,
}: {
  status: Maybe<ApplicationStatusChoice> | undefined;
  title: string;
}): JSX.Element {
  return (
    <Flex $direction="row" $alignItems="flex-start" $justifyContent="space-between" $wrap="wrap">
      <H1 $noMargin>{title}</H1>
      <ApplicationStatusLabel status={status} user="customer" />
    </Flex>
  );
}
