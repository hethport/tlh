export function convertDictionary(dictionary: Map<string, Set<string>>): { [key: string]: string[] } {
  const object: { [key: string]: string[] } = {};
  for (const [key, value] of dictionary) {
    object[key] = Array.from(value);
  }
  return object;
}

export function updateDictionary(dictionary: Map<string, Set<string>>, object: { [key: string]: string[] }): void {
  for (const [key, values] of Object.entries(object)) {
    const currSet = dictionary.get(key);
    if (currSet === undefined) {
      dictionary.set(key, new Set(values));
    }
    else {
      for (const value of values) {
        currSet.add(value);
      }
    }
  }
}