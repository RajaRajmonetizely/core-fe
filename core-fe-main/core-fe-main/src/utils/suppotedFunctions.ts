/* eslint-disable */
const supportedFunctions = ['sum', 'multiply', 'max', 'min', 'lookup'];

export function functionIsSupported(name: string) {
  return supportedFunctions.includes(name.toLowerCase());
}
