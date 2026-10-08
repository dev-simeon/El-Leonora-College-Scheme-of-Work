import React from "react";
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
} from "react-native";

/** App-wide text defaults. Caller styles remain last so icon fonts can override Lexend. */
export function LexendText({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[{ fontFamily: "Lexend" }, style]} />;
}

export const LexendTextInput = React.forwardRef<
  React.ElementRef<typeof NativeTextInput>,
  TextInputProps
>(function LexendTextInput({ style, ...props }, ref) {
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      style={[{ fontFamily: "Lexend" }, style]}
    />
  );
});
