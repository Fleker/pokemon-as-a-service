// https://stackoverflow.com/questions/52173855/convert-array-of-strings-to-typescript-type
export default function asLiterals<T extends string>(arr: T[]): T[] { return arr; }