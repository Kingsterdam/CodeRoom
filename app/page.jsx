'use client';

import React, { createContext, useState } from 'react';
import Chat from '../components/chat';
import Navbar from '../components/navbar';
import Editor from '../components/Editor';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundry';

function App() {
  const [editors, setEditors] = useState([{ id: 1, language: 'python', name: 'file1.py', theme: 'vs-dark' }]);
  const [activeEditorId, setActiveEditorId] = useState(1);
  const [showChat, setShowChat] = useState(false);
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
                <div key={editor.id} className="flex items-center justify-between gap-1">
                  <div
                    className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer ${editor.id === activeEditorId ? 'bg-gray-900 text-white' : 'bg-gray-200'
                      }`}
                    onClick={() => handleEditorSwitch(editor.id)} // Clicking the file name switches to the editor
                  >
                    <span>{editor.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the editor switch when the "X" is clicked
                        removeEditor(editor.id); // Close editor
                      }}
                      className="text-black font-bold"
                      aria-label={`Remove editor ${editor.name}`}
                    >
                      <img src='./cross.png' className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addEditor}
                className="px-0 py-1 rounded"
                aria-label="Add new editor"
              >
                <img src='./tab.png' width={27} />
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
                  </div>

                  <div className="flex-grow mt-9">
                    <ErrorBoundary>
                      <Editor language={editor.language} theme={editor.theme} />
                    </ErrorBoundary>
                  </div>
                </div>
              )
          )}
          {/* Console and Run buttons */}
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
