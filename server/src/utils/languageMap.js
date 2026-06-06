export const LANGUAGE_MAP = {
  python: { id: 109, label: 'Python 3.13', monaco: 'python' },
  javascript: { id: 102, label: 'JavaScript (Node.js 22)', monaco: 'javascript' },
  java: { id: 91, label: 'Java (JDK 17)', monaco: 'java' },
  cpp: { id: 105, label: 'C++ (GCC 14)', monaco: 'cpp' },
};

export function getLanguageId(language) {
  const entry = LANGUAGE_MAP[language?.toLowerCase()];
  if (!entry) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return entry.id;
}

export function isValidLanguage(language) {
  return Boolean(LANGUAGE_MAP[language?.toLowerCase()]);
}
