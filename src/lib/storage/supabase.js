/**
 * Driver Supabase Storage lewat REST, tanpa SDK.
 *
 * Tiga panggilan `fetch` menggantikan satu dependensi penuh — dan karena
 * service-role key hanya dipakai di sini (server), ia tidak pernah ikut
 * ter-bundle ke browser.
 */
const bucket = () => process.env.SUPABASE_BUCKET || "sekelas";
const base = () => process.env.SUPABASE_URL.replace(/\/+$/, "") + "/storage/v1";

const headers = () => ({
  Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

async function assertOk(response, what) {
  if (response.ok) return response;
  const body = await response.text().catch(() => "");
  throw new Error(`Supabase Storage ${what} gagal (${response.status}): ${body.slice(0, 200)}`);
}

export async function put(path, file) {
  const response = await fetch(`${base()}/object/${bucket()}/${encodeURI(path)}`, {
    method: "POST",
    headers: {
      ...headers(),
      "Content-Type": file.type || "application/octet-stream",
      // Menimpa kalau jalurnya sudah ada — id-nya sudah unik, jadi ini hanya
      // terjadi saat percobaan ulang setelah gagal separuh jalan.
      "x-upsert": "true",
    },
    body: await file.arrayBuffer(),
  });
  await assertOk(response, "upload");
}

/**
 * Signed upload URL: klien mengunggah **langsung** ke Supabase, tidak lewat
 * aplikasi. Itu yang menghindari batas badan request 4,5 MB milik Vercel, yang
 * berlaku di semua paket dan muncul sebelum kode aplikasi dijalankan.
 *
 * `x-upsert` dipasang karena id objeknya sudah unik: jalur yang sama hanya
 * terjadi pada percobaan ulang setelah gagal separuh jalan.
 *
 * Token-nya berlaku dua jam (ditentukan Supabase, bukan di sini).
 */
export async function signUpload(path) {
  const response = await fetch(`${base()}/object/upload/sign/${bucket()}/${encodeURI(path)}`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", "x-upsert": "true" },
    body: "{}",
  });
  await assertOk(response, "tanda tangan unggah");

  // Jawabannya berisi jalur relatif (`/object/upload/sign/…?token=…`).
  const { url } = await response.json();
  return { url: base() + String(url).replace(/^\/+/, "/"), method: "PUT" };
}

/** Ukuran objek yang **benar-benar** tersimpan, bukan yang diklaim klien. */
export async function statObject(path) {
  const response = await fetch(`${base()}/object/info/${bucket()}/${encodeURI(path)}`, { headers: headers() });
  if (response.status === 404) return null;
  await assertOk(response, "info objek");

  const info = await response.json();
  return { size: Number(info.size), contentType: info.content_type || null };
}

export async function remove(path) {
  const response = await fetch(`${base()}/object/${bucket()}/${encodeURI(path)}`, {
    method: "DELETE",
    headers: headers(),
  });
  // 404 bukan kegagalan: objeknya memang sudah tidak ada.
  if (response.status !== 404) await assertOk(response, "hapus");
}

/**
 * Menghapus seluruh objek di bawah satu awalan.
 *
 * Supabase Storage tidak punya "hapus folder": isinya harus didaftar dulu, lalu
 * dihapus per jalur. Didaftar per halaman karena API-nya memang berhalaman —
 * satu sandbox hanya berisi puluhan berkas, tapi mengandalkan halaman pertama
 * saja akan meninggalkan sisa tanpa pemberitahuan apa pun.
 */
export async function removePrefix(prefix) {
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const listed = await fetch(`${base()}/object/list/${bucket()}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit, offset }),
    });
    await assertOk(listed, "daftar objek");

    const items = await listed.json();
    // Berkas ada di `{prefix}/materials/…`, jadi daftarnya bertingkat: entri
    // tanpa `id` adalah folder, dan isinya diminta dengan awalan yang lebih dalam.
    const files = items.filter((item) => item.id);
    for (const folder of items.filter((item) => !item.id)) {
      await removePrefix(prefix.replace(/\/+$/, "") + "/" + folder.name);
    }

    if (files.length) {
      const removed = await fetch(`${base()}/object/${bucket()}`, {
        method: "DELETE",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: files.map((f) => prefix.replace(/\/+$/, "") + "/" + f.name) }),
      });
      await assertOk(removed, "hapus objek");
    }

    if (items.length < limit) return;
  }
}

export async function signedUrl(path, expiresIn = 60) {
  const response = await fetch(`${base()}/object/sign/${bucket()}/${encodeURI(path)}`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn }),
  });
  await assertOk(response, "tanda tangan URL");
  const { signedURL } = await response.json();
  return base().replace(/\/storage\/v1$/, "") + "/storage/v1" + signedURL;
}
