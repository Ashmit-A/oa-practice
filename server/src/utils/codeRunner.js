import { parseMetaData } from './leetcodeTransformer.js';

function parseValue(type, line) {
  const trimmed = line.trim();
  if (type.includes('integer[]') || type === 'int[]') {
    return JSON.parse(trimmed);
  }
  if (type.includes('string[]')) {
    return JSON.parse(trimmed);
  }
  if (type === 'integer' || type === 'int' || type === 'long') {
    return parseInt(trimmed, 10);
  }
  if (type === 'double' || type === 'float') {
    return parseFloat(trimmed);
  }
  if (type === 'boolean') {
    return trimmed === 'true';
  }
  if (type === 'string') {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.replace(/^"|"$/g, '');
    }
  }
  return trimmed;
}

function pythonType(type) {
  if (type.includes('integer[]') || type === 'int[]') return 'List[int]';
  if (type.includes('string[]')) return 'List[str]';
  if (type === 'integer' || type === 'int') return 'int';
  if (type === 'boolean') return 'bool';
  if (type === 'string') return 'str';
  return 'Any';
}

function formatPythonOutput(retType) {
  if (retType.includes('integer[]') || retType === 'int[]') {
    return 'print(json.dumps(result, separators=(",", ":")))';
  }
  if (retType.includes('string[]')) {
    return 'print(json.dumps(result, separators=(",", ":")))';
  }
  if (retType === 'boolean') {
    return 'print("true" if result else "false")';
  }
  if (retType === 'string') {
    return 'print(json.dumps(result))';
  }
  return 'print(result)';
}

function buildPythonRunner(userCode, metaData) {
  const params = metaData.params;
  const method = metaData.name;
  const retType = metaData.return.type;

  const parseLines = params
    .map((p, i) => `    ${p.name} = ${pythonParseExpr(p.type, `lines[${i}]`)}`)
    .join('\n');

  const callArgs = params.map((p) => p.name).join(', ');

  return `import json
import sys
from typing import *

${userCode}

if __name__ == "__main__":
    lines = [line for line in sys.stdin.read().split('\\n') if line.strip()]
${parseLines}
    sol = Solution()
    result = sol.${method}(${callArgs})
    ${formatPythonOutput(retType)}
`;
}

function pythonParseExpr(type, lineExpr) {
  if (type.includes('[]')) return `json.loads(${lineExpr}.strip())`;
  if (type === 'integer' || type === 'int' || type === 'long') return `int(${lineExpr}.strip())`;
  if (type === 'boolean') return `(${lineExpr}.strip() == 'true')`;
  if (type === 'string') return `json.loads(${lineExpr}.strip()) if ${lineExpr}.strip().startswith('"') else ${lineExpr}.strip()`;
  return `${lineExpr}.strip()`;
}

function buildJavaScriptRunner(userCode, metaData) {
  const params = metaData.params;
  const method = metaData.name;
  const retType = metaData.return.type;

  const parseLines = params
    .map((p, i) => `  const ${p.name} = ${jsParseExpr(p.type, `lines[${i}]`)};`)
    .join('\n');

  const callArgs = params.map((p) => p.name).join(', ');

  let formatResult;
  if (retType.includes('[]')) {
    formatResult = 'console.log(JSON.stringify(result).replace(/ /g, ""));';
  } else if (retType === 'boolean') {
    formatResult = 'console.log(result ? "true" : "false");';
  } else if (retType === 'string') {
    formatResult = 'console.log(JSON.stringify(result));';
  } else {
    formatResult = 'console.log(String(result));';
  }

  return `${userCode}

const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').split('\\n').filter((l) => l.trim());
${parseLines}
const result = ${method}(${callArgs});
${formatResult}
`;
}

function jsParseExpr(type, lineExpr) {
  if (type.includes('[]')) return `JSON.parse(${lineExpr}.trim())`;
  if (type === 'integer' || type === 'int' || type === 'long') return `parseInt(${lineExpr}.trim(), 10)`;
  if (type === 'boolean') return `${lineExpr}.trim() === 'true'`;
  if (type === 'string') {
    return `${lineExpr}.trim().startsWith('"') ? JSON.parse(${lineExpr}.trim()) : ${lineExpr}.trim()`;
  }
  return `${lineExpr}.trim()`;
}

function buildJavaRunner(userCode, metaData) {
  const params = metaData.params;
  const method = metaData.name;
  const retType = metaData.return.type;

  const parseBlock = params
    .map((p, i) => javaParseStatement(p.type, p.name, `lines.get(${i})`))
    .join('\n        ');

  const callArgs = params.map((p) => p.name).join(', ');
  const printStmt = javaPrintStatement(retType);

  return `import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            if (!line.trim().isEmpty()) lines.add(line.trim());
        }
        ${parseBlock}
        Solution sol = new Solution();
        ${javaReturnType(retType)} result = sol.${method}(${callArgs});
        ${printStmt}
    }

    static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0];
        s = s.substring(1, s.length() - 1);
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }

}
`;
}

function javaReturnType(type) {
  if (type.includes('integer[]') || type === 'int[]') return 'int[]';
  if (type.includes('string[]')) return 'String[]';
  if (type === 'boolean') return 'boolean';
  if (type === 'string') return 'String';
  return 'int';
}

function javaParseStatement(type, name, lineExpr) {
  if (type.includes('integer[]') || type === 'int[]') {
    return `${javaReturnType(type)} ${name} = parseIntArray(${lineExpr});`;
  }
  if (type === 'integer' || type === 'int') {
    return `int ${name} = Integer.parseInt(${lineExpr});`;
  }
  if (type === 'boolean') {
    return `boolean ${name} = ${lineExpr}.equals("true");`;
  }
  if (type === 'string') {
    return `String ${name} = ${lineExpr}.startsWith("\\"") ? ${lineExpr}.substring(1, ${lineExpr}.length()-1) : ${lineExpr};`;
  }
  return `String ${name} = ${lineExpr};`;
}

function javaPrintStatement(retType) {
  if (retType.includes('[]')) {
    return `System.out.println(Arrays.toString(result).replace(" ", ""));`;
  }
  if (retType === 'boolean') {
    return `System.out.println(result ? "true" : "false");`;
  }
  if (retType === 'string') {
    return `System.out.println("\\"" + result + "\\"");`;
  }
  return `System.out.println(result);`;
}

function buildCppRunner(userCode, metaData) {
  const params = metaData.params;
  const method = metaData.name;
  const retType = metaData.return.type;

  const parseBlock = params
    .map((p, i) => cppParseStatement(p.type, p.name, i))
    .join('\n    ');

  const callArgs = params.map((p) => p.name).join(', ');
  const cppRet = cppReturnType(retType);
  const printStmt = cppPrintStatement(retType);

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

vector<int> parseIntVector(const string& s) {
    vector<int> res;
    string t;
    for (char c : s) {
        if (isdigit(c) || c == '-') t += c;
        else if (!t.empty()) { res.push_back(stoi(t)); t.clear(); }
    }
    if (!t.empty()) res.push_back(stoi(t));
    return res;
}

int main() {
    vector<string> lines;
    string line;
    while (getline(cin, line)) if (!line.empty()) lines.push_back(line);
    ${parseBlock}
    Solution sol;
    ${cppRet} result = sol.${method}(${callArgs});
    ${printStmt}
    return 0;
}
`;
}

function cppReturnType(type) {
  if (type.includes('integer[]') || type === 'int[]') return 'vector<int>';
  if (type === 'integer' || type === 'int') return 'int';
  if (type === 'boolean') return 'bool';
  if (type === 'string') return 'string';
  return 'auto';
}

function cppParseStatement(type, name, idx) {
  if (type.includes('integer[]') || type === 'int[]') {
    return `vector<int> ${name} = parseIntVector(lines[${idx}]);`;
  }
  if (type === 'integer' || type === 'int') {
    return `int ${name} = stoi(lines[${idx}]);`;
  }
  if (type === 'boolean') {
    return `bool ${name} = lines[${idx}] == "true";`;
  }
  if (type === 'string') {
    return `string ${name} = lines[${idx}];`;
  }
  return `string ${name} = lines[${idx}];`;
}

function cppPrintStatement(retType) {
  if (retType.includes('integer[]') || retType === 'int[]') {
    return `cout << "["; for (int i = 0; i < (int)result.size(); i++) { if (i) cout << ","; cout << result[i]; } cout << "]";`;
  }
  if (retType === 'boolean') {
    return `cout << (result ? "true" : "false");`;
  }
  if (retType === 'string') {
    return `cout << "\\"" << result << "\\"";`;
  }
  return `cout << result;`;
}

export function wrapUserCode(sourceCode, language, metaDataRaw) {
  const metaData = parseMetaData(metaDataRaw);
  if (!metaData?.name) {
    throw new Error('Question metadata missing — cannot execute code');
  }

  switch (language) {
    case 'python':
      return buildPythonRunner(sourceCode, metaData);
    case 'javascript':
      return buildJavaScriptRunner(sourceCode, metaData);
    case 'java':
      return buildJavaRunner(sourceCode, metaData);
    case 'cpp':
      return buildCppRunner(sourceCode, metaData);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}
