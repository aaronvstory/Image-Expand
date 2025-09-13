
export function createExpandedCanvas(
  originalImageSrc: string,
  targetWidth: number,
  targetHeight: number,
  originalWidth: number,
  originalHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('Could not get canvas context'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; 
    img.onload = () => {
      // Clear canvas (it's transparent by default)
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Calculate position to center the image
      const x = (targetWidth - originalWidth) / 2;
      const y = (targetHeight - originalHeight) / 2;

      // Draw the original image in the center
      ctx.drawImage(img, x, y, originalWidth, originalHeight);

      // Resolve with the base64 data URL
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => {
      reject(new Error('Failed to load image for canvas manipulation.'));
      console.error(err);
    };

    img.src = originalImageSrc;
  });
}
