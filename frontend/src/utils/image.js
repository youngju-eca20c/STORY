const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) {
    return { ok: false, message: "이미지를 선택해 주세요." };
  }

  if (!file.type?.startsWith("image/")) {
    return { ok: false, message: "이미지 파일만 업로드할 수 있습니다." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "이미지가 너무 큽니다. 12MB 이하 파일을 선택해 주세요." };
  }

  return { ok: true, message: "" };
}

export function resizeImageToDataUrl(file, maxSize = 512, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);

      let dataUrl = canvas.toDataURL("image/webp", quality);
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      URL.revokeObjectURL(objectUrl);
      resolve({
        dataUrl,
        width,
        height,
        originalBytes: file.size,
        storedBytes: Math.round((dataUrl.length * 3) / 4)
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };

    image.src = objectUrl;
  });
}

export function removeCharacterAvatar(characterId) {
  void characterId;
  return { avatarDataUrl: "" };
}
