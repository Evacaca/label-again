import { useProjects } from "@/context/project-context";
import type Konva from "konva";
import React, { useCallback, useImperativeHandle } from "react";
import { useEffect, useState } from "react"
import { Image, Layer, Transformer } from "react-konva";

type ImageData = {
  imgObj: HTMLImageElement;
  width: number;
  height: number;
  scale: number;
}

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
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageLayer: React.FC<
  {
    imageFile: File,
    onBoundsChange: (bounds: Bounds) => void
  }> = ({ imageFile, onBoundsChange }) => {
    const [image, setImage] = useState<ImageData>();
    const [transform, setTransform] = useState<ImageTransform>({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      flipX: false,
      flipY: false,
    });

    const { projectRef } = useProjects();
    const imageRef = React.useRef<Konva.Image>(null);
    const transformerRef = React.useRef<Konva.Transformer>(null);

    const handleBoundsChange = useCallback(() => {
      if (imageRef.current && onBoundsChange) {
        const rect = imageRef.current.getClientRect();
        onBoundsChange({
          x: 0,
          y: 0,
          width: rect.width,
          height: rect.height
        });
      }
    }, [onBoundsChange]);

    const handleFlipX = useCallback(() => {
      if (!imageRef.current) return;
      const newFlipX = !transform.flipX;
      const newScaleX = transform.scaleX * (newFlipX ? -1 : 1);
      // 沿中轴线翻转：调整 x 坐标
      const offsetX = imageRef.current.width() * transform.scaleX;
      imageRef.current.x(imageRef.current.x() + offsetX * (-newScaleX));
      setTransform(prev => ({
        ...prev,
        flipX: newFlipX,
        scaleX: Math.abs(newScaleX),
      }));

      imageRef.current.scaleX(newScaleX);
      imageRef.current.getLayer()?.batchDraw();
    }, [transform]);

    const handleFlipY = useCallback(() => {
      if (!imageRef.current) return;
      const newFlipY = !transform.flipY;
      const newScaleY = transform.scaleY * (newFlipY ? -1 : 1);
      // 沿中轴线翻转：调整 y 坐标
      const offsetY = imageRef.current.height() * transform.scaleY;
      imageRef.current.y(imageRef.current.y() + offsetY * (-newScaleY));
      setTransform(prev => ({
        ...prev,
        flipY: newFlipY,
        scaleY: Math.abs(newScaleY),
      }));

      imageRef.current.scaleY(newScaleY);
      imageRef.current.getLayer()?.batchDraw();
    }, [transform]);

    useImperativeHandle(projectRef, () => ({
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
        const link = document.createElement('a');
        link.download = 'LA-image.png';
        link.href = dataUrl;
        link.click();
      },
      handleFlipX,
      handleFlipY,
    }));

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
            scale: 1
          });
          setTransform(prev => ({
            ...prev,
            width: img.width,
            height: img.height,
          }));
          handleBoundsChange();
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }, [imageFile, handleBoundsChange]);

    useEffect(() => {
      if (imageRef.current && transformerRef.current) {
        transformerRef.current.nodes([imageRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, [image]);

    const handleTransformEnd = () => {
      if (!imageRef.current) return;

      const node = imageRef.current;

      setTransform((prev) => ({
        ...prev,
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
        rotation: node.rotation(),
      }));
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
          draggable
          onDragStart={(e) => {
            e.evt.stopPropagation();
          }}
          onDragMove={(e) => {
            e.evt.stopPropagation();
          }}
          onDragEnd={(e) => {
            e.evt.stopPropagation();
            setTransform(prev => ({
              ...prev,
              x: e.target.x(),
              y: e.target.y()
            }));
          }}
          onTransformStart={(e) => {
            e.evt.stopPropagation();
          }}
          onTransform={(e) => {
            e.evt.stopPropagation();
          }}
          onTransformEnd={(e) => {
            e.evt.stopPropagation();
            handleTransformEnd();
          }}
        />
        <Transformer
          ref={transformerRef}
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
    )
  }

export default ImageLayer;