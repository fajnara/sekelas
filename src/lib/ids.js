/**
 * Id untuk baris yang dibuat pengguna.
 *
 * Sebelumnya dipakai penghitung `seq` yang mulai dari 0 setiap komponen
 * dipasang. Itu aman selama data hanya di memori, tapi begitu id-nya disimpan
 * ia langsung bertabrakan: tambah kelas, refresh, tambah kelas lagi — dua-duanya
 * ber-id `c0`.
 *
 * Dibuat di klien, **sebelum** patch optimistik, supaya baris di layar dan baris
 * di database memakai id yang sama. Kalau dibuat di server, keduanya berbeda
 * sampai halaman dimuat ulang.
 */
export const newId = (prefix) => prefix + "_" + crypto.randomUUID();
