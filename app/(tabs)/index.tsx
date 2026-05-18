import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts, spacing } from '@/constants/theme';

type FriendEntry = {
  id: string;
  name: string;
  avatarColor: string;
  avatarUri?: string;
  timeAgo: string;
  workoutName: string;
  duration: string;
  volume: string;
  photoUri?: string;
  cardRotation: string;
};

type WorkoutPost = {
  id: string;
  imageUri?: string;
  aspectRatio: number;
  username: string;
  avatarUri?: string;
  caption: string;
};

// Left col (even idx): 1.30 / 1.15 alternating. Right col (odd idx): 1.12 / 1.28 alternating.
// Mirrors generatePosts logic so initial + loaded posts share the same designed stagger.
const MOCK_POSTS: WorkoutPost[] = [
  { id: '1', aspectRatio: 1.3, username: 'kaylaaa', caption: 'Booty Workout' },
  { id: '2', aspectRatio: 1.12, username: 'abby', caption: 'Push Day' },
  { id: '3', aspectRatio: 1.15, username: 'samantha.k', caption: 'Full Body' },
  { id: '4', aspectRatio: 1.28, username: 'anniii', caption: 'Home workout with @kassiee' },
  { id: '5', aspectRatio: 1.3, username: 'jess.m', caption: 'Leg Day' },
  { id: '6', aspectRatio: 1.12, username: 'lily_x', caption: 'Morning session' },
];

const D_USERNAMES = [
  'kaylaaa',
  'abby',
  'samantha.k',
  'anniii',
  'jess.m',
  'lily_x',
  'cass.fit',
  'meg_lifts',
  'ella.fit',
  'grace.g',
];
const D_CAPTIONS = [
  'Booty Workout',
  'Push Day',
  'Full Body',
  'Home workout with @kassiee',
  'Leg Day',
  'Morning session',
  'Glute finisher',
  'Upper body',
  'Core burn',
  'Back day',
];

function generatePosts(startId: number, count: number): WorkoutPost[] {
  return Array.from({ length: count }, (_, i) => {
    const absIdx = startId + i;
    const isLeft = absIdx % 2 === 0;
    const colPos = Math.floor(absIdx / 2);
    const ratio = isLeft ? (colPos % 2 === 0 ? 1.3 : 1.15) : colPos % 2 === 0 ? 1.12 : 1.28;
    const nameIdx = absIdx % D_USERNAMES.length;
    return {
      id: String(absIdx),
      aspectRatio: ratio,
      username: D_USERNAMES[nameIdx],
      caption: D_CAPTIONS[nameIdx],
    };
  });
}

// Placeholder data — replace with real API calls once friends schema exists
const MOCK_FRIENDS: FriendEntry[] = [
  {
    id: '1',
    name: 'Ellie',
    avatarColor: '#C9A96E',
    timeAgo: '2hrs ago',
    workoutName: 'Ab Burner',
    duration: '1h 2 mins',
    volume: '10,892kg',
    cardRotation: '-1deg',
  },
  {
    id: '2',
    name: 'Alex',
    avatarColor: '#6EB5C9',
    timeAgo: '4hrs ago',
    workoutName: 'Full Body',
    duration: '1h 22 mins',
    volume: '13,229kg',
    cardRotation: '1deg',
  },
  {
    id: '3',
    name: 'Rach',
    avatarColor: '#C96EA5',
    timeAgo: '8hrs ago',
    workoutName: 'Glutes',
    duration: '55 minutes',
    volume: '8,420kg',
    cardRotation: '-1deg',
  },
];

function FriendCard({ entry }: { entry: FriendEntry }) {
  const { width: sw } = useWindowDimensions();
  const cw = sw - 32; // card width
  const ch = Math.round(cw * 0.51); // ~185pt on a 361pt-wide screen
  const mw = Math.round(cw * 0.287); // mini card width (~104pt)
  const mh = Math.round(mw * 1.165); // mini card height (~121pt)
  const avatarSize = Math.round(cw * 0.19); // ~69pt
  const miniTop = Math.round((ch - mh) / 2); // vertical centering

  return (
    <View
      style={[styles.card, { width: cw, height: ch, transform: [{ rotate: entry.cardRotation }] }]}
    >
      {/* Left: avatar, name, time ago */}
      <View style={[styles.leftInfo, { width: Math.round(cw * 0.36) }]}>
        {entry.avatarUri ? (
          <Image
            source={{ uri: entry.avatarUri }}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize,
              marginBottom: 6,
            }}
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize,
                backgroundColor: entry.avatarColor,
              },
            ]}
          >
            <Text style={[styles.avatarInitial, { fontSize: Math.round(avatarSize * 0.38) }]}>
              {entry.name[0]}
            </Text>
          </View>
        )}
        <Text style={styles.friendName}>{entry.name}</Text>
        <Text style={styles.timeAgo}>{entry.timeAgo}</Text>
      </View>

      {/* Photo card — behind the stat card */}
      <View
        style={[
          styles.photoCard,
          {
            left: Math.round(cw * 0.596),
            top: miniTop - 4,
            width: mw,
            height: mh,
            transform: [{ rotate: '7deg' }],
          },
        ]}
      >
        {entry.photoUri ? (
          <Image
            source={{ uri: entry.photoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#C8C8C8' }]} />
        )}
      </View>

      {/* Stat card — in front */}
      <View
        style={[
          styles.statCard,
          {
            left: Math.round(cw * 0.364),
            top: miniTop + 4,
            width: mw,
            height: mh,
            transform: [{ rotate: '-5deg' }],
          },
        ]}
      >
        <Text style={styles.statLabel}>Workout</Text>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {entry.workoutName}
        </Text>
        <Text style={styles.statLabel}>Time</Text>
        <Text style={styles.statValue}>{entry.duration}</Text>
        <Text style={styles.statLabel}>Volume</Text>
        <Text style={styles.statValue}>{entry.volume}</Text>
      </View>
    </View>
  );
}

function renderCaption(caption: string): React.ReactNode {
  const parts = caption.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <Text key={i} style={styles.postCaptionMention}>
        {part}
      </Text>
    ) : (
      <Text key={i}>{part}</Text>
    )
  );
}

function WorkoutPostCard({ post, colWidth }: { post: WorkoutPost; colWidth: number }) {
  const cardHeight = Math.round(colWidth * post.aspectRatio);
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={[styles.postCard, { height: cardHeight }]}>
        {post.imageUri ? (
          <Image
            source={{ uri: post.imageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.postUserOverlay}>
          {post.avatarUri ? (
            <Image source={{ uri: post.avatarUri }} style={styles.postAvatar} />
          ) : (
            <View style={styles.postAvatar} />
          )}
          <Text style={styles.postUsername}>{post.username}</Text>
        </View>
      </View>
      <Text style={styles.postCaption}>{renderCaption(post.caption)}</Text>
    </View>
  );
}

function DiscoverFeed() {
  const { width } = useWindowDimensions();
  const colWidth = Math.floor((width - 32 - 6) / 2);
  const [posts, setPosts] = useState<WorkoutPost[]>(MOCK_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoadingRef = useRef(false);
  const nextId = useRef(MOCK_POSTS.length + 1);

  const leftPosts = posts.filter((_, i) => i % 2 === 0);
  const rightPosts = posts.filter((_, i) => i % 2 !== 0);

  async function loadMore() {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    const next = generatePosts(nextId.current, 6);
    nextId.current += 6;
    setPosts((prev) => [...prev, ...next]);
    setLoading(false);
    isLoadingRef.current = false;
  }

  async function onRefresh() {
    setRefreshing(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    nextId.current = MOCK_POSTS.length + 1;
    setPosts(MOCK_POSTS);
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={styles.discoverScrollContent}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={200}
      onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) {
          loadMore();
        }
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }
    >
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={{ flex: 1, gap: 8 }}>
          {leftPosts.map((p) => (
            <WorkoutPostCard key={p.id} post={p} colWidth={colWidth} />
          ))}
          {loading && <View style={[styles.postCard, { height: Math.round(colWidth * 1.25) }]} />}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          {rightPosts.map((p) => (
            <WorkoutPostCard key={p.id} post={p} colWidth={colWidth} />
          ))}
          {loading && <View style={[styles.postCard, { height: Math.round(colWidth * 1.1) }]} />}
        </View>
      </View>
    </ScrollView>
  );
}

export default function FriendsScreen() {
  const { top } = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<'friends' | 'discover'>('friends');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 4 }]}>
        <Pressable style={styles.titleRow} onPress={() => setDropdownOpen((v) => !v)}>
          <Text style={styles.title}>{activeView === 'friends' ? 'My Friends' : 'Discover'}</Text>
          <View style={[styles.dropArrow, dropdownOpen && styles.dropArrowUp]} />
        </Pressable>

        <View style={styles.headerIcons}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Ionicons name="person-add-outline" size={20} color="#000" />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Ionicons name="share-outline" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* Dropdown */}
      {dropdownOpen && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDropdownOpen(false)} />
          <View style={[styles.dropdown, { top: top + 56 }]}>
            {(['friends', 'discover'] as const).map((v) => (
              <Pressable
                key={v}
                style={styles.dropdownOption}
                onPress={() => {
                  setActiveView(v);
                  setDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    activeView === v && styles.dropdownOptionActive,
                  ]}
                >
                  {v === 'friends' ? 'My Friends' : 'Discover'}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {activeView === 'friends' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {MOCK_FRIENDS.map((entry) => (
            <FriendCard key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      ) : (
        <DiscoverFeed />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: '#000',
    letterSpacing: -0.3,
  },
  dropArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000000',
    marginTop: 3,
  },
  dropArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdown: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    minWidth: 160,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dropdownOptionText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#AAAAAA',
  },
  dropdownOptionActive: {
    color: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 28,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  leftInfo: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    gap: 2,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  friendName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  timeAgo: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  photoCard: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  statCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 10,
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
  },
  statValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  discoverScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  postCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  postUserOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C0C0C0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  postUsername: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  postCaption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.75)',
    marginTop: 5,
    letterSpacing: -0.2,
  },
  postCaptionMention: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.75)',
    letterSpacing: -0.2,
  },
});
