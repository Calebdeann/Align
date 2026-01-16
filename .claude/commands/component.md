# /component - Create a new React Native component

Create a new component following the established pattern.

## Instructions

1. Ask for the component name if not provided
2. Ask where to place it (src/components/ui, src/components/common, or specific feature folder)
3. Create the component file with:
   - TypeScript interface for props
   - StyleSheet using theme colors
   - Export from the component

## Template

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '@/constants/theme';

interface ${name}Props {
  // props here
}

export function ${name}({ }: ${name}Props) {
  return (
    <View style={styles.container}>
      {/* content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
```

## After Creation

- Add export to components/index.ts if it exists
- Inform user the component is ready
