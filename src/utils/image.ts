// Kompres gambar upload ke JPEG ≤ 89KB langsung di browser (Canvas API).
// Target: hasil akhir maksimal ~89KB (rentang aman 6–89KB).

export interface CompressedImage {
  dataUrl: string;
  sizeKB: number;
  name: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('File bukan gambar yang valid'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function compressImage(file: File, maxKB = 89): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Gambar maksimal 15MB');
  }
  const img = await loadImage(file);

  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  // batasi dimensi awal agar tidak meledak di memori
  const MAX_DIM = 1600;
  const scale0 = Math.min(1, MAX_DIM / Math.max(w, h));
  w = Math.round(w * scale0);
  h = Math.round(h * scale0);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung browser ini');

  let quality = 0.85;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = '#131315';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    blob = await canvasToBlob(canvas, quality);
    if (!blob) throw new Error('Gagal mengompres gambar');
    if (blob.size / 1024 <= maxKB) break;
    // kecilkan: turunkan kualitas dulu, lalu dimensi
    if (quality > 0.5) quality -= 0.12;
    else {
      w = Math.round(w * 0.8);
      h = Math.round(h * 0.8);
      quality = 0.7;
    }
  }
  if (!blob) throw new Error('Gagal mengompres gambar');

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca hasil kompres'));
    reader.readAsDataURL(blob as Blob);
  });

  return {
    dataUrl,
    sizeKB: Math.round((blob.size / 1024) * 10) / 10,
    name: file.name.replace(/\.[^.]+$/, '') || 'image',
  };
}
