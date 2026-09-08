import { useRef, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, PackageCheck, Fuel } from 'lucide-react-native';
import { useOnboardingStore } from '../stores/onboardingStore';
import Button from '../components/Button';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    Icon: Truck,
    title: 'Track every trip in real time',
    body: 'Start a trip and your location shares automatically so dispatch always knows where you are.',
  },
  {
    Icon: PackageCheck,
    title: 'Confirm deliveries on the spot',
    body: 'Mark each cargo item delivered or failed, with a photo and customer signature right from your phone.',
  },
  {
    Icon: Fuel,
    title: 'Log fuel, see your ratings',
    body: 'Record fuel purchases as you go, and check your trip history and performance any time.',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const complete = useOnboardingStore((s) => s.complete);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      complete();
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.skip} onPress={complete}>
        Skip
      </Text>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <item.Icon size={56} color={colors.charcoal} strokeWidth={1.75} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button title={isLast ? 'Get Started' : 'Next'} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.charcoal, textAlign: 'center' },
  body: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.lime, width: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 8 },
});
