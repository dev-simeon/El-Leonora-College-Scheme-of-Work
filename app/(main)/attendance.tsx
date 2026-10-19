import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  ScrollView,
  Text as NativeText,
  TextInput as NativeTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  LexendText as Text,
  LexendTextInput as TextInput,
} from "../../src/components/LexendText";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import { ClassesApi } from "../../src/api/generated/endpoints/classes-api";
import { StudentsApi } from "../../src/api/generated/endpoints/students-api";
import { AttendanceApi } from "../../src/api/generated/endpoints/attendance-api";
import { TermsApi } from "../../src/api/generated/endpoints/terms-api";
import { GetTermActivitiesFilterEnum } from "../../src/api/generated/endpoints/terms-api";
import { AcademicSessionsApi } from "../../src/api/generated/endpoints/academic-sessions-api";
import {
  GetStaffsRoleEnum,
  StaffsApi,
} from "../../src/api/generated/endpoints/staffs-api";
import {
  RecordGateAttendanceRequestGateReasonEnum,
  RecordGateAttendanceRequestGateTypeEnum,
} from "../../src/api/generated/models/record-gate-attendance-request";
import { ClassroomAttendanceItemStatusEnum } from "../../src/api/generated/models/classroom-attendance-item";
import type { BulkClassroomAttendanceRequest } from "../../src/api/generated/models/bulk-classroom-attendance-request";
import { Configuration } from "../../src/api/generated/configuration";
import api, { API_BASE_URL } from "../../src/services/api";
import { StorageService } from "../../src/services/storage";
import {
  StaffGateAttendanceRequestGateReasonEnum,
  StaffGateAttendanceRequestGateTypeEnum,
} from "../../src/api/generated/models/staff-gate-attendance-request";
import {
  getApiErrorMessage,
  getRequestErrorMessage,
} from "../../src/utils/apiError";
import { useToast } from "../../src/context/ToastContext";
import { decodeJwt } from "../../src/utils/jwt";

type Person = {
  id: string;
  name: string;
  className?: string;
  admissionNumber?: string;
  isInSchool?: boolean;
};
type ClassOption = { id: string; label: string; itemKey: string };
type CheckoutOption = "day" | "reason";
type SuccessAction = "check_in" | "check_out";
const manualAttendanceByClass = new Map<string, string[]>();
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
  {
    label: "School Event",
    value: RecordGateAttendanceRequestGateReasonEnum.SchoolEvent,
  },
  {
    label: "School Errand",
    value: RecordGateAttendanceRequestGateReasonEnum.SchoolErrand,
  },
  {
    label: "Medical",
    value: RecordGateAttendanceRequestGateReasonEnum.Medical,
  },
  {
    label: "Early Pickup",
    value: RecordGateAttendanceRequestGateReasonEnum.EarlyPickup,
  },
  {
    label: "School Closed",
    value: RecordGateAttendanceRequestGateReasonEnum.SchoolClosed,
  },
  { label: "Other", value: RecordGateAttendanceRequestGateReasonEnum.Other },
] as const;
const APPROVER_STAFF_ROLES = [
  GetStaffsRoleEnum.Proprietor,
  GetStaffsRoleEnum.Chairman,
  GetStaffsRoleEnum.Principal,
  GetStaffsRoleEnum.VicePrincipal,
  GetStaffsRoleEnum.AdminOfficer,
];
const STAFF_GATE_QR_VALUE = "schoolcompanion://attendance/gate/ELN-01";
const STAFF_GATE_CODE = STAFF_GATE_QR_VALUE.split("/").pop()!;
const staffGateStateKey = (staffId: string) =>
  `attendance.staff.${staffId}.isInSchool`;
const STAFF_CHECKOUT_REASONS = [
  { label: "School Event", value: StaffGateAttendanceRequestGateReasonEnum.SchoolEvent },
  { label: "School Errand", value: StaffGateAttendanceRequestGateReasonEnum.SchoolErrand },
  { label: "Medical", value: StaffGateAttendanceRequestGateReasonEnum.Medical },
  { label: "Early Check-Out", value: StaffGateAttendanceRequestGateReasonEnum.EarlyCheckOut },
  { label: "School Closed", value: StaffGateAttendanceRequestGateReasonEnum.SchoolClosed },
  { label: "Other", value: StaffGateAttendanceRequestGateReasonEnum.Other },
];
const decodeQrBase64 = (value: string) => {
  try {
    return globalThis.atob(value.trim()).trim();
  } catch {
    return null;
  }
};
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
const academicSessionsApi = new AcademicSessionsApi(
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
const formatPersonName = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(
      /(^|[\s'-])([a-z])/g,
      (_match, separator, letter) =>
        `${separator}${letter.toLocaleUpperCase()}`,
    );
const stripArmSuffix = (value: string) => {
  if (!value) return "";

  const trimmed = value.trim();
  const armPatterns = [
    /\s*[-–/]\s*[A-D]\s*$/i,
    /\s*[-–/]\s*ART\s*$/i,
    /\s*[-–/]\s*ARTS\s*$/i,
    /\s*[-–/]\s*SCI\s*$/i,
    /\s*[-–/]\s*SCIENCE\s*$/i,
    /\s*[-–/]\s*COM\s*$/i,
    /\s*[-–/]\s*COMM\s*$/i,
    /\s*[-–/]\s*COMMERCIAL\s*$/i,
  ];

  let cleaned = trimmed;
  for (const pattern of armPatterns) {
    cleaned = cleaned.replace(pattern, "").trim();
  }

  return cleaned;
};

const getClassSortPriority = (label: string) => {
  const normalized = label.trim().toUpperCase();

  if (/^JSS\s*\d+/i.test(normalized)) {
    const match = normalized.match(/JSS\s*(\d+)/i);
    return 100 + Number(match?.[1] ?? 0);
  }

  if (/^SS\s*\d+/i.test(normalized)) {
    const match = normalized.match(/SS\s*(\d+)/i);
    return 200 + Number(match?.[1] ?? 0);
  }

  if (/^NUR\s*\d+/i.test(normalized)) {
    const match = normalized.match(/NUR\s*(\d+)/i);
    return 300 + Number(match?.[1] ?? 0);
  }

  if (/^PRY\s*\d+/i.test(normalized)) {
    const match = normalized.match(/PRY\s*(\d+)/i);
    return 400 + Number(match?.[1] ?? 0);
  }

  return 999;
};

const classLabelOf = (schoolClass: any) => {
  const rawLevel =
    schoolClass?.classCode ??
    schoolClass?.classLevel ??
    schoolClass?.code ??
    schoolClass?.level ??
    "Class";

  const level = stripArmSuffix(String(rawLevel).trim()) || "Class";
  const department = String(schoolClass?.department ?? "").trim();
  const normalizedDepartment = department.replace(/[-_]/g, " ").trim();

  if (!normalizedDepartment) return level;

  return `${level} ${normalizedDepartment}`;
};
const parseStudentQr = (data: string) => {
  const value = data.trim();
  try {
    const parsed = JSON.parse(value) as any;
    if (typeof parsed === "string" || typeof parsed === "number") {
      const admissionNumber = String(parsed).trim();
      return { admissionNumber: admissionNumber || undefined };
    }
    if (!parsed || typeof parsed !== "object") {
      return { admissionNumber: value || undefined };
    }

    const admissionNumber = String(
      parsed.studentAdmissionNo ??
        parsed.admissionNumber ??
        parsed.admissionNo ??
        parsed.studentNo ??
        "",
    ).trim();
    return {
      name: parsed.studentName ?? parsed.name,
      admissionNumber: admissionNumber || undefined,
    };
  } catch {
    return { name: undefined, admissionNumber: value || undefined };
  }
};

const getAssignedClassFromToken = (token: string | null | undefined) => {
  const claims = token
    ? (decodeJwt(token) as Record<string, unknown> | null)
    : null;
  if (!claims) return null;

  const normalizeKey = (key: string) =>
    key.toLowerCase().replace(/[^a-z0-9]/g, "");
  const claim = (names: string[]) => {
    const normalizedNames = names.map(normalizeKey);
    const entry = Object.entries(claims).find(([key]) => {
      const normalizedKey = normalizeKey(key);
      return normalizedNames.some(
        (name) => normalizedKey === name || normalizedKey.endsWith(name),
      );
    });
    return entry?.[1];
  };
  const asId = (value: unknown): string | null => {
    if (typeof value === "string" || typeof value === "number") {
      const id = String(value).trim();
      return id || null;
    }
    return null;
  };

  let assigned = claim(["assignedClass", "classInfo", "homeroomClass"]);
  if (Array.isArray(assigned)) assigned = assigned[0];
  const nested =
    assigned && typeof assigned === "object"
      ? (assigned as Record<string, unknown>)
      : null;
  const nestedEntries = nested ? Object.entries(nested) : [];
  const nestedValue = (names: string[]) => {
    const normalizedNames = names.map(normalizeKey);
    return nestedEntries.find(([key]) =>
      normalizedNames.includes(normalizeKey(key)),
    )?.[1];
  };

  const id =
    asId(claim(["assignedClassId", "classId", "homeroomClassId"])) ??
    asId(nestedValue(["classId", "id", "assignedClassId"]));
  if (!id) return null;

  const label =
    asId(claim(["className", "classCode", "assignedClassName"])) ??
    asId(nestedValue(["className", "classCode", "code", "name", "level"])) ??
    "Assigned Class";
  return { id, label };
};

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<"Students" | "Staff">("Students");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [staffCheckoutOpen, setStaffCheckoutOpen] = useState(false);
  const [staffGateCode, setStaffGateCode] = useState<string | null>(null);
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
  const [reason, setReason] =
    useState<RecordGateAttendanceRequestGateReasonEnum | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
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
  const [gateCheckIns, setGateCheckIns] = useState<Person[]>([]);
  const [gateCheckInsLoading, setGateCheckInsLoading] = useState(false);
  const [studentPresentCount, setStudentPresentCount] = useState(0);
  const [studentTotalCount, setStudentTotalCount] = useState(0);
  const [staffGateCheckIns, setStaffGateCheckIns] = useState<Person[]>([]);
  const [staffGateCheckInsLoading, setStaffGateCheckInsLoading] = useState(false);
  const [staffPresentCount, setStaffPresentCount] = useState(0);
  const [staffTotalCount, setStaffTotalCount] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsProgress = useRef(new Animated.Value(0)).current;
  const scanLock = useRef(false);
  const classAdmissionsCache = useRef(new Map<string, Set<string>>());
  const isWeb = Platform.OS === "web";
  const isAdmin = user?.backendRole?.toLowerCase().includes("admin") ?? false;
  const isTeacher =
    user?.backendRole
      ?.split(/[,;|]/)
      .some((role) => role.trim().toLowerCase() === "teacher") ?? false;
  const assignedClass = getAssignedClassFromToken(token);
  const staffGateKey = user?.id ? staffGateStateKey(user.id) : null;
  const canSeeGateCheckIns = isAdmin;
  const canLoadStudentSummary = isAdmin || (isTeacher && Boolean(assignedClass?.id));
  const normalList = activeTab === "Students" ? gateCheckIns : staffGateCheckIns;
  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const summary = activeTab === "Students"
    ? `${studentPresentCount}/${studentTotalCount}`
    : `${staffPresentCount}/${staffTotalCount}`;

  useEffect(() => {
    if (user && user.role === "student") router.replace("/(main)/home");
    else if (user && !isAdmin && !isTeacher) router.replace("/(main)/home");
  }, [router, user, isAdmin, isTeacher]);
  useEffect(() => {
    let active = true;
    if (!staffGateKey) return;
    void (async () => {
      try {
        const saved = await StorageService.getItem(staffGateKey);
        if (!active) return;
        if (saved === null) await StorageService.setItem(staffGateKey, "false");
      } catch (error) {
        console.error("[Staff Attendance Storage] Failed to load gate state", error);
      }
    })();
    return () => { active = false; };
  }, [staffGateKey]);
  useEffect(() => {
    if (!user || (!isAdmin && !isTeacher)) {
      setAssignmentLoading(false);
      setHasClassAssignment(false);
      setClasses([]);
      setGateCheckIns([]);
      setStudentPresentCount(0);
      setStudentTotalCount(0);
      return;
    }

    if (isAdmin) {
      setHasClassAssignment(true);
      setAssignmentLoading(false);
      void loadAllowedClasses();
      void loadGateCheckIns();
      return;
    }

    if (assignedClass) {
      const assignedOption: ClassOption = {
        id: assignedClass.id,
        label: assignedClass.label,
        itemKey: assignedClass.id,
      };
      setClasses([assignedOption]);
      setSelectedClassId(assignedOption.id);
      setHasClassAssignment(true);
      setAssignmentLoading(false);
      void loadGateCheckIns();
      return;
    }

    // No class claim means this teacher may scan, but must not request gate lists.
    setClasses([]);
    setSelectedClassId(null);
    setHasClassAssignment(false);
    setAssignmentLoading(false);
    setGateCheckIns([]);
    setStudentPresentCount(0);
    setStudentTotalCount(0);
    setGateCheckInsLoading(false);
  }, [
    user?.id,
    user?.backendRole,
    token,
    isAdmin,
    isTeacher,
    assignedClass?.id,
  ]);
  useEffect(() => {
    if (manualMode && selectedClassId) void loadClassStudents(selectedClassId);
  }, [selectedClassId, manualMode]);
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
    setStaffGateCode(null);
    resetCheckout();
  };
  const openScanner = async () => {
    closeActions();
    scanLock.current = false;
    setScannerError(null);

    if (isWeb && typeof window !== "undefined" && !window.isSecureContext) {
      showToast({
        message:
          "Browser camera access requires HTTPS or localhost. Open this app using a secure connection and try again.",
        type: "error",
      });
      return;
    }

    try {
      const cameraPermission = permission?.granted
        ? permission
        : await requestPermission();
      if (!cameraPermission.granted) {
        showToast({
          message:
            "Camera access was not allowed. Enable camera permission in your browser and try again.",
          type: "info",
        });
        return;
      }
      setScannerOpen(true);
    } catch (error) {
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not request camera access from the browser.",
        ),
        type: "error",
      });
    }
  };
  const scanStaffGate = async (decodedGateCode: string) => {
    if (!isTeacher && !isAdmin) {
      showToast({ message: "Staff attendance is available to staff accounts only.", type: "error" });
      return;
    }
    if (!staffGateKey) {
      showToast({ message: "Could not identify the signed-in staff account.", type: "error" });
      return;
    }
    setLoading(true);
    setScannerError(null);
    try {
      const storedState = await StorageService.getItem(staffGateKey);
      const isInSchool = storedState === "true";
      setStaffGateCode(STAFF_GATE_CODE);
      if (isInSchool) {
        setScannerOpen(false);
        setStaffCheckoutOpen(true);
        return;
      }

      const requestBody = {
        gateCode: STAFF_GATE_CODE,
        gateType: StaffGateAttendanceRequestGateTypeEnum.CheckIn,
      };
      console.log("[Staff Gate Check-In API] Request", {
        method: "POST",
        baseUrl: API_BASE_URL,
        path: "/api/Attendance/staffs/gate",
        body: requestBody,
      });
      const response = await attendanceApi.recordStaffGateAttendance({
        staffGateAttendanceRequest: requestBody,
      });
      console.log("[Staff Gate Check-In API] Response", {
        httpStatus: response.status,
        data: response.data,
      });
      if (response.data.success !== true) {
        const apiError = new Error(
          getApiErrorMessage(response.data, "Could not record staff check-in."),
        ) as Error & { apiResponse?: unknown };
        apiError.apiResponse = response.data;
        throw apiError;
      }
      await updateStaffGateState(true);
      if (canSeeGateCheckIns) void loadStaffGateCheckIns();
      setScannerOpen(false);
      setSuccess({ action: "check_in", timestamp: new Date() });
    } catch (error) {
      const requestError = error as any;
      console.log("[Staff Gate Check-In API] Request failed", {
        httpStatus: requestError?.response?.status,
        url: requestError?.config?.url,
        method: requestError?.config?.method,
        response: requestError?.apiResponse ?? requestError?.response?.data,
        message: getRequestErrorMessage(error, "Could not record staff check-in."),
      });
      const message = getRequestErrorMessage(error, "Could not record staff check-in.");
      if (scannerOpen) setScannerError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
      scanLock.current = false;
    }
  };
  const updateStaffGateState = async (isInSchool: boolean) => {
    if (!staffGateKey) return;
    try {
      await StorageService.setItem(staffGateKey, String(isInSchool));
    } catch (error) {
      console.error("[Staff Attendance Storage] Failed to save gate state", error);
      showToast({
        message: "Attendance was recorded, but this device could not save your gate status.",
        type: "error",
      });
    }
  };
  const scan = async ({ data }: { data: string }) => {
    closeActions();
    const decodedGateQr = decodeQrBase64(data);
    if (decodedGateQr === STAFF_GATE_QR_VALUE) {
      if (scanLock.current) return;
      scanLock.current = true;
      await scanStaffGate(decodedGateQr);
      scanLock.current = false;
      return;
    }
    const qr = parseStudentQr(data);
    const scannedAdmissionNo = qr.admissionNumber?.trim();
    // Student admission numbers without the STU prefix use underscores in the
    // attendance API, while STU-prefixed numbers are already in API format.
    const studentAdmissionNo = scannedAdmissionNo
      ? /stu/i.test(scannedAdmissionNo)
        ? scannedAdmissionNo
        : scannedAdmissionNo.replace(/\//g, "_")
      : undefined;
    if (!studentAdmissionNo || scanLock.current) {
      if (!studentAdmissionNo) {
        showToast({
          message: "This QR code does not contain a student admission number.",
          type: "error",
        });
      }
      return;
    }
    scanLock.current = true;
    setScannerError(null);
    setUserId(studentAdmissionNo);
    setLoading(true);
    let operation = "check student attendance status";
    try {
      if (activeTab === "Staff") {
        throw new Error(
          "Staff QR attendance is not supported by the student attendance API.",
        );
      }
      if (isTeacher && !isAdmin) {
        if (!assignedClass?.id) {
          throw new Error("You need an assigned class to scan student attendance.");
        }
        let classAdmissions = classAdmissionsCache.current.get(assignedClass.id);
        if (!classAdmissions) {
          const classRoster = await studentsApi.getStudentsByClass({
            classId: assignedClass.id,
          });
          classAdmissions = new Set(
            (classRoster.data.data ?? [])
              .map((student: any) => String(student.admissionNumber ?? "").trim())
              .filter(Boolean)
              .map((admissionNumber) =>
                /stu/i.test(admissionNumber)
                  ? admissionNumber
                  : admissionNumber.replace(/\//g, "_"),
              ),
          );
          classAdmissionsCache.current.set(assignedClass.id, classAdmissions);
        }
        if (!classAdmissions.has(studentAdmissionNo)) {
          throw new Error("You can only scan students assigned to your class.");
        }
      }
      const statusRequest = { studentAdmissionNo };
      const statusPath = `/api/Attendance/students/${encodeURIComponent(studentAdmissionNo)}/status`;
      console.log("[Attendance Status API] Request", {
        method: "GET",
        baseUrl: API_BASE_URL,
        path: statusPath,
        pathParameter: { studentAdmissionNo },
      });
      const statusResponse =
        await attendanceApi.getStudentStatus(statusRequest);
      console.log("[Attendance Status API] Response", {
        httpStatus: statusResponse.status,
        data: statusResponse.data,
      });
      if (statusResponse.data.success !== true || !statusResponse.data.data) {
        const apiError = new Error(
          getApiErrorMessage(
            statusResponse.data,
            "Could not check this student's attendance status.",
          ),
        ) as Error & { apiResponse?: unknown };
        apiError.apiResponse = statusResponse.data;
        throw apiError;
      }
      const status = statusResponse.data.data;
      // The current status contract exposes the gate state as `isInSchool`.
      // Do not infer gate state from classroom attendance (`isPresent`) or an
      // active movement; a missing value must not accidentally trigger checkout.
      const isCurrentlyInSchool = status?.isInSchool === true;
      console.log("[Attendance Status API] Scan decision", {
        studentAdmissionNo,
        isInSchool: status?.isInSchool,
        action: isCurrentlyInSchool ? "open_check_out" : "record_check_in",
      });
      const knownStudent = CHECK_IN_STUDENTS.find(
        (student) => student.admissionNumber === studentAdmissionNo,
      );
      const studentName =
        qr.name ?? knownStudent?.name ?? `Student ${studentAdmissionNo}`;
      setScannedStudent({ id: studentAdmissionNo, name: studentName });
      if (isCurrentlyInSchool) {
        setScannerOpen(false);
        resetCheckout();
        setOption("reason");
        setCheckoutOpen(true);
      } else {
        operation = "record student attendance";
        const recordRequest = {
          studentAdmissionNo,
          gateType: RecordGateAttendanceRequestGateTypeEnum.CheckIn,
        };
        console.log("[Attendance Check-In API] Request", {
          method: "POST",
          baseUrl: API_BASE_URL,
          path: "/api/Attendance/students/gate",
          body: recordRequest,
        });
        const recordResponse = await attendanceApi.recordGateAttendance({
          recordGateAttendanceRequest: recordRequest,
        });
        console.log("[Attendance Check-In API] Response", {
          httpStatus: recordResponse.status,
          data: recordResponse.data,
        });
        if (recordResponse.data.success !== true) {
          const apiError = new Error(
            getApiErrorMessage(
              recordResponse.data,
              "Could not record this student's attendance.",
            ),
          ) as Error & { apiResponse?: unknown };
          apiError.apiResponse = recordResponse.data;
          throw apiError;
        }
        if (canLoadStudentSummary) void loadGateCheckIns();
        setScannerOpen(false);
        setSuccess({
          action: "check_in",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      const fallback =
        operation === "record student attendance"
          ? "Could not record this student's attendance."
          : "Could not check this student's attendance status.";
      const requestError = error as any;
      console.log(
        operation === "record student attendance"
          ? "[Attendance Check-In API] Request failed"
          : "[Attendance Status API] Request failed",
        {
          httpStatus: requestError?.response?.status,
          url: requestError?.config?.url,
          method: requestError?.config?.method,
          response: requestError?.apiResponse ?? requestError?.response?.data,
          message: getRequestErrorMessage(error, fallback),
        },
      );
      const message = getRequestErrorMessage(error, fallback);
      if (scannerOpen) setScannerError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
      scanLock.current = false;
    }
  };
  const selectedReason = reason;
  const canSubmit =
    Boolean(selectedReason) &&
    (selectedReason !== RecordGateAttendanceRequestGateReasonEnum.Other ||
      Boolean(otherReason.trim()));
  const submitCheckout = async (checkoutDetails?: {
    schoolEventId?: string;
    accompaniedByStaffId?: string;
    approvedByStaffId?: string;
    destination?: string;
    otherReason?: string;
    extraNotes?: string;
  }) => {
    if (!userId || !canSubmit) return;
    const requestBody = {
      studentAdmissionNo: userId,
      gateType: RecordGateAttendanceRequestGateTypeEnum.CheckOut,
      gateReason: selectedReason,
      ...(selectedReason !==
      RecordGateAttendanceRequestGateReasonEnum.SchoolClosed
        ? { approvedByStaffId: checkoutDetails?.approvedByStaffId }
        : {}),
      ...(selectedReason ===
      RecordGateAttendanceRequestGateReasonEnum.SchoolEvent
        ? {
            schoolEvent: {
              eventId: checkoutDetails?.schoolEventId,
              accompaniedByStaffId: checkoutDetails?.accompaniedByStaffId,
            },
            extraNotes: checkoutDetails?.extraNotes,
          }
        : selectedReason === RecordGateAttendanceRequestGateReasonEnum.Other
          ? {
              destination: checkoutDetails?.destination?.trim(),
              otherReason: checkoutDetails?.otherReason?.trim(),
            }
          : {
              destination: checkoutDetails?.destination?.trim(),
              extraNotes: checkoutDetails?.extraNotes?.trim(),
            }),
    };
    setLoading(true);
    try {
      console.log("[Attendance Check-Out API] Request", {
        method: "POST",
        baseUrl: API_BASE_URL,
        path: "/api/Attendance/students/gate",
        body: requestBody,
      });
      const response = await attendanceApi.recordGateAttendance({
        recordGateAttendanceRequest: requestBody,
      });
      console.log("[Attendance Check-Out API] Response", {
        httpStatus: response.status,
        data: response.data,
      });
      if (response.data.success !== true) {
        const apiError = new Error(
          getApiErrorMessage(
            response.data,
            "Could not record the student's checkout.",
          ),
        ) as Error & { apiResponse?: unknown };
        apiError.apiResponse = response.data;
        throw apiError;
      }
      setCheckoutOpen(false);
      setSuccess({
        action: "check_out",
        timestamp: new Date(),
        reason:
          selectedReason === RecordGateAttendanceRequestGateReasonEnum.Other
            ? otherReason.trim()
            : REASONS.find((item) => item.value === selectedReason)?.label,
      });
      if (canLoadStudentSummary) void loadGateCheckIns();
    } catch (error) {
      const requestError = error as any;
      console.log("[Attendance Check-Out API] Request failed", {
        httpStatus: requestError?.response?.status,
        url: requestError?.config?.url,
        method: requestError?.config?.method,
        response: requestError?.apiResponse ?? requestError?.response?.data,
        message: getRequestErrorMessage(
          error,
          "Could not record the student's checkout.",
        ),
      });
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not record the student's checkout.",
        ),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const submitStaffCheckout = async (checkoutDetails: {
    reason: StaffGateAttendanceRequestGateReasonEnum;
    otherReason?: string;
    schoolEventId?: string;
    extraNote?: string;
  }) => {
    if (!staffGateCode || !staffGateKey) return;
    const requestBody = {
      gateCode: staffGateCode,
      gateType: StaffGateAttendanceRequestGateTypeEnum.CheckOut,
      gateReason: checkoutDetails.reason,
      ...(checkoutDetails.reason === StaffGateAttendanceRequestGateReasonEnum.Other
        ? { otherReason: checkoutDetails.otherReason?.trim() }
        : {}),
      ...(checkoutDetails.reason === StaffGateAttendanceRequestGateReasonEnum.SchoolEvent
        ? { schoolEventId: checkoutDetails.schoolEventId }
        : {}),
      ...(checkoutDetails.reason !== StaffGateAttendanceRequestGateReasonEnum.Other && checkoutDetails.extraNote?.trim()
        ? { extraNote: checkoutDetails.extraNote.trim() }
        : {}),
    };
    setLoading(true);
    try {
      console.log("[Staff Gate Check-Out API] Request", {
        method: "POST",
        baseUrl: API_BASE_URL,
        path: "/api/Attendance/staffs/gate",
        body: requestBody,
      });
      const response = await attendanceApi.recordStaffGateAttendance({
        staffGateAttendanceRequest: requestBody,
      });
      console.log("[Staff Gate Check-Out API] Response", {
        httpStatus: response.status,
        data: response.data,
      });
      if (response.data.success !== true) {
        const apiError = new Error(
          getApiErrorMessage(response.data, "Could not record staff check-out."),
        ) as Error & { apiResponse?: unknown };
        apiError.apiResponse = response.data;
        throw apiError;
      }
      await updateStaffGateState(false);
      if (canSeeGateCheckIns) void loadStaffGateCheckIns();
      setStaffCheckoutOpen(false);
      setSuccess({
        action: "check_out",
        timestamp: new Date(),
        reason:
          checkoutDetails.reason === StaffGateAttendanceRequestGateReasonEnum.Other
            ? checkoutDetails.otherReason?.trim()
            : checkoutDetails.reason,
      });
    } catch (error) {
      const requestError = error as any;
      console.log("[Staff Gate Check-Out API] Request failed", {
        httpStatus: requestError?.response?.status,
        url: requestError?.config?.url,
        method: requestError?.config?.method,
        response: requestError?.apiResponse ?? requestError?.response?.data,
        message: getRequestErrorMessage(error, "Could not record staff check-out."),
      });
      showToast({
        message: getRequestErrorMessage(error, "Could not record staff check-out."),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
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
  const loadGateCheckIns = async () => {
    if (!canLoadStudentSummary) {
      setGateCheckIns([]);
      setStudentPresentCount(0);
      setStudentTotalCount(0);
      setGateCheckInsLoading(false);
      return;
    }

    setGateCheckInsLoading(true);
    let requestStage = "classroom attendance list";
    try {
      const now = new Date();
      // The API contract is a calendar date (yyyy-MM-dd), not a UTC timestamp.
      // toISOString() would shift local midnight into the previous UTC day in Lagos.
      const fromDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const pageSize = 500;
      const firstPageParams = {
        classId: isAdmin ? undefined : assignedClass?.id,
        fromDate,
        pageNumber: 1,
        pageSize,
      };
      const firstPage =
        await attendanceApi.getClassroomAttendance(firstPageParams);
      if (firstPage.data.success === false) {
        throw new Error(
          getApiErrorMessage(
            firstPage.data,
            "Could not load today's gate check-ins.",
          ),
        );
      }

      const totalPages = Math.max(
        1,
        firstPage.data.pagination?.totalPages ?? 1,
      );
      const laterPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, async (_, index) => {
          const pageNumber = index + 2;
          const params = {
            classId: isAdmin ? undefined : assignedClass?.id,
            fromDate,
            pageNumber,
            pageSize,
          };
          const response = await attendanceApi.getClassroomAttendance(params);
          if (response.data.success === false) {
            throw new Error(
              getApiErrorMessage(
                response.data,
                "Could not load today's gate check-ins.",
              ),
            );
          }
          return response;
        }),
      );
      const records = [firstPage, ...laterPages].flatMap(
        (response) => response.data.items ?? [],
      );
      // The attendance-list response currently has studentId but omits the
      // admission number used by this screen. Resolve admission numbers from
      // the student directory and join by database student id.
      requestStage = "student directory lookup";
      let students: any[];
      if (isAdmin) {
        const studentPage = await studentsApi.getStudents({
          pageNumber: 1,
          pageSize: 100,
        });
        const studentPages = Math.max(
          1,
          studentPage.data.pagination?.totalPages ?? 1,
        );
        const studentRest = await Promise.all(
          Array.from({ length: studentPages - 1 }, async (_, index) => {
            const pageNumber = index + 2;
            return studentsApi.getStudents({ pageNumber, pageSize: 100 });
          }),
        );
        students = [studentPage, ...studentRest].flatMap(
          (response) => response.data.items ?? [],
        );
      } else {
        const classStudents = await studentsApi.getStudentsByClass({
          classId: assignedClass!.id,
        });
        students = classStudents.data.data ?? [];
      }
      setStudentTotalCount(students.length);
      setStudentPresentCount(
        records.filter((record: any) => record.isInSchool === true).length,
      );
      const studentById = new Map(
        students.map((student: any) => [String(student.id), student]),
      );
      setGateCheckIns(
        records
          .map((record: any) => ({
            id: String(record.studentId ?? "").trim(),
            name: formatPersonName(
              String(
                record.fullName ??
                  record.studentName ??
                  nameOf(studentById.get(String(record.studentId ?? ""))),
              ),
            ),
            admissionNumber:
              record.studentAdmissionNo ??
              record.admissionNumber ??
              record.admissionNo ??
              record.studentNumber ??
              (studentById.get(String(record.studentId ?? "")) as any)
                ?.admissionNumber ??
              "—",
            className: record.className ?? record.classCode,
            isInSchool:
              typeof record.isInSchool === "boolean"
                ? record.isInSchool
                : undefined,
          }))
          .filter((student) => student.id),
      );
    } catch (error) {
      showToast({
        message: getRequestErrorMessage(
          error,
          requestStage === "student directory lookup"
            ? "The gate check-ins loaded, but student admission numbers could not be loaded."
            : "Could not load today's gate check-ins.",
        ),
        type: "error",
      });
    } finally {
      setGateCheckInsLoading(false);
    }
  };
  const loadStaffGateCheckIns = async () => {
    if (!canSeeGateCheckIns) {
      setStaffGateCheckIns([]);
      setStaffGateCheckInsLoading(false);
      return;
    }

    setStaffGateCheckInsLoading(true);
    try {
      const now = new Date();
      const fromDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const response = await attendanceApi.getStaffsAttendance({
        fromDate,
        pageNumber: 1,
        pageSize: 500,
      });
      if (response.data.success === false) {
        throw new Error(response.data.message || "Could not load staff check-ins.");
      }
      const staffAttendancePages = Math.max(1, response.data.pagination?.totalPages ?? 1);
      const additionalAttendancePages = await Promise.all(
        Array.from({ length: staffAttendancePages - 1 }, (_, index) =>
          attendanceApi.getStaffsAttendance({
            fromDate,
            pageNumber: index + 2,
            pageSize: 500,
          }),
        ),
      );
      const records = [response, ...additionalAttendancePages].flatMap(
        (page) => page.data.items ?? [],
      );
      const firstStaffPage = await staffsApi.getStaffs({ pageNumber: 1, pageSize: 500 });
      if (firstStaffPage.data.success === false) {
        throw new Error(firstStaffPage.data.message || "Could not load staff directory.");
      }
      const staffPages = Math.max(1, firstStaffPage.data.pagination?.totalPages ?? 1);
      const additionalStaffPages = await Promise.all(
        Array.from({ length: staffPages - 1 }, (_, index) =>
          staffsApi.getStaffs({ pageNumber: index + 2, pageSize: 500 }),
        ),
      );
      const allStaff = [firstStaffPage, ...additionalStaffPages].flatMap(
        (page) => page.data.items ?? [],
      );
      const staffById = new Map(allStaff.map((staff) => [String(staff.id ?? ""), staff]));
      setStaffTotalCount(allStaff.filter((staff) => staff.isActive !== false).length);
      setStaffPresentCount(records.filter((record) => record.isInSchool === true).length);
      const mappedStaff = await Promise.all(
        records.map(async (record, index) => {
          const staffId = String(record.staffId ?? "").trim();
          const directoryRecord = staffById.get(staffId);
          const attendanceRecord = record as any;
          let staffNo =
            attendanceRecord.staffNo?.trim() ||
            attendanceRecord.staffNumber?.trim() ||
            directoryRecord?.staffNo?.trim();

          // Some attendance payloads reference a staff account that is missing
          // from the directory page. Resolve that person's display staff number
          // from the staff detail endpoint before omitting the subtitle.
          if (!staffNo && staffId) {
            try {
              const detail = await staffsApi.getStaffById({ id: staffId });
              if (detail.data.success !== false) {
                staffNo = detail.data.data?.staffNo?.trim();
              }
            } catch {
              // Keep the check-in row visible; the staff number is optional.
            }
          }

          return {
            id: staffId || `staff-${index}`,
            name: formatPersonName(
              record.staffFullName ||
                [directoryRecord?.firstName, directoryRecord?.lastName]
                  .filter(Boolean)
                  .join(" ") || "Staff member",
            ),
            admissionNumber: staffNo || undefined,
            isInSchool:
              typeof record.isInSchool === "boolean"
                ? record.isInSchool
                : undefined,
          };
        }),
      );
      setStaffGateCheckIns(mappedStaff);
    } catch (error) {
      showToast({
        message: getRequestErrorMessage(error, "Could not load staff check-ins."),
        type: "error",
      });
    } finally {
      setStaffGateCheckInsLoading(false);
    }
  };
  const loadAllowedClasses = async () => {
    setClassLoading(true);
    try {
      const response = await classesApi.getClasses();
      const all = response.data.data ?? [];
      let allowed = all
        .map((item: any) => {
          const id = String(item?.classId ?? item?.id ?? "").trim();
          const label = classLabelOf(item);
          if (!id || !label) return null;
          return {
            id,
            label,
            itemKey: `${id}_${String(item?.department ?? "").trim()}`,
          } as ClassOption;
        })
        .filter(Boolean) as ClassOption[];

      allowed = allowed.sort((a, b) => {
        const priorityDiff =
          getClassSortPriority(a.label) - getClassSortPriority(b.label);
        if (priorityDiff !== 0) return priorityDiff;
        return a.label.localeCompare(b.label);
      });
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
      setPresentIds(manualAttendanceByClass.get(classId) ?? []);
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
    const studentsWithoutAdmissionNumbers = manualStudents.filter(
      (student) => !student.admissionNumber?.trim(),
    );
    if (studentsWithoutAdmissionNumbers.length > 0) {
      showToast({
        message: `Attendance was not sent because ${studentsWithoutAdmissionNumbers.length} student${studentsWithoutAdmissionNumbers.length === 1 ? " is" : "s are"} missing an admission number.`,
        type: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const requestBody: BulkClassroomAttendanceRequest = {
        classId: selectedClassId,
        // Send the complete class roster: checked students are Present and
        // every unchecked student is explicitly recorded as Absent.
        students: manualStudents.map((student) => ({
          studentAdmissionNo: student.admissionNumber!.trim(),
          status: presentIds.includes(student.id)
            ? ClassroomAttendanceItemStatusEnum.Present
            : ClassroomAttendanceItemStatusEnum.Absent,
        })),
      };
      const response = await attendanceApi.recordClassroomAttendance({
        bulkClassroomAttendanceRequest: requestBody,
      });
      if (response.data.success !== true) {
        throw new Error(
          getApiErrorMessage(response.data, "Could not save attendance."),
        );
      }
      manualAttendanceByClass.set(selectedClassId, [...presentIds]);
      setManualMode(false);
      showToast({
        message: `Attendance saved for ${presentIds.length} student${presentIds.length === 1 ? "" : "s"}.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        message: getRequestErrorMessage(
          error,
          "Could not save attendance. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const copy =
    success?.action === "check_in"
      ? ["Check-In Successful"]
      : ["Check-Out Successful"];

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
  if (assignmentLoading || !hasClassAssignment || !isAdmin)
    return (
      <ScanOnlyView
        insets={insets}
        loadingAssignment={assignmentLoading}
        canLoadSchoolEventOptions={isAdmin || isTeacher}
        showStudentSummaryCard={isTeacher && hasClassAssignment}
        studentSummary={summary}
        summaryLoading={gateCheckInsLoading}
        scannerOpen={scannerOpen}
        scannerError={scannerError}
        loading={loading}
        checkoutOpen={checkoutOpen}
        success={success}
        student={scannedStudent}
        termId={user?.currentTermId ?? "2"}
        option={option}
        reason={reason}
        otherReason={otherReason}
        reasonMenuOpen={reasonMenuOpen}
        canSubmit={canSubmit}
        showManualAction={isTeacher && hasClassAssignment}
        onManual={enterManual}
        onScan={openScanner}
        onCloseScanner={() => {
          if (!loading) {
            setScannerOpen(false);
            setScannerError(null);
          }
        }}
        onBarcode={scan}
        onDismissScannerError={() => setScannerError(null)}
        onCameraMountError={(message: string) => {
          setScannerOpen(false);
          showToast({ message, type: "error" });
        }}
        onCloseCheckout={() => !loading && setCheckoutOpen(false)}
        onOption={setOption}
        onReason={setReason}
        onOther={setOtherReason}
        onReasonMenu={() => setReasonMenuOpen(!reasonMenuOpen)}
        onSubmitCheckout={submitCheckout}
        staffCheckoutOpen={staffCheckoutOpen}
        staffLoading={loading}
        staffTermId={user?.currentTermId ?? "2"}
        onCloseStaffCheckout={() => !loading && setStaffCheckoutOpen(false)}
        onSubmitStaffCheckout={submitStaffCheckout}
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
              onPress={() => {
                closeActions();
                setActiveTab(tab);
                if (tab === "Staff") void loadStaffGateCheckIns();
              }}
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
                {activeTab === "Students"
                  ? "SCAN QR TO CHECK IN OR OUT"
                  : "STAFF CHECK-INS TODAY"}
              </Text>
              {(activeTab === "Students" ? gateCheckInsLoading : staffGateCheckInsLoading) ? (
                <ActivityIndicator color="#FFF" style={{ alignSelf: "flex-start", marginVertical: 12 }} />
              ) : (
                <Text style={styles.summaryValue}>{summary}</Text>
              )}
              <View style={styles.scanHint}>
                <Ionicons name="qr-code-outline" size={16} color="#FFF" />
                  <Text style={styles.scanHintText}>
                    {activeTab === "Students"
                      ? "Tap to scan attendance"
                      : "Tap to scan staff attendance"}
                  </Text>
              </View>
              <Ionicons
                name="school"
                size={120}
                color="rgba(255,255,255,.1)"
                style={styles.summaryIcon}
              />
            </TouchableOpacity>
            <Text style={styles.listTitle}>
              {activeTab === "Students" ? "Gate Check-Ins" : "Staff Check-Ins"}
            </Text>
          </>
        }
        ListEmptyComponent={
          activeTab === "Students" ? (
            gateCheckInsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : (
              <Text style={styles.noStudents}>
                No gate check-ins recorded today.
              </Text>
            )
          ) : staffGateCheckInsLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <Text style={styles.noStudents}>No staff check-ins recorded today.</Text>
          )
        }
        renderItem={({ item }) => (
          <PersonCard
            person={item}
            showIdentifier={activeTab === "Students" || Boolean(item.admissionNumber)}
            alignTextTop={activeTab === "Staff"}
          />
        )}
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
        errorMessage={scannerError}
        loading={loading}
        insetTop={insets.top}
        onClose={() => {
          if (!loading) {
            setScannerOpen(false);
            setScannerError(null);
          }
        }}
        onScan={scan}
        onDismissError={() => setScannerError(null)}
        onMountError={(message: string) => {
          setScannerOpen(false);
          showToast({ message, type: "error" });
        }}
      />
      <CheckoutModal
        visible={checkoutOpen}
        loading={loading}
        insetBottom={insets.bottom}
        student={scannedStudent}
        termId={user?.currentTermId ?? "2"}
        canLoadSchoolEventOptions={isAdmin || isTeacher}
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
      <StaffCheckoutModal
        visible={staffCheckoutOpen}
        loading={loading}
        termId={user?.currentTermId ?? "2"}
        onClose={() => !loading && setStaffCheckoutOpen(false)}
        onSubmit={submitStaffCheckout}
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
                        key={item.itemKey}
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
  canLoadSchoolEventOptions,
  showStudentSummaryCard,
  studentSummary,
  summaryLoading,
  scannerOpen,
  scannerError,
  loading,
  checkoutOpen,
  success,
  student,
  termId,
  option,
  reason,
  otherReason,
  reasonMenuOpen,
  canSubmit,
  showManualAction,
  onManual,
  onScan,
  onCloseScanner,
  onBarcode,
  onDismissScannerError,
  onCameraMountError,
  onCloseCheckout,
  onOption,
  onReason,
  onOther,
  onReasonMenu,
  onSubmitCheckout,
  staffCheckoutOpen,
  staffLoading,
  staffTermId,
  onCloseStaffCheckout,
  onSubmitStaffCheckout,
  onDone,
}: any) {
  const copy =
    success?.action === "check_in"
      ? ["Check-In Successful"]
      : ["Check-Out Successful"];
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
            {showStudentSummaryCard ? (
              <TouchableOpacity style={styles.summaryCard} onPress={onScan}>
                <Text style={styles.summaryLabel}>YOUR CLASS CHECK-INS</Text>
                {summaryLoading ? (
                  <ActivityIndicator color="#FFF" style={{ alignSelf: "flex-start", marginVertical: 12 }} />
                ) : (
                  <Text style={styles.summaryValue}>{studentSummary}</Text>
                )}
                <View style={styles.scanHint}>
                  <Ionicons name="qr-code-outline" size={16} color="#FFF" />
                  <Text style={styles.scanHintText}>Tap to scan student attendance</Text>
                </View>
                <Ionicons
                  name="school"
                  size={120}
                  color="rgba(255,255,255,.1)"
                  style={styles.summaryIcon}
                />
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.qrIllustration}>
                  <Ionicons name="qr-code-outline" size={92} color={COLORS.primary} />
                </View>
                <Text style={styles.scanOnlyTitle}>Scan Student QR Code</Text>
                <Text style={styles.scanOnlyBody}>
                  Tap the scan button below, then point your camera at a student's attendance QR code.
                </Text>
                <TouchableOpacity style={styles.scanOnlyButton} onPress={onScan}>
                  <Ionicons name="qr-code-outline" size={22} color="#FFF" />
                  <Text style={styles.doneButtonText}>Scan QR Code</Text>
                </TouchableOpacity>
              </>
            )}
            {showManualAction && (
              <TouchableOpacity
                style={styles.manualOnlyButton}
                onPress={onManual}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={styles.manualOnlyButtonText}>Mark Attendance</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      <ScannerModal
        visible={scannerOpen}
        errorMessage={scannerError}
        loading={loading}
        insetTop={insets.top}
        onClose={onCloseScanner}
        onScan={onBarcode}
        onDismissError={onDismissScannerError}
        onMountError={onCameraMountError}
      />
      <CheckoutModal
        visible={checkoutOpen}
        loading={loading}
        insetBottom={insets.bottom}
        student={student}
        termId={termId}
        canLoadSchoolEventOptions={canLoadSchoolEventOptions}
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
      <StaffCheckoutModal
        visible={staffCheckoutOpen}
        loading={staffLoading}
        termId={staffTermId}
        onClose={onCloseStaffCheckout}
        onSubmit={onSubmitStaffCheckout}
      />
      <SuccessModal success={success} copy={copy} onDone={onDone} />
    </View>
  );
}
function StaffCheckoutModal({ visible, loading, termId, onClose, onSubmit }: any) {
  const [reason, setReason] = useState<StaffGateAttendanceRequestGateReasonEnum | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [textEntryModalOpen, setTextEntryModalOpen] = useState(false);
  const [textEntryType, setTextEntryType] = useState<"otherReason" | "extraNote">("extraNote");
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [events, setEvents] = useState<{ id: string; label: string }[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventReloadKey, setEventReloadKey] = useState(0);
  const eventRequestStarted = useRef(false);
  const selectedEvent = events.find((item) => item.id === eventId);
  const isOther = reason === StaffGateAttendanceRequestGateReasonEnum.Other;
  const isSchoolEvent = reason === StaffGateAttendanceRequestGateReasonEnum.SchoolEvent;

  useEffect(() => {
    if (!visible) return;
    setReason(null);
    setOtherReason("");
    setExtraNote("");
    setTextEntryModalOpen(false);
    setEventModalOpen(false);
    setEventId(null);
    setEventMenuOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || eventsLoaded || eventRequestStarted.current) return;
    eventRequestStarted.current = true;
    void (async () => {
      setEventLoading(true);
      setEventError(null);
      try {
        const session = await academicSessionsApi.getCurrentAcademicSession();
        if (session.data.success === false) {
          throw new Error(session.data.message || "Could not load the current term.");
        }
        const currentTermId = session.data.data?.terms?.find((term) => term.isCurrent)?.id;
        const resolvedTermId = currentTermId || (termId && !/^\d+$/.test(termId) ? termId : undefined);
        if (!resolvedTermId) throw new Error("Could not find the current term.");
        const response = await termsApi.getTermActivities({
          termId: resolvedTermId,
          filter: GetTermActivitiesFilterEnum.All,
          pageNumber: 1,
          pageSize: 100,
        });
        if (response.data.success === false) {
          throw new Error(response.data.message || "Could not load school events.");
        }
        setEvents((response.data.items ?? []).map((event: any) => ({
          id: event.id ?? "",
          label: event.title ?? "School event",
        })).filter((event) => event.id));
        setEventsLoaded(true);
      } catch (error) {
        setEventError(getRequestErrorMessage(error, "Could not load school events."));
      } finally {
        eventRequestStarted.current = false;
        setEventLoading(false);
      }
    })();
  }, [visible, eventsLoaded, eventReloadKey, termId]);

  const canSubmit = Boolean(reason) &&
    (!isOther || Boolean(otherReason.trim())) &&
    (!isSchoolEvent || Boolean(selectedEvent));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, styles.keyboardSheet, { paddingBottom: 24 }]}>
          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {eventModalOpen ? (
              <StaffSchoolEventModal
                visible
                loading={eventLoading}
                error={eventError}
                events={events}
                selectedEvent={selectedEvent}
                extraNote={extraNote}
                onExtraNote={setExtraNote}
                eventMenuOpen={eventMenuOpen}
                onBack={() => setEventModalOpen(false)}
                onToggleEvents={() => setEventMenuOpen((open) => !open)}
                onSelectEvent={(id: string) => {
                  setEventId(id);
                  setEventMenuOpen(false);
                }}
                onRetry={() => {
                  setEventsLoaded(false);
                  setEventError(null);
                  setEventReloadKey((key) => key + 1);
                }}
                onConfirm={() => reason && selectedEvent && onSubmit({
                  reason,
                  schoolEventId: eventId ?? undefined,
                  extraNote: extraNote.trim() || undefined,
                })}
              />
            ) : textEntryModalOpen ? (
              <>
                <View style={styles.handle} />
                <TouchableOpacity style={styles.backToCheckoutButton} onPress={() => setTextEntryModalOpen(false)}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                  <Text style={styles.backToCheckoutText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{STAFF_CHECKOUT_REASONS.find((item) => item.value === reason)?.label ?? "Checkout Details"}</Text>
                <Text style={styles.sheetSub}>
                  {textEntryType === "otherReason" ? "Tell us why you are leaving school." : "Add any additional checkout details (optional)."}
                </Text>
                <Text style={styles.classLabel}>{textEntryType === "otherReason" ? "Other Reason" : "Extra Notes"}</Text>
                <TextInput
                  style={styles.reasonTextArea}
                  placeholder={textEntryType === "otherReason" ? "Enter the reason" : "Enter extra notes (optional)"}
                  value={textEntryType === "otherReason" ? otherReason : extraNote}
                  onChangeText={textEntryType === "otherReason" ? setOtherReason : setExtraNote}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={5}
                />
                <TouchableOpacity
                  style={[styles.doneButton, (loading || (textEntryType === "otherReason" && !otherReason.trim())) && styles.disabled]}
                  disabled={loading || (textEntryType === "otherReason" && !otherReason.trim())}
                  onPress={() => reason && onSubmit({
                    reason,
                    otherReason: textEntryType === "otherReason" ? otherReason.trim() : undefined,
                    extraNote: textEntryType === "extraNote" ? extraNote.trim() || undefined : undefined,
                  })}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.doneButtonText}>Confirm Check-Out</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Staff Check-Out</Text>
            <Text style={styles.sheetSub}>Choose why you are leaving school.</Text>
            {STAFF_CHECKOUT_REASONS.map((item) => (
              <Choice
                key={item.value}
                active={reason === item.value}
                title={item.label}
                onPress={() => {
                  setReason(item.value);
                  if (item.value === StaffGateAttendanceRequestGateReasonEnum.SchoolEvent) {
                    setEventId(null);
                    setTextEntryModalOpen(false);
                    setEventModalOpen(true);
                    setOtherReason("");
                    setExtraNote("");
                  } else {
                    setEventModalOpen(false);
                    setOtherReason("");
                    setExtraNote("");
                    const isOtherReason = item.value === StaffGateAttendanceRequestGateReasonEnum.Other;
                    setTextEntryType("otherReason");
                    setTextEntryModalOpen(
                      item.value !== StaffGateAttendanceRequestGateReasonEnum.SchoolClosed,
                    );
                    if (!isOtherReason) setTextEntryType("extraNote");
                  }
                  setEventMenuOpen(false);
                  setEventError(null);
                }}
              />
            ))}
            {reason === StaffGateAttendanceRequestGateReasonEnum.SchoolClosed && (
              <TouchableOpacity
                style={[styles.doneButton, (!canSubmit || loading) && styles.disabled]}
                disabled={!canSubmit || loading}
                onPress={() => reason && onSubmit({ reason })}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.doneButtonText}>Confirm Check-Out</Text>}
              </TouchableOpacity>
            )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function StaffSchoolEventModal({
  visible,
  loading,
  error,
  events,
  selectedEvent,
  extraNote,
  onExtraNote,
  eventMenuOpen,
  onBack,
  onToggleEvents,
  onSelectEvent,
  onRetry,
  onConfirm,
}: any) {
  if (!visible) return null;
  return (
      <>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.backToCheckoutButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backToCheckoutText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>School Event</Text>
          <Text style={styles.sheetSub}>Select the event related to your checkout.</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
          ) : error ? (
            <View style={styles.eventErrorState}>
              <Text style={styles.eventErrorText}>{error}</Text>
              <TouchableOpacity style={styles.eventRetryButton} onPress={onRetry}>
                <Text style={styles.eventRetryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.classLabel}>Event</Text>
              <TouchableOpacity style={styles.classSelect} onPress={onToggleEvents}>
                <Text style={selectedEvent ? styles.classSelectText : styles.placeholder}>
                  {selectedEvent?.label ?? "Select an event"}
                </Text>
                <Ionicons name={eventMenuOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
              </TouchableOpacity>
              {eventMenuOpen && (
                <View style={styles.classMenu}>
                  {events.map((event: { id: string; label: string }) => (
                    <TouchableOpacity key={event.id} style={styles.classMenuItem} onPress={() => onSelectEvent(event.id)}>
                      <Text style={styles.classMenuText}>{event.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {events.length === 0 && (
                    <Text style={styles.eventErrorText}>No events available for this term.</Text>
                  )}
                </View>
              )}
              <Text style={[styles.classLabel, { marginTop: 16 }]}>Extra Notes</Text>
              <TextInput
                style={styles.reasonTextArea}
                placeholder="Add extra notes (optional)"
                value={extraNote}
                onChangeText={onExtraNote}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[styles.doneButton, !selectedEvent && styles.disabled]}
                disabled={!selectedEvent}
                onPress={onConfirm}
              >
                <Text style={styles.doneButtonText}>Confirm Check-Out</Text>
              </TouchableOpacity>
            </>
          )}
      </>
  );
}

function PersonCard({
  person,
  showIdentifier = true,
  alignTextTop = false,
}: {
  person: Person;
  showIdentifier?: boolean;
  alignTextTop?: boolean;
}) {
  const displayName = formatPersonName(person.name);
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
      </View>
      <View style={[styles.cardText, alignTextTop && styles.cardTextTop]}>
        <Text style={styles.userName}>{displayName}</Text>
        {showIdentifier && person.admissionNumber ? (
          <Text style={styles.userId}>{person.admissionNumber}</Text>
        ) : null}
      </View>
      {typeof person.isInSchool === "boolean" && (
        <View
          style={[
            styles.attendanceDot,
            { backgroundColor: person.isInSchool ? "#22C55E" : "#EF4444" },
          ]}
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
function ScannerModal({
  visible,
  errorMessage,
  loading,
  insetTop,
  onClose,
  onScan,
  onDismissError,
  onMountError,
}: any) {
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
          onMountError={(event) =>
            onMountError(
              event.message ||
                "Could not start the camera. Check browser permissions and try again.",
            )
          }
        />
        <View style={styles.cameraShade}>
          <View style={styles.viewfinder} />
          {errorMessage ? (
            <View style={styles.scannerErrorToast}>
              <Text style={styles.scannerErrorText}>{errorMessage}</Text>
              <Pressable
                onPress={onDismissError}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Dismiss camera error"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>
          ) : null}
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
  termId,
  canLoadSchoolEventOptions,
  reason,
  otherReason,
  canSubmit,
  onClose,
  onReason,
  onOther,
  onSubmit,
}: any) {
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [eventDetailsConfirmed, setEventDetailsConfirmed] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventOptionsLoaded, setEventOptionsLoaded] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [staffOptionsLoaded, setStaffOptionsLoaded] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; label: string }[]>([]);
  const [supervisors, setSupervisors] = useState<
    { id: string; label: string }[]
  >([]);
  const [approvers, setApprovers] = useState<{ id: string; label: string }[]>(
    [],
  );
  const [eventId, setEventId] = useState<string | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [eventApprovedById, setEventApprovedById] = useState<string | null>(
    null,
  );
  const [approvedById, setApprovedById] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [eventExtraNotes, setEventExtraNotes] = useState("");
  const [detailsOtherReason, setDetailsOtherReason] = useState("");
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [supervisorMenuOpen, setSupervisorMenuOpen] = useState(false);
  const [eventApprovedByMenuOpen, setEventApprovedByMenuOpen] = useState(false);
  const [approvedByMenuOpen, setApprovedByMenuOpen] = useState(false);
  const eventOptionsRequestStarted = useRef(false);
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const dismissKeyboardOrClose = () => {
    if (keyboardVisible) Keyboard.dismiss();
    else onClose();
  };
  const loadSchoolEventOptions = async () => {
    if (!canLoadSchoolEventOptions) return;
    if (
      eventLoading ||
      eventOptionsLoaded ||
      eventOptionsRequestStarted.current
    )
      return;
    eventOptionsRequestStarted.current = true;
    setEventLoading(true);
    setEventError(null);
    setStaffError(null);
    let staffLoadedSuccessfully = false;
    try {
      const [sessionResponse, staffResponse, ...approverResponses] =
        await Promise.all([
          academicSessionsApi.getCurrentAcademicSession(),
          staffsApi.getStaffs({ pageSize: 100 }),
          ...APPROVER_STAFF_ROLES.map((role) =>
            staffsApi.getStaffs({ role, pageNumber: 1, pageSize: 100 }),
          ),
        ]);
      if (
        sessionResponse.data.success === false ||
        staffResponse.data.success === false
      ) {
        throw new Error(
          sessionResponse.data.message ||
            staffResponse.data.message ||
            "Could not load the current term and staff list.",
        );
      }
      const failedApproverResponse = approverResponses.find(
        (response) => response.data.success === false,
      );
      if (failedApproverResponse) {
        throw new Error(
          failedApproverResponse.data.message ||
            "Could not load staff with administrative roles.",
        );
      }
      const approverStaffById = new Map<
        string,
        { id: string; label: string }
      >();
      approverResponses.forEach((response) => {
        (response.data.items ?? []).forEach((staff: any) => {
          if (!staff.id) return;
          approverStaffById.set(staff.id, {
            id: staff.id,
            label:
              [staff.firstName, staff.lastName].filter(Boolean).join(" ") ||
              staff.staffNo ||
              "Staff member",
          });
        });
      });
      setApprovers(Array.from(approverStaffById.values()));
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
      setStaffOptionsLoaded(true);
      staffLoadedSuccessfully = true;
      const currentTermId = sessionResponse.data.data?.terms?.find(
        (term) => term.isCurrent,
      )?.id;
      // AuthContext can contain a display placeholder like "2"; the activities
      // endpoint requires the real current-term identifier.
      const resolvedTermId =
        currentTermId || (termId && !/^\d+$/.test(termId) ? termId : undefined);
      if (!resolvedTermId) {
        throw new Error("Could not find the current term for school events.");
      }
      const eventResponse = await termsApi.getTermActivities({
        termId: resolvedTermId,
        filter: GetTermActivitiesFilterEnum.All,
        pageNumber: 1,
        pageSize: 100,
      });
      if (eventResponse.data.success === false) {
        throw new Error(
          eventResponse.data.message || "Could not load school events.",
        );
      }
      setEvents(
        (eventResponse.data.items ?? [])
          .map((event: any) => ({
            id: event.id ?? "",
            label: event.title ?? "School event",
          }))
          .filter((event) => event.id),
      );
      setEventOptionsLoaded(true);
    } catch (error) {
      const message = getRequestErrorMessage(
        error,
        "Could not load school events and staff.",
      );
      setEventError(message);
      if (!staffLoadedSuccessfully && !staffOptionsLoaded)
        setStaffError(message);
    } finally {
      eventOptionsRequestStarted.current = false;
      setEventLoading(false);
    }
  };
  useEffect(() => {
    // CheckoutModal is rendered only for authorized attendance users (admins
    // and teachers), so load both selector lists ahead of the user's tap.
    if (canLoadSchoolEventOptions) void loadSchoolEventOptions();
  }, [termId, canLoadSchoolEventOptions]);
  const openSchoolEvent = () => {
    Keyboard.dismiss();
    setEventDetailsConfirmed(false);
    if (reason !== RecordGateAttendanceRequestGateReasonEnum.SchoolEvent) {
      setEventId(null);
      setSupervisorId(null);
      setEventApprovedById(null);
      setEventDetailsConfirmed(false);
    }
    setDetailsDialogOpen(false);
    onReason(RecordGateAttendanceRequestGateReasonEnum.SchoolEvent);
    setEventDialogOpen(true);
    if (!eventOptionsLoaded && !eventLoading) void loadSchoolEventOptions();
  };
  const retrySchoolEventOptions = () => {
    setEventError(null);
    setEventOptionsLoaded(false);
    eventOptionsRequestStarted.current = false;
    void loadSchoolEventOptions();
  };
  const selectedEvent = events.find((event) => event.id === eventId);
  const selectedSupervisor = supervisors.find(
    (supervisor) => supervisor.id === supervisorId,
  );
  const selectedAdminEventApprover = approvers.find(
    (staff) => staff.id === eventApprovedById,
  );
  const selectedApprover = approvers.find((staff) => staff.id === approvedById);
  const isSchoolEvent =
    reason === RecordGateAttendanceRequestGateReasonEnum.SchoolEvent;
  const isSchoolClosed =
    reason === RecordGateAttendanceRequestGateReasonEnum.SchoolClosed;
  const needsDetails = Boolean(reason) && !isSchoolEvent && !isSchoolClosed;
  const canSubmitCheckout = canSubmit && isSchoolClosed;
  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          eventDialogOpen ? setEventDialogOpen(false) : onClose()
        }
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.dismiss}
            onPress={dismissKeyboardOrClose}
            hitSlop={12}
          />
          <View
            style={[
              styles.sheet,
              styles.keyboardSheet,
              {
                paddingBottom: Math.max(insetBottom, 24),
              },
            ]}
          >
            {eventDialogOpen ? (
              <SchoolEventModal
                visible
                loading={eventLoading}
                error={eventError}
                events={events}
                supervisors={supervisors}
                approvers={approvers}
                eventId={eventId}
                supervisorId={supervisorId}
                approvedById={eventApprovedById}
                extraNotes={eventExtraNotes}
                eventMenuOpen={eventMenuOpen}
                supervisorMenuOpen={supervisorMenuOpen}
                approvedByMenuOpen={eventApprovedByMenuOpen}
                onClose={() => setEventDialogOpen(false)}
                onBack={() => setEventDialogOpen(false)}
                onRetry={retrySchoolEventOptions}
                onEventMenu={() => setEventMenuOpen(!eventMenuOpen)}
                onSupervisorMenu={() => setSupervisorMenuOpen(!supervisorMenuOpen)}
                onApprovedByMenu={() => setEventApprovedByMenuOpen(!eventApprovedByMenuOpen)}
                onEvent={(id: string) => { setEventId(id); setEventMenuOpen(false); }}
                onSupervisor={(id: string) => { setSupervisorId(id); setSupervisorMenuOpen(false); }}
                onApprovedBy={(id: string) => { setEventApprovedById(id); setEventApprovedByMenuOpen(false); }}
                onExtraNotes={setEventExtraNotes}
                onConfirm={() => {
                  if (selectedEvent && selectedSupervisor && selectedAdminEventApprover) {
                    onSubmit({
                      schoolEventId: eventId ?? undefined,
                      approvedByStaffId: eventApprovedById ?? undefined,
                      accompaniedByStaffId: supervisorId ?? undefined,
                      extraNotes: eventExtraNotes.trim() || undefined,
                    });
                  }
                }}
              />
            ) : detailsDialogOpen ? (
              <CheckoutDetailsModal
                visible
                reason={reason}
                loading={eventLoading && !staffOptionsLoaded}
                error={staffError}
                staff={approvers}
                approvedById={approvedById}
                approvedByMenuOpen={approvedByMenuOpen}
                destination={destination}
                note={note}
                otherReason={detailsOtherReason}
                onDestination={setDestination}
                onNote={setNote}
                onOtherReason={(value: string) => { setDetailsOtherReason(value); onOther(value); }}
                onApprovedByMenu={() => setApprovedByMenuOpen(!approvedByMenuOpen)}
                onApprovedBy={(id: string) => { setApprovedById(id); setApprovedByMenuOpen(false); }}
                onClose={() => { if (keyboardVisible) Keyboard.dismiss(); else setDetailsDialogOpen(false); }}
                onBack={() => setDetailsDialogOpen(false)}
                onRetry={retrySchoolEventOptions}
                onConfirm={() => {
                  const approver = approvers.find((staff) => staff.id === approvedById);
                  if (destination.trim() && approver && (reason !== RecordGateAttendanceRequestGateReasonEnum.Other || detailsOtherReason.trim())) {
                    onSubmit({
                      approvedByStaffId: approvedById ?? undefined,
                      destination: destination.trim() || undefined,
                      extraNotes: note.trim() || undefined,
                      otherReason: detailsOtherReason.trim() || undefined,
                    });
                  }
                }}
              />
            ) : (
            <ScrollView
              style={styles.checkoutScroll}
              contentContainerStyle={styles.checkoutScrollContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
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
                    key={item.value}
                    active={reason === item.value}
                    title={item.label}
                    onPress={() => {
                      if (
                        item.value ===
                        RecordGateAttendanceRequestGateReasonEnum.SchoolEvent
                      ) {
                        openSchoolEvent();
                        return;
                      }
                      Keyboard.dismiss();
                      setEventId(null);
                      setSupervisorId(null);
                      setEventApprovedById(null);
                      setApprovedById(null);
                      setEventDetailsConfirmed(false);
                      setDetailsConfirmed(false);
                      onReason(item.value);
                      if (
                        item.value ===
                        RecordGateAttendanceRequestGateReasonEnum.SchoolClosed
                      ) {
                        setDetailsDialogOpen(false);
                      } else {
                        setDetailsDialogOpen(true);
                      }
                    }}
                  />
                ))}
              </View>
              {isSchoolClosed && <TouchableOpacity
                style={[
                  styles.doneButton,
                  !canSubmitCheckout && styles.disabled,
                ]}
                disabled={!canSubmitCheckout || loading}
                onPress={() =>
                  onSubmit({
                    schoolEventId: eventId ?? undefined,
                    approvedByStaffId:
                      (isSchoolEvent ? eventApprovedById : approvedById) ??
                      undefined,
                    accompaniedByStaffId: isSchoolEvent
                      ? (supervisorId ?? undefined)
                      : undefined,
                    destination: destination.trim() || undefined,
                    extraNotes:
                      (isSchoolEvent ? eventExtraNotes : note).trim() ||
                      undefined,
                    otherReason:
                      detailsOtherReason.trim() ||
                      otherReason.trim() ||
                      undefined,
                  })
                }
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.doneButtonText}>
                    Confirm Leave School
                  </Text>
                )}
              </TouchableOpacity>}
            </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
function SchoolEventModal({
  visible,
  loading,
  error,
  events,
  supervisors,
  approvers,
  eventId,
  supervisorId,
  approvedById,
  extraNotes,
  eventMenuOpen,
  supervisorMenuOpen,
  approvedByMenuOpen,
  onClose,
  onBack,
  onRetry,
  onEventMenu,
  onSupervisorMenu,
  onApprovedByMenu,
  onEvent,
  onSupervisor,
  onApprovedBy,
  onExtraNotes,
  onConfirm,
}: any) {
  const event = events.find((item: any) => item.id === eventId);
  const supervisor = supervisors.find((item: any) => item.id === supervisorId);
  const approver = approvers.find((item: any) => item.id === approvedById);
  if (!visible) return null;
  return (
        <ScrollView
          style={styles.checkoutScroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.checkoutScrollContent}
        >
          <View style={styles.handle} />
          <TouchableOpacity style={styles.backToCheckoutButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backToCheckoutText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>School Event</Text>
          <Text style={styles.sheetSub}>
            Select the event, approver, and supervising staff member.
          </Text>
          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 28 }}
            />
          ) : error ? (
            <View style={styles.eventErrorState}>
              <Text style={styles.eventErrorText}>{error}</Text>
              <TouchableOpacity
                style={styles.eventRetryButton}
                onPress={onRetry}
              >
                <Text style={styles.eventRetryText}>Try again</Text>
              </TouchableOpacity>
            </View>
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
                Approved By
              </Text>
              <TouchableOpacity
                style={styles.classSelect}
                onPress={onApprovedByMenu}
              >
                <Text
                  style={approver ? styles.classSelectText : styles.placeholder}
                >
                  {approver?.label ?? "Select approving staff"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
              {approvedByMenuOpen && (
                <View style={styles.classMenu}>
                  {approvers.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.classMenuItem}
                      onPress={() => onApprovedBy(item.id)}
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
              <Text style={[styles.classLabel, { marginTop: 16 }]}>
                Extra Notes
              </Text>
              <TextInput
                style={styles.reasonTextArea}
                placeholder="Add a note (optional)"
                value={extraNotes}
                onChangeText={onExtraNotes}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  (!event || !approver || !supervisor) && styles.disabled,
                ]}
                disabled={!event || !approver || !supervisor}
                onPress={onConfirm}
              >
                <Text style={styles.doneButtonText}>Confirm Check-Out</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
  );
}

function CheckoutDetailsModal({
  visible,
  reason,
  loading,
  error,
  staff,
  approvedById,
  approvedByMenuOpen,
  destination,
  note,
  otherReason,
  onDestination,
  onNote,
  onOtherReason,
  onApprovedByMenu,
  onApprovedBy,
  onClose,
  onBack,
  onRetry,
  onConfirm,
}: any) {
  const approver = staff.find((item: any) => item.id === approvedById);
  const isOther = reason === RecordGateAttendanceRequestGateReasonEnum.Other;
  if (!visible) return null;
  return (
        <ScrollView
          style={styles.checkoutScroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.checkoutScrollContent}
        >
          <View style={styles.handle} />
          <TouchableOpacity style={styles.backToCheckoutButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backToCheckoutText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>
            {REASONS.find((item: any) => item.value === reason)?.label ?? "Checkout Details"}
          </Text>
          <Text style={styles.sheetSub}>
            Add the destination, approver, and any useful notes.
          </Text>
          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 18 }}
            />
          ) : error ? (
            <View style={styles.eventErrorState}>
              <Text style={styles.eventErrorText}>{error}</Text>
              <TouchableOpacity
                style={styles.eventRetryButton}
                onPress={onRetry}
              >
                <Text style={styles.eventRetryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.classLabel, { marginTop: 16 }]}>
                Destination
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Where is the student going?"
                value={destination}
                onChangeText={onDestination}
                returnKeyType="done"
              />
              <Text style={[styles.classLabel, { marginTop: 16 }]}>
                Approved By
              </Text>
              <TouchableOpacity
                style={styles.classSelect}
                onPress={onApprovedByMenu}
              >
                <Text
                  style={approver ? styles.classSelectText : styles.placeholder}
                >
                  {approver?.label ?? "Select approving staff"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
              {approvedByMenuOpen && (
                <View style={styles.classMenu}>
                  {staff.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.classMenuItem}
                      onPress={() => onApprovedBy(item.id)}
                    >
                      <Text style={styles.classMenuText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {isOther && (
                <>
                  <Text style={[styles.classLabel, { marginTop: 16 }]}>
                    Other Reason
                  </Text>
                  <TextInput
                    style={styles.reasonTextArea}
                    placeholder="Enter reason"
                    value={otherReason}
                    onChangeText={onOtherReason}
                    multiline
                    textAlignVertical="top"
                    numberOfLines={4}
                  />
                </>
              )}
              {!isOther && (
                <>
                  <Text style={[styles.classLabel, { marginTop: 16 }]}>
                    Extra Notes
                  </Text>
                  <TextInput
                    style={styles.reasonTextArea}
                    placeholder="Add a note (optional)"
                    value={note}
                    onChangeText={onNote}
                    multiline
                    textAlignVertical="top"
                    numberOfLines={4}
                  />
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  (!destination.trim() ||
                    !approver ||
                    (isOther && !otherReason.trim())) &&
                    styles.disabled,
                ]}
                disabled={
                  !destination.trim() ||
                  !approver ||
                  (isOther && !otherReason.trim())
                }
                onPress={onConfirm}
              >
                <Text style={styles.doneButtonText}>Confirm Check-Out</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
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
        {description ? (
          <Text style={styles.choiceSub}>{description}</Text>
        ) : null}
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
          <Text style={styles.timeText}>
            {success?.action === "check_in" ? "Check-in" : "Check-out"} time:{" "}
            {success?.timestamp.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
          {success?.action === "check_out" && success?.reason ? (
            <Text style={styles.successReason}>Reason: {success.reason}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.doneButton, styles.successDoneButton]}
            onPress={onDone}
          >
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
  manualOnlyButton: {
    marginTop: 12,
    minHeight: 54,
    width: "100%",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  manualOnlyButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Lexend",
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
  cardTextTop: { alignSelf: "flex-start" },
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
  attendanceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 7,
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
    paddingHorizontal: 20,
  },
  successDoneButton: {
    width: "100%",
    maxWidth: 240,
    marginTop: 16,
    marginBottom: 0,
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
  scannerErrorToast: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    elevation: 8,
  },
  scannerErrorText: {
    flex: 1,
    color: "#1F2937",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Lexend",
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
  eventModalOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "transparent",
    zIndex: 10,
    elevation: 10,
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  checkoutDetailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  keyboardSheet: {
    width: "100%",
    maxHeight: "92%",
  },
  checkoutScroll: {
    flexShrink: 1,
  },
  checkoutScrollContent: {
    paddingBottom: 8,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },
  backToCheckoutButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginBottom: 14,
    paddingVertical: 4,
  },
  backToCheckoutText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Lexend",
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
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  reasonTextArea: {
    minHeight: 120,
    maxHeight: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    maxWidth: 360,
    backgroundColor: "#FFF",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.statusCompleted,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  reasonText: {
    marginTop: 16,
    color: "#0F172A",
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  timeText: { marginTop: 12, color: "#64748B", fontFamily: "Lexend" },
  eventSelectionSummary: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 12,
    fontFamily: "Lexend",
  },
  eventErrorState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  eventErrorText: {
    color: "#B91C1C",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Lexend",
  },
  eventRetryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  eventRetryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  successReason: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Lexend",
  },
});
