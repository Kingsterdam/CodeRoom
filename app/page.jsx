// App.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Chat from '../components/chat';
import Navbar from '../components/navbar';
import Editor from '../components/Editor';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundry';
import AuthButtons from '@/components/authButtons';


function App() {
  const [editors, setEditors] = useState([{
    id: 1,
    language: 'python',
    name: 'file1.py',
    theme: 'vs-dark',
    content: ''
  }]);
  const [activeEditorId, setActiveEditorId] = useState(1);
  const [showChat, setShowChat] = useState(false);
  const [copyStatus, setCopyStatus] = useState(''); // For copy feedback
  const editorRef = useRef(null);
  const [isDrawModeEnabled, setIsDrawModeEnabled] = useState(false);
  const [idCounter, setIdCounter] = useState(2);


  useEffect(() => {
    console.log('Editors state updated:', editors);
  }, [editors]);

  const addEditor = () => {
    const newEditor = {
      id: idCounter,
      language: 'python',
      name: `file${idCounter}.py`,
      theme: 'vs-dark',
      content: '',
    };
    setEditors([...editors, newEditor]);
    setActiveEditorId(idCounter);
    setIdCounter((prev) => prev + 1);
  };

  const handleDraw = () => {
    setIsDrawModeEnabled(prevState => !prevState);
    editorRef.current.handleDrawing();
  };

  const removeEditor = (id) => {
    const filteredEditors = editors.filter((editor) => editor.id !== id);
    setEditors(filteredEditors);
    if (activeEditorId === id && filteredEditors.length > 0) {
      setActiveEditorId(filteredEditors[0].id);
    }
  };

  const handleSnapshot = () => {
    if (editorRef.current) {
      editorRef.current.takeSnapshot();
    }
  }

  const handleContentChange = (id, newContent) => {
    setEditors(prevEditors =>
      prevEditors.map(editor =>
        editor.id === id
          ? { ...editor, content: newContent }
          : editor
      )
    );
  };

  const handleCopy = async () => {
    const activeEditor = editors.find(editor => editor.id === activeEditorId);

    if (!activeEditor) {
      console.warn('No active editor found');
      setCopyStatus('Nothing to copy');
      return;
    }

    if (!activeEditor.content) {
      console.warn('No content available to copy');
      setCopyStatus('No content to copy');
      return;
    }

    console.log('Attempting to copy content:', activeEditor.content);

    try {
      await navigator.clipboard.writeText(activeEditor.content);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy');
      console.error('Failed to copy:', err);
    }
  };

  const fileDownload = (fileName) => {
    const activeEditor = editors.find(editor => editor.id === activeEditorId);

    if (!activeEditor) {
      console.warn('No active editor found');
      return;
    }

    if (!activeEditor.content) {
      console.warn('No content to download');
      return;
    }

    try {
      const blob = new Blob([activeEditor.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
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

    setEditors(prevEditors =>
      prevEditors.map(editor =>
        editor.id === id
          ? { ...editor, language, name: `file${id}.${fileExtension}` }
          : editor
      )
    );
  };

  const handleThemeChange = (id, theme) => {
    setEditors(prevEditors =>
      prevEditors.map(editor =>
        editor.id === id
          ? { ...editor, theme }
          : editor
      )
    );
  };

  return (
    <div className="transition-colors duration-500 dark:bg-gradient-to-br dark:from-gray-600 dark:via-gray-800 dark:to-gray-500 flex flex-col h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-gradient-to-br from-white via-orange-50 to-white">
      {/* Changed to h-screen and added overflow-hidden */}
      <header className="w-full px-2 sm:px-4 flex-shrink-0"> {/* Added flex-shrink-0 */}
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
      </header>

      <div className="flex flex-grow w-full p-2 sm:p-4 gap-2 lg:flex-row flex-col "> {/* Added overflow-hidden */}
        <div className="flex flex-col lg:w-3/4 w-full p-2 flex-grow border-t relative border bg-white dark:bg-opacity-80 dark:bg-black dark:border-none rounded-lg shadow-lg">
          {/* Tab Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1 flex-shrink-0"> {/* Added flex-shrink-0 */}
            {/* Tabs Section */}
            <div className="flex flex-wrap gap-1 w-full sm:w-auto">
              {editors.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between gap-1">
                  <div
                    className={`flex items-center space-x-1 text-xs sm:text-sm px-1 py-1 rounded-lg border cursor-pointer ${editor.id === activeEditorId ? 'bg-gray-200 text-black dark:bg-green-200' : 'bg-white'
                      }`}
                    onClick={() => handleEditorSwitch(editor.id)}
                  >
                    <span className="max-w-[100px] sm:max-w-[150px] truncate">{editor.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditor(editor.id);
                      }}
                      className="text-black font-bold ml-1"
                      aria-label={`Remove editor ${editor.name}`}
                    >
                      <img src='./cross.png' className='w-2 h-2 sm:w-3 sm:h-3 filter brightness-0' alt="Remove" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addEditor}
                className="p-1 sm:p-2 hover:bg-gray-200 hover:rounded-full"
                aria-label="Add new editor"
              >
                <img src='./plus.png' className="w-3 h-3 sm:w-4 sm:h-4 dark:filter dark:brightness-0 dark:invert dark:hover:invert-0" alt="Add tab" />
              </button>
            </div>

            {/* Language and Theme Selectors */}
            <div className="flex gap-2 text-xs sm:text-sm w-full sm:w-auto">
              <select
                value={editors.find(editor => editor.id === activeEditorId)?.language}
                onChange={(e) => handleLanguageChange(activeEditorId, e.target.value)}
                className="bg-gray-100 dark:bg-green-200 text-black p-1 rounded-lg flex-1 sm:flex-none"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
              <select
                value={editors.find(editor => editor.id === activeEditorId)?.theme}
                onChange={(e) => handleThemeChange(activeEditorId, e.target.value)}
                className="bg-gray-100 dark:bg-green-200 text-black p-1 rounded-lg flex-1 sm:flex-none"
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">High Contrast Black</option>
              </select>
            </div>
          </div>

          {/* Editor Section */}
          {editors.map(
            (editor) =>
              editor.id === activeEditorId && (
                <div key={editor.id} className="relative w-full h-full flex flex-col">
                  <div className="absolute top-0 left-0 flex sm:flex-row items-start sm:items-center justify-between w-full bg-gray-950 dark:bg-opacity-40  text-white p-2 rounded-t-lg">
                    <span className="text-xs sm:text-sm font-bold mb-2 sm:mb-0">{editor.name}</span>
                    <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
                      <button
                        className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-lg hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600"
                        onClick={handleDraw}
                        title="Draw"
                      >
                        <span>{isDrawModeEnabled ? "Exit Draw" : "Draw"}</span>
                      </button>

                      <button
                        className='cursor-pointer'
                        onClick={handleSnapshot}
                        title="Take Snapshot"
                      >
                        <img
                          src='./camera.png'
                          alt='Copy'
                          className='w-4 h-4 sm:w-6 sm:h-6 filter brightness-0 invert'
                        />
                      </button>

                      <div className="relative">
                        <button
                          className='cursor-pointer'
                          onClick={handleCopy}
                          title="Copy code"
                        >
                          <img
                            src='./copy.png'
                            alt='Copy'
                            className='w-4 h-4 sm:w-5 sm:h-5 filter brightness-0 invert'
                          />
                          {copyStatus && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                              {copyStatus}
                            </span>
                          )}
                        </button>
                      </div>

                      <button
                        className='cursor-pointer'
                        onClick={() => fileDownload(editor.name)}
                        title="Download file"
                      >
                        <img
                          src='./direct-download.png'
                          alt='Download'
                          className='w-4 h-4 sm:w-5 sm:h-5 filter brightness-0 invert'
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow mt-10 sm:mt-10 overflow-hidden"> {/* Added overflow-hidden */}
                    <ErrorBoundary>
                      <Editor
                        key={editor.id}
                        language={editor.language}
                        theme={editor.theme}
                        initialContent={editor.content}
                        onContentChange={(content) => handleContentChange(editor.id, content)}
                        ref={editorRef}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              )
          )}
        </div>

        {/* Chat Section */}
        <div className="hidden relative lg:flex flex-col lg:w-1/4 w-full bg-white dark:bg-opacity-70 dark:bg-black dark:border-none dark:text-white rounded-lg shadow-lg py-4 px-2 border"> {/* Modified flex-grow to h-full and added overflow-hidden */}
          <ErrorBoundary>
            <Chat />
          </ErrorBoundary>
        </div>

        <button
          className="lg:hidden bg-white text-black rounded-lg p-2 w-full mt-4 text-sm font-medium hover:bg-gray-50 transition-colors flex-shrink-0"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? "Hide Chat" : "Show Chat"}
        </button>

        {/* Mobile Chat View */}
        {showChat && (
          <div className="flex lg:hidden flex-col w-full h-[600px] sm:h-[400px] bg-white sm:overflow-auto dark:bg-opacity-60 dark:bg-black rounded-lg shadow-lg p-4">
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