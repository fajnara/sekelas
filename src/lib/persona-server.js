import { cookies } from "next/headers";

import { PERSONA_COOKIE, parsePersona } from "./persona.js";

/**
 * Persona yang tersimpan di cookie, untuk render pertama.
 *
 * Dipisah dari [persona.js](persona.js) karena `next/headers` tidak ada di
 * runtime middleware, dan modul itu dipakai middleware.
 *
 * Mode frozen tidak pernah membacanya: harness fidelitas harus merender hal yang
 * sama selamanya, dan cookie pengunjung tidak boleh ikut menentukan piksel.
 */
export async function savedPersona({ frozen = false } = {}) {
  if (frozen) return null;
  return parsePersona((await cookies()).get(PERSONA_COOKIE)?.value);
}
