export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result = [];
  let index = 0;

  while (index < array.length) {
    result.push(array.slice(index, size + index));
    index += size;
  }

  return result;
};
