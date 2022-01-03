/**
 * Custom FormData for changing the default behaviour of
 * apollo-upload-client so that the format is what core expects.
 *
 */
export class CustomFormData extends FormData {
  append(name: string, value: string | Blob, fileName?: string): void {
    if (name === "operations") {
      return super.append(name, value);
    }
    if (name === "map") {
      const newMap = {
        image: JSON.parse(value as string)[1],
      };
      return super.append(name, JSON.stringify(newMap));
    }
    return super.append("image", value, fileName);
  }
}
