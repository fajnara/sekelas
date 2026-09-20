# Sekelas

Implementasi Next.js dari desain Sekelas (Claude Design) — aplikasi tugas,
jadwal, dan materi sekolah untuk tiga role: **Siswa**, **Guru**, dan **TU**.

Stack: **Next.js 16 (App Router, JavaScript)** · **Tailwind CSS v4** ·
**shadcn/ui** (base Radix).

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Aturan utama: desain yang menang

Semua nilai visual — warna, spacing, radius, shadow, ukuran font, font-weight —
diambil apa adanya dari [`design/Sekelas App v2.dc.html`](design/README.md).
Kalau gaya bawaan shadcn bentrok dengan desain, **desain yang dipakai**.

Caranya:

- **Token desain** ada di [`src/app/globals.css`](src/app/globals.css) dalam
  blok `@theme` (`--color-brand`, `--color-ink-4`, `--color-line-08`, dst.).
  Variabel shadcn (`--primary`, `--border`, …) di-remap ke token ini supaya
  primitive shadcn mewarisi tampilan Sekelas, bukan default-nya.
- **Nilai piksel** ditulis sebagai arbitrary value Tailwind (`rounded-[18px]`,
  `text-[14.5px]`, `py-[9px]`) supaya sama persis dengan desain, bukan
  dibulatkan ke skala Tailwind.
- **Warna dari data** (warna mapel, badge status, dll.) tetap lewat `style`
  inline karena nilainya datang dari data, bukan dari kelas statis.
- **Primitive shadcn dibungkus ulang** di
  [`src/components/ui-sekelas.jsx`](src/components/ui-sekelas.jsx) —
  `SkInput`, `SkTextarea`, `SkSelect`, `BottomSheet`, `SheetActions`. Perilaku
  (fokus, keyboard, portal, scroll-lock) dari Radix; tampilannya dari desain.

Satu contoh aturan itu bekerja, ditemukan oleh harness visual sendiri: Radix
memindahkan fokus ke kontrol pertama begitu sheet terbuka, sehingga kolom
pertama di setiap sheet tampil dalam keadaan `:focus` — border ungu, latar
putih — padahal desain menggambarnya netral. Sekarang fokusnya jatuh ke panel
sheet: jebakan fokus dan pembacaan judul oleh screen reader tetap utuh, tidak
ada kolom yang menyala, dan di ponsel papan ketik tidak ikut muncul. Enam
baseline sheet diperbarui karena itu, dan keenamnya bergerak **mendekat** ke
desain, bukan menjauh.

## Struktur

```
middleware.js          Mencetak cookie sandbox + persona awal pengunjung
src/
  app/
    layout.js          Font Plus Jakarta Sans (400–800)
    page.js            Frame 390×844; memuat snapshot, membaca query param
    actions.js         Server Action — adaptor tipis di atas lib/db/writes.js
    api/file/route.js  Menyajikan & menerima berkas driver lokal (per sandbox)
    api/cron/route.js  Pembersihan sandbox harian + keep-alive Supabase
    globals.css        Token desain + keyframes (skPop / skRise / skToast)
  lib/
    data.js            Seed relasional, persis dari file desain
    useSekelas.js      Port class Component desain → hook React (view-model)
    clock.js           Satu-satunya sumber "sekarang"; jam demo terkunci
    snapshot.js        Bentuk snapshot + seed lokal
    load-snapshot.js   Pemilihan sumber: frozen / seed lokal / sandbox Postgres
    ids.js             Id baris dibuat di klien sebelum patch optimistik
    hmac.js            Tanda tangan HMAC (Web Crypto) untuk nilai ke klien
    workspace-cookie.js  Cookie sandbox: tanda tangan + pembacaan
    persona.js         Peran pengunjung + penjaga aksi (murni)
    persona-server.js  Membaca cookie persona untuk render pertama
    icons.jsx          Path ikon nav, disalin dari desain
    db/
      schema.js        13 tabel, PK komposit (workspaceId, id teks)
      mappers.js       Satu-satunya tempat bentuk DB ↔ bentuk aplikasi
      queries.js       Pembacaan snapshot
      writes.js        Semua logika tulis, (db, workspaceId, input)
      workspace.js     Kloning template, reset, GC, gerbang cron
      seed.js          Menulis workspace template dari seed lokal
      session.js       Menyelesaikan sandbox + persona dari cookie
      client.js        Dua driver (postgres-js, PGlite), satu skema
    storage/
      rules.js         Aturan berkas murni — dipakai klien dan server
      index.js         Pemilihan driver + pemeriksaan objek (server saja)
      upload-token.js  Padanan signed upload URL untuk driver lokal
      supabase.js      Supabase Storage lewat REST
      local.js         Folder di disk, untuk mencoba tanpa akun cloud
  components/
    sekelas-app.jsx    Router layar (satu layar aktif, seperti rantai sc-if)
    shell.jsx          Phone frame, status bar, bottom nav, toast
    sheets.jsx         8 bottom sheet (slot, kelas, penugasan, upload,
                       kumpulkan, nilai, siswa, pratinjau file)
    ui-sekelas.jsx     Pembungkus shadcn yang dikunci ke desain
    ui/                Komponen shadcn mentah
    screens/
      siswa.jsx        Login, Home, Tugas, Detail tugas, Mapel, Detail mapel,
                       Kalender, Profil, Nilai, Notifikasi
      admin.jsx        Dashboard TU, Kelola mapel, Form mapel, Jadwal,
                       Materi, Kelola tugas
      guru.jsx         Form tugas, Dashboard guru, Jadwal mengajar,
                       Profil guru, Daftar pengumpulan
      tu.jsx           Kelas & jurusan, Detail kelas, Guru & penugasan,
                       Detail guru, Profil TU
```

## Membuka layar tertentu

Semua "Prototype prop" dari file desain bisa dipakai sebagai query param, jadi
tiap frame di katalog desain punya URL-nya sendiri:

| Frame desain | URL                                                                  |
| ------------ | -------------------------------------------------------------------- |
| v1           | `/?screen=tasks&frozen=1`                                             |
| v3           | `/?screen=taskDetail&taskId=2&sheet=submit&frozen=1`                  |
| v5           | `/?screen=grades&frozen=1`                                            |
| v7           | `/?screen=submissions&role=guru&guruId=t1&subTaskId=a1&frozen=1`      |
| v9           | `/?screen=adminSchedule&role=tu&sheet=slot&frozen=1`                  |
| v10          | `/?screen=tuClassDetail&role=tu&adminClass=10ipa1&frozen=1`           |
| v12          | `/?screen=tuProfile&role=tu&frozen=1`                                 |

Param yang didukung: `screen`, `role`, `guruId`, `adminClass`, `taskKind`,
`statusFilter`, `subjectFilter`, `dayIndex`, `subjectId`, `taskId`,
`subTaskId`, `sheet`, `studentName`, `streak`.

`frozen=1` bukan hiasan: ia merender dari seed lokal tanpa menyentuh database
dan tanpa membuat sandbox, jadi setiap URL di atas menampilkan hal yang sama
selamanya. Harus **eksplisit** — pengunjung yang mendarat di `/?screen=tasks`
tetap mendapat sandbox hidup.

## Database & sandbox pengunjung

Aplikasi membaca satu **snapshot** — bukan konstanta modul. Sumbernya ditentukan
oleh tiga hal, yang pertama cocok dipakai:

| Kondisi | Sumber data |
| --- | --- |
| `?frozen=1` | seed lokal, database tidak disentuh |
| `DATABASE_URL` kosong (default) | seed lokal di [src/lib/data.js](src/lib/data.js) |
| `DATABASE_URL` terisi | sandbox pengunjung di Postgres |

Karena itu `npm run dev` langsung jalan setelah clone, dan harness fidelitas bisa
berjalan di CI tanpa rahasia apa pun.

### Satu sandbox per pengunjung

Setiap layar TU punya tombol Hapus. Di satu database bersama, satu pengunjung
yang penasaran bisa mengosongkan demo orang lain — tidak bisa diterima untuk URL
yang dikirim ke orang. Jadi tiap pengunjung mendapat salinan datanya sendiri.

Cara kerjanya:

- [middleware.js](middleware.js) mencetak uuid dan menyimpannya di cookie
  `sk_ws` (httpOnly, ditandatangani), lalu meneruskannya sebagai header request
  supaya render **pertama** sudah punya id. Harus di middleware: Server
  Component tidak bisa menyetel cookie.
- Kunjungan pertama memanggil `seed_workspace()` — satu fungsi SQL berisi
  sebelas `INSERT … SELECT` **di dalam** database, bukan ~600 baris yang lewat
  jaringan. Bisa apa adanya karena setiap primary key berbentuk
  `(workspace_id, id teks)`: tidak ada id yang perlu dipetakan ulang.
- Daftar kolom di fungsi itu dibaca dari katalog Postgres, bukan ditulis tangan,
  jadi kolom baru ikut tersalin tanpa menyentuh fungsinya. Ada ujinya yang
  benar-benar menambah kolom lalu memastikannya terbawa.
- `?reset=1` mengembalikan sandbox ke kondisi awal.

Cookie-nya ditandatangani bukan untuk melindungi klaim apa pun — id-nya sendiri
sudah jadi otorisasi, seperti session token. Gunanya mencegah id karangan: tanpa
itu satu skrip bisa mengirim ribuan uuid acak dan tiap satu memicu pembuatan
workspace baru berisi ~600 baris. Set `SESSION_SECRET` di produksi; tanpa itu
aplikasi tetap jalan, tapi cookie lama berhenti berlaku setiap deploy dan
pengunjung mendapat sandbox baru.

**Isolasinya diuji, bukan diasumsikan.** `tests/workspace.spec.js` mengosongkan
satu sandbox lalu memastikan sandbox lain masih utuh (9 kelas, 288 siswa, 23
tugas) dan template-nya tetap bersih. Ada juga uji yang memanggil pembuatan
sandbox tiga kali sekaligus untuk memastikan hanya satu yang menyemai.

Menyiapkan database sungguhan:

```bash
DATABASE_URL="postgres://…" npm run db:seed
```

Mau mencoba jalur database tanpa akun cloud? `npm run db:local` menjalankan
Postgres di balik protokol wire lewat PGlite, jadi aplikasi menyambung seperti
ke database sungguhan:

```bash
npm run db:local
```

Datanya hanya di memori dan hilang saat proses ditutup. Satu catatan penting:
jembatan itu **melayani satu koneksi pada satu waktu**, jadi jalankan seed dulu,
baru aplikasinya — dan jangan menjalankan skrip lain ke port itu sementara
aplikasinya hidup. Untuk pemakaian sehari-hari, Postgres sungguhan lebih tenang.

Perintah itu menjalankan migrasi lalu menulis workspace `template`. Aman
dijalankan berulang — migrasi dicatat oleh migrator Drizzle.

Setelah mengubah [src/lib/db/schema.js](src/lib/db/schema.js):

```bash
npm run db:generate
```

**Uji database jalan sungguhan, bukan di-mock.** `tests/db.spec.js` menjalankan
Postgres di dalam proses lewat PGlite, menerapkan migrasi yang sama, menyemai,
lalu memastikan snapshot yang keluar **identik** dengan seed lokal. Ini gerbang
yang penting: kalau keduanya berbeda, tampilan aplikasi akan berubah begitu
`DATABASE_URL` dipasang — dan harness visual tidak akan menangkapnya, karena
harness berjalan tanpa database. Uji itu juga memeriksa keutuhan referensi antar
tabel, karena foreign key belum dipasang di skema (baris disalin per workspace).

```bash
npm run test:unit
```

## Operasi: reset, pembersihan, keep-alive

**Reset.** `/?reset=1` mengembalikan sandbox pengunjung ke kondisi awal:
barisnya dibuang, template disalin ulang, dan berkas yang sudah diunggah ikut
dihapus — tanpa itu byte-nya tertinggal tanpa baris pemilik dan tidak ada lagi
yang bisa membuangnya. Parameternya lalu **dibuang dari URL** lewat redirect;
kalau tetap menempel, tiap muat ulang akan mereset lagi dan pengunjung tidak
akan pernah bisa mencoba apa pun. Tidak ada layar yang punya tombol reset, dan
layar tidak boleh diubah, jadi URL adalah afordansi yang benar untuk ini.

**Pembersihan berkala + keep-alive.** Satu Vercel Cron harian memanggil
`GET /api/cron` ([vercel.json](vercel.json), 20.00 UTC = 03.00 WIB):

- menghapus sandbox `demo` yang **14 hari** tidak dibuka, beserta seluruh
  barisnya dan berkasnya. Per tabel, bukan lewat `ON DELETE CASCADE` — foreign
  key memang belum dipasang, karena baris disalin per workspace dan urutan
  penyalinannya yang menjaga keutuhan;
- workspace `template` tidak pernah ikut terhapus (`kind` yang menentukan, bukan
  `last_seen_at` — template memang tidak punya pengunjung, jadi kalau GC hanya
  melihat tanggal, seluruh aplikasi mati pada pembersihan pertama). Ada ujinya;
- dan menyentuh database setiap hari. Project Postgres gratis Supabase **pause
  setelah satu minggu tanpa aktivitas**, yang fatal untuk URL portfolio yang
  dibuka sesekali. Jadwal yang memang sudah dibutuhkan itu sekalian jadi
  keep-alive, gratis.

Route-nya dijaga `CRON_SECRET`, dan tanpa rahasia itu ia **mati (503), bukan
terbuka**: ia menghapus data, dan `/api/*` di Vercel bisa diakses siapa saja.

## Aktivitas dan notifikasi dari aksi nyata

Feed "Aktivitas terbaru" di panel TU dan kotak notifikasi siswa tidak lagi hanya
berisi seed:

| Aksi | Aktivitas TU | Notifikasi siswa |
| --- | --- | --- |
| Guru membuat tugas | ✓ hijau | ✓ "Tugas baru" — kalau tugasnya untuk kelasnya |
| Guru mengunggah materi | ✓ kuning | — |
| TU mengubah jadwal | ✓ ungu | ✓ "Jadwal berubah" — kalau jadwal kelasnya |
| Guru memberi nilai | — | ✓ "Nilai keluar" — kalau yang dinilai dia |

Empat keputusan yang menahan bagian ini tetap jujur:

1. **Hanya kejadian yang sudah punya padanan di desain yang dicatat.** Desain
   punya empat jenis notifikasi dan empat warna aktivitas; menambah jenis lain
   berarti mengarang warna dan nada yang desainnya tidak pernah menyebut. Karena
   itu materi tidak memunculkan notifikasi, dan menghapus tugas, menambah siswa,
   atau mengubah kelas tidak meninggalkan jejak apa pun.
2. **Notifikasi hanya masuk kalau kejadiannya menyangkut siswa itu.** Kotak
   notifikasi di desain adalah kotak **satu** siswa, jadi mengisinya dengan
   kejadian kelas lain akan bohong. Tugas untuk kelas lain tetap masuk aktivitas.
3. **Baris turunan tidak boleh menjatuhkan tulisan utamanya.** Kalau catatan
   aktivitas gagal setelah tugasnya tersimpan, mengembalikan error akan membuat
   UI me-rollback tugas yang **sudah ada** di database. Jejak yang hilang jauh
   lebih ringan daripada itu.
4. **Baris baru muncul di puncak** (`min(sort_order) - 1`), karena daftarnya
   dirender apa adanya dan seed-nya terbaru-dulu.

Satu batas yang tidak ditutup: baris turunan lahir di server, sementara `st`
klien hanya diinisialisasi sekali. Jadi notifikasi baru muncul pada muat ulang
berikutnya, bukan seketika — sama seperti seluruh data server di aplikasi ini.

## Persona: siapa yang sedang diperankan

Layar login desain jadi pintu masuknya. Tombol Masuk memilih peran — siswa,
guru, atau staf TU — dan peran itu disimpan di cookie `sk_as` (httpOnly, 30
hari) lewat sebuah Server Action, karena Server Component tidak boleh menyetel
cookie.

**Ini bukan autentikasi, dan tidak berpura-pura begitu.** Desainnya tidak pernah
memeriksa password, dan itu dipertahankan: siapa pun boleh masuk sebagai siapa
pun. Cookie-nya juga **tidak** ditandatangani — tanda tangan hanya akan
melindungi klaim yang pemiliknya memang berhak mengubah sesukanya. Yang dijaga
adalah **kecocokan**, bukan identitas:

```js
export const deleteClassAction = run("tu", writes.deleteClass);
export const addMaterialAction = withUpload("materials", "guru", writes.addMaterial);
export const submitTaskAction = withUpload("submissions", "siswa", writes.submitTask);
```

Peran yang boleh memanggil ditulis di sebelah action-nya di
[src/app/actions.js](src/app/actions.js), mengikuti pemilik layarnya: nav siswa,
nav guru, dan nav TU tidak pernah berbagi satu tulisan pun. Kalau tidak cocok,
action menolak dengan alasannya ("Aksi ini hanya untuk staf TU."), dan karena
penolakan itu lewat jalur `mutate()` yang sama, patch optimistiknya ikut
dikembalikan — tidak ada perubahan yang tampak berhasil padahal ditolak.

Gunanya jadi: **menangkap bug, bukan penyerang**. Kalau suatu hari layar siswa
memanggil tulisan milik TU, itu gagal keras dan kelihatan, bukan tersimpan
diam-diam ke sandbox.

Tiga detail yang menopangnya:

- **Persona awal dicetak middleware, dan hanya kalau belum ada.** Kunjungan
  pertama ke `/?screen=tuClasses&role=tu` langsung berperan sebagai TU, jadi
  tautan langsung di bagian sebelumnya tetap bisa menulis tanpa lewat layar
  login. Tidak pernah menimpa yang sudah ada — parameter `role` tetap menempel
  di URL setelah pengunjung berpindah peran lewat layar login, dan Server Action
  di-POST ke URL itu juga; menimpanya akan mengembalikan persona lama lalu
  menolak aksi yang sah.
- **Muat ulang tidak memulangkan siapa pun ke layar siswa.** `page.js` memakai
  persona tersimpan kalau URL-nya tidak menyebut peran, dan layar awalnya
  mengikuti peran itu. Query param tetap menang, supaya tautan langsung selalu
  merender apa yang ditulisnya.
- **Keluar melepas persona, bukan sandbox.** Datanya harus masih ada saat
  pengunjung masuk lagi, termasuk sebagai peran yang berbeda.

Mode frozen tidak pernah membaca cookie persona: harness fidelitas harus
merender hal yang sama selamanya, dan cookie pengunjung tidak boleh ikut
menentukan piksel.

## Cara perubahan disimpan

Satu jalur untuk semua perubahan, di
[src/lib/useSekelas.js](src/lib/useSekelas.js):

```js
mutate(patchOptimistik, () => api.saveClassAction({ … }), "Kelas ditambahkan.");
```

- **Patch optimistik dan toast dinaikkan di `setState` yang sama**, jadi
  keduanya muncul saat diklik — bukan setelah server menjawab. Waktunya identik
  dengan versi tanpa database.
- **Tulisannya di belakang.** Server Action dipanggil setelahnya; kalau ditolak,
  state dikembalikan dari sebuah ref — bukan dari closure, yang bisa sudah basi
  saat jawabannya datang.
- **Toast validasi tidak lewat sini.** "Masukkan nilai 0–100.", "Nama siswa
  belum diisi." tetap murni di klien dan tidak pernah menyentuh jaringan.
- **Mode frozen melewati server sepenuhnya** — perubahan cukup hidup di memori,
  persis seperti sebelum ada database.

Server Action di [src/app/actions.js](src/app/actions.js) sengaja dibuat tipis:
masing-masing hanya membaca sandbox dari cookie lalu memanggil fungsi di
[src/lib/db/writes.js](src/lib/db/writes.js). Logikanya ada di sana supaya bisa
diuji langsung di Postgres tanpa runtime Next — dan itulah yang dilakukan
`tests/writes.spec.js`.

Id baris dibuat **di klien** sebelum patch optimistik, supaya baris di layar dan
baris di database memakai id yang sama. Sebelumnya dipakai penghitung yang mulai
dari 0 setiap komponen dipasang; aman selama data hanya di memori, tapi langsung
bertabrakan begitu id-nya disimpan.

Bentrok jadwal diperiksa dua kali: di klien supaya pesannya seketika, dan di
server — yang menentukan, karena klien hanya melihat slot yang ada di memorinya.

## Unggah berkas

Materi guru dan pengumpulan siswa mengunggah berkas sungguhan. Dropzone desain
tetap satu piksel pun tidak berubah: `div` bergaris putus-putus itu menjadi
`label` dengan `<input type="file">` transparan menutupi seluruh areanya, jadi
kelas dan ukurannya sama, tapi area itu jadi bisa diklik **dan** bisa dijangkau
keyboard.

Tiga kemungkinan penyimpanan, dipilih otomatis (lihat
[src/lib/storage/index.js](src/lib/storage/index.js)):

| Env | Driver | Untuk |
| --- | --- | --- |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Supabase Storage lewat REST, tanpa SDK | produksi |
| `STORAGE_DIR` | folder di disk, disajikan lewat `/api/file` | mencoba tanpa akun cloud |
| — | tidak ada | default: baris tersimpan, byte dibuang |

### Byte-nya tidak lewat server

Satu unggahan adalah **tiga langkah**, dan berkasnya tidak pernah melewati
Server Action:

1. `signUploadAction` memeriksa persona dan aturan berkasnya, lalu mencetak
   alamat unggah berumur pendek untuk satu jalur objek tertentu.
2. Klien mengirim byte-nya **langsung** ke alamat itu.
3. Action pencatat (`addMaterialAction`, `submitTaskAction`) menuliskan barisnya
   — setelah memeriksa objek yang benar-benar sampai.

Alasannya satu dan keras: **badan request di Vercel dibatasi 4,5 MB di semua
paket**, dan batas itu memotong sebelum kode aplikasi dijalankan
([dokumen Vercel](https://vercel.com/docs/functions/limitations)) — sementara
dua dropzone desain menjanjikan 25 MB. Karena itu `bodySizeLimit` di
[next.config.mjs](next.config.mjs) sengaja **tidak** dipasang lagi: menaikkan
angka di sana tidak pernah bisa menolong.

Langkah 3 itu yang menutup lubang yang dibuka langkah 2. Server tidak lagi
memegang berkasnya, jadi ukuran dan tipe yang dikirim klien tidak bisa
dipercaya — dan `sizeBytes` bukan hiasan, ia menggerakkan "4,0 MB terpakai" di
layar Materi. `confirmUpload()` menanyakan ukuran **sebenarnya** ke penyimpanan,
memakai angka itu untuk barisnya, dan membuang objek yang kosong atau melampaui
batas. Ada ujinya, termasuk kasus "klien mengaku 1 KB, yang tersimpan 25 MB + 1".

**Satu jalur klien untuk dua driver.** Supabase punya signed upload URL sendiri;
driver folder lokal tidak, jadi padanannya dibuat di
[upload-token.js](src/lib/storage/upload-token.js) — token bertanda tangan HMAC
yang menyebut jalur objek dan kedaluwarsanya (dua jam, sama seperti Supabase),
ditukar di `PUT /api/file`. Bentuk permintaannya dibuat identik dengan Supabase
(PUT, `multipart/form-data`, berkas di field tanpa nama), jadi kode kliennya
satu — bukan dua cabang dengan salah satunya tidak pernah dijalankan uji.

### Yang lain

- **Aturan berkasnya murni dan dipakai dua kali.**
  [src/lib/storage/rules.js](src/lib/storage/rules.js) tidak mengimpor apa pun
  dari Node, jadi kode klien boleh memakainya untuk menolak seketika, dan
  `signUploadAction` memakai fungsi yang **sama persis** untuk menolak
  sungguhan. Atribut `accept` bukan pertahanan: ia hanya menyaring dialog
  pemilih berkas dan bisa dilewati sepenuhnya.
- **Batasnya 25 MB dan allowlist ekstensi** — mengikuti teks yang tertulis di
  dua dropzone desain. Teksnya kontrak yang dilihat pengguna, jadi batasnya
  yang menyesuaikan teks, bukan sebaliknya.
- **Jalur objek selalu diawali id workspace** (`{workspace}/materials/{id}.pdf`).
  Nama asli berkas tidak ikut masuk ke jalur, jadi nama aneh tidak bisa dipakai
  keluar dari folder sandbox; `fileUrlAction` dan action pencatatnya menolak
  jalur apa pun yang bukan milik sandbox pemanggil, dan `PUT /api/file` memeriksa
  hal yang sama walau jalurnya sudah datang dari token.
- **Menghapus materi menghapus byte-nya juga**, supaya objek tak bertuan tidak
  menumpuk.
- **Batas keras yang sebenarnya ada di bucket**, bukan di kode ini: karena klien
  mengunggah langsung, ia bisa mencoba mengirim berkas raksasa dan aplikasi baru
  membuangnya setelah sampai. Karena itu bucket Supabase-nya **harus** dibuat
  dengan `file_size_limit` 25 MB (lihat bagian Deploy) — di situlah percobaan
  seperti itu ditolak sebelum menghabiskan kuota.

## Model data

Skema ada di [src/lib/db/schema.js](src/lib/db/schema.js); seed lokal di
[src/lib/data.js](src/lib/data.js) memakai bentuk yang sama:

| Tabel | Catatan |
| --- | --- |
| `SUBJECTS` | nama guru **tidak** disimpan di sini — diturunkan dari penugasan |
| `CLASSES` | `homeroomTeacherId` (FK), **tanpa** kolom jumlah siswa |
| `TEACHERS` | tanpa penugasan bersarang |
| `TEACHING_ASSIGNMENTS` | satu baris per (guru, mapel, kelas) |
| `STUDENTS` | datar, ber-id stabil, `isMe` menandai akun siswa yang dipakai demo |
| `TASKS` | menyatukan tugas sisi siswa + sisi guru + riwayat nilai (`isArchived`) |
| `SUBMISSIONS` | satu baris per (tugas, siswa) — menggantikan `done`/`sub`/`grade`/hitungan `submitted` |
| `MATERIALS` | ukuran dalam byte, satu sumber untuk layar guru dan siswa |

Yang tidak lagi disimpan karena selalu bisa dihitung: jumlah siswa per kelas,
jumlah pengumpulan per tugas, status pengumpulan, dan semua label waktu.

Dua keputusan skema yang menopang sisanya:

1. **Primary key komposit `(workspaceId, id)` dengan id bertipe teks** —
   bukan uuid. Semua foreign key menunjuk id teks, jadi menyalin satu workspace
   cukup `INSERT … SELECT` tanpa memetakan ulang id. Itu yang akan membuat
   sandbox per pengunjung murah.
2. **Bentuk penyimpanan ≠ bentuk tampilan.** Database menyimpan yang bisa
   diurutkan dan dijumlahkan (`dayIndex`, menit integer, byte); aplikasi
   memakai yang siap tampil (`"Jumat"`, `"07.30"`, `"2,4 MB"`). Semua konversi
   terkurung di [src/lib/db/mappers.js](src/lib/db/mappers.js), jadi tidak ada
   layar yang perlu tahu.

### Divergensi yang diambil sadar

Tiga perilaku berbeda dari desain, semuanya karena desainnya sendiri tidak
konsisten:

1. **Layar Pengumpulan, baris Alya.** Desain menebak siapa yang sudah
   mengumpulkan secara posisional (`i < submitted` atas roster urut abjad).
   Alya urutan kedua, jadi sisi guru menyatakan dia sudah mengumpulkan tugas
   yang menurut sisi siswa belum. Sekarang barisnya diambil dari kebenaran sisi
   siswa, jadi keduanya sepakat — Alya tampil "Belum". Jumlah totalnya tetap 18
   karena kuotanya diisi teman sekelas.
2. **Hapus mata pelajaran.** Dulu praktis tidak berefek: `subj()` membaca
   konstanta modul, bukan state, jadi mapel yang "dihapus" tetap muncul di
   semua layar lain. Sekarang satu sumber, dan penghapusan ditolak dengan
   alasannya ("Masih dipakai di 18 slot jadwal · 3 tugas.") daripada
   meninggalkan jadwal dan tugas tanpa induk.
3. **Tanggal di layar Nilai** selalu absolut — lihat bagian jam di bawah.

Divergensi pertama satu-satunya yang terlihat di baseline visual, dan
baseline-nya sudah diperbarui secara sengaja.

## Jam aplikasi

"Hari ini" di aplikasi dipatok ke **Senin 7 September 2026, 09.41 WIB** lewat
[src/lib/clock.js](src/lib/clock.js) — satu-satunya sumber waktu, diimpor semua
yang butuh.

Ini bukan sekadar pilihan: string `"Senin, 7 September"` ada sebagai literal di
dua layar, dan layar tidak boleh berubah. Menitnya juga disengaja — status bar
menampilkan 09.41, jadi label yang diturunkan untuk pengumpulan baru
("Hari ini · 09.41") mereproduksi string yang dulu ditulis hardcode.

Yang **disimpan** selalu tanggal-waktu sungguhan; yang relatif ("Hari ini",
"Besok", "3 hari lagi", grid minggu) selalu diturunkan. Untuk membuktikan
logikanya nyata dan bukan tabel label:

```bash
NEXT_PUBLIC_DEMO_CLOCK=live npm run dev
```

Seluruh aplikasi berjalan dengan waktu sebenarnya — dua string header di atas
jadi basi, sisanya tetap benar.

## Deploy

Dirancang untuk Vercel + Supabase, dan keduanya cukup di paket gratis.

1. Buat project Postgres di Supabase, lalu satu bucket **privat** bernama
   `sekelas` di Supabase Storage — dengan **`file_size_limit` 25 MB**. Batas itu
   bukan hiasan: klien mengunggah langsung ke Storage, jadi bucket-lah yang
   menolak berkas raksasa sebelum sampai (lihat bagian Unggah berkas). Kalau mau
   lebih ketat lagi, `allowed_mime_types` bisa diisi
   `application/pdf`, `application/msword`,
   `application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
   `application/vnd.ms-powerpoint`,
   `application/vnd.openxmlformats-officedocument.presentationml.presentation`,
   `image/png`, `image/jpeg`.
2. Siapkan skema dan workspace template — sekali saja, dari mesin sendiri:

```bash
DATABASE_URL="postgres://…" npm run db:seed
```

3. Import repo ini ke Vercel, lalu isi environment variable berikut (semuanya
   dijelaskan di [.env.example](.env.example)):

| Variabel | Isi |
| --- | --- |
| `DATABASE_URL` | connection string Supabase (pakai **transaction pooler**) |
| `SESSION_SECRET` | string acak panjang; tanpa ini sandbox pengunjung hilang tiap deploy |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key — **jangan** diberi awalan `NEXT_PUBLIC_` |
| `SUPABASE_BUCKET` | `sekelas` (opsional, itu default-nya) |
| `CRON_SECRET` | string acak panjang; Vercel Cron mengirimkannya sendiri |

`STORAGE_DIR` **tidak** dipakai di produksi: filesystem Vercel bersifat
sementara, jadi berkasnya akan hilang. Ia hanya untuk mencoba jalur unggah di
mesin sendiri.

4. Setelah deploy pertama, buktikan cron-nya sekali dengan tangan — inilah satu
   satu-satunya bagian yang tidak bisa diuji dari mesin lokal (lihat catatan di
   `tests/e2e-ops.spec.js`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron
```

Jawaban yang benar berbentuk
`{"ok":true,"ttlDays":14,"deleted":0,"remaining":…}`.

### Batas 4,5 MB Vercel: sudah dihindari, tapi sekali perlu dibuktikan

Unggahan tidak lewat Server Action, jadi batas badan request 4,5 MB milik Vercel
tidak menyentuhnya — itu seluruh alasan jalur unggahnya tiga langkah (lihat
bagian Unggah berkas). Jalur itu dijalankan penuh oleh `npm run test:e2e`,
termasuk berkas 2 MB yang diperiksa memang pergi lewat satu `PUT` bertanda
tangan sementara POST action terbesar tetap di bawah 100 KB.

Yang **belum** pernah dijalankan sekali pun: langkah tanda tangan versi
Supabase (`POST /object/upload/sign/…`) dan pembacaan ukuran
(`GET /object/info/…`). Keduanya ditulis mengikuti implementasi
[`storage-js`](https://github.com/supabase/storage-js) endpoint per endpoint,
tapi tidak ada akun Supabase di lingkungan uji ini. Jadi setelah deploy
pertama, unggah satu berkas 5–10 MB sebagai guru dan pastikan tiga hal:

1. materinya muncul di layar Materi guru **dan** Detail Mapel siswa;
2. ukurannya benar di "N file · X MB terpakai" — kalau salah, artinya
   `GET /object/info` mengembalikan bentuk lain dari yang dibaca kode ini;
3. berkasnya ada di bucket, di bawah folder ber-uuid sandbox-nya.

## Harness fidelitas

Klaim "sama persis dengan desain" diverifikasi, bukan diasumsikan. 41 frame
dipotret pada 390×844 dan dibandingkan piksel-per-piksel dengan baseline yang
ikut di-commit di `tests/__frames__/`, ditambah 100 uji tanpa peramban: label
waktu, snapshot database, isolasi sandbox, pembersihan berkala, jalur tulis,
jejak aktivitas dan notifikasi, aturan berkas, token unggah, pemeriksaan objek
yang sampai, dan penjaga persona.

```bash
npm test
```

```bash
npm run frames
```

```bash
npm run frames:baseline
```

`npm test` menjalankan keduanya; `npm run frames` hanya perbandingan visual.
Untuk menulis ulang baseline: `npm run frames:baseline` — **hanya** jalankan itu
setelah sebuah perbedaan ditinjau dan sengaja diterima.

Detail yang perlu diketahui:

- Memakai **Edge yang sudah ada di sistem** (`channel: "msedge"`), karena unduhan
  Chromium bawaan Playwright gagal di mesin ini. Edge adalah Chromium.
- Berjalan di atas **build produksi di port 3100**, bukan dev server — dev punya
  double-render StrictMode dan overlay yang membuat hasil tidak deterministik.
  Port terpisah supaya tidak bentrok dengan `npm run dev` di 3000.
- Toleransi 60 piksel untuk noise antialiasing. Sebagai kalibrasi: mengubah satu
  ukuran font dari 25px ke 26px menghasilkan 10.376 piksel berbeda, jadi
  perubahan nyata sekecil apa pun tetap tertangkap.
- **Satu worker, disengaja.** Dengan dua worker, kontensi CPU membuat
  stability-loop screenshot pada layar terberat melewati timeout dan melaporkan
  kegagalan palsu. Ternyata satu worker juga lebih cepat.
- Yang terpotret hanya viewport awal tiap layar; konten yang perlu di-scroll ke
  bawah belum tercakup.
- Semua URL frame membawa `&frozen=1`: hidrasi dari seed lokal, jangan sentuh
  database, dan jangan cetak cookie sandbox. Itulah yang membuat harness ini
  tetap bisa jalan di CI tanpa rahasia apa pun setelah backend masuk.

Uji end-to-end terpisah, karena ia butuh database dan penyimpanan sungguhan:

```bash
npm run test:e2e
```

Perintah itu menyiapkan sendiri semuanya — Postgres (PGlite) di port acak,
folder penyimpanan sementara, migrasi, workspace template, lalu build — dan
membereskannya lagi setelah selesai.

`tests/e2e.spec.js` membuktikan jalur berkas: yang dipilih guru sampai ke
database, ke disk, dan ke layar siswa — **dan pergi langsung ke penyimpanan**,
bukan lewat Server Action (berkas 2 MB, satu `PUT` bertanda tangan, POST action
terbesar di bawah 100 KB); berkas terlarang ditolak sebelum apa pun ditulis;
menghapus materi ikut membuang byte-nya.
`tests/e2e-persona.spec.js` membuktikan jalur persona: peran bertahan setelah
muat ulang, aksi milik peran lain ditolak server dan patch optimistiknya
dikembalikan, dan Keluar melepas peran tanpa ikut membuang data.
`tests/e2e-ops.spec.js` membuktikan `?reset=1` (kembali ke kondisi awal, berkas
ikut dibuang, parameternya tidak menempel di URL) dan penolakan `/api/cron`
tanpa rahasia yang benar.

Satu hal yang ditemukan saat menulisnya, dan sengaja tidak disembunyikan di
dalam uji: menunggu badan respons Server Action selesai (`response.finished()`)
kadang menggantung tanpa batas **walau datanya sudah tersimpan** — aliran RSC-nya
tidak selalu ditutup Next secepat action-nya kelar. Jadi uji itu menunggu
hasilnya (barisnya bertahan setelah muat ulang), bukan responsnya.

## Catatan

- Datanya seed, bukan data sekolah sungguhan. Tanpa `DATABASE_URL` semuanya
  hidup di memori seperti prototipe desainnya; dengan `DATABASE_URL` setiap
  pengunjung dapat sandbox sendiri di Postgres, dan perubahannya bertahan.
- Dua panggilan REST Supabase di jalur unggah (tanda tangan dan pembacaan
  ukuran) belum pernah dijalankan terhadap Supabase sungguhan — tidak ada akun
  di lingkungan uji ini. Lihat bagian Deploy untuk cara membuktikannya sekali.
- Desainnya khusus mobile (390×844). Di layar lebar, frame ditaruh di tengah
  kanvas; di layar ≤ 390px frame mengisi penuh tanpa padding.
