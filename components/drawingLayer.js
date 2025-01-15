import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useRoomContext } from '@/context/RoomContext';
import { connectSocket, offCursor, offDrawing, onCursor, onDrawing, sendCursor, sendDrawing } from '@/utils/socketCon';
import msgpack from 'msgpack-lite';
import { throttle } from 'lodash';

const convertToBinary = (data) => {
  if (!data) return null;
  try {
    return msgpack.encode(data);
  } catch (error) {
    console.error('Error encoding binary data:', error);
    return null;
  }
};

const convertFromBinary = (binaryData) => {
  if (!binaryData) return null;
  try {
    // Handle ArrayBuffer conversion
    if (binaryData instanceof ArrayBuffer) {
      binaryData = new Uint8Array(binaryData);
    }
    return msgpack.decode(Buffer.from(binaryData));
  } catch (error) {
    console.error('Error decoding binary data:', error);
    return null;
  }
};

// Compress path data before sending
const compressPathData = (points) => {
  // Remove redundant points and convert to efficient format
  const tolerance = 2;
  const compressedPoints = points.filter((point, index, array) => {
    if (index === 0) return true;
    const prevPoint = array[index - 1];
    const distance = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
    return distance >= tolerance;
  });

  // Convert to more efficient format: [x1,y1,x2,y2,...]
  return compressedPoints.reduce((acc, point) => {
    acc.push(Math.round(point.x * 100) / 100); // Keep 2 decimal places
    acc.push(Math.round(point.y * 100) / 100);
    return acc;
  }, []);
};

// Decompress received path data
const decompressPathData = (flatPoints) => {
  const points = [];
  for (let i = 0; i < flatPoints.length; i += 2) {
    points.push({
      x: flatPoints[i],
      y: flatPoints[i + 1]
    });
  }
  return points;
};

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
  const pathPointsRef = useRef([]);
  const lastSentPointsRef = useRef(null);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [currentTool, setCurrentTool] = useState('pencil');
  const [brushSize, setBrushSize] = useState(2);
  const [showLaser, setShowLaser] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState('');
  const { room } = useRoomContext();
  const cursorUpdateTimeoutRef = useRef(null);
  const batchTimeoutRef = useRef(null);
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

  // Throttled cursor update with binary data
  const sendThrottledCursor = throttle((cursorData) => {
    // const binaryCursorData = convertToBinary({
    //   t: 'c', // type: cursor
    //   x: Math.round(cursorData.x * 100) / 100,
    //   y: Math.round(cursorData.y * 100) / 100,
    //   n: cursorData.name,
    //   c: cursorData.color
    // });
    sendCursor(room, cursorData);
  });

  // Throttled drawing update with binary data
  const sendThrottledDrawing = throttle((room, drawingData) => {
    // const binaryDrawingData = convertToBinary({
    //   t: 'd', // type: drawing
    //   p: compressPathData(drawingData.points),
    //   s: drawingData.stroke,
    //   w: drawingData.strokeWidth
    // });
    sendDrawing(room, drawingData);
  }, 50);


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


  // Update the mouse event handlers in the drawing effect:
  useEffect(() => {
    if (fabricRef.current && room && currentTool === "pencil") {
      const canvas = fabricRef.current;
      let isDrawing = false;
      let currentPath = null;

      const handleMouseDown = (event) => {
        isDrawing = true;
        const pointer = canvas.getPointer(event.e);

        // Start a new path
        currentPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
          stroke: canvas.freeDrawingBrush.color,
          strokeWidth: canvas.freeDrawingBrush.width,
          fill: null,
          selectable: false,
          evented: false,
        });

        canvas.add(currentPath);
        pathPointsRef.current = [pointer];

        // Send initial point
        const drawingData = {
          t: 'd',
          p: [{ x: pointer.x, y: pointer.y }],
          s: canvas.freeDrawingBrush.color,
          w: canvas.freeDrawingBrush.width
        };

        sendThrottledDrawing(room, convertToBinary(drawingData));
      };

      const handleMouseMove = (event) => {
        if (!isDrawing || !currentPath) return;

        const pointer = canvas.getPointer(event.e);
        pathPointsRef.current.push(pointer);

        // Update the path
        currentPath.path.push(['L', pointer.x, pointer.y]);
        currentPath.setCoords();
        canvas.renderAll();

        // Send updated path data
        const drawingData = {
          t: 'd',
          p: [{ x: pointer.x, y: pointer.y }],
          s: canvas.freeDrawingBrush.color,
          w: canvas.freeDrawingBrush.width
        };

        sendThrottledDrawing(room, convertToBinary(drawingData));
      };

      const handleMouseUp = () => {
        isDrawing = false;
        currentPath = null;
        pathPointsRef.current = [];
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

  // Update the drawing event listener
  useEffect(() => {
    connectSocket();

    onDrawing((binaryData) => {
      let data = convertFromBinary(binaryData);
      console.log("Received Drawing Data:", data);
      
      if (fabricRef.current && data.p) {
        const canvas = fabricRef.current;

        const pathString = data.p
          .map(({ x, y }, index) => (index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
          .join(' ');

        const path = new fabric.Path(pathString, {
          stroke: data.s || 'black',
          strokeWidth: data.w || 1,
          fill: null,
          selectable: false,
          evented: false,
        });

        canvas.add(path);
        canvas.renderAll();
        console.log('Rendered Path:', path);
      } else if (fabricRef.current && data.data.objects) {
        fabricRef.current.loadFromJSON(data.data, () => {
          fabricRef.current.renderAll(); // Render the updated canvas
        });
      }
      else if (fabricRef.current && !data.data.objects && !data.data.points) {
        fabricRef.current.clear();
        console.log("Cleared drawing")
      }
      else {
        console.error("Invalid drawing data received:", data);
      }
    });

    return () => {
      offDrawing();
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

  // Update the clear function
  const clear = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      sendThrottledDrawing(room, convertToBinary({ t: 'clear' }));
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
        sendThrottledDrawing(room, convertToBinary(drawingData))
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

  // Handle drawing actions
  useEffect(() => {
    if (fabricRef.current && room && currentTool === "pencil") {
      const canvas = fabricRef.current;
      let isDrawing = false;

      const handleMouseDown = () => {
        isDrawing = true;
        pathPointsRef.current = [];
        lastSentPointsRef.current = null;
      };

      const handleMouseMove = (event) => {
        if (!isDrawing) return;

        const pointer = canvas.getPointer(event.e);
        pathPointsRef.current.push(pointer);

        // Send points immediately with each move
        const pathData = {
          t: 'd',
          points: pathPointsRef.current,
          stroke: canvas.freeDrawingBrush.color,
          strokeWidth: canvas.freeDrawingBrush.width
        };

        sendThrottledDrawing(room, convertToBinary(pathData));
      };

      const handleMouseUp = () => {
        if (!isDrawing) return;
        isDrawing = false;

        // Send final path data
        if (pathPointsRef.current.length > 0) {
          const pathData = {
            t: 'd',
            points: pathPointsRef.current,
            stroke: canvas.freeDrawingBrush.color,
            strokeWidth: canvas.freeDrawingBrush.width
          };

          sendThrottledDrawing(room, convertToBinary(pathData));
        }

        pathPointsRef.current = [];
      };


      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
      };
    }
  }, [isEnabled, room, currentTool]);

  // Handle cursor updates
  useEffect(() => {
    if (fabricRef.current && room) {
      const canvas = fabricRef.current;
      const cursors = new Map();

      const handleMouseMove = (event) => {
        if (cursorUpdateTimeoutRef.current) {
          clearTimeout(cursorUpdateTimeoutRef.current);
        }

        cursorUpdateTimeoutRef.current = setTimeout(() => {
          const pointer = canvas.getPointer(event.e);
          const cursorData = {
            t: 'c', // type: cursor
            x: Math.round(pointer.x * 100) / 100,
            y: Math.round(pointer.y * 100) / 100,
            n: "Prasoon",
            c: "#FF0000"
          };

          // Convert to binary before sending
          const binaryCursorData = convertToBinary(cursorData);
          if (binaryCursorData) {
            sendThrottledCursor(binaryCursorData);
          }
        });
      };

      canvas.on('mouse:move', handleMouseMove);

      // Handle incoming cursor updates
      onCursor((data) => {
        if (!fabricRef.current || !room || !data) return;

        requestAnimationFrame(() => {
          let decodedData;
          try {
            // Only decode if it's binary data
            if (data instanceof Uint8Array || data instanceof Buffer || data instanceof ArrayBuffer) {
              decodedData = convertFromBinary(data);
            } else {
              decodedData = data;
            }

            if (!decodedData || !decodedData.n) return;

            const userId = decodedData.n;

            // Remove existing cursor
            if (cursors.has(userId)) {
              canvas.remove(cursors.get(userId));
              cursors.delete(userId);
            }

            // Create cursor group
            const cursorGroup = new fabric.Group([
              new fabric.Circle({
                left: decodedData.x,
                top: decodedData.y,
                radius: 5,
                fill: decodedData.c || 'blue',
                selectable: false,
                evented: false,
              }),
              new fabric.Text(decodedData.n, {
                left: decodedData.x,
                top: decodedData.y - 20,
                fontSize: 14,
                fill: 'black',
                selectable: false,
                evented: false,
              })
            ], {
              selectable: false,
              evented: false,
            });

            // Store and add new cursor
            cursors.set(userId, cursorGroup);
            canvas.add(cursorGroup);
            canvas.renderAll();
          } catch (error) {
            console.error('Error processing cursor update:', error);
          }
        });
      });

      return () => {
        canvas.off('mouse:move', handleMouseMove);
        if (cursorUpdateTimeoutRef.current) {
          clearTimeout(cursorUpdateTimeoutRef.current);
        }
        offCursor();
        cursors.clear();
      };
    }
  }, [isEnabled, room]);



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
      <div className="absolute left-1/2 -translate-x-1/2 bottom-1 z-[150] max-w-full px-2">
        {isEnabled && (
          <div className="flex flex-wrap items-center justify-center gap-4 bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
            {/* Tools */}
            <div className="flex flex-wrap gap-2 border-r border-gray-600 pr-4">
              <button
                className={`p-2 rounded-lg transition-all ${currentTool === 'pencil'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } md:p-1 lg:p-1.5`}
                onClick={() => changeTool('pencil')}
                title="Draw"
              >
                <PencilIcon className="w-4 h-4 sm:w-3 sm:h-3 lg:w-5 lg:h-5" />
              </button>
              <button
                className={`p-2 rounded-lg transition-all ${currentTool === 'laser'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } md:p-1 lg:p-1.5`}
                onClick={() => changeTool('laser')}
                title="Laser Pointer"
              >
                <LaserIcon className="w-4 h-4 sm:w-3 sm:h-3 lg:w-5 lg:h-5" />
              </button>
            </div>

            {/* Brush Size */}
            <div className="flex flex-wrap items-center gap-2 border-r border-gray-600 pr-4">
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => changeBrushSize(Number(e.target.value))}
                className="w-24 accent-white sm:w-20 md:w-16 lg:w-24"
                title="Brush Size"
              />
              <span className="text-white text-sm md:text-xs lg:text-sm min-w-[2rem]">{brushSize}px</span>
            </div>

            {/* Colors */}
            <div className="flex flex-wrap gap-1">
              {colors.map(({ hex, name }) => (
                <button
                  key={hex}
                  className={`w-8 h-8 sm:w-6 sm:h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-lg transition-all hover:scale-110 ${currentColor === hex ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800' : ''
                    }`}
                  style={{ backgroundColor: hex }}
                  onClick={() => changeColor(hex)}
                  title={name}
                />
              ))}
            </div>

            {/* Clear Button */}
            <button
              className="ml-4 px-4 py-2 sm:px-3 sm:py-1 md:px-2 md:py-1 lg:px-3 lg:py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              onClick={clear}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </>


  );
};

export default DrawingLayer;