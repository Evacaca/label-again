import { useCallback} from "react";
import { Layer, Circle, } from "react-konva"

const MatrixLayer: React.FC<{ matrixData: number[][], matrixColor: string, scale: number }> = ({ matrixData, matrixColor, scale }) => {
  // 根据缩放比例计算点的半径
  const getPointRadius = useCallback(() => {
    const baseRadius = 8;
    return Math.max(4, Math.min(baseRadius / scale, 20));
  }, [scale]);
  // 批量渲染点
  const renderPoints = useCallback(() => {
    const radius = getPointRadius();
    const BATCH_SIZE = 500; // 每批渲染的点数
    const batches = [];
    console.log(radius)
    for (let i = 0; i < matrixData.length; i += BATCH_SIZE) {
      const batch = matrixData.slice(i, i + BATCH_SIZE).map(([x, y], index) => (
        <Circle
          key={`matrix-${i + index}`}
          x={x}
          y={y}
          radius={radius}
          fill={matrixColor}
          listening={false}
        />
      ));
      batches.push(batch);
    }

    return batches;
  }, [matrixData, matrixColor, getPointRadius]);
  return (
    <Layer
      listening={false}>
      {renderPoints()}
    </Layer>
  )
}

export default MatrixLayer;