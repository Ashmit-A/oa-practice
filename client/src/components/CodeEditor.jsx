import Editor from '@monaco-editor/react';

const languageMap = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
};

export default function CodeEditor({ value, onChange, language = 'python', height = '400px' }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-700 bg-black">
      <Editor
        height={height}
        language={languageMap[language] || 'python'}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
