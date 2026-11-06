import manifest from '@/data/characterKitV3.json';
import type { CharacterCustomization } from '@/types/game';

const ROOT = '/assets/sprites/character_kit_v3';

function label(id: string) {
  return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function options(ids: string[], names: string[]) {
  return ids.map((id, index) => ({ id, nameEn: label(id), nameVi: names[index] }));
}

export const BODIES_V3 = manifest.bodies.map(({ id }) => {
  const [gender, tone] = id.split('_');
  return { id, gender, build: Number(tone), nameEn: `Skin Tone ${tone}`, nameVi: `Tông Da ${tone}` };
});
export const HAIR_V3 = options(manifest.hair.map(item => item.id), manifest.displayNames.hair);
export const FACES_V3 = manifest.faces.map((id, index) => ({
  id,
  nameEn: `Expression ${index + 1}`,
  nameVi: manifest.displayNames.face[index],
}));
export const SHIRTS_V3 = options(manifest.shirts, manifest.displayNames.shirt);
export const PANTS_V3 = options(manifest.pants, manifest.displayNames.pants);
export const ACCESSORIES_V3 = options(manifest.accessories, manifest.displayNames.accessory);

function index(value: number | undefined, count: number) {
  return Number.isInteger(value) && value! >= 0 && value! < count ? value! : 0;
}

function fileIndex(value: number) {
  return String(value).padStart(2, '0');
}

export function getCharacterV3Layers(character: Partial<CharacterCustomization> = {}) {
  const body = manifest.bodies[index(character.baseIndex, BODIES_V3.length)];
  const hair = manifest.hair[index(character.hairIndex, HAIR_V3.length)];
  const face = manifest.faces[index(character.faceIndex, FACES_V3.length)];
  const shirt = fileIndex(index(character.shirtIndex, SHIRTS_V3.length));
  const pants = fileIndex(index(character.pantsIndex, PANTS_V3.length));
  const accessory = character.accessoryIndex;
  const accessoryPath = typeof accessory === 'number' && Number.isInteger(accessory) &&
    accessory >= 0 && accessory < ACCESSORIES_V3.length
    ? `accessories/${body.id}/${fileIndex(accessory)}`
    : null;

  return [
    ...(accessoryPath ? [accessoryPath + '_back.png'] : []),
    hair.back,
    body.path,
    `pants/${body.id}/${pants}.png`,
    `shirts/${body.id}/${shirt}.png`,
    face,
    hair.front,
    ...(accessoryPath ? [accessoryPath + '_front.png'] : []),
  ].map(asset => `${ROOT}/${asset}`);
}
