import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
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

type UserRole = 'student' | 'teacher';

const CLASSES = [
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SS 1',
  'SS 2',
  'SS 3',
];

const SUBJECTS = [
  'Mathematics',
  'English Language',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Government',
  'Economics',
  'Literature in English',
  'Further Mathematics',
  'Computer Science',
  'Technical Drawing',
  'Fine Arts',
  'Music',
  'Physical Education',
  'Agricultural Science',
  'Home Economics',
  'Integrated Science',
  'Civic Education',
  'French',
  'Islamic Studies',
  'Christian Religious Studies',
];

// Utility function to validate Nigerian phone numbers
const validateNigerianPhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters except leading +
  const cleaned = phoneNumber.replace(/\s/g, '');

  // Nigerian phone number patterns:
  // +234XXXXXXXXXX (with country code)
  // 0XXXXXXXXXX (without country code, starts with 0)
  // 234XXXXXXXXXX (without + sign)

  const nigerianPhoneRegex = /^(\+234|0|234)[789]\d{9}$/;
  return nigerianPhoneRegex.test(cleaned);
};

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form values
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Animation values for role switch
  const [switchAnim] = useState(new Animated.Value(1));

  const handleRoleSwitch = (role: UserRole) => {
    if (role === selectedRole) return;
    
    Animated.sequence([
      Animated.timing(switchAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(switchAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedRole(role);
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setShowClassPicker(false);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subject)) {
        return prev.filter((s) => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleRegister = async () => {
    // Validate form
    if (selectedRole === 'student') {
      if (!studentId.trim()) {
        Alert.alert('Required Field', 'Please enter your Student ID');
        return;
      }
      if (!selectedClass) {
        Alert.alert('Required Field', 'Please select your class');
        return;
      }
      if (!phoneNumber.trim()) {
        Alert.alert('Required Field', 'Please enter your phone number');
        return;
      }
      // Validate phone number format
      if (!validateNigerianPhoneNumber(phoneNumber)) {
        setPhoneError('Please enter a valid Nigerian phone number (e.g., +234 800 000 0000 or 08012345678)');
        return;
      }
    } else {
      if (!teacherId.trim()) {
        Alert.alert('Required Field', 'Please enter your Teacher ID');
        return;
      }
      if (selectedSubjects.length === 0) {
        Alert.alert('Required Field', 'Please select at least one subject you teach');
        return;
      }
      if (!phoneNumber.trim()) {
        Alert.alert('Required Field', 'Please enter your phone number');
        return;
      }
      // Validate phone number format
      if (!validateNigerianPhoneNumber(phoneNumber)) {
        setPhoneError('Please enter a valid Nigerian phone number (e.g., +234 800 000 0000 or 08012345678)');
        return;
      }
      if (!password.trim()) {
        Alert.alert('Required Field', 'Please enter a password');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Password Too Short', 'Password must be at least 6 characters long');
        return;
      }
    }

    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Simulate registration delay (in real app, this would be an API call)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to main app
      setIsLoading(false);
      navigation.navigate('Tabs');
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {}}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Register</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding Section */}
        <View style={styles.brandingSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="school" 
              size={36} 
              color="#135BEC" 
            />
          </View>
          <Text style={styles.mainTitle}>Join El-Leonoa College</Text>
          <Text style={styles.subtitle}>Access your scheme of work instantly.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* User Role Switch */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>User Role</Text>
            <View style={styles.roleSwitch}>
              <Pressable
                style={styles.roleOption}
                onPress={() => handleRoleSwitch('student')}
              >
                <View
                  style={[
                    styles.roleOptionInner,
                    selectedRole === 'student' && styles.roleOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      selectedRole === 'student' && styles.roleTextActive,
                    ]}
                  >
                    Student
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.roleOption}
                onPress={() => handleRoleSwitch('teacher')}
              >
                <View
                  style={[
                    styles.roleOptionInner,
                    selectedRole === 'teacher' && styles.roleOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      selectedRole === 'teacher' && styles.roleTextActive,
                    ]}
                  >
                    Teacher
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Animated Form Content */}
          <Animated.View style={{ opacity: switchAnim }}>
            {selectedRole === 'student' ? (
              <>
                {/* Student ID */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Student ID</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="card-outline" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="ELC-2023-001"
                      placeholderTextColor="#9CA3AF"
                      value={studentId}
                      onChangeText={setStudentId}
                    />
                  </View>
                </View>

                {/* Class */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Class</Text>
                  <Pressable 
                    style={styles.inputContainer}
                    onPress={() => setShowClassPicker(true)}
                  >
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="book-outline" size={20} color="#9CA3AF" />
                    </View>
                    <Text style={[
                      styles.inputText, 
                      !selectedClass && styles.inputPlaceholder
                    ]}>
                      {selectedClass || 'Select your class'}
                    </Text>
                    <View style={styles.inputIconRight}>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </View>
                  </Pressable>
                </View>

                {/* Phone Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputContainer, phoneError && styles.inputContainerError]}>
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="+234 800 000 0000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                    />
                  </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                </View>
              </>
            ) : (
              <>
                {/* Teacher ID */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Teacher ID</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="card-outline" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="ELC-2023-001"
                      placeholderTextColor="#9CA3AF"
                      value={teacherId}
                      onChangeText={setTeacherId}
                    />
                  </View>
                </View>

                {/* Subject(s) Taught */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Subject(s) Taught</Text>
                  <Pressable
                    style={styles.inputContainer}
                    onPress={() => setShowSubjectPicker(true)}
                  >
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="book-outline" size={20} color="#9CA3AF" />
                    </View>
                    <Text style={[
                      styles.inputText,
                      selectedSubjects.length === 0 && styles.inputPlaceholder
                    ]}>
                      {selectedSubjects.length === 0
                        ? 'Select subject(s)'
                        : selectedSubjects.length === 1
                        ? selectedSubjects[0]
                        : `${selectedSubjects.length} subjects selected`}
                    </Text>
                    <View style={styles.inputIconRight}>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </View>
                  </Pressable>
                </View>

                {/* Phone Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputContainer, phoneError && styles.inputContainerError]}>
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="+234 800 000 0000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                    />
                  </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconLeft}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable 
                      style={styles.inputIconRight}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#9CA3AF" 
                      />
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </Animated.View>

          {/* Terms and Privacy */}
          <View style={styles.termsContainer}>
            <Pressable
              style={styles.checkbox}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkboxBox, agreed && styles.checkboxChecked]}>
                {agreed && (
                  <Ionicons name="checkmark" size={14} color="#135BEC" />
                )}
              </View>
            </Pressable>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, (!agreed || isLoading) && styles.submitButtonDisabled]}
            disabled={!agreed || isLoading}
            onPress={handleRegister}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Register & Activate</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Class Picker Modal */}
      <Modal
        visible={showClassPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowClassPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <Pressable onPress={() => setShowClassPicker(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </Pressable>
            </View>
            <ScrollView style={styles.classListContainer}>
              {CLASSES.map((className) => (
                <Pressable
                  key={className}
                  style={[
                    styles.classOption,
                    selectedClass === className && styles.classOptionSelected
                  ]}
                  onPress={() => handleClassSelect(className)}
                >
                  <Text style={[
                    styles.classOptionText,
                    selectedClass === className && styles.classOptionTextSelected
                  ]}>
                    {className}
                  </Text>
                  {selectedClass === className && (
                    <Ionicons name="checkmark" size={20} color="#135BEC" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSubjectPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject(s)</Text>
              <Pressable onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </Pressable>
            </View>
            <ScrollView style={styles.classListContainer}>
              {SUBJECTS.map((subject) => (
                <Pressable
                  key={subject}
                  style={[
                    styles.classOption,
                    selectedSubjects.includes(subject) && styles.classOptionSelected
                  ]}
                  onPress={() => toggleSubject(subject)}
                >
                  <View style={styles.subjectOptionContent}>
                    <Text style={[
                      styles.classOptionText,
                      selectedSubjects.includes(subject) && styles.classOptionTextSelected
                    ]}>
                      {subject}
                    </Text>
                  </View>
                  {selectedSubjects.includes(subject) && (
                    <Ionicons name="checkmark" size={20} color="#135BEC" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalFooterButton}
                onPress={() => setShowSubjectPicker(false)}
              >
                <Text style={styles.modalFooterButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.27,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  brandingSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 91, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.75,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    lineHeight: 14,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  roleOption: {
    flex: 1,
  },
  roleOptionInner: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 20,
  },
  roleTextActive: {
    color: '#135BEC',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  inputIconLeft: {
    marginRight: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconRight: {
    marginLeft: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
    padding: 0,
    height: 20,
    outlineStyle: 'none',
    outlineWidth: 0,
  } as any,
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
  },
  inputPlaceholder: {
    color: '#9CA3AF',
  },
  inputContainerError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#EF4444',
    marginTop: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  checkbox: {
    paddingTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#135BEC',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#135BEC',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#135BEC',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  classListContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#F9FAFB',
  },
  classOptionSelected: {
    backgroundColor: 'rgba(19, 91, 236, 0.1)',
  },
  classOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  classOptionTextSelected: {
    color: '#135BEC',
    fontWeight: '600',
  },
  subjectOptionContent: {
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalFooterButton: {
    backgroundColor: '#135BEC',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
