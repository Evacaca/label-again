import { memo, useEffect, useMemo } from "react";
import { Layer, Shape } from "react-konva"

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface MatrixLayerProps {
  matrixData: number[][],
  matrixColor: string,
  scale: number,
  onBoundsChange: (bounds: Bounds) => void
}

const MatrixLayer = memo(({ matrixData, matrixColor, scale, onBoundsChange }: MatrixLayerProps) => {
  // 根据缩放比例计算点的半径
  const radius = useMemo(() => {
    const baseRadius = 8;
    return Math.max(4, Math.min(baseRadius / scale, 40));
  }, [scale]);

  useEffect(() => {
    const calculateContentBounds = () => {
      const bounds = matrixData.reduce((acc, [x, y]) => {
        if (isNaN(x) || isNaN(y)) return acc;
        acc.minX = Math.min(acc.minX, x);
        acc.minY = Math.min(acc.minY, y);
        acc.maxX = Math.max(acc.maxX, x);
        acc.maxY = Math.max(acc.maxY, y);
        return acc;
      }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

      return {
        ...bounds,
        width: bounds.maxX - bounds.minX || 500,
        height: bounds.maxY - bounds.minY || 500,
      };
    };
    const bounds = calculateContentBounds();
    onBoundsChange(bounds);
  }, [matrixData])

  return (
    <Layer>
      <Shape
        sceneFunc={(context) => {
          context.fillStyle = matrixColor;
          matrixData.forEach(([x, y]) => {
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.closePath();
            context.fill();
          });
        }}
      />
    </Layer>
  )
})

export default MatrixLayer;