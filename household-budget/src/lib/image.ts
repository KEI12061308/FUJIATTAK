/**
 * アップロード画像を API に送る前に縮小・JPEG 化する。
 * スマホ写真（数MB〜十数MB）をそのまま送るとリクエスト上限や料金に響くため、
 * 長辺を MAX_EDGE 以下に抑える。レシートの小さな文字が潰れない程度の解像度は残す。
 */
const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

export interface PreparedImage {
  base64: string;
  mediaType: "image/jpeg";
  previewUrl: string;
}

export async function prepareReceiptImage(file: File): Promise<PreparedImage> {
  // createImageBitmap は EXIF の向きを反映する（imageOrientation: "from-image" が既定）
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の処理に失敗しました");
  ctx.fillStyle = "#ffffff"; // 透過 PNG の背景を白に
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return {
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    mediaType: "image/jpeg",
    previewUrl: dataUrl,
  };
}
