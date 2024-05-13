// export const REGEX = /^[a-zA-Z][a-zA-Z0-9.,\-_& ]+$/i;
export const REGEX = /./;

export const generateRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

export const clearStorage = () => {
  localStorage.removeItem('ActiveSection');
  localStorage.removeItem('mimicUser');
};

export const escapeRegExp = (value: string): string =>
  value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
