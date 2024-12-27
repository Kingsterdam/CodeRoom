import React, { useState, useEffect } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import { executeCode } from "../utils/codeExecution";

const SAMPLE_CODE = {
  javascript: `// JavaScript Hello World
console.log("Hello, World!");`,
  python: `# Python Hello World
print("Hello, World!")`,
  java: `// Java Hello World
public class Temp {
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
  const [showOutput, setShowOutput] = useState(false);
  const [showConsole, setShowConsole] = useState(false); // Control console visibility
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState({ status: "", result: "" });

  // React to language changes and update the code sample
  useEffect(() => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.default);
  }, [language]);

  // Load additional Monaco language support dynamically if necessary
  useEffect(() => {
    loader.init().then((monaco) => {
      if (!monaco.languages.getLanguages().find((lang) => lang.id === language)) {
        if (language === "java") {
          require("monaco-editor/esm/vs/basic-languages/java/java.contribution");
        } else if (language === "cpp") {
          require("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution");
        }
      }
    });
  }, [language]);

  const handleRunCode = async () => {
    setLoading(true);
    setShowOutput(false); // Reset the output visibility

    try {
      const result = await executeCode(language, code); // Call the API

      // Determine status message based on error type or success
      let statusMessage = "";
      if (result.success) {
        statusMessage = "Success!";
      } else if (result.errorType === "CompilationError") {
        statusMessage = "Compilation Error!";
      } else if (result.errorType === "RuntimeError") {
        statusMessage = "Runtime Error!";
      } else {
        statusMessage = "Error!";
      }

      // Update the output state
      setOutput({ status: statusMessage, result: result.output || "No output" });
      setShowOutput(true); // Make output visible
    } catch (error) {
      setOutput({ status: "Error!", result: "Unable to execute code. Please try again." });
      setShowOutput(true); // Ensure output visibility
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };


  return (
    <div className="relative w-full" style={{ height: '73vh' }}> {/* Adjust height */}
      <MonacoEditor
        height="100%" // This will take 100% of the parent's height
        language={language}
        overflow={true} // Dynamically set language
        theme={theme} // Dynamically set theme
        value={code}
        onChange={(newValue) => setCode(newValue)}
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
      {showConsole && (
        <div className="absolute bottom-0 left-0 w-full bg-gray-200 p-0 rounded-t-sm transition-all duration-300 ease-in-out"
          style={{ height: showConsole ? '25%' : '0', overflow: 'hidden' }}>
          <div className='w-full h-full border rounded'>
            <h1 className='p-1 w-full h-1/4 border font-bold bg-slate-100'>Input</h1>
            <textarea
              className="w-full h-3/4 border-r border-l border-b rounded"
              placeholder="Enter your input here..."
            ></textarea>
          </div>
        </div>
      )}

      {showOutput && (
        <div
          className="absolute bottom-0 left-0 w-full bg-gray-200 p-0 rounded-t-sm transition-all duration-300 ease-in-out"
          style={{ height: '30%', overflow: 'auto' }}
        >
          <div className="w-full h-full p-1 border rounded bg-white text-black font-bold">
            <div className="flex justify-between border-b p-1">
              <h1>Output</h1>
              <div onClick={() => setShowOutput(false)} className="cursor-pointer">
                <img src="./down.png" className="cursor-pointer" width={22} />
              </div>
            </div>
            <div className="p-2">
              <div
                className={`text-xl py-1 rounded relative bold ${output.status === "Success!" ? "text-green-700" : "text-red-700"
                  }`}
                role="alert"
              >
                {output.status}
              </div>
              <pre>{output.result}</pre>
            </div>
          </div>
        </div>
      )}


      <div className='flex items-center justify-between gap-2 mb-2'>
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="mt-1 bg-gray-900 text-white rounded-sm py-2 px-3 w-full lg:w-auto border"
        >
          {showConsole ? "Hide Console" : "Console"}
        </button>
        <button
          onClick={handleRunCode}
          className="mt-1 flex items-center justify-center bg-white text-black rounded-sm px-3 py-2 w-full lg:w-auto border"
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <div className="flex items-center">
              <span>Running</span>
              <img
                src="/running.gif" // Replace with your spinner GIF path
                alt="Loading..."
                className="ml-2 w-6.5 h-6"
              />
            </div>
          ) : (
            <div className='flex items-center'>
              <span>Run</span>
              <img src='./play.png' className='ml-1' width={16} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default Editor;
