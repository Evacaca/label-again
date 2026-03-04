/* eslint-disable @typescript-eslint/no-explicit-any */
// useOpenCV.js - 自定义 Hook 管理 OpenCV.js 加载
import { useState, useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}
export const useOpenCV = () => {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.8.0/opencv.js";
    script.async = true;

    script.onload = () => {
      if (window.cv && window.cv.Mat) {
        setCv(window.cv);
        setLoading(false);
      }
    };

    script.onerror = () => {
      setError("OpenCV.js 加载失败");
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return { cv, loading, error };
};
