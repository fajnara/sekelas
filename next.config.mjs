/** @type {import('next').NextConfig} */
const nextConfig = {
  // `serverActions.bodySizeLimit` sengaja **tidak** dipasang lagi.
  //
  // Berkas tidak lewat Server Action: klien mengunggahnya langsung ke
  // penyimpanan memakai alamat berumur pendek, karena badan request di Vercel
  // dibatasi 4,5 MB di semua paket — batas platform yang memotong sebelum kode
  // aplikasi dijalankan, jadi menaikkan angka di sini tidak menolong apa pun.
  // Action-nya kini hanya membawa metadata, yang muat di batas bawaan 1 MB.
};

export default nextConfig;
