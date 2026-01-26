import { ImageSourcePropType } from 'react-native';

export interface TemplateImageItem {
  id: string;
  source: ImageSourcePropType;
}

export interface TemplateImageCategory {
  id: string;
  name: string;
  images: TemplateImageItem[];
}

export const TEMPLATE_IMAGE_CATEGORIES: TemplateImageCategory[] = [
  {
    id: 'abs-core',
    name: 'Abs & Core',
    images: [
      { id: 'abs-core-4464', source: require('../../assets/images/ABS-CORE/IMG_4464.JPG') },
      { id: 'abs-core-4465', source: require('../../assets/images/ABS-CORE/IMG_4465.JPG') },
      { id: 'abs-core-4466', source: require('../../assets/images/ABS-CORE/IMG_4466.JPG') },
      { id: 'abs-core-4467', source: require('../../assets/images/ABS-CORE/IMG_4467.JPG') },
      { id: 'abs-core-4468', source: require('../../assets/images/ABS-CORE/IMG_4468.JPG') },
      { id: 'abs-core-4469', source: require('../../assets/images/ABS-CORE/IMG_4469.JPG') },
      { id: 'abs-core-4470', source: require('../../assets/images/ABS-CORE/IMG_4470.JPG') },
      { id: 'abs-core-4471', source: require('../../assets/images/ABS-CORE/IMG_4471.JPG') },
    ],
  },
  {
    id: 'back-pull',
    name: 'Back & Pull',
    images: [
      { id: 'back-pull-4451', source: require('../../assets/images/BACK-PULL/IMG_4451.JPG') },
      { id: 'back-pull-4452', source: require('../../assets/images/BACK-PULL/IMG_4452.JPG') },
      { id: 'back-pull-4454', source: require('../../assets/images/BACK-PULL/IMG_4454.JPG') },
      { id: 'back-pull-4455', source: require('../../assets/images/BACK-PULL/IMG_4455.JPG') },
      { id: 'back-pull-4456', source: require('../../assets/images/BACK-PULL/IMG_4456.JPG') },
      { id: 'back-pull-4457', source: require('../../assets/images/BACK-PULL/IMG_4457.JPG') },
      { id: 'back-pull-4458', source: require('../../assets/images/BACK-PULL/IMG_4458.JPG') },
      { id: 'back-pull-4459', source: require('../../assets/images/BACK-PULL/IMG_4459.JPG') },
      { id: 'back-pull-4460', source: require('../../assets/images/BACK-PULL/IMG_4460.JPG') },
      { id: 'back-pull-4461', source: require('../../assets/images/BACK-PULL/IMG_4461.JPG') },
      { id: 'back-pull-4462', source: require('../../assets/images/BACK-PULL/IMG_4462.JPG') },
      { id: 'back-pull-4463', source: require('../../assets/images/BACK-PULL/IMG_4463.JPG') },
    ],
  },
  {
    id: 'cardio',
    name: 'Cardio',
    images: [
      { id: 'cardio-4506', source: require('../../assets/images/CARDIO/IMG_4506.JPG') },
      { id: 'cardio-4507', source: require('../../assets/images/CARDIO/IMG_4507.JPG') },
      { id: 'cardio-4508', source: require('../../assets/images/CARDIO/IMG_4508.JPG') },
      { id: 'cardio-4509', source: require('../../assets/images/CARDIO/IMG_4509.JPG') },
      { id: 'cardio-4510', source: require('../../assets/images/CARDIO/IMG_4510.JPG') },
      { id: 'cardio-4511', source: require('../../assets/images/CARDIO/IMG_4511.JPG') },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    images: [
      { id: 'full-body-4480', source: require('../../assets/images/FULL BODY/IMG_4480.JPG') },
      { id: 'full-body-4481', source: require('../../assets/images/FULL BODY/IMG_4481.JPG') },
      { id: 'full-body-4482', source: require('../../assets/images/FULL BODY/IMG_4482.JPG') },
      { id: 'full-body-4483', source: require('../../assets/images/FULL BODY/IMG_4483.JPG') },
    ],
  },
  {
    id: 'glutes',
    name: 'Glutes',
    images: [
      { id: 'glutes-4472', source: require('../../assets/images/GLUTES/IMG_4472.JPG') },
      { id: 'glutes-4473', source: require('../../assets/images/GLUTES/IMG_4473.JPG') },
      { id: 'glutes-4474', source: require('../../assets/images/GLUTES/IMG_4474.JPG') },
      { id: 'glutes-4475', source: require('../../assets/images/GLUTES/IMG_4475.JPG') },
      { id: 'glutes-4476', source: require('../../assets/images/GLUTES/IMG_4476.JPG') },
      { id: 'glutes-4477', source: require('../../assets/images/GLUTES/IMG_4477.JPG') },
      { id: 'glutes-4478', source: require('../../assets/images/GLUTES/IMG_4478.JPG') },
      { id: 'glutes-4479', source: require('../../assets/images/GLUTES/IMG_4479.JPG') },
    ],
  },
  {
    id: 'gym-aesthetic',
    name: 'Gym Aesthetic',
    images: [
      {
        id: 'gym-aesthetic-4512',
        source: require('../../assets/images/Gym aesthetic /IMG_4512.JPG'),
      },
      {
        id: 'gym-aesthetic-4513',
        source: require('../../assets/images/Gym aesthetic /IMG_4513.JPG'),
      },
      {
        id: 'gym-aesthetic-4514',
        source: require('../../assets/images/Gym aesthetic /IMG_4514.JPG'),
      },
      {
        id: 'gym-aesthetic-4515',
        source: require('../../assets/images/Gym aesthetic /IMG_4515.JPG'),
      },
      {
        id: 'gym-aesthetic-4516',
        source: require('../../assets/images/Gym aesthetic /IMG_4516.JPG'),
      },
      {
        id: 'gym-aesthetic-4517',
        source: require('../../assets/images/Gym aesthetic /IMG_4517.JPG'),
      },
      {
        id: 'gym-aesthetic-4518',
        source: require('../../assets/images/Gym aesthetic /IMG_4518.JPG'),
      },
    ],
  },
  {
    id: 'home-workout',
    name: 'Home Workout',
    images: [
      {
        id: 'home-workout-4499',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4499.JPG'),
      },
      {
        id: 'home-workout-4500',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4500.JPG'),
      },
      {
        id: 'home-workout-4501',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4501.JPG'),
      },
      {
        id: 'home-workout-4502',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4502.JPG'),
      },
      {
        id: 'home-workout-4503',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4503.JPG'),
      },
      {
        id: 'home-workout-4504',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4504.JPG'),
      },
      {
        id: 'home-workout-4505',
        source: require('../../assets/images/HOME WORKOUT-MAT/IMG_4505.JPG'),
      },
    ],
  },
  {
    id: 'lower-body',
    name: 'Lower Body',
    images: [
      { id: 'lower-body-4484', source: require('../../assets/images/LOWER BODY/IMG_4484.JPG') },
      { id: 'lower-body-4485', source: require('../../assets/images/LOWER BODY/IMG_4485.JPG') },
      { id: 'lower-body-4486', source: require('../../assets/images/LOWER BODY/IMG_4486.JPG') },
      { id: 'lower-body-4487', source: require('../../assets/images/LOWER BODY/IMG_4487.JPG') },
      { id: 'lower-body-4488', source: require('../../assets/images/LOWER BODY/IMG_4488.JPG') },
      { id: 'lower-body-4489', source: require('../../assets/images/LOWER BODY/IMG_4489.JPG') },
      { id: 'lower-body-4490', source: require('../../assets/images/LOWER BODY/IMG_4490.JPG') },
      { id: 'lower-body-4491', source: require('../../assets/images/LOWER BODY/IMG_4491.JPG') },
    ],
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    images: [
      { id: 'upper-body-4492', source: require('../../assets/images/UPPER BODY/IMG_4492.JPG') },
      { id: 'upper-body-4493', source: require('../../assets/images/UPPER BODY/IMG_4493.JPG') },
      { id: 'upper-body-4494', source: require('../../assets/images/UPPER BODY/IMG_4494.JPG') },
      { id: 'upper-body-4495', source: require('../../assets/images/UPPER BODY/IMG_4495.JPG') },
      { id: 'upper-body-4496', source: require('../../assets/images/UPPER BODY/IMG_4496.JPG') },
      { id: 'upper-body-4497', source: require('../../assets/images/UPPER BODY/IMG_4497.JPG') },
      { id: 'upper-body-4498', source: require('../../assets/images/UPPER BODY/IMG_4498.JPG') },
    ],
  },
];

// Lookup a template image by its ID (used to resolve stored templateImageId back to require() source)
export function getTemplateImageById(imageId: string): ImageSourcePropType | null {
  for (const category of TEMPLATE_IMAGE_CATEGORIES) {
    const found = category.images.find((img) => img.id === imageId);
    if (found) return found.source;
  }
  return null;
}
