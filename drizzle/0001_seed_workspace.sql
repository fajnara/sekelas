-- Menyalin seluruh isi satu workspace ke workspace lain.
--
-- Daftar kolomnya dibaca dari katalog Postgres, bukan ditulis tangan — jadi
-- fungsi ini tidak bisa melenceng saat skema berubah. Tanpa itu, menambah satu
-- kolom berarti pengunjung baru mendapat data yang diam-diam tidak lengkap.
--
-- Bisa `INSERT … SELECT` apa adanya karena setiap primary key berbentuk
-- (workspace_id, id teks) dan setiap foreign key menunjuk id teks: tidak ada
-- id yang perlu dipetakan ulang.
CREATE OR REPLACE FUNCTION seed_workspace(dst uuid, src uuid) RETURNS void AS $$
DECLARE
  tbl text;
  cols text;
  -- Urut mengikuti ketergantungan, supaya tetap valid saat foreign key dipasang.
  tables text[] := ARRAY[
    'subjects', 'teachers', 'classes', 'teaching_assignments', 'students',
    'subject_slots', 'tasks', 'submissions', 'materials', 'notifications', 'activity_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
      INTO cols
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = tbl
       AND column_name <> 'workspace_id';

    EXECUTE format(
      'INSERT INTO %I (workspace_id, %s) SELECT $1, %s FROM %I WHERE workspace_id = $2',
      tbl, cols, cols, tbl
    ) USING dst, src;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
