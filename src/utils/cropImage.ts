// src/utils/cropImage.ts

/**
 * 画像を指定された領域で切り抜き、Data URI (Base64)として返す
 * @param imageSrc 元画像のURL
 * @param pixelCrop 切り抜く領域（ピクセル座標）
 * ※重要: この座標は元画像の自然サイズ（naturalWidth/naturalHeight）に対する座標である必要があります。
 * 表示サイズではなく、実際の画像サイズに対する座標を渡してください。
 * @returns 切り抜かれた画像のData URI (data:image/png;base64,...)
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
    return new Promise((resolve, reject) => {
        // 入力値のバリデーション
        if (!imageSrc) {
            reject(new Error('Image source is required'));
            return;
        }

        if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
            reject(new Error('Invalid crop dimensions: width and height must be positive'));
            return;
        }

        const image = new Image();
        image.crossOrigin = 'anonymous'; // CORS対応

        image.onload = () => {
            // クロップ領域が画像の範囲内にあるかチェック
            if (
                pixelCrop.x < 0 ||
                pixelCrop.y < 0 ||
                pixelCrop.x + pixelCrop.width > image.naturalWidth ||
                pixelCrop.y + pixelCrop.height > image.naturalHeight
            ) {
                console.warn('Crop region exceeds image bounds, adjusting...');
                // 範囲を画像内に収める
                pixelCrop.x = Math.max(0, Math.min(pixelCrop.x, image.naturalWidth));
                pixelCrop.y = Math.max(0, Math.min(pixelCrop.y, image.naturalHeight));
                pixelCrop.width = Math.min(pixelCrop.width, image.naturalWidth - pixelCrop.x);
                pixelCrop.height = Math.min(pixelCrop.height, image.naturalHeight - pixelCrop.y);
            }

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

            // CanvasをData URI (Base64)に変換
            // ★ 修正: Blob URLではなくData URIを使用（公開時にBlobが失われる問題を回避）
            const croppedImageUrl = canvas.toDataURL('image/png');
            resolve(croppedImageUrl);
        };

        image.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        image.src = imageSrc;
    });
}