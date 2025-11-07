"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Circle, Square, Triangle, Pen, Hand, Eraser, Minus, RotateCcw, RotateCw, Crosshair, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
  userId?: string;
  timestamp?: number;
}

interface Cursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const ROOM_ID = 'canvas-room-1'; // You can make this dynamic

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
  
  // Collaboration state
  const [supabase, setSupabase] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeCursors, setActiveCursors] = useState<Map<string, Cursor>>(new Map());
  const [showSetup, setShowSetup] = useState(true);
  const channelRef = useRef<any>(null);
  const cursorThrottleRef = useRef<number>(0);

  // Initialize Supabase client
  const initializeSupabase = useCallback((url: string, key: string, name: string) => {
    try {
      const client = createClient(url, key);
      setSupabase(client);
      
      // Generate a unique user ID
      const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUserId(id);
      setUserName(name || `User ${id.slice(-4)}`);
      setShowSetup(false);
      
      return client;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      alert('Failed to connect to Supabase. Please check your credentials.');
      return null;
    }
  }, []);

  // Load initial canvas state
  const loadCanvasState = useCallback(async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('canvas_elements')
        .select('*')
        .eq('room_id', ROOM_ID)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const loadedElements = data.map((item: any) => ({
          id: item.element_id,
          tool: item.tool,
          points: item.points,
          color: item.color,
          thickness: item.thickness,
          fillColor: item.fill_color,
          startPoint: item.start_point,
          endPoint: item.end_point,
          userId: item.user_id,
          timestamp: item.timestamp
        }));
        setElements(loadedElements);
      }
    } catch (error) {
      console.error('Error loading canvas state:', error);
    }
  }, [supabase]);

  // Save element to Supabase
  const saveElementToSupabase = useCallback(async (element: DrawingElement) => {
    if (!supabase || !userId) return;
    
    try {
      const { error } = await supabase
        .from('canvas_elements')
        .insert({
          room_id: ROOM_ID,
          element_id: element.id,
          user_id: userId,
          tool: element.tool,
          points: element.points,
          color: element.color,
          thickness: element.thickness,
          fill_color: element.fillColor,
          start_point: element.startPoint,
          end_point: element.endPoint,
          timestamp: Date.now()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving element:', error);
    }
  }, [supabase, userId]);

  // Clear canvas in Supabase
  const clearCanvasInSupabase = useCallback(async () => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('canvas_elements')
        .delete()
        .eq('room_id', ROOM_ID);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  }, [supabase]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase.channel(`room:${ROOM_ID}`)
      .on('broadcast', { event: 'drawing' }, (payload: any) => {
        if (payload.payload.userId !== userId) {
          const element = payload.payload.element;
          setElements(prev => {
            const exists = prev.find(e => e.id === element.id);
            if (!exists) {
              return [...prev, element];
            }
            return prev.map(e => e.id === element.id ? element : e);
          });
        }
      })
      .on('broadcast', { event: 'cursor' }, (payload: any) => {
        if (payload.payload.userId !== userId) {
          setActiveCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.set(payload.payload.userId, {
              userId: payload.payload.userId,
              x: payload.payload.x,
              y: payload.payload.y,
              color: payload.payload.color,
              name: payload.payload.name
            });
            return newCursors;
          });
        }
      })
      .on('broadcast', { event: 'clear' }, (payload: any) => {
        if (payload.payload.userId !== userId) {
          setElements([]);
        }
      })
      //@ts-expect-error
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log("subscribed")
          loadCanvasState();
        }
      });

    channelRef.current = channel;

    // Cleanup cursors
    const cursorCleanup = setInterval(() => {
      setActiveCursors(prev => {
        const now = Date.now();
        const newCursors = new Map(prev);
        // Remove cursors not updated in last 3 seconds
        for (const [key, cursor] of newCursors) {
          if (now - (cursor as any).lastUpdate > 3000) {
            newCursors.delete(key);
          }
        }
        return newCursors;
      });
    }, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(cursorCleanup);
    };
  }, [supabase, userId, loadCanvasState]);

  // Broadcast cursor position
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !userId) return;
    
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return; // Throttle to 20 updates/sec
    cursorThrottleRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { userId, x, y, color, name: userName }
    });
  }, [userId, color, userName]);

  // Broadcast drawing element
  const broadcastElement = useCallback((element: DrawingElement) => {
    if (!channelRef.current || !userId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'drawing',
      payload: { userId, element }
    });
  }, [userId]);

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
      
      if (element.fillColor) {
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
      if (element.fillColor) {
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
      if (element.fillColor) {
        ctx.fillStyle = element.fillColor;
        ctx.fill();
      }
      ctx.stroke();
    }
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSize = 20 * scale;
    const dotSize = 1;
    const dotColor = '#e5e7eb';
    
    const visibleWidth = ctx.canvas.width / scale;
    const visibleHeight = ctx.canvas.height / scale;
    
    const startX = Math.floor(-offset.x / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / gridSize) * gridSize;
    
    const endX = startX + visibleWidth + gridSize * 2;
    const endY = startY + visibleHeight + gridSize * 2;
    
    ctx.fillStyle = dotColor;
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [offset.x, offset.y, scale]);

  const drawCursors = useCallback((ctx: CanvasRenderingContext2D) => {
    activeCursors.forEach((cursor) => {
      ctx.save();
      
      // Draw cursor pointer
      ctx.fillStyle = cursor.color;
      ctx.beginPath();
      ctx.moveTo(cursor.x, cursor.y);
      ctx.lineTo(cursor.x + 12, cursor.y + 12);
      ctx.lineTo(cursor.x + 8, cursor.y + 12);
      ctx.lineTo(cursor.x + 6, cursor.y + 18);
      ctx.closePath();
      ctx.fill();
      
      // Draw user name label
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillRect(cursor.x + 15, cursor.y + 5, ctx.measureText(cursor.name).width + 8, 18);
      ctx.fillStyle = cursor.color;
      ctx.fillText(cursor.name, cursor.x + 19, cursor.y + 17);
      
      ctx.restore();
    });
  }, [activeCursors]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    drawGrid(ctx);
    
    elements.forEach(element => drawElement(ctx, element));
    if (currentElement) {
      drawElement(ctx, currentElement);
    }
    
    drawCursors(ctx);
    
    ctx.restore();
  }, [elements, currentElement, offset, scale, drawElement, drawGrid, drawCursors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }, [redraw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || tool === 'pan') {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (tool === 'select') return;

    const mousePos = getMousePos(e);
    const newElement: DrawingElement = {
      id: `${userId}-${Date.now()}`,
      tool,
      points: [mousePos],
      color: tool === 'eraser' ? '#ffffff' : color,
      thickness: tool === 'eraser' ? 20 : thickness,
      fillColor: useFill ? fillColor : undefined,
      startPoint: mousePos,
      endPoint: mousePos,
      userId,
      timestamp: Date.now()
    };
    
    setCurrentElement(newElement);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(e);
    
    // Broadcast cursor position
    if (isConnected) {
      broadcastCursor(mousePos.x, mousePos.y);
    }

    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const point = mousePos;

    if (tool === 'pen' || tool === 'eraser') {
      const updatedElement = {
        ...currentElement,
        points: [...currentElement.points, point]
      };
      setCurrentElement(updatedElement);
      broadcastElement(updatedElement);
    } else {
      const updatedElement = {
        ...currentElement,
        endPoint: point
      };
      setCurrentElement(updatedElement);
      broadcastElement(updatedElement);
    }
    redraw();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (currentElement) {
      const finalElement = { ...currentElement };
      setElements(prev => [...prev, finalElement]);
      saveElementToSupabase(finalElement);
      broadcastElement(finalElement);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const clearCanvas = async () => {
    setElements([]);
    setCurrentElement(null);
    await clearCanvasInSupabase();
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'clear',
        payload: { userId }
      });
    }
  };

  const centerCanvas = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setElements(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setElements(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    const preventDefault = (e: MouseEvent) => {
      if (e.button === 1) {
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

  // Setup modal
  if (showSetup) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Setup Collaborative Canvas</h2>
          <p className="text-gray-600 mb-6">
            Enter your Supabase credentials to enable real-time collaboration.
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const url = formData.get('url') as string;
            const key = formData.get('key') as string;
            const name = formData.get('name') as string;
            initializeSupabase(url, key, name);
          }}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Supabase URL</label>
              <input
                type="text"
                name="url"
                placeholder="https://xxxxx.supabase.co"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Supabase Anon Key</label>
              <input
                type="text"
                name="key"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Connect
            </button>
          </form>
          <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
            <p className="font-medium mb-2">Database Setup Required:</p>
            <p className="text-gray-700 mb-2">Create a table in Supabase:</p>
            <pre className="bg-gray-800 text-white p-2 rounded text-xs overflow-x-auto">
{`CREATE TABLE canvas_elements (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  element_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  points JSONB,
  color TEXT,
  thickness INTEGER,
  fill_color TEXT,
  start_point JSONB,
  end_point JSONB,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-screen w-full bg-white flex overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
      onMouseLeave={() => setIsPanning(false)}
    >
      {/* Connection Status */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 z-10">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        <Users size={16} className="ml-2" />
        <span className="text-sm">{activeCursors.size + 1}</span>
      </div>

      {/* Left Sidebar */}
      <div className="absolute left-7 top-7 w-12 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-2 flex flex-col items-center gap-2.5 z-10">
        <button
          onClick={() => setTool('select')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'select' ? 'bg-gray-200' : ''}`}
          title="Select"
        >
          <Hand size={20} />
        </button>
        
        <button
          onClick={() => setTool('pan')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'pan' ? 'bg-gray-200' : ''}`}
          title="Pan"
        >
          <Hand size={20} />
        </button>

        <button
          onClick={() => setTool('rectangle')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'rectangle' ? 'bg-gray-200' : ''}`}
          title="Rectangle"
        >
          <Square size={20} />
        </button>

        <button
          onClick={() => setTool('circle')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'circle' ? 'bg-gray-200' : ''}`}
          title="Circle"
        >
          <Circle size={20} />
        </button>

        <button
          onClick={() => setTool('line')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'line' ? 'bg-gray-200' : ''}`}
          title="Line"
        >
          <Minus size={20} className="rotate-45" />
        </button>

        <button
          onClick={() => setTool('pen')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'pen' ? 'bg-gray-200' : ''}`}
          title="Pen"
        >
          <Pen size={20} />
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`size-8 flex items-center justify-center rounded hover:bg-gray-100 ${tool === 'eraser' ? 'bg-gray-200' : ''}`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>

        <div className="h-px w-10 bg-gray-200 my-2"></div>

        <button
          onClick={centerCanvas}
          className="size-8 flex items-center justify-center rounded hover:bg-gray-100"
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
          disabled={historyIndex <= 0}
          className={`p-2 rounded hover:bg-gray-100 ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Undo"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex <= 0}

          className={`p-2 rounded hover:bg-gray-100 ${historyIndex >= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
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