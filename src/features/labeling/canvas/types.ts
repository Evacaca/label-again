import type { Label, Polygon } from "@/components/layout/data/schema";
import type { Project } from "@/context/data/schema";
import type { CanvasStateRefValue } from "@/context/project-context";

export interface Point {
  x: number;
  y: number;
}

export interface CanvasState {
  scale: number;
  position: Point;
  isInitialized: boolean;
}

export interface PolygonState {
  polygons: Polygon[];
  tracePoint: Point | null;
  selectedFigureId: string | null;
}

// Canvas component props
export interface CanvasProps {
  project: Project;
  label: Label | null;
  figures: Polygon[];
  onChange: (updatedLabel: Label) => void;
  onSelectFigure: (figure: Polygon | null) => void;
  hiddenLabelIds?: Set<string>;
  canvasStateRef?: React.RefObject<CanvasStateRefValue | null>;
}
