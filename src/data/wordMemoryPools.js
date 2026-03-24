/**
 * Verbal memory word pools — concrete, calm vocabulary for adults.
 * Words are chosen for recognition & recall, not grammar or spelling drills.
 * Pools must stay large enough for expert: 6 targets + 5 distractors = 11 unique words per round.
 */

export const WORD_POOL_EN = [
  'Garden', 'Window', 'Silver', 'Harbor', 'Forest', 'Bridge', 'Candle', 'Station',
  'Kitchen', 'Mountain', 'Pillow', 'Thunder', 'Velvet', 'Canvas', 'Mirror',
  'Feather', 'Library', 'Lantern', 'Cottage', 'Marble', 'Orchard', 'Ocean',
  'Diamond', 'Canyon', 'Eclipse', 'Fountain', 'Granite', 'Compass', 'Olive',
  'Prism', 'Summit', 'Timber', 'Willow', 'Nectar', 'Oasis', 'River', 'Cloud',
  'Morning', 'Paper', 'Picture', 'Shadow', 'Crystal', 'Sand', 'Moon', 'Vessel',
  'Basket', 'Journey', 'Ember', 'Meadow', 'Horizon',
];

export const WORD_POOL_ES = [
  'Jardín', 'Ventana', 'Plata', 'Puerto', 'Bosque', 'Puente', 'Vela', 'Estación',
  'Cocina', 'Montaña', 'Almohada', 'Trueno', 'Terciopelo', 'Lienzo', 'Espejo',
  'Pluma', 'Biblioteca', 'Farol', 'Cabaña', 'Mármol', 'Huerto', 'Océano',
  'Diamante', 'Cañón', 'Eclipse', 'Fuente', 'Granito', 'Brújula', 'Oliva',
  'Prisma', 'Cumbre', 'Madera', 'Sauce', 'Néctar', 'Oasis', 'Río', 'Nube',
  'Mañana', 'Papel', 'Cuadro', 'Sombra', 'Cristal', 'Arena', 'Luna', 'Cesta',
  'Viaje', 'Brasa', 'Pradera', 'Horizonte', 'Sendero',
];

/** De-duplicate while preserving order (safety if lists are edited). */
function uniqueInOrder(list) {
  const seen = new Set();
  return list.filter((w) => {
    const k = w.trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function getWordPoolForLang(lang) {
  const raw = lang === 'es' ? WORD_POOL_ES : WORD_POOL_EN;
  return uniqueInOrder(raw);
}
