/**
 * Convierte los landmarks del formato de red (arrays compactos) al formato
 * que consume LandmarkOverlay.
 *
 * El servidor manda [x, y, z, visibilidad] en vez de {x, y, z, visibility}
 * porque a 5 fps con ~75 puntos la diferencia de tamano es real. Aqui se
 * deshace esa compresion.
 *
 * Una mano ausente llega como null y debe seguir siendo null: el overlay
 * distingue "no hay mano" de "mano en el origen".
 */

function toPoints(rows, withVisibility = false) {
  if (!Array.isArray(rows)) return null;
  return rows.map((r) =>
    withVisibility
      ? { x: r[0], y: r[1], z: r[2] ?? 0, visibility: r[3] ?? 1 }
      : { x: r[0], y: r[1], z: r[2] ?? 0 }
  );
}

/**
 * @param {{pose?:number[][], leftHand?:number[][], rightHand?:number[][], face?:number[][]}} wire
 * @returns {import('./LandmarkSource').LandmarkFrame|null}
 */
export function fromWire(wire) {
  if (!wire) return null;
  const pose = toPoints(wire.pose, true);
  const leftHand = toPoints(wire.leftHand);
  const rightHand = toPoints(wire.rightHand);
  const face = toPoints(wire.face);

  if (!pose && !leftHand && !rightHand) return null;

  return {
    pose: pose ?? [],
    leftHand,
    rightHand,
    face: face ?? [],
    hasHands: Boolean(leftHand || rightHand),
    timestamp: Date.now(),
  };
}

export default fromWire;
