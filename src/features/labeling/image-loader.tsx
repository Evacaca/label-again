import { useProjects } from "@/context/project-context";
import type Konva from "konva";
import React, { useImperativeHandle } from "react";
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
}

const ImageLayer: React.FC<
  {
    imageFile: File,
  }> = ({ imageFile }) => {
    const [image, setImage] = useState<ImageData>();
    const [transform, setTransform] = useState<ImageTransform>({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    });

    const { projectRef } = useProjects();
    const imageRef = React.useRef<Konva.Image>(null);
    const transformerRef = React.useRef<Konva.Transformer>(null);

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
        link.download = 'transformed-image.png';
        link.href = dataUrl;
        link.click();
      }
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
          const scale = Math.min(500 / img.width, 500 / img.height);
          setImage({
            imgObj: img,
            width: img.width,
            height: img.height,
            scale,
          });
          setTransform(prev => ({
            ...prev,
            width: img.width * scale,
            height: img.height * scale
          }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }, [imageFile]);

    useEffect(() => {
      if (imageRef.current && transformerRef.current) {
        transformerRef.current.nodes([imageRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, [image]);

    const handleTransformEnd = () => {
      if (!imageRef.current) return;

      const node = imageRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      setTransform({
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
        rotation: node.rotation(),
        scaleX,
        scaleY
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