import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import {
  AttendanceAction,
  AttendanceService,
} from "../../src/services/attendanceService";
import { ClassesApi } from "../../src/api/generated/endpoints/classes-api";
import { StudentsApi } from "../../src/api/generated/endpoints/students-api";
import { AttendanceApi } from "../../src/api/generated/endpoints/attendance-api";
import { TermsApi } from "../../src/api/generated/endpoints/terms-api";
import { StaffsApi } from "../../src/api/generated/endpoints/staffs-api";
import { RecordStudentAttendanceRequestStatusEnum } from "../../src/api/generated/models/record-student-attendance-request";
import { Configuration } from "../../src/api/generated/configuration";
import api, { API_BASE_URL } from "../../src/services/api";
import { getRequestErrorMessage } from "../../src/utils/apiError";
import { useToast } from "../../src/context/ToastContext";

type Person = {
  id: string;
  name: string;
  className?: string;
  admissionNumber?: string;
  isInSchool?: boolean;
};
type ClassOption = { id: string; label: string };
type CheckoutOption = "day" | "reason";
type SuccessAction = Exclude<AttendanceAction, "check_out_required">;
const STAFF: Person[] = [
  { id: "STF-2024-001", name: "Dr. Sarah Johnson" },
  { id: "STF-2024-002", name: "Prof. Michael Smith" },
];
const CHECK_IN_STUDENTS: Person[] = [
  {
    id: "student-1",
    admissionNumber: "2024-0891",
    name: "Julian Alexander",
    className: "SS 3",
    isInSchool: true,
  },
  {
    id: "student-2",
    admissionNumber: "2024-1102",
    name: "Sophia Chen",
    className: "SS 3",
    isInSchool: false,
  },
  {
    id: "student-3",
    admissionNumber: "2024-0453",
    name: "Marcus Sterling",
    className: "SS 2",
    isInSchool: true,
  },
  {
    id: "student-4",
    admissionNumber: "2024-0922",
    name: "Elena Rodriguez",
    className: "JSS 3",
    isInSchool: false,
  },
  {
    id: "student-5",
    admissionNumber: "2024-0711",
    name: "David Okafor",
    className: "SS 1",
    isInSchool: true,
  },
  {
    id: "student-6",
    admissionNumber: "2024-0344",
    name: "Zoe Takahashi",
    className: "JSS 2",
    isInSchool: false,
  },
];
const REASONS = [
  "School Event",
  "School Errand",
  "Medical",
  "Early Pickup",
  "School Closed",
  "Other",
] as const;
const classesApi = new ClassesApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const studentsApi = new StudentsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const attendanceApi = new AttendanceApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const termsApi = new TermsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const staffsApi = new StaffsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const nameOf = (student: any) =>
  [student?.firstName, student?.middleName, student?.lastName]
    .filter(Boolean)
    .join(" ") || "Student";
const classLabelOf = (schoolClass: any) => {
  const level =
    schoolClass?.classCode ||
    schoolClass?.classLevel ||
    schoolClass?.code ||
    schoolClass?.level ||
    "Class";
  const department = schoolClass?.department?.trim();
  return department && !level.toLowerCase().includes(department.toLowerCase())
    ? `${level} — ${department}`
    : level;
};
const parseStudentQr = (data: string) => {
  const value = data.trim();
  try {
    const parsed = JSON.parse(value);
    return {
      id: String(parsed.studentId ?? parsed.id ?? "").trim(),
      name: parsed.studentName ?? parsed.name,
    };
  } catch {
    return { id: value, name: undefined };
  }
};

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<"Students" | "Staff">("Students");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [success, setSuccess] = useState<{
    action: SuccessAction;
    timestamp: Date;
    reason?: string;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [option, setOption] = useState<CheckoutOption | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [events, setEvents] = useState<{ id: string; label: string }[]>([]);
  const [supervisors, setSupervisors] = useState<
    { id: string; label: string }[]
  >([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<
    string | null
  >(null);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [supervisorMenuOpen, setSupervisorMenuOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [manualStudents, setManualStudents] = useState<Person[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [hasClassAssignment, setHasClassAssignment] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsProgress = useRef(new Animated.Value(0)).current;
  const scanLock = useRef(false);
  const isWeb = Platform.OS === "web";
  const isAdmin = user?.backendRole?.toLowerCase().includes("admin") ?? false;
  const normalList = activeTab === "Students" ? CHECK_IN_STUDENTS : STAFF;
  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const summary =
    activeTab === "Students" ? `${CHECK_IN_STUDENTS.length}/42` : "2/12";

  useEffect(() => {
    if (user?.role === "student") router.replace("/(main)/home");
  }, [router, user?.role]);
  useEffect(() => {
    if (user?.id) void loadAllowedClasses();
  }, [user?.id]);
  useEffect(() => {
    if (selectedClassId) void loadClassStudents(selectedClassId);
  }, [selectedClassId]);
  if (!user || user.role === "student") return null;

  const resetCheckout = () => {
    setOption(null);
    setReason(null);
    setOtherReason("");
    setReasonMenuOpen(false);
  };
  const dismissSuccess = () => {
    scanLock.current = false;
    setLoading(false);
    setSuccess(null);
    setUserId(null);
    setScannedStudent(null);
    resetCheckout();
  };
  const openScanner = async () => {
    scanLock.current = false;

    if (isWeb) {
      showToast({
        message:
          "Camera scanning is not available in the browser. Please use the mobile app for QR scanning.",
        type: "info",
      });
      return;
    }

    if (!permission) return;
    if (!permission.granted && !(await requestPermission()).granted) return;
    setScannerOpen(true);
  };
  const scan = async ({ data }: { data: string }) => {
    const qr = parseStudentQr(data);
    if (!qr.id || scanLock.current) return;
    scanLock.current = true;
    setUserId(qr.id);
    setLoading(true);
    try {
      if (activeTab === "Staff") {
        const response = await AttendanceService.scanAttendance(qr.id);
        setScannerOpen(false);
        if (response.action === "check_out_required") {
          resetCheckout();
          setCheckoutOpen(true);
        } else
          setSuccess({
            action: "check_in",
            timestamp:
              AttendanceService.getLatestLog(qr.id)?.timestamp ?? new Date(),
          });
        return;
      }
      const statusResponse = await attendanceApi.getStudentStatus({
        studentId: qr.id,
      });
      const status = statusResponse.data.data as any;
      const isCurrentlyInSchool =
        status?.isCurrentlyInSchool ?? status?.isPresent ?? false;
      const knownStudent = CHECK_IN_STUDENTS.find(
        (student) => student.id === qr.id || student.admissionNumber === qr.id,
      );
      const studentName =
        status?.studentName ??
        status?.name ??
        qr.name ??
        knownStudent?.name ??
        `Student ${qr.id}`;
      setScannedStudent({ id: qr.id, name: studentName });
      setScannerOpen(false);
      if (isCurrentlyInSchool) {
        resetCheckout();
        setOption("reason");
        setCheckoutOpen(true);
      } else {
        await attendanceApi.recordStudentAttendance({
          recordStudentAttendanceRequest: {
            studentId: qr.id,
            status: RecordStudentAttendanceRequestStatusEnum.Present,
          },
        });
        setSuccess({ action: "check_in", timestamp: new Date() });
      }
    } catch (error) {
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not check this student's attendance status.",
        ),
        type: "error",
      });
    } finally {
      setLoading(false);
      scanLock.current = false;
    }
  };
  const selectedReason = reason === "Other" ? otherReason.trim() : reason;
  const canSubmit = Boolean(selectedReason);
  const submitCheckout = async () => {
    if (!userId || !canSubmit) return;
    setLoading(true);
    try {
      const response = await AttendanceService.checkOutForReason(
        userId,
        selectedReason!,
      );
      setCheckoutOpen(false);
      setSuccess({
        action: response.action as SuccessAction,
        timestamp:
          AttendanceService.getLatestLog(userId)?.timestamp ?? new Date(),
        reason: selectedReason ?? undefined,
      });
    } finally {
      setLoading(false);
    }
  };
  const openSchoolEventDialog = async () => {
    setEventDialogOpen(true);
    setEventLoading(true);
    setSelectedEventId(null);
    setSelectedSupervisorId(null);
    try {
      const [eventsResponse, staffsResponse] = await Promise.all([
        termsApi.getTermActivities({
          termId: user?.currentTermId ?? "2",
          pageSize: 100,
        }),
        staffsApi.getStaffs({ pageSize: 100 }),
      ]);
      setEvents(
        (eventsResponse.data.items ?? [])
          .map((event: any) => ({
            id: event.id ?? "",
            label: event.title ?? "School event",
          }))
          .filter((event) => event.id),
      );
      setSupervisors(
        (staffsResponse.data.items ?? [])
          .map((staff: any) => ({
            id: staff.id ?? "",
            label:
              [staff.firstName, staff.lastName].filter(Boolean).join(" ") ||
              staff.staffNo ||
              "Staff member",
          }))
          .filter((staff) => staff.id),
      );
    } catch (error) {
      setEventDialogOpen(false);
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not load school events and staff.",
        ),
        type: "error",
      });
    } finally {
      setEventLoading(false);
    }
  };
  const confirmSchoolEvent = () => {
    const event = events.find((item) => item.id === selectedEventId);
    const supervisor = supervisors.find(
      (item) => item.id === selectedSupervisorId,
    );
    if (!event || !supervisor) return;
    setReason(`School Event: ${event.label} — Supervisor: ${supervisor.label}`);
    setEventDialogOpen(false);
  };
  const toggleActions = () => {
    const open = !actionsOpen;
    setActionsOpen(open);
    Animated.spring(actionsProgress, {
      toValue: open ? 1 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: false,
    }).start();
  };
  const closeActions = () => {
    setActionsOpen(false);
    Animated.timing(actionsProgress, {
      toValue: 0,
      duration: 140,
      useNativeDriver: false,
    }).start();
  };
  const enterManual = () => {
    closeActions();
    setManualMode(true);
  };
  const loadAllowedClasses = async () => {
    setClassLoading(true);
    setAssignmentLoading(true);
    try {
      const response = await classesApi.getClasses();
      const all = response.data.data ?? [];
      let allowed = all
        .map((item: any) => ({
          id: item.classId ?? "",
          label: classLabelOf(item),
        }))
        .filter((item) => item.id);
      if (!isAdmin) {
        const details = await Promise.all(
          allowed.map(async (item) => ({
            item,
            detail: (await classesApi.getClass({ id: item.id })).data.data,
          })),
        );
        allowed = details
          .filter(({ detail }) =>
            detail?.assignedTeachers?.some(
              (teacher: any) =>
                teacher.staffId === user.id &&
                ["ClassTeacher", "AssistantTeacher"].includes(teacher.role),
            ),
          )
          .map(({ item, detail }) => ({
            ...item,
            label: classLabelOf(detail),
          }));
      }
      setClasses(allowed);
      setHasClassAssignment(isAdmin || allowed.length > 0);
      const defaultClass = isAdmin
        ? (allowed.find((item) => /jss\s*1/i.test(item.label)) ?? allowed[0])
        : allowed[0];
      setSelectedClassId(defaultClass?.id ?? null);
    } catch (error) {
      setClasses([]);
      setHasClassAssignment(isAdmin);
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not load your class assignment.",
        ),
        type: "error",
      });
    } finally {
      setClassLoading(false);
      setAssignmentLoading(false);
    }
  };
  const loadClassStudents = async (classId: string) => {
    setStudentLoading(true);
    try {
      const response = await studentsApi.getStudentsByClass({ classId });
      const rows = response.data.data ?? [];
      const students = rows.map((student: any) => ({
        id: student.id ?? student.admissionNumber,
        name: nameOf(student),
        admissionNumber: student.admissionNumber,
        className: student.classInfo?.classCode,
      }));
      setManualStudents(students);
      setPresentIds(
        AttendanceService.getManualAttendance(classId)?.studentIds ?? [],
      );
    } catch (error) {
      setManualStudents([]);
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not load students for this class.",
        ),
        type: "error",
      });
    } finally {
      setStudentLoading(false);
    }
  };
  const togglePresent = (id: string) =>
    setPresentIds((current) =>
      current.includes(id)
        ? current.filter((studentId) => studentId !== id)
        : [...current, id],
    );
  const saveManual = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      await AttendanceService.saveManualAttendance(selectedClassId, presentIds);
      setManualMode(false);
      showToast({
        message: `Attendance saved for ${presentIds.length} student${presentIds.length === 1 ? "" : "s"}.`,
        type: "success",
      });
    } finally {
      setLoading(false);
    }
  };
  const copy =
    success?.action === "check_in"
      ? [
          "Check-In Successful",
          "Your attendance has been recorded successfully.",
        ]
      : success?.action === "check_out_day"
        ? ["Checked Out Successfully", "Have a safe trip home."]
        : [
            "Temporary Check-Out Recorded",
            "Remember to check back in when you return to school.",
          ];

  if (manualMode)
    return (
      <ManualMarkingView
        insets={insets}
        classes={classes}
        selectedClass={selectedClass}
        classLoading={classLoading}
        studentLoading={studentLoading}
        students={manualStudents}
        presentIds={presentIds}
        classMenuOpen={classMenuOpen}
        loading={loading}
        onBack={() => setManualMode(false)}
        onToggleMenu={() => setClassMenuOpen(!classMenuOpen)}
        onSelectClass={(classId: string) => {
          setClassMenuOpen(false);
          setSelectedClassId(classId);
        }}
        onTogglePresent={togglePresent}
        onSave={saveManual}
      />
    );
  if (assignmentLoading || !hasClassAssignment)
    return (
      <ScanOnlyView
        insets={insets}
        loadingAssignment={assignmentLoading}
        scannerOpen={scannerOpen}
        loading={loading}
        checkoutOpen={checkoutOpen}
        success={success}
        student={scannedStudent}
        option={option}
        reason={reason}
        otherReason={otherReason}
        reasonMenuOpen={reasonMenuOpen}
        canSubmit={canSubmit}
        onScan={openScanner}
        onCloseScanner={() => !loading && setScannerOpen(false)}
        onBarcode={scan}
        onCloseCheckout={() => !loading && setCheckoutOpen(false)}
        onOption={setOption}
        onReason={setReason}
        onOther={setOtherReason}
        onReasonMenu={() => setReasonMenuOpen(!reasonMenuOpen)}
        onSubmitCheckout={submitCheckout}
        onDone={dismissSuccess}
      />
    );
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerSpace} />
        <Text style={styles.headerTitle}>Attendance & Check-In</Text>
        <View style={styles.headerSpace} />
      </View>
      <View style={styles.tabsContainer}>
        <View style={styles.filterTabs}>
          {(["Students", "Staff"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={normalList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <>
            <TouchableOpacity style={styles.summaryCard} onPress={openScanner}>
              <Text style={styles.summaryLabel}>
                SCAN QR TO CHECK IN OR OUT
              </Text>
              <Text style={styles.summaryValue}>{summary}</Text>
              <View style={styles.scanHint}>
                <Ionicons name="qr-code-outline" size={16} color="#FFF" />
                <Text style={styles.scanHintText}>Tap to scan attendance</Text>
              </View>
              <Ionicons
                name="school"
                size={120}
                color="rgba(255,255,255,.1)"
                style={styles.summaryIcon}
              />
            </TouchableOpacity>
            <Text style={styles.listTitle}>Check-In List</Text>
          </>
        }
        renderItem={({ item }) => <PersonCard person={item} />}
      />
      <View
        style={[styles.speedDial, { bottom: Math.max(insets.bottom - 10, 18) }]}
      >
        <DialAction
          icon="qr-code-outline"
          label="Scan QR"
          progress={actionsProgress}
          offset={70}
          onPress={() => {
            closeActions();
            openScanner();
          }}
        />
        {activeTab === "Students" && (
          <DialAction
            icon="checkbox-outline"
            label="Mark attendance"
            progress={actionsProgress}
            offset={132}
            onPress={enterManual}
          />
        )}
        <TouchableOpacity style={styles.fab} onPress={toggleActions}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: actionsProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "45deg"],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="add" size={30} color="#FFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <ScannerModal
        visible={scannerOpen}
        loading={loading}
        insetTop={insets.top}
        onClose={() => !loading && setScannerOpen(false)}
        onScan={scan}
      />
      <CheckoutModal
        visible={checkoutOpen}
        loading={loading}
        insetBottom={insets.bottom}
        student={scannedStudent}
        option={option}
        reason={reason}
        otherReason={otherReason}
        reasonMenuOpen={reasonMenuOpen}
        canSubmit={canSubmit}
        onClose={() => !loading && setCheckoutOpen(false)}
        onOption={setOption}
        onReason={setReason}
        onOther={setOtherReason}
        onMenu={() => setReasonMenuOpen(!reasonMenuOpen)}
        onSubmit={submitCheckout}
      />
      <SuccessModal success={success} copy={copy} onDone={dismissSuccess} />
    </View>
  );
}

function ManualMarkingView({
  insets,
  classes,
  selectedClass,
  classLoading,
  studentLoading,
  students,
  presentIds,
  classMenuOpen,
  loading,
  onBack,
  onToggleMenu,
  onSelectClass,
  onTogglePresent,
  onSave,
}: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <View style={styles.headerSpace} />
      </View>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 28 },
        ]}
        ListHeaderComponent={
          <>
            <Text style={styles.manualIntro}>
              Select the students present today.
            </Text>
            {classLoading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : classes.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="school-outline" size={34} color="#64748B" />
                <Text style={styles.emptyTitle}>No class assigned</Text>
                <Text style={styles.emptyBody}>
                  Ask an administrator to assign you as a class or assistant
                  teacher.
                </Text>
              </View>
            ) : (
              <View style={styles.classSelectWrap}>
                <Text style={styles.classLabel}>Class</Text>
                <TouchableOpacity
                  style={styles.classSelect}
                  onPress={onToggleMenu}
                >
                  <Text style={styles.classSelectText}>
                    {selectedClass?.label ?? "Select a class"}
                  </Text>
                  <Ionicons
                    name={classMenuOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
                {classMenuOpen && (
                  <View style={styles.classMenu}>
                    {classes.map((item: ClassOption) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.classMenuItem}
                        onPress={() => onSelectClass(item.id)}
                      >
                        <Text style={styles.classMenuText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            <View style={styles.manualListHeader}>
              <Text style={styles.listTitle}>Class List</Text>
              <Text style={styles.selectedCount}>
                {presentIds.length} present
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          studentLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            selectedClass && (
              <Text style={styles.noStudents}>
                No students found in this class.
              </Text>
            )
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.manualCard}
            onPress={() => onTogglePresent(item.id)}
          >
            <View
              style={[
                styles.checkbox,
                presentIds.includes(item.id) && styles.checkboxChecked,
              ]}
            >
              {presentIds.includes(item.id) && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userId}>
                {item.admissionNumber ?? item.id}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          selectedClass ? (
            <TouchableOpacity
              style={[styles.doneButton, loading && styles.disabled]}
              disabled={loading}
              onPress={onSave}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.doneButtonText}>Done Marking</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}
function ScanOnlyView({
  insets,
  loadingAssignment,
  scannerOpen,
  loading,
  checkoutOpen,
  success,
  student,
  option,
  reason,
  otherReason,
  reasonMenuOpen,
  canSubmit,
  onScan,
  onCloseScanner,
  onBarcode,
  onCloseCheckout,
  onOption,
  onReason,
  onOther,
  onReasonMenu,
  onSubmitCheckout,
  onDone,
}: any) {
  const copy =
    success?.action === "check_in"
      ? [
          "Check-In Successful",
          "Your attendance has been recorded successfully.",
        ]
      : success?.action === "check_out_day"
        ? ["Checked Out Successfully", "Have a safe trip home."]
        : [
            "Temporary Check-Out Recorded",
            "Remember to check back in when you return to school.",
          ];
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerSpace} />
        <Text style={styles.headerTitle}>Attendance & Check-In</Text>
        <View style={styles.headerSpace} />
      </View>
      <View style={styles.scanOnlyContent}>
        {loadingAssignment ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            <View style={styles.qrIllustration}>
              <Ionicons
                name="qr-code-outline"
                size={92}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.scanOnlyTitle}>Scan Student QR Code</Text>
            <Text style={styles.scanOnlyBody}>
              Tap the scan button below, then point your camera at a student's
              attendance QR code.
            </Text>
            <TouchableOpacity style={styles.scanOnlyButton} onPress={onScan}>
              <Ionicons name="qr-code-outline" size={22} color="#FFF" />
              <Text style={styles.doneButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <ScannerModal
        visible={scannerOpen}
        loading={loading}
        insetTop={insets.top}
        onClose={onCloseScanner}
        onScan={onBarcode}
      />
      <CheckoutModal
        visible={checkoutOpen}
        loading={loading}
        insetBottom={insets.bottom}
        student={student}
        option={option}
        reason={reason}
        otherReason={otherReason}
        reasonMenuOpen={reasonMenuOpen}
        canSubmit={canSubmit}
        onClose={onCloseCheckout}
        onOption={onOption}
        onReason={onReason}
        onOther={onOther}
        onMenu={onReasonMenu}
        onSubmit={onSubmitCheckout}
      />
      <SuccessModal success={success} copy={copy} onDone={onDone} />
    </View>
  );
}
function PersonCard({ person }: { person: Person }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{person.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={styles.userName}>{person.name}</Text>
        <Text style={styles.userId}>{person.admissionNumber ?? person.id}</Text>
      </View>
      {typeof person.isInSchool === "boolean" && (
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: person.isInSchool ? "#22C55E" : "#EF4444",
          }}
        />
      )}
      {person.className && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{person.className}</Text>
        </View>
      )}
    </View>
  );
}
function DialAction({ icon, label, progress, offset, onPress }: any) {
  return (
    <Animated.View
      style={[
        styles.dialAction,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -offset],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.dialLabel}>
        <Text style={styles.dialLabelText}>{label}</Text>
      </View>
      <TouchableOpacity style={styles.dialButton} onPress={onPress}>
        <Ionicons name={icon} size={22} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}
function ScannerModal({ visible, loading, insetTop, onClose, onScan }: any) {
  if (Platform.OS === "web") {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.camera}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={loading ? undefined : onScan}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View style={styles.cameraShade}>
          <View style={styles.viewfinder} />
          <TouchableOpacity
            style={[styles.close, { top: insetTop + 20 }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.scannerText}>
            Center the QR code within the frame
          </Text>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.loadingText}>Recording attendance...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
function CheckoutModal({
  visible,
  loading,
  insetBottom,
  student,
  reason,
  otherReason,
  canSubmit,
  onClose,
  onReason,
  onOther,
  onSubmit,
}: any) {
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [events, setEvents] = useState<{ id: string; label: string }[]>([]);
  const [supervisors, setSupervisors] = useState<
    { id: string; label: string }[]
  >([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [supervisorMenuOpen, setSupervisorMenuOpen] = useState(false);
  const openSchoolEvent = async () => {
    setEventDialogOpen(true);
    setEventLoading(true);
    try {
      const [eventResponse, staffResponse] = await Promise.all([
        termsApi.getTermActivities({ termId: "2", pageSize: 100 }),
        staffsApi.getStaffs({ pageSize: 100 }),
      ]);
      setEvents(
        (eventResponse.data.items ?? [])
          .map((event: any) => ({
            id: event.id ?? "",
            label: event.title ?? "School event",
          }))
          .filter((event) => event.id),
      );
      setSupervisors(
        (staffResponse.data.items ?? [])
          .map((staff: any) => ({
            id: staff.id ?? "",
            label:
              [staff.firstName, staff.lastName].filter(Boolean).join(" ") ||
              staff.staffNo ||
              "Staff member",
          }))
          .filter((staff) => staff.id),
      );
    } finally {
      setEventLoading(false);
    }
  };
  const selectedEvent = events.find((event) => event.id === eventId);
  const selectedSupervisor = supervisors.find(
    (supervisor) => supervisor.id === supervisorId,
  );
  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.dismiss} onPress={onClose} hitSlop={12} />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insetBottom, 24) }]}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Leave School</Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 18,
                fontWeight: "700",
                color: "#0F172A",
                fontFamily: "Lexend",
              }}
            >
              {student?.name ?? "Student"}
            </Text>
            <Text
              style={{
                marginTop: 4,
                marginBottom: 12,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1,
                color: "#D97706",
                fontFamily: "Lexend",
              }}
            >
              Currently: IN SCHOOL
            </Text>
            <Text style={styles.sheetSub}>
              Why is {student?.name?.split(" ")[0] ?? "this student"} leaving?
            </Text>
            <View style={{ marginBottom: 4 }}>
              {REASONS.map((item) => (
                <Choice
                  key={item}
                  active={
                    reason === item ||
                    (item === "School Event" &&
                      reason?.startsWith("School Event:"))
                  }
                  title={item}
                  onPress={() =>
                    item === "School Event"
                      ? void openSchoolEvent()
                      : onReason(item)
                  }
                />
              ))}
            </View>
            {reason === "Other" && (
              <TextInput
                style={styles.input}
                placeholder="Enter reason"
                value={otherReason}
                onChangeText={onOther}
              />
            )}
            <TouchableOpacity
              style={[styles.doneButton, !canSubmit && styles.disabled]}
              disabled={!canSubmit || loading}
              onPress={onSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.doneButtonText}>Confirm Leave School</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SchoolEventModal
        visible={eventDialogOpen}
        loading={eventLoading}
        events={events}
        supervisors={supervisors}
        eventId={eventId}
        supervisorId={supervisorId}
        eventMenuOpen={eventMenuOpen}
        supervisorMenuOpen={supervisorMenuOpen}
        onClose={() => setEventDialogOpen(false)}
        onEventMenu={() => setEventMenuOpen(!eventMenuOpen)}
        onSupervisorMenu={() => setSupervisorMenuOpen(!supervisorMenuOpen)}
        onEvent={(id: string) => {
          setEventId(id);
          setEventMenuOpen(false);
        }}
        onSupervisor={(id: string) => {
          setSupervisorId(id);
          setSupervisorMenuOpen(false);
        }}
        onConfirm={() => {
          if (selectedEvent && selectedSupervisor) {
            onReason(
              `School Event: ${selectedEvent.label} — Supervisor: ${selectedSupervisor.label}`,
            );
            setEventDialogOpen(false);
          }
        }}
      />
    </>
  );
}
function SchoolEventModal({
  visible,
  loading,
  events,
  supervisors,
  eventId,
  supervisorId,
  eventMenuOpen,
  supervisorMenuOpen,
  onClose,
  onEventMenu,
  onSupervisorMenu,
  onEvent,
  onSupervisor,
  onConfirm,
}: any) {
  const event = events.find((item: any) => item.id === eventId);
  const supervisor = supervisors.find((item: any) => item.id === supervisorId);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>School Event Details</Text>
          <Text style={styles.sheetSub}>
            Select the event and staff member supervising the student.
          </Text>
          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 28 }}
            />
          ) : (
            <>
              <Text style={styles.classLabel}>Event</Text>
              <TouchableOpacity
                style={styles.classSelect}
                onPress={onEventMenu}
              >
                <Text
                  style={event ? styles.classSelectText : styles.placeholder}
                >
                  {event?.label ?? "Select an event"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
              {eventMenuOpen && (
                <View style={styles.classMenu}>
                  {events.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.classMenuItem}
                      onPress={() => onEvent(item.id)}
                    >
                      <Text style={styles.classMenuText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={[styles.classLabel, { marginTop: 18 }]}>
                Supervisor
              </Text>
              <TouchableOpacity
                style={styles.classSelect}
                onPress={onSupervisorMenu}
              >
                <Text
                  style={
                    supervisor ? styles.classSelectText : styles.placeholder
                  }
                >
                  {supervisor?.label ?? "Select supervising staff"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
              {supervisorMenuOpen && (
                <View style={styles.classMenu}>
                  {supervisors.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.classMenuItem}
                      onPress={() => onSupervisor(item.id)}
                    >
                      <Text style={styles.classMenuText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  (!event || !supervisor) && styles.disabled,
                ]}
                disabled={!event || !supervisor}
                onPress={onConfirm}
              >
                <Text style={styles.doneButtonText}>Use Event Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
function Choice({ active, title, description, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.choice, active && styles.choiceActive]}
      onPress={onPress}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.dot} />}
      </View>
      <View style={styles.cardText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceSub}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
function SuccessModal({ success, copy, onDone }: any) {
  return (
    <Modal visible={Boolean(success)} transparent animationType="fade">
      <View style={styles.successOverlay}>
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={42} color="#FFF" />
          </View>
          <Text style={styles.successTitle}>{copy[0]}</Text>
          <Text style={styles.successBody}>{copy[1]}</Text>
          {success?.reason && (
            <Text style={styles.reasonText}>Reason: {success.reason}</Text>
          )}
          <Text style={styles.timeText}>
            {success?.action === "check_in" ? "Check-in" : "Check-out"} time:{" "}
            {success?.timestamp.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={onDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerSpace: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  back: { width: 40, padding: 6 },
  tabsContainer: { paddingHorizontal: 20, paddingVertical: 16 },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#FFF", elevation: 2 },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    fontFamily: "Lexend",
  },
  activeTabText: { color: "#0F172A" },
  scanOnlyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    paddingBottom: 90,
  },
  qrIllustration: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  scanOnlyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  scanOnlyBody: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  scanOnlyButton: {
    marginTop: 30,
    minHeight: 54,
    width: "100%",
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  listContent: { paddingHorizontal: 20, paddingTop: 10 },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    height: 140,
    marginBottom: 24,
    overflow: "hidden",
  },
  summaryLabel: {
    color: "rgba(255,255,255,.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: "Lexend",
  },
  summaryValue: {
    color: "#FFF",
    fontSize: 56,
    fontWeight: "800",
    marginTop: 4,
    fontFamily: "Lexend",
  },
  summaryIcon: { position: "absolute", right: -15, bottom: -15 },
  scanHint: { flexDirection: "row", alignItems: "center", gap: 6 },
  scanHintText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#191C1D",
    fontFamily: "Lexend",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  manualCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8E5FF",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DAE2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: "Lexend",
  },
  cardText: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: "Lexend",
  },
  userId: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontFamily: "Lexend",
  },
  badge: {
    backgroundColor: "#DAE2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0040A1",
    fontFamily: "Lexend",
  },
  speedDial: {
    position: "absolute",
    right: 24,
    width: 230,
    height: 200,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  dialAction: {
    position: "absolute",
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
  },
  dialLabel: {
    backgroundColor: "rgba(0,0,0,.78)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dialLabelText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Lexend",
  },
  manualIntro: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "Lexend",
    marginBottom: 18,
  },
  classSelectWrap: { marginBottom: 20 },
  classLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
    marginBottom: 8,
  },
  classSelect: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  classSelectText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  classMenu: {
    marginTop: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
  },
  classMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  classMenuText: { fontSize: 15, color: "#0F172A", fontFamily: "Lexend" },
  manualListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: "Lexend",
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  doneButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Lexend",
  },
  disabled: { opacity: 0.45 },
  loader: { marginVertical: 36 },
  empty: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 20 },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  emptyBody: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    fontFamily: "Lexend",
  },
  noStudents: {
    textAlign: "center",
    color: "#64748B",
    fontFamily: "Lexend",
    marginVertical: 28,
  },
  camera: { flex: 1, backgroundColor: "#000" },
  cameraShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FFF",
    borderRadius: 16,
  },
  close: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(0,0,0,.6)",
    padding: 8,
    borderRadius: 20,
  },
  scannerText: {
    position: "absolute",
    bottom: 100,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.4)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  sheetSub: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    fontFamily: "Lexend",
  },
  choice: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  choiceActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(10,132,255,.06)",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioActive: { borderColor: COLORS.primary },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  choiceTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Lexend",
  },
  choiceSub: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontFamily: "Lexend",
  },
  reasonBox: { marginBottom: 4 },
  placeholder: { color: "#9CA3AF", fontFamily: "Lexend" },
  input: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.46)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  success: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.statusCompleted,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  successBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  reasonText: {
    marginTop: 16,
    color: "#0F172A",
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  timeText: { marginTop: 16, color: "#64748B", fontFamily: "Lexend" },
});
