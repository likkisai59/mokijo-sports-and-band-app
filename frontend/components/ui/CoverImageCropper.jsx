"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

/**
 * Load image from data URL / blob URL.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function createImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (err) => reject(err));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = src;
    });
}

/**
 * Crop the source image using pixel crop area from react-easy-crop.
 * @param {string} imageSrc
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop
 * @returns {Promise<string>} base64 JPEG data URL
 */
export async function getCroppedImage(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const outputWidth = Math.max(1, Math.round(pixelCrop.width));
    const outputHeight = Math.max(1, Math.round(pixelCrop.height));
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
    );

    return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Cover photo picker with drag-to-move + zoom crop (react-easy-crop).
 * Aspect matches venue/training cards (~16:10).
 */
export default function CoverImageCropper({
    value = null,
    onChange,
    aspect = 16 / 10,
    label = "Cover Photo (shown on training cards)",
    hint = "JPG, PNG — drag to reposition, zoom to crop",
}) {
    const [rawSrc, setRawSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [applying, setApplying] = useState(false);
    const [localError, setLocalError] = useState("");

    const onCropComplete = useCallback((_croppedArea, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setLocalError("Please upload an image file (JPG or PNG).");
            return;
        }
        try {
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            setRawSrc(dataUrl);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setLocalError("");
        } catch (err) {
            console.error(err);
            setLocalError("Could not read cover photo.");
        }
    };

    const applyCrop = async () => {
        if (!rawSrc || !croppedAreaPixels) return;
        setApplying(true);
        setLocalError("");
        try {
            const cropped = await getCroppedImage(rawSrc, croppedAreaPixels);
            onChange?.(cropped);
            setRawSrc(null);
        } catch (err) {
            console.error(err);
            setLocalError("Could not crop image. Try another photo.");
        } finally {
            setApplying(false);
        }
    };

    const cancelCrop = () => {
        setRawSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setLocalError("");
    };

    return (
        <div className="vd-field" style={{ marginBottom: 18 }}>
            <label className="vd-label">{label}</label>

            {localError && (
                <div style={{ color: "#f87171", marginBottom: 10, fontSize: 13 }}>{localError}</div>
            )}

            {rawSrc ? (
                <div
                    style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: 14,
                        background: "rgba(255,255,255,0.02)",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 280,
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "#0a0a12",
                        }}
                    >
                        <Cropper
                            image={rawSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            showGrid
                        />
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                fontSize: 13,
                                color: "rgba(226,232,240,0.85)",
                            }}
                        >
                            <span style={{ minWidth: 44 }}>Zoom</span>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                style={{ flex: 1 }}
                            />
                        </label>
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(148,163,184,0.6)" }}>
                            Drag the image to reposition. Use zoom to frame the cover.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button type="button" className="vd-btn-ghost" onClick={cancelCrop} disabled={applying}>
                            Cancel
                        </button>
                        <button type="button" className="vd-btn-primary" onClick={applyCrop} disabled={applying}>
                            {applying ? "Applying…" : "Apply crop"}
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        border: "1px dashed rgba(255,255,255,0.15)",
                        borderRadius: 12,
                        padding: 14,
                        background: "rgba(255,255,255,0.02)",
                    }}
                >
                    {value ? (
                        <div>
                            <img
                                src={value}
                                alt="Cover preview"
                                style={{
                                    width: "100%",
                                    height: 180,
                                    objectFit: "cover",
                                    borderRadius: 10,
                                    display: "block",
                                }}
                            />
                            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                                <label className="vd-btn-ghost" style={{ cursor: "pointer", margin: 0 }}>
                                    Change photo
                                    <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                                </label>
                                <button type="button" className="vd-btn-ghost" onClick={() => onChange?.(null)}>
                                    Remove photo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label
                            style={{
                                display: "block",
                                cursor: "pointer",
                                textAlign: "center",
                                padding: "28px 12px",
                            }}
                        >
                            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.45 }}>📷</div>
                            <div style={{ fontSize: 14, color: "rgba(226,232,240,0.85)", marginBottom: 4 }}>
                                Click to upload cover photo
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(148,163,184,0.55)" }}>{hint}</div>
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
