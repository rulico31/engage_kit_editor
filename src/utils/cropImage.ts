/**
 * 画像を指定された領域で切り抜き、新しいBlob URLとして返す
 * @param imageSrc 元画像のURL
 * @param pixelCrop 切り抜く領域（ピクセル座標）
 * @returns 切り抜かれた画像のBlob URL
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous'; // CORS対応

        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas context could not be created'));
                return;
            }

            // キャンバスサイズを切り抜きサイズに設定
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            // 画像の自然なサイズ（実際のピクセルサイズ）を使用して切り抜き
            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            // CanvasをBlobに変換
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }

                // Blob URLを生成
                const croppedImageUrl = URL.createObjectURL(blob);
                resolve(croppedImageUrl);
            }, 'image/png');
        };

        image.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        image.src = imageSrc;
    });
}
