import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t('errors.somethingWentWrong')}</Text>
          <Text style={styles.subtitle}>{i18n.t('errors.unexpectedError')}</Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>{i18n.t('errors.tryAgain')}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
});
