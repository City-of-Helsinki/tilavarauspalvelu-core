export const hasOperationName = (req, operationName) => {
  const { body } = req;
  return (
    body.hasProperty("operationName") && body.operationName === operationName
  );
};

export const aliasQuery = (req, operationName) => {
  if (hasOperationName(req, operationName)) {
    req.alias = `gql-${operationName}-query`;
  }
};

export const aliasMutation = (req, operationName) => {
  if (hasOperationName(req, operationName)) {
    req.alias = `gql-${operationName}-mutation`;
  }
};
