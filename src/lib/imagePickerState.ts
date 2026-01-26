import { ImageSourcePropType } from 'react-native';

// Simple module-level state to pass selected template image between screens.
// The template-images screen sets this, then save-template reads it on focus.

interface PendingTemplateImage {
  id: string;
  source: ImageSourcePropType;
}

let pendingImage: PendingTemplateImage | null = null;

export function setPendingTemplateImage(image: PendingTemplateImage) {
  pendingImage = image;
}

export function consumePendingTemplateImage(): PendingTemplateImage | null {
  const img = pendingImage;
  pendingImage = null;
  return img;
}
