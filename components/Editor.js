import React, { useState, useEffect } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";

// Sample "Hello, World!" code snippets for various languages
const SAMPLE_CODE = {
  javascript: `// JavaScript Hello World
console.log("Hello, World!");`,
  python: `# Python Hello World
print("Hello, World!")`,
  java: `// Java Hello World
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `// C++ Hello World
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  default: `// Select a language to see "Hello, World!" code`
};

function Editor({ language = "javascript", theme = "vs-dark" }) {
  const [code, setCode] = useState(SAMPLE_CODE[language] || SAMPLE_CODE.default);

  // React to language changes and update the code sample
  useEffect(() => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.default);
  }, [language]);

  // Load additional Monaco language support dynamically if necessary
  useEffect(() => {
    loader.init().then((monaco) => {
      if (!monaco.languages.getLanguages().find((lang) => lang.id === language)) {
        // Load the language if not already loaded
        if (language === "java") {
          require("monaco-editor/esm/vs/basic-languages/java/java.contribution");
        } else if (language === "cpp") {
          require("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution");
        }
      }
    });
  }, [language]);

  return (
    <div className="relative w-full h-full border">
      <MonacoEditor
        height="100%"
        language={language} // Dynamically set language
        theme={theme} // Dynamically set theme
        value={code} // Display language-specific code
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}

export default Editor;
