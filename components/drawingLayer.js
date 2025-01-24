import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useRoomContext } from '@/context/RoomContext';
import { connectSocket, offCursor, offDrawing, onCursor, onDrawing, sendCursor, sendDrawing } from '@/utils/socketCon';
import { throttle } from 'lodash';

// Custom SVG icons
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const LaserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="m12 5-1.5-2" />
    <path d="m19 12 2-1.5" />
    <path d="m12 19 1.5 2" />
    <path d="m5 12-2 1.5" />
  </svg>
);

const DrawingLayer = ({ containerRef, isEnabled = false }) => {
  const fabricRef = useRef(null);
  const laserTimeoutRef = useRef(null);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [currentTool, setCurrentTool] = useState('pencil');
  const [brushSize, setBrushSize] = useState(2);
  const [showLaser, setShowLaser] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState('');

  const { room } = useRoomContext();
  const colors = [
    { hex: '#FF0000', name: 'Red' },
    { hex: '#FF8C00', name: 'Orange' },
    { hex: '#FFD700', name: 'Yellow' },
    { hex: '#00FF00', name: 'Green' },
    { hex: '#0000FF', name: 'Blue' },
    { hex: '#8A2BE2', name: 'Purple' },
    { hex: '#000000', name: 'Black' },
    { hex: '#FFFFFF', name: 'White' },
  ];


  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.renderOnAddRemove = false; // Disable automatic rendering
      fabricRef.current.skipTargetFind = true; // Disable object targeting
      fabricRef.current.selection = false; // Disable selection
    }
  }, []);

  useEffect(() => {
    if (fabricRef.current) {
      const canvas = fabricRef.current;

      // Optimize canvas settings
      canvas.renderOnAddRemove = false;
      canvas.skipTargetFind = true;
      canvas.selection = false;

      // Improve line quality
      canvas.freeDrawingBrush.strokeLineCap = 'round';
      canvas.freeDrawingBrush.strokeLineJoin = 'round';
      canvas.freeDrawingBrush.strokeMiterLimit = 10;

      // Enable better smoothing
      if (canvas.contextTop) {
        canvas.contextTop.imageSmoothingEnabled = true;
        canvas.contextTop.imageSmoothingQuality = 'high';
      }
    }
  }, []);

  const throttledSendDrawing = useRef(
    throttle((room, data) => {
      sendDrawing(room, data);
    }, 16) // Reduced to 16ms (approximately 60fps) for smoother drawing
  ).current;

  useEffect(() => {
    if (!containerRef.current || fabricRef.current) return;

    const overlayDiv = document.createElement('div');
    Object.assign(overlayDiv.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: isEnabled ? 'auto' : 'none',
      zIndex: '100'
    });

    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'drawing-canvas';
    overlayDiv.appendChild(canvasElement);
    containerRef.current.appendChild(overlayDiv);

    const canvas = new fabric.Canvas('drawing-canvas', {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      isDrawingMode: isEnabled,
      backgroundColor: 'transparent'
    });

    const canvasEl = canvas.getElement();
    Object.assign(canvasEl.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%'
    });

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = currentColor;

    canvasEl.addEventListener('mousemove', handleLaserMove);

    fabricRef.current = canvas;

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (overlayDiv.parentNode) {
        overlayDiv.parentNode.removeChild(overlayDiv);
      }
      canvasEl.removeEventListener('mousemove', handleLaserMove);
      if (laserTimeoutRef.current) {
        clearTimeout(laserTimeoutRef.current);
      }
    };
  }, [containerRef]);

  const handleLaserMove = (e) => {
    if (currentTool === 'laser' && fabricRef.current) {
      const rect = fabricRef.current.getElement().getBoundingClientRect();
      setLaserPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setShowLaser(true);

      if (laserTimeoutRef.current) {
        clearTimeout(laserTimeoutRef.current);
      }
      laserTimeoutRef.current = setTimeout(() => {
        setShowLaser(false);
      }, 100);
    }
  };

  useEffect(() => {
    connectSocket();

    const pathMap = new Map(); // Store ongoing paths

    const handleDrawing = (data) => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;

      requestAnimationFrame(() => {
        if (data.data.points && data.data.type === 'drawing') {
          const points = data.data.points;

          if (points.length < 2) return;

          // Create smooth path between points
          let pathString = `M ${points[0].x} ${points[0].y}`;

          for (let i = 1; i < points.length; i++) {
            // Use quadratic curves for smoother lines
            if (i < points.length - 1) {
              const xc = (points[i].x + points[i + 1].x) / 2;
              const yc = (points[i].y + points[i + 1].y) / 2;
              pathString += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
            } else {
              pathString += ` L ${points[i].x} ${points[i].y}`;
            }
          }

          // Remove existing path if it's an ongoing drawing
          if (pathMap.has(data.sender)) {
            canvas.remove(pathMap.get(data.sender));
          }

          const path = new fabric.Path(pathString, {
            stroke: data.data.stroke || 'black',
            strokeWidth: data.data.strokeWidth || 1,
            fill: null,
            selectable: false,
            evented: false,
            strokeLineCap: 'round',
            strokeLineJoin: 'round'
          });

          canvas.add(path);

          if (!data.data.isComplete) {
            pathMap.set(data.sender, path);
          } else {
            pathMap.delete(data.sender);
          }

          canvas.renderAll();
        } else if (data.data.objects) {
          canvas.loadFromJSON(data.data, () => {
            canvas.renderAll();
          });
        } else if (!data.data.objects && !data.data.points) {
          canvas.clear();
          pathMap.clear();
        }
      });
    };

    onDrawing(handleDrawing);

    return () => {
      offDrawing();
      pathMap.clear();
    };
  }, []);

  const logDrawingData = () => {
    if (fabricRef.current) {
      const drawingData = fabricRef.current.toJSON();
      console.log('Drawing Data:', drawingData);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (fabricRef.current && containerRef.current) {
        fabricRef.current.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
        fabricRef.current.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);

  const clear = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      const drawingData = fabricRef.current.toJSON();
      console.log("room: ", room)
      console.log("drawing data: ", drawingData)
      sendDrawing(room, drawingData)
    }
  };

  const changeTool = (tool) => {
    setCurrentTool(tool);
    console.log("Chnaged tool")
    if (fabricRef.current && tool === 'pencil') {
      fabricRef.current.freeDrawingBrush.color = currentColor;
    }
  };

  const changeColor = (color) => {
    if (fabricRef.current && currentTool === 'pencil') {
      fabricRef.current.freeDrawingBrush.color = color;
      setCurrentColor(color);
    }
  };

  const changeBrushSize = (size) => {
    setBrushSize(size);
    if (fabricRef.current) {
      fabricRef.current.freeDrawingBrush.width = size;
    }
  };

  useEffect(() => {
    if (fabricRef.current) {
      const canvas = fabricRef.current;

      // Enable drawing mode
      canvas.isDrawingMode = isEnabled && currentTool !== 'laser';
      const canvasEl = fabricRef.current.getElement();
      const parentDiv = canvasEl.parentElement;
      if (parentDiv) {
        parentDiv.style.pointerEvents = isEnabled ? 'auto' : 'none';
      }
      canvasEl.style.cursor = currentTool === 'laser' ? 'none' : 'crosshair';
      // Add event listener for path creation
      const handlePathCreated = (event) => {
        const path = event.path;
        console.log('Path Created:', path);
        logDrawingData(); // Log full drawing data
      };

      canvas.on('path:created', handlePathCreated);

      // Add event listener for object modification (optional)
      const handleObjectModified = (event) => {
        const obj = event.target; // Get the modified object
        console.log('Object Modified:', obj);
        const drawingData = fabricRef.current.toJSON();
        sendDrawing(room, drawingData)
        logDrawingData(); // Log full drawing data
      };

      canvas.on('object:modified', handleObjectModified);

      return () => {
        // Cleanup event listeners
        canvas.off('path:created', handlePathCreated);
        canvas.off('object:modified', handleObjectModified);
      };
    }
  }, [isEnabled, currentTool]);

  useEffect(() => {
    if (fabricRef.current && room && currentTool === "pencil") {
      const canvas = fabricRef.current;
      canvas.isDrawingMode = true;
      let isDrawing = false;
      let currentPath = [];

      const handleMouseDown = (event) => {
        isDrawing = true;
        currentPath = [];
        const pointer = canvas.getPointer(event.e);
        currentPath.push({ x: pointer.x, y: pointer.y });
      };

      const handleMouseMove = (event) => {
        if (!isDrawing) return;

        const brush = fabricRef.current.freeDrawingBrush;
        if (brush && brush._points) {
          const pointer = canvas.getPointer(event.e);
          currentPath.push({ x: pointer.x, y: pointer.y });

          // Send the complete path so far
          const pathData = {
            points: currentPath,
            strokeWidth: brush.width,
            stroke: brush.color,
            type: 'drawing',
            isComplete: false
          };

          throttledSendDrawing(room, pathData);
        }
      };

      const handleMouseUp = () => {
        if (!isDrawing) return;

        isDrawing = false;
        const brush = fabricRef.current.freeDrawingBrush;

        // Send final complete path
        const pathData = {
          points: currentPath,
          strokeWidth: brush.width,
          stroke: brush.color,
          type: 'drawing',
          isComplete: true
        };

        sendDrawing(room, pathData); // Send immediately without throttling
        currentPath = [];
      };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      };
    }
  }, [isEnabled, room, currentTool]);

  useEffect(() => {
    if (fabricRef.current && room) {
      const canvas = fabricRef.current;

      const throttledSendCursor = throttle((cursorData) => {
        sendCursor(room, cursorData);
      }, 50); // 50ms throttle time

      const handleMouseMove = (event) => {
        const pointer = canvas.getPointer(event.e); // Get cursor position
        const name = displayName
        const cursorData = {
          x: pointer.x,
          y: pointer.y,
          name: "Prasoon",
          color: "#FF0000",
        };
        throttledSendCursor(cursorData);
      };

      canvas.on('mouse:move', handleMouseMove);

      return () => {
        canvas.off('mouse:move', handleMouseMove);
        throttledSendCursor.cancel();
      };
    }
  }, [isEnabled, room]);

  useEffect(() => {
    onCursor((data) => {
      console.log("Received Cursor Data:", data);

      if (fabricRef.current && room) {
        const canvas = fabricRef.current;

        // Remove existing cursor for the user
        const existingCursor = canvas.getObjects().find(obj => obj.id === `cursor_${data.data.name}`);
        if (existingCursor) {
          canvas.remove(existingCursor);
        }

        // Create a new circle to represent the cursor
        const cursorCircle = new fabric.Circle({
          left: data.data.x,
          top: data.data.y,
          radius: 5,
          fill: data.data.color || 'blue',
          selectable: false,
          evented: false,
          id: `cursor_${data.data.name}`,
        });

        // Add text (user name) above the cursor
        const cursorText = new fabric.Text(data.data.name, {
          left: data.data.x,
          top: data.data.y - 20,
          fontSize: 14,
          fill: 'black',
          selectable: false,
          evented: false,
          id: `text_${data.data.name}`,
        });

        // Group the cursor and text together
        const cursorGroup = new fabric.Group([cursorCircle, cursorText], {
          selectable: false,
          evented: false,
          id: `cursor_${data.data.name}`, // Unique identifier for the group
        });

        // Add the cursor group to the canvas
        canvas.add(cursorGroup);
        canvas.renderAll();
      }
    });

    return () => {
      offCursor();
    };
  }, [room]);



  return (
    <>
      {showLaser && currentTool === 'laser' && (
        <div
          className="absolute w-2 h-2 rounded-full bg-red-500 pointer-events-none z-[200]"
          style={{
            left: `${laserPosition.x - 4}px`,
            top: `${laserPosition.y - 4}px`,
            boxShadow: '0 0 10px 2px rgba(255, 0, 0, 0.5)',
          }}
        />
      )}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-[150] w-[95%] md:w-auto">
        {isEnabled && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 bg-gray-800/90 backdrop-blur-sm p-1.5 sm:px-3 sm:py-2 rounded-lg shadow-lg border border-gray-700">
            {/* First Row for Mobile / Left Section for Desktop */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              {/* Tools Section */}
              <div className="flex gap-1 sm:gap-2 border-r border-gray-600 pr-2 sm:pr-3">
                <button
                  className={`transition-colors ${currentTool === 'pencil'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } rounded p-1 sm:p-1.5`}
                  onClick={() => changeTool('pencil')}
                  title="Draw"
                >
                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </button>
                <button
                  className={`transition-colors ${currentTool === 'laser'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } rounded p-1 sm:p-1.5`}
                  onClick={() => changeTool('laser')}
                  title="Laser Pointer"
                >
                  <LaserIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </button>
              </div>

              {/* Brush Size Section */}
              <div className="flex items-center gap-1 sm:gap-2 border-r border-gray-600 pr-2 sm:pr-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => changeBrushSize(Number(e.target.value))}
                  className="w-16 sm:w-20 lg:w-24 accent-white"
                  title="Brush Size"
                />
                <span className="text-white text-xs sm:text-sm min-w-[1.75rem] sm:min-w-[2rem]">
                  {brushSize}px
                </span>
              </div>
            </div>

            {/* Second Row for Mobile / Right Section for Desktop */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              {/* Colors Section */}
              <div className="flex gap-0.5 sm:gap-1">
                {colors.map(({ hex, name }) => (
                  <button
                    key={hex}
                    className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded transition-colors ${currentColor === hex
                      ? 'ring-1 sm:ring-2 ring-white ring-offset-1 ring-offset-gray-800'
                      : ''
                      }`}
                    style={{ backgroundColor: hex }}
                    onClick={() => changeColor(hex)}
                    title={name}
                  />
                ))}
              </div>

              {/* Clear Button */}
              <button
                className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500 text-white text-xs sm:text-sm
                       rounded hover:bg-red-600 transition-colors"
                onClick={clear}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </>


  );
};

export default DrawingLayer;