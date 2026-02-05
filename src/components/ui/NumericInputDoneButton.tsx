import React from 'react';
import { InputAccessoryView, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

// TextInputs that want this toolbar should set inputAccessoryViewID={NUMERIC_ACCESSORY_ID}
export const NUMERIC_ACCESSORY_ID = 'numericDoneButton';

export function NumericInputDoneButton() {
  return (
    <InputAccessoryView nativeID={NUMERIC_ACCESSORY_ID}>
      <View style={styles.toolbar}>
        <View style={styles.spacer} />
        <Pressable onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1D4D9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#B5B9BE',
  },
  spacer: {
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  doneText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
