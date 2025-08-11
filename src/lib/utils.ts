import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseFile2Matrix = (file: File) => {
  // 解析excel、txt、csv文件
  if (
    file.type === "text/csv" ||
    file.type === "text/tsv" ||
    file.type === "text/plain"
  ) {
    return new Promise<number[][]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n");
          let symbol = ",";
          if (lines[0].includes("\t")) {
            symbol = "\t";
          }
          // 解析 CSV 内容
          // 默认第一行为表头
          const matrixData = lines.slice(1).map((line) =>
            line
              .split(symbol)
              .slice(1)
              .map((v) => Number(v))
          );
          resolve(matrixData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  // 解析excel文件
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return new Promise<number[][]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          });
          const matrixData = jsonData
            .slice(1)
            .map((row) => row.slice(1).map((v) => Number(v)));
          resolve(matrixData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  return [];
};

export const rgbaToHex = (rgba: number[]) => {
  // 提取 RGBA 值
  const [r, g, b, a] = rgba;

  // 将 RGB 转换为 6 位 HEX
  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      [r, g, b]
        .map((c) => {
          const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  // 将透明度转换为 2 位 HEX (0-255)
  const alphaToHex = (alpha: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return rgbToHex(r, g, b) + alphaToHex(a);
};
