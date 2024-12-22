'use client';

import React, { useState } from 'react';
import Chat from '../components/chat';
import Navbar from '../components/navbar';
import Editor from '../components/Editor';
import Output from '../components/output';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundry';

function App() {
  const [editors, setEditors] = useState([{ id: 1, language: 'python', name: 'file1.py', theme: 'vs-dark' }]);
  const [activeEditorId, setActiveEditorId] = useState(1);
  const [showChat, setShowChat] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showConsole, setShowConsole] = useState(false); // Control console visibility
  const [loading, setLoading] = useState(false);

  const handleRunCode = () => {
    setLoading(true);
    setShowOutput(true);

    // Simulate code execution or API call
    setTimeout(() => {
      setLoading(false); // Reset loading after the process completes
    }, 2000); // Adjust time as per requirement
  };

  const addEditor = () => {
    const newId = editors.length + 1;
    const newEditor = {
      id: newId,
      language: 'python',
      name: `file${newId}.py`,
      theme: 'vs-dark'
    };
    setEditors([...editors, newEditor]);
    setActiveEditorId(newId); // Switch to the new editor
  };

  const removeEditor = (id) => {
    const filteredEditors = editors.filter((editor) => editor.id !== id);
    setEditors(filteredEditors);
    if (activeEditorId === id && filteredEditors.length > 0) {
      setActiveEditorId(filteredEditors[0].id); // Switch to the first available editor
    }
  };

  const handleEditorSwitch = (id) => {
    setActiveEditorId(id);
  };
  const handleLanguageChange = (id, language) => {
    const languageExtensions = {
      python: "py",
      javascript: "js",
      java: "java",
      cpp: "cpp",
      ruby: "rb",
      scala: "scala",
      sql: "sql",
    };
    const fileExtension = languageExtensions[language] || "txt";
    const updatedEditors = editors.map((editor) => {
      if (editor.id === id) {
        return { ...editor, language, name: `file${id}.${fileExtension}` };
      }
      return editor;
    });

    setEditors(updatedEditors);
  };


  const handleThemeChange = (id, theme) => {
    const updatedEditors = editors.map((editor) => {
      if (editor.id === id) {
        return { ...editor, theme };
      }
      return editor;
    });
    setEditors(updatedEditors);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white text-black">
      <header className="w-full px-4 font-bold">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>

      </header>

      <div className="flex flex-grow w-full p-4 gap-4 lg:flex-row flex-col">
        <div className="flex flex-col lg:w-3/4 w-full p-2 flex-grow border-t relative border">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex gap-2">
              {editors.map((editor) => (
                <button
                  key={editor.id}
                  onClick={() => handleEditorSwitch(editor.id)}
                  className={`px-2 py-1 text-sm rounded ${editor.id === activeEditorId ? 'bg-gray-900 text-white' : 'bg-gray-300'
                    }`}
                >
                  {editor.name}
                </button>
              ))}
              <button
                onClick={addEditor}
                className="bg-white text-black px-2 py-1 rounded border"
              >
                + New
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={editors.find(editor => editor.id === activeEditorId)?.language}
                onChange={(e) => handleLanguageChange(activeEditorId, e.target.value)}
                className="bg-white text-black p-1 rounded border"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
              <select
                value={editors.find(editor => editor.id === activeEditorId)?.theme}
                onChange={(e) => handleThemeChange(activeEditorId, e.target.value)}
                className="bg-white text-black p-1 rounded border"
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">High Contrast Black</option>
              </select>
            </div>
          </div>

          {/* Render the active editor */}
          {editors.map(
            (editor) =>
              editor.id === activeEditorId && (
                <div key={editor.id} className="relative w-full h-full flex flex-col">
                  <div className="absolute top-0 left-0 flex items-center justify-between w-full bg-gray-800 text-white p-2 rounded-t-lg">
                    <span className="text-sm font-bold">{editor.name}</span>
                    <button
                      onClick={() => removeEditor(editor.id)}
                      className="bg-red-600 text-white px-2 rounded"
                    >
                      X
                    </button>
                  </div>

                  <div className="flex-grow mt-10">
                    <ErrorBoundary>
                      <Editor language={editor.language} theme={editor.theme} />
                    </ErrorBoundary>

                  </div>
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
                    <div className="absolute bottom-0 left-0 w-full bg-gray-200 p-0 rounded-t-sm transition-all duration-300 ease-in-out"
                      style={{ height: showOutput ? '30%' : '0', overflow: 'hidden' }}>
                      <div className="w-full h-full p-1 border rounded bg-white text-black font-bold">
                        <div className='border-b p-1'>
                          <h1>Output</h1>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
          )}

          {/* Console and Run buttons */}
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

        <div className="hidden lg:flex flex-col lg:w-1/4 w-full bg-white rounded-sm py-4 px-2 flex-grow border">
          <ErrorBoundary>
            <Chat />
          </ErrorBoundary>

        </div>

        <button
          className="lg:hidden bg-white black rounded-lg p-2 w-full mt-4"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? "Hide Chat" : "Show Chat"}
        </button>
        {showChat && (
          <div className="flex lg:hidden flex-col w-full bg-white rounded-lg shadow-lg p-4 flex-grow">
            <ErrorBoundary>
              <Chat />
            </ErrorBoundary>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;
