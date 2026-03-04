import type Konva from "konva";
import React from "react";
import { Component } from "react";
import { Circle, Line } from "react-konva";
import { opacityColor } from "./utils";
import type { Polygon } from "@/components/layout/data/schema";

interface Point {
  x: number;
  y: number;
}

interface FigureProps {
  figure: Polygon;

  options: {
    newPoint?: Point;
    editing: boolean;
    finished: boolean;
    sketch: boolean;
    color: string;
    radius?: number;
    vertexColor?: string;
    interactive: boolean;
    scale: number;
    onSelect: () => void;
    onChange: (type: string, payload: { point?: Point, pos?: number, figure: FigureProps['figure'] }) => void;
  };
}

interface FigureState {
  dragging: boolean;
  draggedPoint: {
    point: Point;
    index: number;
  } | null;
}

abstract class Figure extends Component<FigureProps, FigureState> {
  constructor(props: FigureProps) {
    super(props);
    this.state = {
      dragging: false,
      draggedPoint: null,
    }
  }

  // 辅助线
  protected abstract calcGuides(): Point[][];

  protected abstract onPointClick(i: number): void;

  protected abstract onPointMoved(point: Point, i: number): void;

  protected abstract makeExtraElements(): React.ReactNode;

  protected makeGuides() {
    const guides = this.calcGuides();
    const { color, scale } = this.props.options;
    const baseStrokeWidth = 2;
    const strokeWidth = baseStrokeWidth / scale;
    const baseDashArray = [5];
    const dashArray = baseDashArray.map(d => d / scale);
    return guides.map((points, i) => (
      <Line
        key={i}
        points={points.flatMap(point => [point.x, point.y])}
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.7}
        dash={dashArray}
      />
    ));
  }

  render() {
    const { figure, options } = this.props;
    const { id, points } = figure;
    const {
      editing,
      finished,
      sketch,
      color,
      vertexColor,
      interactive,
      scale,
    } = options;

    // 根据缩放比例计算线条宽度
    const baseStrokeWidth = editing && sketch ? 2 : 3;
    const strokeWidth = baseStrokeWidth / scale;

    // 根据缩放比例计算顶点半径
    const baseVertexRadius = figure.radius || 6;
    const vertexRadius = baseVertexRadius / scale;
    const strokeColor = editing && sketch ? color : vertexColor || color;
    const fillColor = editing && sketch && !finished ? 'rgba(0,0,0,0)' : opacityColor(color, 0.2)
    const baseDashArray = editing ? [6] : [];
    const dashArray = baseDashArray.map(d => d / scale);
    return (
      <>
        <Line
          points={points.flatMap(point => [point.x, point.y])}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          closed={finished}
          fill={fillColor}
          dash={dashArray}
          fillRule="evenodd"
          onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            if (interactive) {
              options.onSelect();
            }
          }}
        />
        {this.makeGuides()}
        {this.makeExtraElements()}
        {
          (!finished || editing) && points.map((point, i) => (

            <Circle
              key={`${id}-${i}`}
              x={point.x}
              y={point.y}
              radius={vertexRadius}
              fill={strokeColor}
              onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (i == 0) {
                  e.target.getStage()!.container().style.cursor = 'inherit';
                }
                this.onPointClick(i)
              }}
              draggable={editing}
              onMouseEnter={(e) => {
                if (finished) {
                  if (editing) {
                    e.target.getStage()!.container().style.cursor = 'move';
                  } else {
                    e.target.getStage()!.container().style.cursor = 'grab';
                  }
                } else {
                  if (i == 0) {
                    e.target.getStage()!.container().style.cursor = 'cell';
                  } else {
                    e.target.getStage()!.container().style.cursor = 'crosshair';
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (editing) {
                  e.target.getStage()!.container().style.cursor = 'crosshair';
                }
              }}
              onDragStart={(e: Konva.KonvaEventObject<DragEvent>) => {
                console.log('------ onDragStart ------')
                e.cancelBubble = true;
                this.setState({ dragging: true })
              }}
              onDragMove={
                (e: Konva.KonvaEventObject<DragEvent>) => {
                  console.log('------ onDragMove ------')
                  e.cancelBubble = true;
                  const pos = e.target.position();
                  this.setState({
                    draggedPoint: { point: pos, index: i }
                  })
                }
              }
              onDragEnd={
                (e: Konva.KonvaEventObject<DragEvent>) => {
                  console.log('------ onDragEnd ------')
                  const pos = e.target.position();
                  e.cancelBubble = true;
                  this.onPointMoved(pos, i);
                  this.setState({
                    dragging: false,
                    draggedPoint: null,
                  })
                }
              }
            />
          ))
        }
      </>
    )
  }
}

export class PolygonFigure extends Figure {
  /**
   * 计算多边形绘制过程需要显示的辅助线
   * @returns [[start.x, start.y], [end.x, end.y]]
   */
  protected calcGuides(): Point[][] {
    const { figure, options } = this.props
    const { points } = figure;
    const { newPoint, finished } = options;
    const { draggedPoint } = this.state;
    const guides: Point[][] = [];

    if (draggedPoint) {
      const { point, index } = draggedPoint;
      const length = points.length;
      guides.push(
        // 连接当前拖拽点和下一个点
        [point, points[(index + 1) % length]],
        // 连接当前拖拽点和上一个点
        [point, points[(index - 1 + length) % length]]
      )
    }

    if (!finished && points.length > 0 && newPoint) {
      guides.push([points[points.length - 1], newPoint])
    }
    return guides;
  }

  protected makeExtraElements(): React.ReactNode {
    const { figure, options } = this.props;
    const { id, points } = figure;
    const { editing, finished, scale, onChange } = options;
    const { dragging } = this.state;

    if (!finished || !editing || dragging) return [];

    const calcMidPoint = (p1: Point, p2: Point) => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    });

    const calcDistance = (p1: Point, p2: Point): number => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
    // 根据缩放比例计算中点半径
    const baseMidPointRadius = 4;
    const midPointRadius = baseMidPointRadius / scale;
    return points.map(
      (pos, i) => [pos, points[(i + 1) % points.length], i])
      .filter(([p1, p2]) => calcDistance(p1 as Point, p2 as Point) > 10)
      .map(
        ([p1, p2, i]) => {
          const midPoint = calcMidPoint(p1 as Point, p2 as Point);
          return (
            <Circle
              key={`${id}-${i}-mid`}
              x={midPoint.x}
              y={midPoint.y}
              radius={midPointRadius}
              fill="white"
              opacity={0.5}
              onMouseEnter={(e) => {
                e.target.getStage()!.container().style.cursor = 'copy';
              }}
              onMouseLeave={(e) => {
                e.target.getStage()!.container().style.cursor = 'inherit';
              }}
              onMouseDown={
                (e: Konva.KonvaEventObject<MouseEvent>) => {
                  e.cancelBubble = true;
                  onChange('add', { point: midPoint, pos: (i as number + 1), figure })
                }
              }
            />
          )
        })
  }

  protected onPointMoved(point: Point, i: number): void {
    const { figure, options } = this.props;

    options.onChange('move', { point, pos: i, figure })
  }

  protected onPointClick(i: number): void {
    const { figure, options } = this.props;
    const { points } = figure;
    const { finished, editing, onChange } = options;
    if (!finished && i === 0) {
      console.log('------ 点击origin circle ------')
      if (points.length >= 3) {
        onChange('end', { figure });
      }
      return;
    }

    if (finished && editing) {
      console.log('-------- 点击circle -------')
      if (points.length > 3) {
        onChange('remove', { pos: i, figure })
      }
      return;
    }
  }
}