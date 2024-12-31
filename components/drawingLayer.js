import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

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
    if (fabricRef.current) {
      fabricRef.current.isDrawingMode = isEnabled && currentTool !== 'laser';
      const canvasEl = fabricRef.current.getElement();
      const parentDiv = canvasEl.parentElement;
      if (parentDiv) {
        parentDiv.style.pointerEvents = isEnabled ? 'auto' : 'none';
      }
      canvasEl.style.cursor = currentTool === 'laser' ? 'none' : 'crosshair';
    }
  }, [isEnabled, currentTool]);

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
    }
  };

  const changeTool = (tool) => {
    setCurrentTool(tool);
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