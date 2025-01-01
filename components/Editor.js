import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import { executeCode } from "../utils/codeExecution";
import html2canvas from "html2canvas";
import DrawingLayer from './drawingLayer';
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
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

const Editor = forwardRef(({
  language = "javascript",
  theme = "vs-dark",
  initialContent = "",
  onContentChange = () => { } // Add this prop with default empty function
}, ref) => {
  const [code, setCode] = useState(initialContent || SAMPLE_CODE[language] || SAMPLE_CODE.default);
  const [showOutput, setShowOutput] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState({ status: "", result: "" });
  // const { room } = useRoomContext();
  const editorRef = useRef(null);
  const [isDrawModeEnabled, setIsDrawModeEnabled] = useState(false);
  // React to language changes and update the code sample

  useEffect(() => {
    const sampleCode = SAMPLE_CODE[language] || SAMPLE_CODE.default;
    setCode(sampleCode); // Update code based on language
    onContentChange(sampleCode); // Notify parent about the change
  }, [language]); // Triggered when language or initialContent changes


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

  const takeSnapshot = async () => {
    if (editorRef.current) {
      try {
        const canvas = await html2canvas(editorRef.current, {
          backgroundColor: "#1e1e1e",
          scale: 2,
          logging: false,
          useCORS: true,
        });

        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `code-snapshot-${language}.png`;
        link.click();
      } catch (error) {
        console.error("Error taking snapshot:", error);
      }
    }
  };

  const handleDrawing = () => {
    setIsDrawModeEnabled(prevState => !prevState);
  };


  useImperativeHandle(ref, () => ({
    takeSnapshot,
    handleDrawing
  }));

  const handleRunCode = async () => {
    setLoading(true);
    // setShowOutput(false); // Reset the output visibility
    setShowConsole(true); // Open the console
    setActiveTab('output');

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
      // setShowOutput(true); // Make output visible
    } catch (error) {
      setOutput({ status: "Error!", result: "Unable to execute code. Please try again." });
      // setShowOutput(true); // Ensure output visibility
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };

  function handleCodeChange(newCode) {
    setCode(newCode);
    onContentChange(newValue);
    const newMessage = {
      type: "code",
      name: "You", // Replace this with the current user's name if available
      text: newCode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    // sendMessage(room, newMessage)
  }


  return (
    <div className="relative w-full" ref={editorRef} style={{ height: '73vh' }}> {/* Adjust height */}
      <MonacoEditor
        height="100%"
        language={language}
        overflow={true}
        theme={theme}
        value={code}
        onChange={(newValue) => handleCodeChange(newValue)}
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true, // Add this option
          fontSize: 14, // Optional: set font size
          readOnly: isDrawModeEnabled
        }}
      />
      <ErrorBoundary>
        <DrawingLayer
          containerRef={editorRef}
          isEnabled={isDrawModeEnabled}
        />
      </ErrorBoundary>


      {/* Changes code */}
      {showConsole && (
        <div
          className="absolute bottom-0 left-0 w-full bg-gray-200 p-0 rounded-t-sm transition-all duration-300 ease-in-out"
          style={{ height: showConsole ? '40%' : '0', overflow: 'hidden' }}
        >
          <div className="w-full h-full border rounded flex flex-col">
            {/* Tabs */}
            <div className="flex h-1/6 bg-slate-100">
              <button
                className={`flex-1 p-1 font-bold ${activeTab === 'input' ? 'border-b border-b-gray-900' : ''
                  }`}
                onClick={() => setActiveTab('input')}
              >
                Input
              </button>
              <button
                className={`flex-1 p-1 font-bold ${activeTab === 'output' ? 'border-b border-b-gray-900' : ''
                  }`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
            </div>

            {/* Content Area */}
            <div className="w-full h-5/6 border-t overflow-hidden">
              {activeTab === 'input' && (
                <textarea
                  className="w-full h-full p-2 border-r border-l border-b rounded"
                  placeholder="Enter your input here..."
                ></textarea>
              )}
              {activeTab === 'output' && (
                <div className="w-full h-full border-r border-l border-b rounded bg-white overflow-auto">
                  <div className="p-2">
                    <div
                      className={`text-xl  rounded relative bold font-bold ${output.status === "Success!" ? "text-green-700" : "text-red-700"
                        }`}
                      role="alert"
                    >
                      {output.status}
                    </div>
                    <pre>{output.result}</pre>
                  </div>
                </div>
              )}
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
            <div className="flex items-center text-green-500">
              <span>Running</span>
              <img
                src="/running.gif" // Replace with your spinner GIF path
                alt="Loading..."
                className="ml-2 w-6.5 h-6"
              />
            </div>
          ) : (
            <div className='flex items-center text-green-600 font-semibold'>
              <span>Run</span>
              <img src='./play.png' className='ml-1 font-semibold' width={16} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
});

export default Editor;
