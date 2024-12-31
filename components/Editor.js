import React, { useState, useEffect, useContext } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import { executeCode } from "../utils/codeExecution";
import { connectSocket, offMessage, onMessage, sendMessage } from "@/utils/socketCon";
import { useRoomContext } from "@/context/RoomContext";

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

function Editor({ language, theme = "vs-dark", handleLanguageChange }) {
  // const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(SAMPLE_CODE[language] || SAMPLE_CODE.default);
  const [showOutput, setShowOutput] = useState(false);
  const [showConsole, setShowConsole] = useState(false); // Control console visibility
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState({ status: "", result: "" });
  const { room } = useRoomContext();
  // React to language changes and update the code sample

  useEffect(() => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.default);
    console.log("Language changed")
    const newMessage = {
      type: "language",
      name: "You", // Replace this with the current user's name if available
      text: language,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    sendMessage(room, newMessage)
  }, [language]);

  useEffect(() => {
    // Connect to the Socket.IO server
    connectSocket();

    // Listen for incoming messages
    onMessage((data) => {
      console.log(data)
      if (data.type === "code") {
        console.log("code", data)
        setCode(data.text)
      }
    });

    return () => {
      // Clean up the message listener
      offMessage();
    };
  }, []);

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
    const newMessage = {
      type: "code",
      name: "You", // Replace this with the current user's name if available
      text: newCode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    sendMessage(room, newMessage)
  }


  return (
    <div className="relative w-full" style={{ height: '73vh' }}> {/* Adjust height */}
      <MonacoEditor
        height="100%" // This will take 100% of the parent's height
        language={language}
        overflow={true} // Dynamically set language
        theme={theme} // Dynamically set theme
        value={code}
        onChange={(newValue) => handleCodeChange(newValue)}
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
      {/* Changes code */}
      {showConsole && (
        <div
          className="absolute bottom-0 left-0 w-full bg-gray-200 p-0 rounded-t-sm transition-all duration-300 ease-in-out"
          style={{ height: showConsole ? '30%' : '0', overflow: 'hidden' }}
        >
          <div className="w-full h-full border rounded flex flex-col">
            {/* Tabs */}
            <div className="flex h-1/4 bg-slate-100">
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
            <div className="w-full h-3/4 border-t overflow-hidden">
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
