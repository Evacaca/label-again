import type Konva from "konva";
import React from "react";
import { Component } from "react";
import { Circle, Line } from "react-konva";
import { lighten, opacityColor } from "./utils";

interface Point {
  x: number;
  y: number;
}

interface FigureProps {
  figure: {
    id: string;
    points: Point[];
  };

  options: {
    newPoint?: Point;
    editing: boolean;
    finished: boolean;
    sketch: boolean;
    color: string;
    vertexColor?: string;
    interactive: boolean;
    onSelect: () => void;
    onChange: (type: string, payload: { point?: Point, pos?: number, figure?: FigureProps['figure'] }) => void;
  };

  skipNextClick: () => void;
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
    const { color } = this.props.options;

    return guides.map((points, i) => (
      <Line
        key={i}
        points={points.flatMap(point => [point.x, point.y])}
        stroke={color}
        opacity={0.7}
        dash={[5]}
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
      interactive
    } = options;
    console.log(`----- editing: ${editing} ------`)
    console.log(`----- sketch: ${sketch} ------`)
    const strokeWidth = editing && sketch ? 2 : 3;
    const strokeColor = editing && sketch ? color : vertexColor || color;
    const fillColor = editing && sketch ? 'rgba(0,0,0,0)' : opacityColor(color, 0.5)
    console.log(lighten(color, 500));
    const dashArray = editing ? [8] : [];

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
          onClick={() => {
            if (interactive) {
              options.onSelect();
              this.props.skipNextClick();
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
              radius={8}
              fill={strokeColor}
              onClick={() => this.onPointClick(i)}
              draggable={editing}
              onDragStart={() => {
                console.log('------ onDragStart ------')
                this.props.skipNextClick();
                this.setState({ dragging: true })
              }}
              onDragMove={
                (e: Konva.KonvaEventObject<DragEvent>) => {
                  console.log('------ onDragMove ------')
                  this.props.skipNextClick();
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
    const { figure, options, skipNextClick } = this.props;
    const { id, points } = figure;
    const { editing, finished, onChange } = options;
    const { dragging } = this.state;

    if (!finished || !editing || dragging) return [];

    const calcMidPoint = (p1: Point, p2: Point) => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    });

    const calcDistance = (p1: Point, p2: Point): number => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

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
              radius={4}
              fill="white"
              opacity={0.5}
              onMouseDown={
                () => {
                  onChange('add', { point: midPoint, pos: (i as number + 1), figure })
                  skipNextClick();
                }
              }
            />
          )
        })
  }

  protected onPointMoved(point: Point, i: number): void {
    const { figure, options, skipNextClick } = this.props;
    skipNextClick();
    options.onChange('move', { point, pos: i, figure })
  }

  protected onPointClick(i: number): void {
    const { figure, options, skipNextClick } = this.props;
    const { points } = figure;
    const { finished, editing, onChange } = options;
    if (!finished && i === 0) {
      console.log('------ 点击origin circle ------')
      if (points.length > 3) {
        onChange('end', {});
      }
      skipNextClick();
      return;
    }

    if (finished && editing) {
      console.log('-------- 点击circle -------')
      if (points.length > 3) {
        onChange('remove', { pos: i, figure })
      }
      skipNextClick();
      return;
    }
  }
}