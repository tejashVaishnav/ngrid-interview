"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Circle, Square, Triangle, Pen, Hand, Eraser, Minus, RotateCcw, RotateCw, Crosshair } from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'select' | 'pan';

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  thickness: number;
  fillColor?: string;
  startPoint?: Point;
  endPoint?: Point;
}

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [thickness, setThickness] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [useFill, setUseFill] = useState(false);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale
    };
  }, [offset, scale]);

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (element.tool === 'pen' || element.tool === 'eraser') {
      ctx.beginPath();
      element.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (element.tool === 'line' && element.startPoint && element.endPoint) {
      ctx.beginPath();
      ctx.moveTo(element.startPoint.x, element.startPoint.y);
      ctx.lineTo(element.endPoint.x, element.endPoint.y);
      ctx.stroke();
    } else if (element.tool === 'rectangle' && element.startPoint && element.endPoint) {
      const width = element.endPoint.x - element.startPoint.x;
      const height = element.endPoint.y - element.startPoint.y;
      
      if (element.fillColor && useFill) {
        ctx.fillStyle = element.fillColor;
        ctx.fillRect(element.startPoint.x, element.startPoint.y, width, height);
      }
      ctx.strokeRect(element.startPoint.x, element.startPoint.y, width, height);
    } else if (element.tool === 'circle' && element.startPoint && element.endPoint) {
      const radius = Math.sqrt(
        Math.pow(element.endPoint.x - element.startPoint.x, 2) +
        Math.pow(element.endPoint.y - element.startPoint.y, 2)
      );
      ctx.beginPath();
      ctx.arc(element.startPoint.x, element.startPoint.y, radius, 0, 2 * Math.PI);
      if (element.fillColor && useFill) {
        ctx.fillStyle = element.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    } else if (element.tool === 'triangle' && element.startPoint && element.endPoint) {
      const width = element.endPoint.x - element.startPoint.x;
      const height = element.endPoint.y - element.startPoint.y;
      ctx.beginPath();
      ctx.moveTo(element.startPoint.x + width / 2, element.startPoint.y);
      ctx.lineTo(element.startPoint.x, element.startPoint.y + height);
      ctx.lineTo(element.startPoint.x + width, element.startPoint.y + height);
      ctx.closePath();
      if (element.fillColor && useFill) {
        ctx.fillStyle = element.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    }
  }, [useFill]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSize = 20 * scale; // Size between grid points
    const dotSize = 1;
    const dotColor = '#e5e7eb'; // Light gray color for the dots
    
    // Calculate the visible area
    const visibleWidth = ctx.canvas.width / scale;
    const visibleHeight = ctx.canvas.height / scale;
    
    // Calculate the starting point (top-left of the visible area)
    const startX = Math.floor(-offset.x / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / gridSize) * gridSize;
    
    // Calculate the ending point (bottom-right of the visible area)
    const endX = startX + visibleWidth + gridSize * 2;
    const endY = startY + visibleHeight + gridSize * 2;
    
    // Draw the grid dots
    ctx.fillStyle = dotColor;
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [offset.x, offset.y, scale]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the current transformation matrix
    ctx.save();
    
    // Apply the current view transformation
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    // Draw the grid
    drawGrid(ctx);
    
    // Draw all elements
    elements.forEach(element => drawElement(ctx, element));
    if (currentElement) {
      drawElement(ctx, currentElement);
    }
    
    // Restore the transformation matrix
    ctx.restore();
  }, [elements, currentElement, offset, scale, drawElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }, [redraw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle mouse button (button 1) for panning
    if (e.button === 1 || tool === 'pan') {
      e.preventDefault(); // Prevent default behavior like scrolling
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (tool === 'select') {
      // Handle selection logic here
      return;
    }

    const mousePos = getMousePos(e);
    const newElement: DrawingElement = {
      id: Date.now().toString(),
      tool,
      points: [mousePos],
      color: tool === 'eraser' ? '#ffffff' : color,
      thickness: tool === 'eraser' ? 20 : thickness,
      fillColor: useFill ? fillColor : undefined,
      startPoint: mousePos,
      endPoint: mousePos
    };
    
    setCurrentElement(newElement);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && tool === 'pan') {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const point = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentElement(prev => prev ? {
        ...prev,
        points: [...prev.points, point]
      } : null);
    } else {
      setCurrentElement(prev => prev ? {
        ...prev,
        endPoint: point
      } : null);
    }
    redraw();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle left mouse button (button 0) for drawing
    if (e.button !== 1 && isPanning) {
      setIsPanning(false);
      return;
    } else if (e.button === 1) {
      // Middle mouse button up - stop panning
      setIsPanning(false);
      return;
    }

    if (currentElement) {
      updateElements([...elements, currentElement]);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const clearCanvas = () => {
    updateElements([]);
    setCurrentElement(null);
  };

  const centerCanvas = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  const updateElements = (newElements: DrawingElement[]) => {
    setElements(newElements);
    // Update history when elements change
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, [...newElements]]);
    setHistoryIndex(newHistory.length);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = () => {
    if (canUndo) {
      setElements(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (canRedo) {
      setElements(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Update elements when they change through drawing
  useEffect(() => {
    if (elements.length > 0 || history[historyIndex]?.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      if (JSON.stringify(elements) !== JSON.stringify(newHistory[newHistory.length - 1])) {
        setHistory([...newHistory, [...elements]]);
        setHistoryIndex(newHistory.length);
      }
    }
  }, [elements]);

  // Prevent default context menu on right click to allow for smooth panning
  useEffect(() => {
    const preventDefault = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
      }
    };
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', preventDefault);
      return () => {
        canvas.removeEventListener('mousedown', preventDefault);
      };
    }
  }, []);

  return (
    <div 
    className="relative h-screen w-full bg-white flex overflow-hidden"
    onContextMenu={(e) => e.preventDefault()}
    onMouseLeave={() => setIsPanning(false)}
  >
    {/* Left Sidebar */}
    <div className="absolute left-7 top-7  w-12 bg-white border border-gray-200 flex flex-col items-center py-4 gap-1 z-10">
      <button
        onClick={() => setTool('select')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'select' ? 'bg-gray-200' : ''}`}
        title="Select"
      >
        <Hand size={20} />
      </button>
      
      <button
        onClick={() => setTool('pan')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'pan' ? 'bg-gray-200' : ''}`}
        title="Pan"
      >
        <Hand size={20} />
      </button>

      <button
        onClick={() => setTool('rectangle')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'rectangle' ? 'bg-gray-200' : ''}`}
        title="Rectangle"
      >
        <Square size={20} />
      </button>

      <button
        onClick={() => setTool('circle')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'circle' ? 'bg-gray-200' : ''}`}
        title="Circle"
      >
        <Circle size={20} />
      </button>

      <button
        onClick={() => setTool('line')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'line' ? 'bg-gray-200' : ''}`}
        title="Line"
      >
        <Minus size={20} className="rotate-45" />
      </button>

      <button
        onClick={() => setTool('pen')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'pen' ? 'bg-gray-200' : ''}`}
        title="Pen"
      >
        <Pen size={20} />
      </button>

      <button
        onClick={() => setTool('eraser')}
        className={`w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'eraser' ? 'bg-gray-200' : ''}`}
        title="Eraser"
      >
        <Eraser size={20} />
      </button>

      <div className="h-px w-10 bg-gray-200 my-2"></div>

      <button
        onClick={centerCanvas}
        className="w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100"
        title="Center Canvas"
      >
        <Crosshair size={20} />
      </button>
    </div>

    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1 cursor-crosshair"
      style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair', marginLeft: '64px' }}
    />

    {/* Bottom Toolbar */}
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-2 flex items-center gap-1 z-10">
      {/* Color picker - always visible */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0"
          style={{ background: color }}
          title="Stroke Color"
        />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-gray-400">
          <path d="M2 4L5 7L8 4H2Z" />
        </svg>
      </div>

      {/* Tool-specific options */}
      {(tool === 'pen' || tool === 'eraser') && (
        <>
          <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-1">
            <Pen size={14} />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-gray-400">
              <path d="M2 4L5 7L8 4H2Z" />
            </svg>
          </button>
        </>
      )}

      {(tool === 'rectangle' || tool === 'circle' || tool === 'triangle') && (
        <>
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0"
              style={{ background: fillColor }}
              title="Fill Color"
            />
          </div>
        </>
      )}

      {/* Thickness slider */}
      {(tool === 'pen' || tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'triangle') && (
        <div className="flex items-center gap-2 px-2">
          <input
            type="range"
            min="1"
            max="20"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="w-20 h-1"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded hover:bg-gray-100 ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Undo"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded hover:bg-gray-100 ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Redo"
        >
          <RotateCw size={16} />
        </button>
        <button
          className="p-2 rounded hover:bg-gray-100"
          title="More Options"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
        <button
          onClick={clearCanvas}
          className="p-2 rounded hover:bg-gray-100"
          title="Clear Canvas"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="10" height="9" rx="1" />
            <path d="M2 5h12M6 3h4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  );
};

export default InfiniteCanvas;