import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { getCroppedImg } from '../utils/cropImage';
import './ImageCropModal.css';

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string;
    onComplete: (croppedImageUrl: string) => void;
    onCancel: () => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isOpen,
    imageSrc,
    onComplete,
    onCancel,
}) => {
    const [crop, setCrop] = useState<Crop | undefined>(undefined);
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined);
    const imgRef = useRef<HTMLImageElement>(null);

    if (!isOpen) return null;

    const handleApply = async () => {
        if (!completedCrop || !imgRef.current) return;

        try {
            // 画像が50%に縮小表示されているため、座標を2倍にスケーリング
            const scaledCrop = {
                x: completedCrop.x * 2,
                y: completedCrop.y * 2,
                width: completedCrop.width * 2,
                height: completedCrop.height * 2,
            };

            const croppedImageUrl = await getCroppedImg(imageSrc, scaledCrop);
            onComplete(croppedImageUrl);
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('画像のトリミングに失敗しました');
        }
    };

    return (
        <div className="image-crop-modal-overlay">
            <div className="image-crop-modal-content">
                <div className="image-crop-modal-header">
                    <h3>画像をトリミング</h3>
                </div>

                <div className="image-crop-modal-body">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop preview"
                        />
                    </ReactCrop>
                </div>

                <div className="image-crop-modal-footer">
                    <button className="image-crop-modal-btn cancel" onClick={onCancel}>
                        キャンセル
                    </button>
                    <button
                        className="image-crop-modal-btn apply"
                        onClick={handleApply}
                        disabled={!completedCrop}
                    >
                        適用
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
