import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/colors";

const CloseIcon = () => (
  <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
    <Path
      d="M5.33317 17.8333L4.1665 16.6666L8.83317 12L4.1665 7.33331L5.33317 6.16665L9.99984 10.8333L14.6665 6.16665L15.8332 7.33331L11.1665 12L15.8332 16.6666L14.6665 17.8333L9.99984 13.1666L5.33317 17.8333Z"
      fill="#6B7280"
    />
  </Svg>
);

const AttachmentIcon = () => (
  <Svg width={25} height={28} viewBox="0 0 25 28" fill="none">
    <Path
      d="M17.8432 17.6458C17.8432 19.331 17.2518 20.7651 16.0689 21.9479C14.886 23.1308 13.452 23.7222 11.7668 23.7222C10.0816 23.7222 8.64761 23.1308 7.46474 21.9479C6.28186 20.7651 5.69043 19.331 5.69043 17.6458V8.65278C5.69043 7.43751 6.11578 6.40452 6.96647 5.55383C7.81717 4.70313 8.85015 4.27778 10.0654 4.27778C11.2807 4.27778 12.3137 4.70313 13.1644 5.55383C14.0151 6.40452 14.4404 7.43751 14.4404 8.65278V17.1597C14.4404 17.9051 14.1812 18.537 13.6627 19.0556C13.1441 19.5741 12.5122 19.8333 11.7668 19.8333C11.0214 19.8333 10.3895 19.5741 9.87099 19.0556C9.35247 18.537 9.09321 17.9051 9.09321 17.1597V8.16667H11.0377V17.1597C11.0377 17.3704 11.1065 17.5446 11.2442 17.6823C11.382 17.82 11.5562 17.8889 11.7668 17.8889C11.9775 17.8889 12.1517 17.82 12.2894 17.6823C12.4271 17.5446 12.496 17.3704 12.496 17.1597V8.65278C12.4798 7.97223 12.2408 7.397 11.779 6.92709C11.3172 6.45718 10.746 6.22223 10.0654 6.22223C9.38487 6.22223 8.80964 6.45718 8.33974 6.92709C7.86983 7.397 7.63487 7.97223 7.63487 8.65278V17.6458C7.61867 18.7963 8.01566 19.7726 8.82585 20.5747C9.63603 21.3767 10.6164 21.7778 11.7668 21.7778C12.9011 21.7778 13.8652 21.3767 14.6592 20.5747C15.4532 19.7726 15.8664 18.7963 15.8988 17.6458V8.16667H17.8432V17.6458Z"
      fill="#4C669A"
    />
  </Svg>
);

const SendIcon = () => (
  <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
    <Path
      d="M2.5 18.6667V5.33334L18.3333 12L2.5 18.6667ZM4.16667 16.1667L14.0417 12L4.16667 7.83334V10.75L9.16667 12L4.16667 13.25V16.1667ZM4.16667 16.1667V12V7.83334V10.75V13.25V16.1667Z"
      fill="white"
    />
  </Svg>
);

interface CreateTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (subject: string, description: string) => void;
}

export default function CreateTicketModal({
  visible,
  onClose,
  onSubmit,
}: CreateTicketModalProps) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [focusedField, setFocusedField] = useState<
    "subject" | "description" | null
  >(null);

  const handleSubmit = () => {
    if (subject.trim() && description.trim()) {
      onSubmit?.(subject, description);
      setSubject("");
      setDescription("");
      onClose();
    }
  };

  const handleAttachment = () => {
    // TODO: Implement file attachment picker
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close ticket modal"
        />
        <View style={styles.modalContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Ticket</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Subject Input */}
            <View
              style={[
                styles.inputContainer,
                focusedField === "subject" && styles.inputContainerFocused,
              ]}
            >
              <Text style={styles.label}>Ticket subject</Text>
              <TextInput
                style={[
                  styles.input,
                  Platform.OS === "web" && ({ outline: "none" } as any),
                ]}
                placeholder="e.g., Billing, Technical Issue"
                placeholderTextColor="#9CA3AF"
                value={subject}
                onChangeText={setSubject}
                onFocus={() => setFocusedField("subject")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "subject" ? null : current,
                  )
                }
                selectionColor="#135BEC"
              />
            </View>

            {/* Description Input */}
            <View
              style={[
                styles.inputContainer,
                focusedField === "description" && styles.inputContainerFocused,
              ]}
            >
              <Text style={styles.label}>Describe your issue</Text>
              <TextInput
                style={[
                  styles.textArea,
                  Platform.OS === "web" && ({ outline: "none" } as any),
                ]}
                multiline
                numberOfLines={8}
                placeholder=""
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                onFocus={() => setFocusedField("description")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "description" ? null : current,
                  )
                }
                textAlignVertical="top"
                selectionColor="#135BEC"
              />
            </View>

            {/* Attachment Button */}
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAttachment}
              activeOpacity={0.7}
            >
              <View style={styles.attachmentIconContainer}>
                <AttachmentIcon />
              </View>
              <Text style={styles.attachmentText}>
                Add attachment (Optional)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <SendIcon />
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.40)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    display: "flex",
    flexDirection: "column",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: "#D1D5DB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    color: "#0D121B",
    fontFamily: "Lexend",
  },
  closeButton: {
    padding: 6,
    minWidth: 40,
    minHeight: 40,
    borderRadius: 9999,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputContainerFocused: {
    borderRadius: 12,
    shadowColor: "#135BEC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: "#0D121B",
    fontFamily: "Lexend",
  },
  textArea: {
    height: 194,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F6F6F8",
    padding: 16,
    fontSize: 14,
    fontFamily: "Lexend",
    color: "#0D121B",
    textAlignVertical: "top",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F6F6F8",
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "Lexend",
    color: "#0D121B",
  },
  attachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 4,
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: "#4C669A",
    fontFamily: "Lexend",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#135BEC",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    color: "#FFFFFF",
    fontFamily: "Lexend",
  },
});
