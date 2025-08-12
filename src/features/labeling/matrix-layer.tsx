import { memo, useMemo } from "react";
import { Layer, Shape, } from "react-konva"

const MatrixLayer = memo(({ matrixData, matrixColor, scale }: { matrixData: number[][], matrixColor: string, scale: number }) => {
  // 根据缩放比例计算点的半径
  const radius = useMemo(() => {
    const baseRadius = 8;
    return Math.max(4, Math.min(baseRadius / scale, 40));
  }, [scale]);

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