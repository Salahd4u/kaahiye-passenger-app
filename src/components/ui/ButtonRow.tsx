import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type ButtonRowProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Lays buttons out side by side in equal-width cells. The cells own the geometry
 * (50/50 split with a fixed gap) so the buttons inside always render the same width,
 * regardless of their own flex/width styles — and the row always measures itself
 * from its parent, so it is responsive on every device.
 */
export function ButtonRow({ children, style }: ButtonRowProps) {
  const items = React.Children.toArray(children);

  return (
    <View style={[styles.row, style]}>
      {items.map((child, index) => (
        <View key={index} style={styles.cell}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  // Explicit flex properties (not the `flex: 1` shorthand) so both cells are
  // always sized identically by the layout engine.
  cell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
});

export default ButtonRow;
