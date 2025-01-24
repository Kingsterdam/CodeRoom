// App.jsx
'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import Chat from '../components/chat';
import Navbar from '../components/navbar';
import Editor from '../components/Editor';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundry';
import AuthButtons from '@/components/authButtons';
import { offEditorUpdate, onEditorUpdate, sendEditorUpdate, sendLanguageUpdate } from '@/utils/socketCon';
import { useRoomContext } from "../context/RoomContext";
import { Smartphone, Code, GripVertical } from 'lucide-react';

const Resizer = ({ onResize }) => {
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const preventSelection = (e) => {
      e.preventDefault();
      return false;
    };

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      // Prevent text selection
      e.preventDefault();

      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;

      if (newWidth >= 30 && newWidth <= 85) {
        requestAnimationFrame(() => {
          onResize(newWidth);
        });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('selectstart', preventSelection);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('selectstart', preventSelection);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div className="relative w-0 cursor-col-resize hover:bg-transparent select-none">
      {/* Invisible hit area */}
      <div className="absolute inset-0 w-full h-full" />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-6 rounded-lg hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors select-none"
        onMouseDown={handleMouseDown}
        style={{
          touchAction: 'none',  // Prevents touch handling
          WebkitTapHighlightColor: 'transparent' // Removes tap highlight on mobile
        }}
      >
        <GripVertical
          size={20}
          className="text-gray-400 dark:text-gray-500"
        />
      </div>
    </div>
  );
};

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
  const room = useRoomContext()
  const [activeView, setActiveView] = useState('editor'); // 'editor' or 'chat'
  const [isLargeScreen, setIsLargeScreen] = useState(() => window.innerWidth >= 1024);
  const [editorWidth, setEditorWidth] = useState(75); // Initial width percentage
  const [isSummaryEnabled, setIsSummaryEnabled] = useState(false);

  // Handle screen resize
  useEffect(() => {
    const checkScreenSize = () => {
      const newIsLargeScreen = window.innerWidth >= 1024;
      setIsLargeScreen(newIsLargeScreen);
      if (!newIsLargeScreen) {
        setEditorWidth(100); // Reset to full width on small screens
      } else {
        setEditorWidth(75); // Reset to default width on large screens
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  const handleResize = (newWidth) => {
    setEditorWidth(newWidth);
  };


  // Handle screen resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const addEditor = () => {
    const newEditor = {
      id: idCounter,
      language: 'python',
      name: `file${idCounter}.py`,
      theme: 'vs-dark',
      content: '',
    };
    setEditors((prevEditors) => [...prevEditors, newEditor]);
    console.log("All editors ", editors);
    setActiveEditorId(idCounter);
    setIdCounter((prev) => prev + 1);

    // Send editor update to other users
    const newMessage = {
      type: "editorUpdate",
      instruction: "add",
      id: idCounter,
      source: "local", // Indicate this update is from the local user
    };

    console.log("PAGE: Sending editor add message:", newMessage);
    sendEditorUpdate(room, newMessage);
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
    console.log("handleLanguageChange called", id, language)
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

    // Send language update to other users
    const newMessage = {
      type: "languageUpdate",
      language: language,
      editorId: id,
    };
    sendLanguageUpdate(room, newMessage);
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

  useEffect(() => {
    console.log("Setting up editor update listener");

    const handleEditorUpdate = (data) => {
      console.log("Received editor update:", data);

      // Ignore updates that originated locally
      if (data.source === "local") return;

      if (data.instruction === 'add') {
        console.log("Adding editor::::");
        const newEditor = {
          id: data.id,
          language: 'python',
          name: `file${data.id}.py`,
          theme: 'vs-dark',
          content: '',
        };
        setEditors((prevEditors) => [...prevEditors, newEditor]);
        console.log("All editors ", editors);
        setActiveEditorId(data.id);

        // Ensure the counter stays correct
        setIdCounter((prevCounter) => Math.max(prevCounter, data.id + 1));
      }
    };

    onEditorUpdate(handleEditorUpdate);

    return () => {
      console.log("Cleaning up editor update listener");
      offEditorUpdate();
    };
  }, []);
  // Empty dependency array since we want this to run once on mount


  return (
    <div className="transition-colors duration-500 dark:bg-gradient-to-br dark:from-[#0A0F1E] dark:via-slate-950 dark:to-gray-950 flex flex-col h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-blue-400/20 scrollbar-track-gray-100 dark:scrollbar-track-gray-800/40 bg-gradient-to-br from-white via-orange-50 to-white">
      <header className="w-full px-2 sm:px-4 flex-shrink-0">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
      </header>

      <div className="flex flex-grow w-full p-2 sm:p-4 gap-2 lg:flex-row flex-col">

        <div className={`flex flex-col lg:w-3/4 w-full p-2 flex-grow border-t relative border bg-white dark:bg-[#111627] dark:border-[#2A3343] rounded-lg shadow-lg transition-opacity duration-300 ${!isLargeScreen && activeView !== 'editor' ? 'hidden' : ''
          }`}
          style={{
            width: isLargeScreen ? `${editorWidth}%` : '100%',
            height: 'calc(100vh - 80px)'
          }}>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1 flex-shrink-0">
            <div className="flex flex-wrap gap-1 w-full sm:w-auto">
              {editors.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between gap-1">
                  <div
                    className={`flex items-center space-x-1 text-xs sm:text-sm px-2 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 ${editor.id === activeEditorId
                      ? 'bg-blue-500/10 text-blue-400 dark:border-blue-500/40 border-blue-200'
                      : 'bg-white dark:bg-[#1B2134] dark:border-[#2A3343] dark:text-gray-300 hover:dark:bg-[#212842]'
                      }`}
                    onClick={() => handleEditorSwitch(editor.id)}
                  >
                    <span className="max-w-[100px] sm:max-w-[150px] truncate">{editor.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditor(editor.id);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold ml-1 transition-colors"
                      aria-label={`Remove editor ${editor.name}`}
                    >
                      <img src='./cross.png' className='w-2 h-2 sm:w-3 sm:h-3 opacity-60 hover:opacity-100' alt="Remove" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addEditor}
                className="p-1.5 sm:p-2 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                aria-label="Add new editor"
              >
                <img src='./plus.png' className="w-3 h-3 sm:w-4 sm:h-4 dark:filter dark:invert opacity-60 hover:opacity-100" alt="Add tab" />
              </button>
            </div>

            <div className="flex gap-2 text-xs sm:text-sm w-full sm:w-auto">
              <select
                value={editors.find(editor => editor.id === activeEditorId)?.language}
                onChange={(e) => handleLanguageChange(activeEditorId, e.target.value)}
                className="bg-white dark:bg-[#1B2134] dark:text-gray-200 dark:border-[#2A3343] p-1.5 rounded-lg flex-1 sm:flex-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
              <select
                value={editors.find(editor => editor.id === activeEditorId)?.theme}
                onChange={(e) => handleThemeChange(activeEditorId, e.target.value)}
                className="bg-white dark:bg-[#1B2134] dark:text-gray-200 dark:border-[#2A3343] p-1.5 rounded-lg flex-1 sm:flex-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">Contrast</option>
              </select>
            </div>
          </div>

          {editors.map(
            (editor) =>
              editor.id === activeEditorId && (
                <div key={editor.id} className="relative w-full h-full flex flex-col">
                  <div className="absolute top-0 left-0 flex sm:flex-row items-start sm:items-center justify-between w-full bg-[#1E293B] dark:bg-[#1B2134] text-white p-2 rounded-t-lg">
                    <span className="text-xs sm:text-sm font-medium opacity-90 mb-2 sm:mb-0">{editor.name}</span>
                    <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
                      <button
                        className={`cursor-pointer flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 ${isSummaryEnabled
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                          } shadow-lg`}
                        onClick={() => setIsSummaryEnabled(!isSummaryEnabled)}
                        title="Toggle AI Summary"
                      >
                        <span>AI Explain</span>
                        <div className={`w-3 h-3 rounded-full ${isSummaryEnabled ? 'bg-green-200' : 'bg-gray-300'
                          }`} />
                      </button>
                      <button
                        className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-lg hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600"
                        onClick={handleDraw}
                        title="Draw"
                      >
                        <span>{isDrawModeEnabled ? "Exit Draw" : "Draw"}</span>
                      </button>

                      <button
                        className='cursor-pointer transition-transform duration-200 hover:scale-110'
                        onClick={handleSnapshot}
                        title="Take Snapshot"
                      >
                        <img
                          src='./camera.png'
                          alt='Copy'
                          className='w-4 h-4 sm:w-6 sm:h-6 filter brightness-0 invert opacity-100 hover:opacity-100'
                        />
                      </button>

                      <div className="relative">
                        <button
                          className='cursor-pointer transition-transform duration-200 hover:scale-110'
                          onClick={handleCopy}
                          title="Copy code"
                        >
                          <img
                            src='./copy.png'
                            alt='Copy'
                            className='w-4 h-4 sm:w-5 sm:h-5 filter brightness-0 invert opacity-100 hover:opacity-100'
                          />
                          {copyStatus && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-[#1B2134] text-white px-2 py-1 rounded whitespace-nowrap">
                              {copyStatus}
                            </span>
                          )}
                        </button>
                      </div>

                      <button
                        className='cursor-pointer transition-transform duration-200 hover:scale-110'
                        onClick={() => fileDownload(editor.name)}
                        title="Download file"
                      >
                        <img
                          src='./direct-download.png'
                          alt='Download'
                          className='w-4 h-4 sm:w-5 sm:h-5 filter brightness-0 invert opacity-100 hover:opacity-100'
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow mt-10 sm:mt-10 overflow-hidden">
                    <ErrorBoundary>
                      <Editor
                        key={editor.id}
                        editors={editors}
                        setEditors={setEditors}
                        editorId={editor.id}
                        language={editor.language}
                        theme={editor.theme}
                        initialContent={editor.content}
                        onContentChange={(content) => handleContentChange(editor.id, content)}
                        onLanguageChange={(value) => handleLanguageChange(value.editorId, value.language)}
                        ref={editorRef}
                        isSummaryEnabled={isSummaryEnabled}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              )
          )}
        </div>

        {isLargeScreen && <Resizer onResize={handleResize} />}
        <div className={`lg:flex flex-col lg:w-1/4 w-full bg-white dark:bg-[#111627] dark:border-[#2A3343] dark:text-white rounded-lg shadow-lg py-4 px-2 border transition-opacity duration-300 ${!isLargeScreen && activeView !== 'chat' ? 'hidden' : ''
          }`}
          style={{
            width: isLargeScreen ? `${100 - editorWidth - 1}%` : '100%',
            height: 'calc(100vh - 80px)'
          }}>
          <ErrorBoundary>
            <Chat />
          </ErrorBoundary>
        </div>

        {!isLargeScreen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111627] border-t dark:border-[#2A3343] flex justify-around items-center h-16 px-4 shadow-lg">
            <button
              onClick={() => setActiveView('editor')}
              className={`flex flex-col items-center justify-center w-1/2 py-2 transition-colors ${activeView === 'editor'
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                }`}
            >
              <Code size={24} />
              <span className="text-xs mt-1">Editor</span>
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`flex flex-col items-center justify-center w-1/2 py-2 transition-colors ${activeView === 'chat'
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                }`}
            >
              <Smartphone size={24} />
              <span className="text-xs mt-1">Chat</span>
            </button>
          </div>
        )}

        <div className="lg:hidden h-16" />
      </div>
    </div>
  );
}

export default App;