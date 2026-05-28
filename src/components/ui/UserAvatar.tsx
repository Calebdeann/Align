import { View, StyleSheet, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getHighResAvatarUrl } from '@/stores/userProfileStore';

const PLACEHOLDER = require('../../../assets/Profile Assets/no-pfp.png');

type Props = {
  uri?: string | null;
  size: number;
  loading?: boolean;
  highResHint?: boolean;
  // Cache-bust suffix appended as ?v=<version> at render time. Pass
  // profile.updated_at for the current user's own avatar so a new upload
  // invalidates the cached image without churning the URL stored in the DB.
  version?: string | null;
};

export default function UserAvatar({
  uri,
  size,
  loading = false,
  highResHint = true,
  version,
}: Props) {
  const base = uri ? (highResHint ? getHighResAvatarUrl(uri, size * 3) : uri) : null;
  const resolved =
    base && version && !base.includes('googleusercontent.com')
      ? `${base}${base.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
      : base;

  return (
    <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
      {/* Placeholder is always rendered first/underneath. The photo overlays it
          when it loads; if the photo fails (network blip, stale cache, broken URL)
          the placeholder shows through. No errored state means no permanent
          fallback flicker. */}
      <RNImage
        source={PLACEHOLDER}
        style={[
          StyleSheet.absoluteFill,
          { width: size, height: size, transform: [{ scale: 1.3 }] },
        ]}
        resizeMode="cover"
      />
      {resolved ? (
        <ExpoImage
          key={resolved}
          recyclingKey={resolved}
          source={{ uri: resolved }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          onLoad={() => console.log('[avatar] loaded', resolved)}
          onError={(e) => console.warn('[avatar] failed to load', resolved, e)}
        />
      ) : null}
      {loading && <View style={[StyleSheet.absoluteFill, styles.loadingDim]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: '#F0EEF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDim: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
