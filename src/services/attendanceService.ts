export type AttendanceLogType = "check_in" | "check_out_day" | "check_out_reason";

export interface AttendanceLog {
  type: AttendanceLogType;
  reason?: string;
  timestamp: Date;
}

export type AttendanceAction = AttendanceLogType | "check_out_required";

export interface AttendanceResponse {
  success: true;
  action: AttendanceAction;
  message: string;
}

const MOCK_DELAY_MS = 1000;
const attendanceLogs = new Map<string, AttendanceLog[]>();
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
const getLogs = (userId: string) => attendanceLogs.get(userId) ?? [];

const appendLog = (userId: string, log: AttendanceLog) => {
  const logs = getLogs(userId);
  logs.push(log);
  attendanceLogs.set(userId, logs);
};

/** Temporary API-shaped service; its methods can be replaced by real calls later. */
export const AttendanceService = {
  async scanAttendance(userId: string): Promise<AttendanceResponse> {
    await delay();
    const logs = getLogs(userId);
    const latestLog = logs[logs.length - 1];
    if (latestLog?.type === "check_in") {
      return { success: true, action: "check_out_required", message: "Attendance already exists for today." };
    }
    appendLog(userId, { type: "check_in", timestamp: new Date() });
    return { success: true, action: "check_in", message: "Check-in successful." };
  },

  async checkOutForDay(userId: string): Promise<AttendanceResponse> {
    await delay();
    appendLog(userId, { type: "check_out_day", timestamp: new Date() });
    return { success: true, action: "check_out_day", message: "Check-out successful." };
  },

  async checkOutForReason(userId: string, reason: string): Promise<AttendanceResponse> {
    await delay();
    appendLog(userId, { type: "check_out_reason", reason, timestamp: new Date() });
    return { success: true, action: "check_out_reason", message: "Temporary check-out successful." };
  },

  getLatestLog(userId: string): AttendanceLog | undefined {
    const logs = getLogs(userId);
    return logs[logs.length - 1];
  },
};
