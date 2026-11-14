/**
 * Kannada-first voice interface for grounded MatsyaMitra marine intelligence.
 * Speech is recorded locally and sent only to the configured MatsyaMitra backend.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  type AVEncodingOption,
} from 'react-native-nitro-sound';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useLanguage } from '../i18n';
import { getUserProfile } from '../services/storage/userProfileStorage';
import { getCanonicalCityName, localizeCityName } from '../services/api';
import { apiClient, type CurrentStateResponse, type VoiceQueryResponse } from '../services/api';

const MAX_RECORD_SECONDS = 25;

const copy = {
  en: {
    title: 'MatsyaMitra Voice',
    subtitle: 'Ask about the sea in Kannada or English',
    chooseLocation: 'Choose your coastal location',
    record: 'Tap to speak',
    stop: 'Stop & ask',
    recording: 'Listening… speak your question',
    working: 'Understanding your question and checking marine data…',
    textTitle: 'Or type a question',
    textPlaceholder: 'Example: What is the sea condition at Malpe?',
    ask: 'Ask MatsyaMitra',
    transcript: 'I heard',
    answer: 'MatsyaMitra says',
    source: 'Data source',
    observed: 'Observation / bulletin date',
    freshness: 'Data status',
    play: 'Play Kannada answer',
    stopAudio: 'Stop audio',
    disclaimer: 'Decision support only. This is not a sailing clearance. Always check official marine warnings and local authorities.',
    noLocation: 'Loading coastal locations…',
    permission: 'Microphone permission is required to ask by voice.',
    empty: 'Please enter a question first.',
    retry: 'Try again',
    recordingLimit: 'Recording stopped at 25 seconds. Processing your question…',
    noAudio: 'Voice playback is unavailable for this response.',
    noSpeech: 'I could not hear you. Hold the phone close, speak clearly and try again.',
    noServer: 'Cannot reach MatsyaMitra right now. Check your network and try again.',
  },
  kn: {
    title: 'ಮತ್ಸ್ಯಮಿತ್ರ ಧ್ವನಿ ಸಹಾಯಕ',
    subtitle: 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸಮುದ್ರದ ಬಗ್ಗೆ ಕೇಳಿ',
    chooseLocation: 'ನಿಮ್ಮ ಕರಾವಳಿ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ',
    record: 'ಮಾತನಾಡಲು ಒತ್ತಿ',
    stop: 'ನಿಲ್ಲಿಸಿ ಮತ್ತು ಕೇಳಿ',
    recording: 'ಕೇಳುತ್ತಿದ್ದೇವೆ… ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಹೇಳಿ',
    working: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡು ಸಮುದ್ರದ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    textTitle: 'ಅಥವಾ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ',
    textPlaceholder: 'ಉದಾಹರಣೆ: ಮಲ್ಪೆಯಲ್ಲಿ ಸಮುದ್ರದ ಸ್ಥಿತಿ ಹೇಗಿದೆ?',
    ask: 'ಮತ್ಸ್ಯಮಿತ್ರವನ್ನು ಕೇಳಿ',
    transcript: 'ನೀವು ಕೇಳಿದ್ದು',
    answer: 'ಮತ್ಸ್ಯಮಿತ್ರದ ಉತ್ತರ',
    source: 'ಮಾಹಿತಿ ಮೂಲ',
    observed: 'ಮಾಹಿತಿ ದಿನಾಂಕ / ಸಮಯ',
    freshness: 'ಮಾಹಿತಿ ಸ್ಥಿತಿ',
    play: 'ಕನ್ನಡ ಉತ್ತರ ಕೇಳಿ',
    stopAudio: 'ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ',
    disclaimer: 'ಇದು ನಿರ್ಧಾರಕ್ಕೆ ಸಹಾಯಕ ಮಾಹಿತಿ ಮಾತ್ರ; ಸಮುದ್ರಕ್ಕೆ ಹೊರಡುವ ಅನುಮತಿ ಅಲ್ಲ. ಅಧಿಕೃತ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆ ಮತ್ತು ಸ್ಥಳೀಯ ಅಧಿಕಾರಿಗಳ ಸೂಚನೆ ಪರಿಶೀಲಿಸಿ.',
    noLocation: 'ಕರಾವಳಿ ಸ್ಥಳಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…',
    permission: 'ಧ್ವನಿ ಪ್ರಶ್ನೆಗೆ ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಅಗತ್ಯ.',
    empty: 'ಮೊದಲು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಬರೆಯಿರಿ.',
    retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    recordingLimit: '25 ಸೆಕೆಂಡುಗಳ ನಂತರ ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ. ಪ್ರಶ್ನೆ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    noAudio: 'ಈ ಉತ್ತರಕ್ಕೆ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ.',
    noSpeech: 'ನಿಮ್ಮ ಮಾತು ಕೇಳಿಸಲಿಲ್ಲ. ಫೋನ್ ಹತ್ತಿರ ಹಿಡಿದು ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತೆ ಹೇಳಿ.',
    noServer: 'ಮತ್ಸ್ಯಮಿತ್ರ ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಿಗುತ್ತಿಲ್ಲ. ನೆಟ್‌ವರ್ಕ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  },
};

const VoiceAssistantScreen: React.FC = () => {
  const { language, t: tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const t = copy[language];
  const [locations, setLocations] = useState<CurrentStateResponse[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<VoiceQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef(false);
  const stopAndSendRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let active = true;
    apiClient.getCurrentStates()
      .then((items) => {
        if (!active) return;
        setLocations(items);
        // Start on the fisher's own home port rather than the first port in the list.
        getUserProfile()
          .then((profile) => {
            if (!active) return;
            const home = items.find((item) => item.location_id === profile?.defaultPortId);
            setSelectedLocation((home || items[0])?.location_id || '');
          })
          .catch(() => {
            if (active && items.length > 0) setSelectedLocation(items[0].location_id);
          });
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Could not load coastal locations.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isFocused || locations.length === 0 || recordingRef.current) return;
    getUserProfile()
      .then((profile) => {
        if (profile?.defaultPortId && locations.some((item) => item.location_id === profile.defaultPortId)) {
          setSelectedLocation((current) => current || profile.defaultPortId);
        }
      })
      .catch(() => undefined);
  }, [isFocused, locations]);

  // Speak the answer automatically — many fishers would rather listen than read.
  const lastSpokenRef = useRef<string | null>(null);
  useEffect(() => {
    const url = result?.audio_url;
    if (!url || lastSpokenRef.current === url) return;
    lastSpokenRef.current = url;
    Sound.startPlayer(apiClient.getVoiceAudioUrl(url))
      .then(() => {
        setPlaying(true);
        Sound.addPlaybackEndListener(() => setPlaying(false));
      })
      .catch(() => setPlaying(false));
  }, [result]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => {
      setRecordSeconds((current) => Math.min(current + 1, MAX_RECORD_SECONDS));
    }, 1000);
    const stopTimer = setTimeout(() => stopAndSendRef.current(), MAX_RECORD_SECONDS * 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(stopTimer);
    };
  }, [recording]);

  useEffect(() => {
    stopAndSendRef.current = stopAndSend;
  });

  useEffect(() => () => {
    if (recordingRef.current) {
      recordingRef.current = false;
      Sound.stopRecorder().catch(() => undefined);
      Sound.removeRecordBackListener();
    }
    Sound.stopPlayer().catch(() => undefined);
    Sound.removePlaybackEndListener();
  }, []);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const resultPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'MatsyaMitra microphone permission',
      message: t.permission,
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    });
    return resultPermission === PermissionsAndroid.RESULTS.GRANTED;
  }, [t.permission]);

  const startRecording = useCallback(async () => {
    if (!selectedLocation) {
      setError(t.noLocation);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const permitted = await requestMicrophonePermission();
      if (!permitted) {
        setError(t.permission);
        return;
      }
      const audioSet = Platform.select({
        android: {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          AudioSamplingRate: 16000,
          AudioEncodingBitRate: 64000,
          AudioChannels: 1,
        },
        ios: {
          AVSampleRateKeyIOS: 16000,
          AVFormatIDKeyIOS: 'aac' as AVEncodingOption,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 1,
        },
      });
      await Sound.startRecorder(undefined, audioSet);
      recordingRef.current = true;
      setRecordSeconds(0);
      setRecording(true);
    } catch (err: any) {
      recordingRef.current = false;
      setRecording(false);
      setError(err?.message || 'Could not start microphone recording.');
    } finally {
      setLoading(false);
    }
  }, [requestMicrophonePermission, selectedLocation, t.noLocation, t.permission]);

  async function stopAndSend() {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);
    setLoading(true);
    setError(null);
    try {
      const recordingPath = await Sound.stopRecorder();
      const response = await apiClient.queryVoiceAudio(recordingPath, selectedLocation, language === 'kn' ? 'kn-IN' : 'en-IN');
      setResult(response);
      if (recordSeconds >= MAX_RECORD_SECONDS) setError(t.recordingLimit);
    } catch (err: any) {
      setError(friendlyError(err?.message, 'Voice request failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  const submitTextQuestion = useCallback(async () => {
    if (!question.trim()) {
      setError(t.empty);
      return;
    }
    if (!selectedLocation) {
      setError(t.noLocation);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiClient.queryVoiceText(question.trim(), selectedLocation, true, language === 'kn' ? 'kn-IN' : 'en-IN');
      setResult(response);
    } catch (err: any) {
      setError(friendlyError(err?.message, 'Question failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [question, selectedLocation, t.empty, t.noLocation]);

  const playAnswer = useCallback(async () => {
    if (!result?.audio_url) {
      Alert.alert(t.title, result?.audio_error || t.noAudio);
      return;
    }
    try {
      if (playing) {
        await Sound.stopPlayer();
        setPlaying(false);
        return;
      }
      await Sound.startPlayer(apiClient.getVoiceAudioUrl(result.audio_url));
      setPlaying(true);
      Sound.addPlaybackEndListener(() => setPlaying(false));
    } catch (err: any) {
      setPlaying(false);
      setError(err?.message || 'Could not play the spoken response.');
    }
  }, [playing, result, t.noAudio, t.title]);

  // Turn technical failures into something a fisher can act on.
  const friendlyError = (message: string | undefined, fallback: string): string => {
    const text = (message || '').toLowerCase();
    if (text.includes('empty transcript') || text.includes('audio recording is empty')) return t.noSpeech;
    if (text.includes('network') || text.includes('timeout') || text.includes('timed out') || text.includes('unreachable')) return t.noServer;
    return message || fallback;
  };

  const selectedItem = locations.find((item) => item.location_id === selectedLocation);
  const selectedName = selectedItem ? getCanonicalCityName(selectedItem.location_id, selectedItem.city_name) : undefined;
  const examples = language === 'kn'
    ? ['ಸಮುದ್ರ ಹೇಗಿದೆ?', 'ಸಮುದ್ರಕ್ಕೆ ಹೋಗಬಹುದಾ?', 'ಮೀನು ಸಿಗುವ ಜಾಗ ಎಲ್ಲಿ?']
    : ['How is the sea?', 'Can I go fishing?', 'Where is the fishing zone?'];

  const freshnessLabel = (value: string): string => {
    const kn = language === 'kn';
    if (value === 'CURRENT') return kn ? 'ಪ್ರಸ್ತುತ ಮಾಹಿತಿ' : 'Current';
    if (value === 'STALE') return kn ? 'ಹಳೆಯ ಮಾಹಿತಿ' : 'Old reading';
    if (value === 'BULLETIN_DATE') return kn ? 'ಬುಲೆಟಿನ್ ದಿನಾಂಕ' : 'Bulletin date';
    return kn ? 'ಮಾಹಿತಿ ಇಲ್ಲ' : 'Not available';
  };
  const sourceLabel = (value: string | null): string => {
    if (!value) return '—';
    const known: Record<string, string> = { 'open-meteo': 'Open-Meteo', gee: 'Satellite (GEE)', INCOIS: 'INCOIS' };
    return known[value] || value;
  };
  // "2026-11-12T22:30:00+05:30" -> "12 Nov, 10:30 pm"; plain dates are shown as they are.
  const formatObserved = (value: string | null): string => {
    if (!value) return '—';
    if (!value.includes('T')) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]}, ${hours % 12 || 12}:${minutes} ${hours < 12 ? 'am' : 'pm'}`;
  };

  const askExample = async (text: string) => {
    if (loading || recording || !selectedLocation) return;
    setQuestion(text);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await apiClient.queryVoiceText(text, selectedLocation, true, language === 'kn' ? 'kn-IN' : 'en-IN'));
    } catch (err: any) {
      setError(friendlyError(err?.message, 'Question failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.headerIcon}><Icon name="waves" size={25} color="#FFFFFF" /></View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.sectionLabel}>{t.chooseLocation}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationPills}>
          {locations.map((location) => {
            const active = location.location_id === selectedLocation;
            return (
              <Pressable
                key={location.location_id}
                onPress={() => { setSelectedLocation(location.location_id); setResult(null); }}
                style={[styles.locationPill, active && styles.locationPillActive]}>
                <Text style={[styles.locationText, active && styles.locationTextActive]}>{localizeCityName(getCanonicalCityName(location.location_id, location.city_name), language)}</Text>
              </Pressable>
            );
          })}
          {locations.length === 0 && <Text style={styles.muted}>{t.noLocation}</Text>}
        </ScrollView>
      </View>

      <View style={styles.voiceCard}>
        <View style={styles.voiceOrb}><Icon name="microphone" size={39} color="#FFFFFF" /></View>
        <Text style={styles.recordTitle}>{recording ? t.recording : t.record}</Text>
        <Text style={styles.recordTime}>{recording ? `00:${String(recordSeconds).padStart(2, '0')} / 00:${MAX_RECORD_SECONDS}` : 'Kannada · English · 25 sec max'}</Text>
        <Pressable
          disabled={loading}
          onPress={recording ? stopAndSend : startRecording}
          style={[styles.recordButton, recording && styles.stopButton, loading && styles.disabledButton]}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Icon name={recording ? 'stop' : 'microphone'} size={23} color="#FFFFFF" />}
          <Text style={styles.recordButtonText}>{loading ? '...' : recording ? t.stop : t.record}</Text>
        </Pressable>
        {!!selectedName && (
          <View style={styles.askingAbout}>
            <Icon name="map-marker" size={14} color="#CCFBF1" />
            <Text style={styles.askingAboutText}>{localizeCityName(selectedName, language)}</Text>
          </View>
        )}
      </View>
      {loading && <View style={styles.loadingRow}><ActivityIndicator color="#0D9488" /><Text style={styles.muted}>{t.working}</Text></View>}
      {!!error && <View style={styles.errorBox}><Icon name="alert-circle-outline" size={18} color="#B45309" /><Text style={styles.errorText}>{error}</Text></View>}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.sectionLabel}>{t.transcript}</Text>
          <Text style={styles.transcript}>{result.transcript}</Text>
          <View style={styles.resultDivider} />
          <Text style={styles.sectionLabel}>{t.answer}</Text>
          <Text style={styles.answer}>{result.answer}</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{language === 'kn' ? 'ಸ್ಥಳ' : 'Location'}</Text>
              <Text style={styles.metaValue}>{result.location_name ? localizeCityName(result.location_name, language) : '—'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t.source}</Text>
              <Text style={styles.metaValue}>{sourceLabel(result.source)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t.freshness}</Text>
              <Text style={[styles.metaValue, result.freshness === 'STALE' && styles.stale]}>{freshnessLabel(result.freshness)}</Text>
            </View>
            <View style={styles.metaItemFull}>
              <Text style={styles.metaLabel}>{t.observed}</Text>
              <Text style={styles.metaValue}>{formatObserved(result.observed_at)}</Text>
            </View>
          </View>
          {!!result.audio_url && (
            <Pressable onPress={playAnswer} style={styles.playButton}>
              <Icon name={playing ? 'stop-circle-outline' : 'volume-high'} size={19} color="#0F766E" />
              <Text style={styles.playButtonText}>{playing ? t.stopAudio : t.play}</Text>
            </Pressable>
          )}
          {!!result.audio_error && <Text style={styles.audioNotice}>{result.audio_error}</Text>}
          {!!result.processing_ms && <Text style={styles.processing}>{`${(Number(result.processing_ms) / 1000).toFixed(1)} s`}</Text>}
        </View>
      )}

      <View style={styles.examplesCard}>
        <Text style={styles.sectionLabel}>{tr('voice_try')}</Text>
        <View style={styles.examplesWrap}>
          {examples.map((example) => (
            <Pressable
              key={example}
              disabled={loading || recording}
              onPress={() => askExample(example)}
              style={[styles.exampleChip, (loading || recording) && styles.disabledButton]}>
              <Icon name="chat-question-outline" size={16} color="#0F766E" />
              <Text style={styles.exampleText}>{example}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.textCard}>
        <Text style={styles.sectionLabel}>{t.textTitle}</Text>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder={t.textPlaceholder}
          placeholderTextColor="#94A3B8"
          multiline
          style={styles.questionInput}
          editable={!loading}
        />
        <Pressable onPress={submitTextQuestion} disabled={loading} style={[styles.askButton, loading && styles.disabledButton]}>
          <Icon name="send" size={17} color="#FFFFFF" />
          <Text style={styles.askButtonText}>{t.ask}</Text>
        </Pressable>
      </View>

      <View style={styles.disclaimerBox}>
        <Icon name="shield-alert-outline" size={19} color="#B45309" />
        <Text style={styles.disclaimer}>{t.disclaimer}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F7F8' },
  content: { padding: 16, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headerIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 3 },
  locationCard: { padding: 15, backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionLabel: { color: '#334155', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  locationPills: { gap: 8, paddingRight: 4 },
  locationPill: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  locationPillActive: { backgroundColor: '#CCFBF1', borderColor: '#0D9488' },
  locationText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  locationTextActive: { color: '#0F766E', fontWeight: '800' },
  selectedCode: { color: '#94A3B8', fontSize: 10, marginTop: 9 },
  voiceCard: { alignItems: 'center', padding: 22, borderRadius: 22, backgroundColor: '#0F766E', marginBottom: 14 },
  voiceOrb: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  recordTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  recordTime: { color: '#CCFBF1', fontSize: 11, marginTop: 6, marginBottom: 18 },
  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, alignSelf: 'stretch', minHeight: 58, borderRadius: 29, backgroundColor: '#115E59', paddingHorizontal: 22, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  stopButton: { backgroundColor: '#B91C1C' },
  disabledButton: { opacity: 0.6 },
  recordButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 17 },
  textCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  questionInput: { minHeight: 78, textAlignVertical: 'top', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, color: '#0F172A', fontSize: 14 },
  askButton: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0D9488', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginTop: 10 },
  askButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12 },
  muted: { color: '#64748B', fontSize: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { color: '#92400E', fontSize: 12, flex: 1, lineHeight: 18 },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#BAE6FD', padding: 16, marginBottom: 14 },
  transcript: { color: '#475569', fontSize: 14, lineHeight: 21 },
  resultDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },
  answer: { color: '#0F172A', fontSize: 17, lineHeight: 27, fontWeight: '600' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  metaItem: { minWidth: '44%', flexGrow: 1 },
  metaItemFull: { width: '100%' },
  metaLabel: { color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', fontWeight: '800', marginBottom: 4 },
  metaValue: { color: '#334155', fontSize: 12, fontWeight: '700' },
  stale: { color: '#B45309' },
  playButton: { marginTop: 16, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#CCFBF1', alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  playButtonText: { color: '#0F766E', fontSize: 15, fontWeight: '800' },
  audioNotice: { color: '#B45309', fontSize: 11, marginTop: 9 },
  processing: { color: '#94A3B8', fontSize: 10, marginTop: 12 },
  disclaimerBox: { flexDirection: 'row', gap: 9, backgroundColor: '#FFFBEB', padding: 13, borderRadius: 13, borderWidth: 1, borderColor: '#FDE68A' },
  disclaimer: { flex: 1, color: '#92400E', fontSize: 11, lineHeight: 17 },
  askingAbout: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  askingAboutText: { color: '#CCFBF1', fontSize: 13, fontWeight: '700' },
  examplesCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  examplesWrap: { gap: 8 },
  exampleChip: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  exampleText: { flex: 1, color: '#0F766E', fontSize: 15, fontWeight: '700' },
});

export default VoiceAssistantScreen;
