import React, { useEffect } from "react";
import Konva from "konva";
import type { CanvasProps } from "./types";
import { useCanvasState } from "./hooks/useCanvasState";
import { usePolygonState } from "./hooks/usePolygonState";
import { useCanvasHistory } from "./hooks/useCanvasHistory";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { useLabelSync } from "./hooks/useLabelSync";
import { CanvasStage } from "./components/CanvasStage";

const Canvas: React.FC<CanvasProps> = ({
  project,
  label,
  figures,
  onChange,
  onSelectFigure,
  hiddenLabelIds,
  canvasStateRef,
}) => {
  // Canvas state (zoom, position, initialization)
  const canvasState = useCanvasState({
    project,
    canvasStateRef,
    onBoundsChange: () => {
      // Bounds are managed internally by useCanvasState
    },
  });

  // Polygon state management
  const polygonState = usePolygonState({
    figures,
    label,
  });

  // History (undo/redo)
  const canvasHistory = useCanvasHistory({
    label,
    polygons: polygonState.polygons,
    onPolygonsChange: polygonState.setPolygons,
    onSelectedFigureIdChange: polygonState.setSelectedFigureId,
    onTracePointChange: polygonState.setTracePoint,
  });

  // Event handlers (mouse, keyboard)
  const canvasEvents = useCanvasEvents({
    stageRef: canvasState.stageRef as React.RefObject<Konva.Stage>,
    label,
    scale: canvasState.scale,
    position: canvasState.position,
    polygons: polygonState.polygons,
    selectedFigureId: polygonState.selectedFigureId,
    tracePoint: polygonState.tracePoint,
    isDrawing: polygonState.isDrawing,
    onPolygonsChange: polygonState.setPolygons,
    onTracePointChange: polygonState.setTracePoint,
    onSelectedFigureIdChange: polygonState.setSelectedFigureId,
    pushToHistory: canvasHistory.pushToHistory,
    getSelectedFigure: polygonState.getSelectedFigure,
    handleZoom: canvasState.handleZoom,
  });

  // Label data synchronization
  useLabelSync({
    figures,
    label,
    hiddenLabelIds,
    polygons: polygonState.polygons,
    selectedFigureId: polygonState.selectedFigureId,
    onChange,
    onSelectFigure,
    onPolygonsChange: polygonState.setPolygons,
    onSelectedFigureIdChange: polygonState.setSelectedFigureId,
  });

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleUndoRedo = (e: CustomEvent) => {
      if (e.type === 'canvas-undo') {
        if (e.detail.shiftKey) {
          canvasHistory.redo();
        } else {
          canvasHistory.undo();
        }
      } else if (e.type === 'canvas-redo') {
        canvasHistory.redo();
      }
    };

    window.addEventListener('canvas-undo', handleUndoRedo as EventListener);
    window.addEventListener('canvas-redo', handleUndoRedo as EventListener);

    return () => {
      window.removeEventListener('canvas-undo', handleUndoRedo as EventListener);
      window.removeEventListener('canvas-redo', handleUndoRedo as EventListener);
    };
  }, [canvasHistory]);

  return (
    <div
      ref={canvasState.containerRef}
      style={{
        cursor: polygonState.selectedFigureId ? "crosshair" : "grab",
        width: "100%",
        height: "100%",
      }}
    >
      <CanvasStage
        project={project}
        size={canvasState.size}
        scale={canvasState.scale}
        position={canvasState.position}
        polygons={polygonState.polygons}
        hiddenLabelIds={hiddenLabelIds}
        selectedFigureId={polygonState.selectedFigureId}
        tracePoint={polygonState.tracePoint}
        isDrawing={polygonState.isDrawing}
        onStageRef={canvasState.setStageRef}
        onDragMove={canvasState.handleDragMove}
        onWheel={canvasState.handleWheel}
        onMouseMove={canvasEvents.handleMouseMove}
        onClick={canvasEvents.handleClick}
        onFigureChange={canvasEvents.handleFigureChange}
        onBoundsChange={canvasState.setBounds}
        onSelectedFigureIdChange={polygonState.setSelectedFigureId}
      />
    </div>
  );
};

export default Canvas;
