import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export default function TextField({ label, required, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, fontWeight: '500', color: colors.charcoal },
  required: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.charcoal,
  },
  error: { fontSize: 12, color: colors.danger },
});
