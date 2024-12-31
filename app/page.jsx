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

  useEffect(() => {
    console.log('Editors state updated:', editors);
  }, [editors]);

  const addEditor = () => {
    const newId = editors.length + 1;
    const newEditor = {
      id: newId,
      language: 'python',
      name: `file${newId}.py`,
      theme: 'vs-dark',
      content: '',
    };
    setEditors([...editors, newEditor]);
    setActiveEditorId(newId);
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
    <div className="flex flex-col w-full min-h-screen bg-gray-100 text-black">
      <header className="w-full px-4">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
      </header>

      <div className="flex flex-grow w-full p-4 gap-2 lg:flex-row flex-col">
        <div className="flex flex-col lg:w-3/4 w-full p-2 flex-grow border-t relative border bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex gap-2">
              {editors.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between gap-1">
                  <div
                    className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer ${editor.id === activeEditorId ? 'bg-gray-900 text-white' : 'bg-gray-200'
                      }`}
                    onClick={() => handleEditorSwitch(editor.id)}
                  >
                    <span>{editor.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditor(editor.id);
                      }}
                      className="text-black font-bold"
                      aria-label={`Remove editor ${editor.name}`}
                    >
                      <img src='./cross.png' className='w-4 h-4 filter brightness-0 invert' alt="Remove" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addEditor}
                className="px-0 py-1 rounded"
                aria-label="Add new editor"
              >
                <img src='./tab.png' width={27} alt="Add tab" />
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

          {editors.map(
            (editor) =>
              editor.id === activeEditorId && (
                <div key={editor.id} className="relative w-full h-full flex flex-col">
                  <div className="absolute top-0 left-0 flex items-center justify-between w-full bg-gray-950 text-white p-2 rounded-t-lg">
                    <span className="text-sm font-bold">{editor.name}</span>
                    <div className="flex items-center space-x-4 mr-3">
                      <button
                        className="cursor-pointer flex items-center gap-2 px-2 py-0 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-lg hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600"
                        onClick={handleDraw}
                        title="Draw"
                      >
                        <span>{isDrawModeEnabled ? "Exit Draw" : "Draw"}</span>
                      </button>

                      <button
                        className='cursor-pointer flex items-center gap-2'
                        onClick={handleSnapshot}
                        title="Take Snapshot"
                      >
                        <img
                          src='./camera.png'
                          alt='Copy'
                          className='w-6 h-6 filter brightness-0 invert'
                        />
                      </button>
                      <div className="relative">
                        <button
                          className='cursor-pointer flex items-center gap-2'
                          onClick={handleCopy}
                          title="Copy code"
                        >
                          <img
                            src='./copy.png'
                            alt='Copy'
                            className='w-5 h-5 filter brightness-0 invert'
                          />
                          {copyStatus && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-2 py-1 rounded">
                              {copyStatus}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Download button */}
                      <button
                        className='cursor-pointer'
                        onClick={() => fileDownload(editor.name)}
                        title="Download file"
                      >
                        <img
                          src='./direct-download.png'
                          alt='Download'
                          className='w-5 h-5 filter brightness-0 invert'
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow mt-9">
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

        <div className="hidden lg:flex flex-col lg:w-1/4 w-full bg-white rounded-lg shadow-lg py-4 px-2 flex-grow border">
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