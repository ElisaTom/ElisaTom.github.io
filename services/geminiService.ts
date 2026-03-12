/**
 * Client-side stub for GenAI features. The real AI should be called via a server endpoint.
 */
const isBrowser = typeof window !== 'undefined';

export const getOracleSuggestion = async (
  domain: string,
  mode: 'random' | 'smart',
  preferences?: { energy?: number; budget?: number }
) => {
  if (isBrowser) return null;
  return null;
};

export const pickFromList = async (options: any[], domain: string, criteria: any) => {
  if (isBrowser) return null;
  return null;
};
