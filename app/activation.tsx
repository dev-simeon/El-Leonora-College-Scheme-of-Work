import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Register: undefined;
  Activation: undefined;
  Tabs: undefined;
  Details: { id: string };
};

export default function ActivationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleCodeChange = (text: string) => {
    // Only allow numbers and limit to 4 digits
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setCode(numericText);
    }
  };

  const handleUnlockAccess = () => {
    if (code.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a complete 4-digit activation code');
      return;
    }

    // Here you would validate the code with your backend
    // For now, we'll just navigate to the main app
    Alert.alert(
      'Access Unlocked!',
      `Your activation code ${code} has been verified.`,
      [
        {
          text: 'Continue',
          onPress: () => navigation.navigate('Tabs'),
        },
      ]
    );
  };

  const handleWhereToGetCode = () => {
    Alert.alert(
      'Where to Get Your Code',
      'Your unique 4-digit activation code can be obtained from:\n\n• The school bursar office\n• Your registration confirmation email\n• The school administration office\n\nIf you haven\'t received your code, please contact the bursar.',
      [{ text: 'Got it' }]
    );
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Contact Admin',
      'Need help? You can reach out to:\n\nEmail: admin@el-leonoa.edu.ng\nPhone: +234 800 000 0000\n\nOur support team is available Mon-Fri, 8am-5pm',
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" translucent={false} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>
          <Text style={styles.headerTitle}>Activation</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Icon Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <MaterialCommunityIcons 
                  name="shield-check" 
                  size={48} 
                  color="#135BEC" 
                />
              </View>
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
              </View>
            </View>
            <Text style={styles.logoText}>Unlock Scheme of Work</Text>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.mainHeading}>Enter Activation Code</Text>
            <Text style={styles.description}>
              Please enter the unique 4-digit code provided{'\n'}
              by the bursar to unlock your materials.
            </Text>

            {/* Code Input */}
            <Pressable 
              style={styles.codeInputWrapper}
              onPress={() => inputRef.current?.focus()}
            >
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>
                  {code.padEnd(4, '0').split('').join(' ')}
                </Text>
              </View>
            </Pressable>

            {/* Hidden actual input */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus={false}
            />

            <View style={styles.formatHint}>
              <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
              <Text style={styles.formatText}>Format: EL-XXXX (Numbers only)</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <Pressable 
              style={[styles.unlockButton, code.length !== 4 && styles.unlockButtonDisabled]}
              onPress={handleUnlockAccess}
              disabled={code.length !== 4}
            >
              <Ionicons name="lock-open" size={24} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Unlock Access</Text>
            </Pressable>

            <Pressable 
              style={styles.secondaryButton}
              onPress={handleWhereToGetCode}
            >
              <Text style={styles.secondaryButtonText}>Where do I get my code?</Text>
            </Pressable>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Need technical help?{' '}
              <Text style={styles.helpLink} onPress={handleContactAdmin}>
                Contact Admin
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#F6F6F8',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.27,
    flex: 1,
    textAlign: 'center',
    marginRight: 48,
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 54,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  logoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  contentSection: {
    width: '100%',
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 7,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 16,
  },
  codeInputWrapper: {
    marginTop: 24,
  },
  codeDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 12,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  formatHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
    lineHeight: 16,
  },
  actionsSection: {
    marginTop: 32,
    width: '100%',
  },
  unlockButton: {
    backgroundColor: '#135BEC',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    paddingVertical: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  unlockButtonDisabled: {
    opacity: 0.5,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#135BEC',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  helpLink: {
    textDecorationLine: 'underline',
    color: '#475569',
  },
});
