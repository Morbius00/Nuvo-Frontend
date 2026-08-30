import { File } from 'expo-file-system';

/**
 * Wraps a local file URI (from an image/audio/document picker) as a FormData part.
 *
 * Expo SDK 57 replaced React Native's fetch/FormData with its own implementation, which only
 * accepts a real `Blob`/`File` or an object exposing `.bytes()` — the legacy React Native
 * `{ uri, name, type }` shape it used to accept now throws "Unsupported FormDataPart
 * implementation". `expo-file-system`'s `File` satisfies the new contract.
 */
export function toUploadFilePart(uri: string, name?: string, type?: string): Blob {
  const file = new File(uri);
  return {
    name: name ?? file.name,
    type: type ?? file.type,
    bytes: () => file.bytes(),
  } as unknown as Blob;
}
