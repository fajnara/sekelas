# Sumber desain

File di folder ini diambil langsung dari project Claude Design
`https://claude.ai/design/p/5968f39e-4007-4535-89fd-3201258d52de`.
Jangan diedit — ini referensi, bukan kode aplikasi.

| File                     | Isi                                                                |
| ------------------------ | ------------------------------------------------------------------ |
| `Sekelas App v2.dc.html` | **Sumber kebenaran.** Semua 26 layar + 8 bottom sheet + data dummy. |
| `Sekelas App.dc.html`    | Versi v1 (lama). Hanya untuk perbandingan.                          |
| `support.js`             | Runtime canvas Claude Design. Tidak dipakai aplikasi.               |

`Sekelas Screens.dc.html` (file yang diminta) sendiri tidak berisi UI — dia
cuma katalog yang menyusun frame dari dua file di atas lewat `<dc-import>`.
Turn `V2` di katalog itu menyatakan frame lama (`S`/`G`/`T`) disimpan
"untuk perbandingan", jadi **v2 yang diimplementasikan**.

## Cara membaca `.dc.html`

Template pakai DSL kecil:

- `<sc-if value="{{ flag }}">` → render kondisional
- `<sc-for list="{{ arr }}" as="x">` → perulangan
- `{{ expr }}` → binding
- `style-hover` / `style-focus` → state hover & focus

Bagian `<script data-dc-script>` di bawah template berisi data dummy dan
fungsi `renderVals()` yang menghasilkan semua nilai binding. Port-nya ada di
[`src/lib/data.js`](../src/lib/data.js) dan
[`src/lib/useSekelas.js`](../src/lib/useSekelas.js), memakai nama yang sama
persis supaya mudah diadu dengan aslinya.
