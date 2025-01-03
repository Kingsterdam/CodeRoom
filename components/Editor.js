import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import { executeCode } from "../utils/codeExecution";
import html2canvas from "html2canvas";
import DrawingLayer from './drawingLayer';
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { saveCode, fetchCode } from '../utils/codeSaving'
import { useRoomContext } from "../context/RoomContext";
import { onLanguageUpdate, offLanguageUpdate } from "@/utils/socketCon";
import  { connectSocket } from "@/utils/socketCon";

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
  editorId = 1,
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
  const [activeTab, setActiveTab] = useState('input');
  const editorRef = useRef(null);
  const [isDrawModeEnabled, setIsDrawModeEnabled] = useState(false);
  const [inputValue, setInputValue] = useState(''); // State to manage input
  const { room, setRoom } = useRoomContext();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Ensure socket is connected
    connectSocket();
    
    const handleLanguageUpdate = (data) => {
        if (data.editorId === editorId) {
            const sampleCode = SAMPLE_CODE[data.language] || SAMPLE_CODE.default;
            setCode(sampleCode);
            onContentChange(sampleCode);
        }
    };

    onLanguageUpdate(handleLanguageUpdate);

    return () => {
        offLanguageUpdate();
    };
}, [editorId, onContentChange]);

  //Auto Fetching of the code
  // Fetching and initializing code based on Redis data or language change
  useEffect(() => {
    const initializeCode = async () => {
      // Fetch saved code from Redis
      console.log('room' + room + editorId)
      const savedCode = await fetchCode(room, editorId, language);
      if (savedCode) {
        setCode(savedCode); // Use saved code if available
        onContentChange(savedCode); // Notify parent about the change
      } else {
        // No saved code found, initialize with language-specific sample code
        const sampleCode = SAMPLE_CODE[language] || SAMPLE_CODE.default;
        setCode(sampleCode);
        onContentChange(sampleCode);
      }
    };

    initializeCode();
  }, [room, editorId, language]); // Triggered on room or language change


  useEffect(() => {
    let timeout;

    const saveCodeOnDelay = async () => {
      if (code && !saving) {
        setSaving(true);
        await saveCode(room, editorId, language, code);  // Assuming this is an async function that handles the save operation
        setSaving(false);
      }
    };

    // Set timeout only when the code changes, and clear the previous timeout
    timeout = setTimeout(saveCodeOnDelay, 5000); // Try saving after 2000ms of inactivity

    return () => clearTimeout(timeout);  // Clean up the timeout on every render or change

  }, [code, room, editorId, saving]);  // Triggered on code, room, or saving state change




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

  // Function to handle changes in the textarea
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

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

  const handleCodeChange = (newValue) => {
    setCode(newValue);
    onContentChange(newValue); // Notify parent component of content change
  };

  const handleRunCode = async () => {
    setLoading(true);
    // setShowOutput(false); // Reset the output visibility
    setShowConsole(true); // Open the console
    setActiveTab('output');

    try {
      console.log("same file input")
      const result = await executeCode(language, code, inputValue); // Call the API

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


  return (
    <div className="relative w-full" ref={editorRef} style={{ height: '91%' }}> {/* Adjust height */}
      <MonacoEditor
        height="100%"
        language={language}
        overflow={true}
        theme={theme}
        value={code}
        onChange={(newValue) => setCode(newValue)}
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
          className="absolute bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-900  p-0 rounded-t-sm transition-all duration-300 ease-in-out"
          style={{ height: showConsole ? '40%' : '0', overflow: 'hidden' }}
        >
          <div className="w-full h-full rounded flex flex-col">
            {/* Tabs */}
            <div className="flex h-1/6 bg-slate-100 dark:bg-black dark:bg-opacity-60 dark:text-white">
              <button
                className={`flex-1 p-1 font-bold ${activeTab === 'input' ? 'border-b border-b-gray-900 dark:border-b-green-300' : ''
                  }`}
                onClick={() => setActiveTab('input')}
              >
                Input
              </button>
              <button
                className={`flex-1 p-1 font-bold ${activeTab === 'output' ? 'border-b border-b-gray-900 dark:border-b-green-300' : ''
                  }`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
            </div>

            {/* Content Area */}
            <div className="w-full h-5/6  overflow-hidden">
              {activeTab === 'input' && (
                <textarea
                  className="w-full h-full p-2 rounded bg-white dark:bg-black dark:bg-opacity-40 dark:text-white"
                  placeholder="Enter your input here..."
                  value={inputValue} // Bind the state to the textarea
                  onChange={handleInputChange}
                ></textarea>
              )}
              {activeTab === 'output' && (
                <div className="w-full h-full rounded bg-white dark:bg-black dark:bg-opacity-40 dark:text-white overflow-auto">
                  <div className="p-2">
                    <div
                      className={`text-xl  rounded relative bold font-bold ${output.status === "Success!" ? "text-green-700 dark:text-green-500" : "text-red-700"
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
          className="mt-1 bg-gray-900 dark:bg-green-300 dark:text-black text-white rounded-lg py-2 px-3 w-full lg:w-auto border"
        >
          {showConsole ? "Hide Console" : "Console"}
        </button>
        <div className="text-gray-400">
          {saving ? 'Auto-saving...' : 'All changes saved'}
        </div>
        <button
          onClick={handleRunCode}
          className="mt-1 flex items-center justify-center bg-white text-black rounded-lg px-3 py-2 w-full lg:w-auto border"
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
