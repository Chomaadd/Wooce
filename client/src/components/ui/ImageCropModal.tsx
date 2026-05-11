import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

interface ImageCropModalProps {
  imageSrc: string;
  onCropDone: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropShape?: "round" | "rect";
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.92);
  });
}

export function ImageCropModal({ imageSrc, onCropDone, onCancel, aspectRatio = 1, cropShape = "round" }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropDone(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: 12,
          width: "min(520px, 96vw)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
          Crop Foto
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: -8 }}>
          Geser dan zoom foto untuk menyesuaikan area yang ingin ditampilkan.
        </p>

        {/* Crop area */}
        <div style={{ position: "relative", width: "100%", height: 320, borderRadius: 8, overflow: "hidden", background: "#000" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape={cropShape}
            showGrid={false}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, minWidth: 30 }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#D4A843" }}
            data-testid="slider-crop-zoom"
          />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, minWidth: 30 }}>{zoom.toFixed(1)}x</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={processing}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: 13,
            }}
            data-testid="button-crop-cancel"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            style={{
              padding: "8px 22px",
              borderRadius: 6,
              border: "none",
              background: "#D4A843",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
              opacity: processing ? 0.7 : 1,
            }}
            data-testid="button-crop-confirm"
          >
            {processing ? "Memproses..." : "Gunakan Foto Ini"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
