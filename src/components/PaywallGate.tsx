import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

interface Props {
  children: React.ReactNode;
}

// Wrap any subtree that requires an active subscription. Renders children
// unconditionally so Superwall briefly previews the underlying UI before
// covering it. Blocks Android hardware back while the user is not subscribed.
export function PaywallGate({ children }: Props) {
  const { isActive } = useSubscriptionGate();

  useEffect(() => {
    if (isActive) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [isActive]);

  return <>{children}</>;
}
