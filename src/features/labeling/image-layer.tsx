import type { ImageTransformState } from "@/context/data/schema";
import { useProjects } from "@/context/project-context";
import type Konva from "konva";
import React, { useCallback, useImperativeHandle } from "react";
import { useEffect, useState } from "react";
import { Image, Layer, Transformer } from "react-konva";

type ImageData = {
  imgObj: HTMLImageElement;
  width: number;
  height: number;
  scale: number;
};

interface ImageTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
  offsetX: number;
  offsetY: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const defaultTransform: ImageTransform = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  flipX: false,
  flipY: false,
  offsetX: 0,
  offsetY: 0,
};

const ImageLayer: React.FC<{
  imageFile: File;
  initialTransform?: ImageTransformState | null;
}> = ({ imageFile, initialTransform }) => {
  const [image, setImage] = useState<ImageData>();
  const [transform, setTransform] = useState<ImageTransform>(
    initialTransform ?? defaultTransform,
  );

  const { projectRef, isImageLocked } = useProjects();
  const imageRef = React.useRef<Konva.Image>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  const handleFlipX = useCallback(() => {
    if (!imageRef.current) return;
    const node = imageRef.current;
    // 计算新的 scaleX
    const newScaleX = -node.scaleX();

    // 更新状态
    setTransform((prev) => ({
      ...prev,
      scaleX: newScaleX,
      flipX: !prev.flipX,
    }));
  }, []);

  const handleFlipY = useCallback(() => {
    if (!imageRef.current) return;
    const node = imageRef.current;
    // 计算新的 scaleY
    const newScaleY = -node.scaleY();

    // 更新状态
    setTransform((prev) => ({
      ...prev,
      scaleY: newScaleY,
      flipY: !prev.flipY,
    }));
  }, []);

  useImperativeHandle(
    projectRef,
    () => ({
      handleExport: () => {
        if (!imageRef.current) return;

        const layer = imageRef.current.getLayer();
        if (!layer) return;

        const transformer = transformerRef.current;
        if (transformer) {
          transformer.hide();
        }

        const dataUrl = layer.toDataURL();

        if (transformer) {
          transformer.show();
        }

        // 创建下载链接
        const link = document.createElement("a");
        link.download = "LA-image.png";
        link.href = dataUrl;
        link.click();
      },
      handleFlipX,
      handleFlipY,
      getImageTransform: () => transform,
    }),
    [transform, handleFlipX, handleFlipY],
  );

  useEffect(() => {
    if (!imageFile) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // 设置图片对象并计算缩放比例
        setImage({
          imgObj: img,
          width: img.width,
          height: img.height,
          scale: 1,
        });
        setTransform((prev) => {
          const base = initialTransform ?? prev;
          const isDefaultPosition = base.x === 0 && base.y === 0;
          const next: ImageTransform = {
            ...base,
            // 始终以真实图片尺寸更新 width/height 与 offset
            width: img.width,
            height: img.height,
            offsetX: img.width / 2,
            offsetY: img.height / 2,
          };

          // 没有保存过 transform 时，将图片左上角对齐到 (0,0)
          if (!initialTransform && isDefaultPosition) {
            next.x = img.width / 2;
            next.y = img.height / 2;
          }

          return next;
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile, initialTransform]);

  useEffect(() => {
    if (imageRef.current && transformerRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [image]);

  const handleTransformEnd = () => {
    if (!imageRef.current) return;
    const node = imageRef.current;

    setTransform((prev) => {
      return {
        ...prev,
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        flipX: node.scaleX() < 0,
        flipY: node.scaleY() < 0,
      };
    });
  };

  if (!image) {
    return null;
  }

  return (
    <Layer>
      <Image
        ref={imageRef}
        image={image.imgObj}
        {...transform}
        draggable={!isImageLocked}
        onDragStart={(e) => {
          if (isImageLocked) return;
          e.evt.stopPropagation();
        }}
        onDragMove={(e) => {
          if (isImageLocked) return;
          e.evt.stopPropagation();
        }}
        onDragEnd={(e) => {
          if (isImageLocked) return;
          e.evt.stopPropagation();
          setTransform((prev) => ({
            ...prev,
            x: e.target.x(),
            y: e.target.y(),
          }));
        }}
        onTransformStart={(e) => {
          if (isImageLocked) return;
          e.evt.stopPropagation();
        }}
        onTransform={(e) => {
          if (isImageLocked) return;
          e.evt.stopPropagation();
        }}
        onTransformEnd={(e) => {
          if (isImageLocked) return;
          e.evt.stopPropagation();
          handleTransformEnd();
        }}
      />
      <Transformer
        ref={transformerRef}
        visible={!isImageLocked}
        listening={!isImageLocked}
        boundBoxFunc={(oldBox, newBox) => {
          // 限制最小尺寸
          const minWidth = 20;
          const minHeight = 20;
          if (newBox.width < minWidth || newBox.height < minHeight) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </Layer>
  );
};

export default ImageLayer;
