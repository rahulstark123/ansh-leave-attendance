import { create } from "zustand";
import { sortByAppliedAtRecentFirst, sortPunchRecordsRecentFirst } from "@/lib/sort-recent-first";
import { persist, createJSONStorage } from "zustand/middleware";
import { queuedLocalStorage } from "@/lib/safe-storage";
import { isFaceEnrolled } from "@/lib/face-enrollment";

export type LeaveType = "Annual" | "Sick" | "Casual" | "Unpaid" | "Maternity/Paternity" | "WFH" | string;
export type LeaveStatus = "Approved" | "Pending" | "Rejected";
export type EmployeeStatus = "Active" | "On Leave" | "Half-day" | "Off";
export type EmployeeRole = "Admin" | "HR Manager" | "Employee" | "Owner" | "Manager";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  avatarInitials: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  halfDay: boolean;
  reason: string;
  attachments?: string[];
  status: LeaveStatus;
  appliedAt: string;
}

export interface PunchRecord {
  id: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  duration: string | null; // e.g. "8h 15m"
  status: "On-time" | "Late" | "Half-day" | "Absent" | "WFH" | "Regularized";
  employeeId?: string;
  punchInPhoto?: string | null;
  punchOutPhoto?: string | null;
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  avatarInitials: string;
  status: EmployeeStatus;
  branch?: string;
  reportingManager?: string;
  reportingHR?: string;
  facePhotos?: string[];
  faceEnrolled?: boolean;
  bloodGroup?: string;
  phoneNumber?: string;
  personalEmail?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  employeeCode?: string;
  designation?: string;
  employmentType?: string;
  workLocation?: string;
  joiningDate?: string;
}

interface LeaveState {
  employees: Employee[];
  leaves: LeaveRequest[];
  dashboardEmployees: Employee[];
  dashboardLeaves: LeaveRequest[];
  /** Employees in scope who punched in today (actual attendance, not status field). */
  todayPresentCount: number;
  punchHistory: PunchRecord[];
  currentPunchIn: string | null; // ISO String of when user punched in
  currentPunchInPhoto: string | null; // S3 URL of punch-in selfie
  currentPunchInLat: number | null; // Latitude of check-in
  currentPunchInLng: number | null; // Longitude of check-in
  currentUser: Employee;
  faceEnrolled: boolean;
  setFaceEnrolled: (enrolled: boolean) => void;
  initialize: () => Promise<void>;
  applyLeave: (request: Omit<LeaveRequest, "id" | "employeeId" | "employeeName" | "employeeRole" | "avatarInitials" | "appliedAt" | "status"> & { attachments?: string[] }) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string) => Promise<void>;
  updateLeave: (id: string, request: any) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
  punchIn: (selfie?: string, lat?: number | null, lng?: number | null) => Promise<void>;
  punchOut: (selfie?: string, lat?: number | null, lng?: number | null) => Promise<void>;
  switchUser: (id: string) => void;
}

const initialEmployees: Employee[] = [
  {
    id: "emp-1",
    name: "Rahul Raj",
    email: "rahul.raj@ansh.com",
    role: "HR Manager",
    department: "Human Resources",
    avatarInitials: "RR",
    status: "Active",
  },
  {
    id: "emp-2",
    name: "Priya Sharma",
    email: "priya.sharma@ansh.com",
    role: "Employee",
    department: "Engineering",
    avatarInitials: "PS",
    status: "Active",
  },
  {
    id: "emp-3",
    name: "Amit Patel",
    email: "amit.patel@ansh.com",
    role: "Employee",
    department: "Product Design",
    avatarInitials: "AP",
    status: "On Leave",
  },
  {
    id: "emp-4",
    name: "Sneha Reddy",
    email: "sneha.reddy@ansh.com",
    role: "Employee",
    department: "Data Analytics",
    avatarInitials: "SR",
    status: "Half-day",
  },
  {
    id: "emp-5",
    name: "Rohan Gupta",
    email: "rohan.gupta@ansh.com",
    role: "Employee",
    department: "Engineering (QA)",
    avatarInitials: "RG",
    status: "Active",
  },
  {
    id: "emp-6",
    name: "Vikram Malhotra",
    email: "vikram.m@ansh.com",
    role: "Admin",
    department: "Executive",
    avatarInitials: "VM",
    status: "Active",
  },
];

const initialLeaves: LeaveRequest[] = [
  {
    id: "req-1",
    employeeId: "emp-2",
    employeeName: "Priya Sharma",
    employeeRole: "Software Engineer",
    avatarInitials: "PS",
    type: "Annual",
    startDate: "2026-06-10",
    endDate: "2026-06-13",
    totalDays: 3,
    halfDay: false,
    reason: "Going on a family trip to Himachal",
    status: "Pending",
    appliedAt: "2026-05-28T09:15:00.000Z",
  },
  {
    id: "req-2",
    employeeId: "emp-3",
    employeeName: "Amit Patel",
    employeeRole: "Senior Product Designer",
    avatarInitials: "AP",
    type: "Sick",
    startDate: "2026-05-29",
    endDate: "2026-05-29",
    totalDays: 1,
    halfDay: false,
    reason: "Severe dental checkup and surgery",
    status: "Pending",
    appliedAt: "2026-05-29T07:30:00.000Z",
  },
  {
    id: "req-3",
    employeeId: "emp-4",
    employeeName: "Sneha Reddy",
    employeeRole: "Data Analyst",
    avatarInitials: "SR",
    type: "Casual",
    startDate: "2026-05-29",
    endDate: "2026-05-29",
    totalDays: 0.5,
    halfDay: true,
    reason: "Urgent personal work at the bank in the afternoon",
    status: "Approved",
    appliedAt: "2026-05-27T14:22:00.000Z",
  },
  {
    id: "req-4",
    employeeId: "emp-1",
    employeeName: "Rahul Raj",
    employeeRole: "HR Manager",
    avatarInitials: "RR",
    type: "Annual",
    startDate: "2026-05-15",
    endDate: "2026-05-18",
    totalDays: 3,
    halfDay: false,
    reason: "Extended weekend trip",
    status: "Approved",
    appliedAt: "2026-05-10T10:00:00.000Z",
  },
  {
    id: "req-5",
    employeeId: "emp-5",
    employeeName: "Rohan Gupta",
    employeeRole: "QA Analyst",
    avatarInitials: "RG",
    type: "Casual",
    startDate: "2026-05-05",
    endDate: "2026-05-05",
    totalDays: 1,
    halfDay: false,
    reason: "Sister's graduation ceremony",
    status: "Rejected",
    appliedAt: "2026-05-02T11:45:00.000Z",
  },
];

const initialPunchHistory: PunchRecord[] = [
  {
    id: "p-1",
    date: "2026-05-28",
    punchIn: "09:05 AM",
    punchOut: "06:12 PM",
    duration: "9h 07m",
    status: "On-time",
    employeeId: "emp-1",
  },
  {
    id: "p-2",
    date: "2026-05-27",
    punchIn: "09:45 AM",
    punchOut: "06:05 PM",
    duration: "8h 20m",
    status: "Late",
    employeeId: "emp-1",
  },
  {
    id: "p-3",
    date: "2026-05-26",
    punchIn: "08:58 AM",
    punchOut: "05:30 PM",
    duration: "8h 32m",
    status: "On-time",
    employeeId: "emp-1",
  },
  {
    id: "p-4",
    date: "2026-05-25",
    punchIn: "09:02 AM",
    punchOut: "06:00 PM",
    duration: "8h 58m",
    status: "On-time",
    employeeId: "emp-1",
  },
  {
    id: "p-5",
    date: "2026-05-22",
    punchIn: "01:00 PM",
    punchOut: "06:00 PM",
    duration: "5h 00m",
    status: "Half-day",
    employeeId: "emp-1",
  },
];

const mapDbEmployee = (dbEmp: any): Employee => {
  return {
    id: dbEmp.id,
    name: dbEmp.name,
    email: dbEmp.email,
    role: dbEmp.role as EmployeeRole,
    department: dbEmp.department,
    avatarInitials: dbEmp.avatarInitials,
    status: dbEmp.status as EmployeeStatus,
    branch: dbEmp.branch || undefined,
    reportingManager: dbEmp.reportingManager || undefined,
    reportingHR: dbEmp.reportingHR || undefined,
    facePhotos: dbEmp.facePhotos || [],
    faceEnrolled: isFaceEnrolled(dbEmp.facePhotos, dbEmp.faceEmbedding),
    bloodGroup: dbEmp.bloodGroup || undefined,
    phoneNumber: dbEmp.phoneNumber || undefined,
    personalEmail: dbEmp.personalEmail || undefined,
    dateOfBirth: dbEmp.dateOfBirth || undefined,
    emergencyContactName: dbEmp.emergencyContactName || undefined,
    emergencyContactPhone: dbEmp.emergencyContactPhone || undefined,
    employeeCode: dbEmp.employeeCode || undefined,
    designation: dbEmp.designation || undefined,
    employmentType: dbEmp.employmentType || undefined,
    workLocation: dbEmp.workLocation || undefined,
    joiningDate: dbEmp.joiningDate || undefined,
  };
};

const getHeaders = () => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("ansh_auth_token") : null;
  const impersonateId = typeof window !== "undefined" ? sessionStorage.getItem("ansh_impersonate_user_id") : null;
  
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(impersonateId ? { "X-Impersonate-User": impersonateId } : {}),
  };
};

export const useLeaveStore = create<LeaveState>()(
  persist(
    (set) => ({
      employees: [],
      leaves: [],
      dashboardEmployees: [],
      dashboardLeaves: [],
      todayPresentCount: 0,
      punchHistory: [],
      currentPunchIn: null,
      currentPunchInPhoto: null,
      currentPunchInLat: null,
      currentPunchInLng: null,
      currentUser: {
        id: "",
        name: "Loading...",
        email: "",
        role: "Employee",
        department: "",
        avatarInitials: "...",
        status: "Active",
      },
      faceEnrolled: false,
      setFaceEnrolled: (enrolled: boolean) => set({ faceEnrolled: enrolled }),


      initialize: async () => {
        try {
          const headers = getHeaders();
          
          const res = await fetch("/api/dashboard", { headers });
          if (!res.ok) return;
          const data = await res.json();

          const currentUser = mapDbEmployee(data.currentUser);
          const employees = (data.employees || []).map(mapDbEmployee);
          const leaves = sortByAppliedAtRecentFirst(data.leaves || []) as LeaveRequest[];
          const dashboardEmployees = (data.dashboardEmployees || []).map(mapDbEmployee);
          const dashboardLeaves = sortByAppliedAtRecentFirst(data.dashboardLeaves || []) as LeaveRequest[];
          const punchHistory = sortPunchRecordsRecentFirst(data.punchHistory || []) as PunchRecord[];
          const currentPunchIn = data.currentPunchIn || null;
          const currentPunchInPhoto = data.currentPunchInPhoto || null;
          const currentPunchInLat = data.currentPunchInLat || null;
          const currentPunchInLng = data.currentPunchInLng || null;
          const faceEnrolled = data.faceEnrolled || false;
          const scopedTeam = dashboardEmployees.length ? dashboardEmployees : [currentUser];
          const todayPresentCount =
            typeof data.todayPresentCount === "number" ? data.todayPresentCount : 0;

          set({
            currentUser,
            employees: employees.length ? employees : [currentUser],
            leaves,
            dashboardEmployees: scopedTeam,
            dashboardLeaves,
            todayPresentCount,
            punchHistory,
            currentPunchIn,
            currentPunchInPhoto,
            currentPunchInLat,
            currentPunchInLng,
            faceEnrolled,
          });
        } catch (error) {
          console.error("Store initialization failed:", error);
        }
      },

      applyLeave: async (req) => {
        try {
          const headers = getHeaders();
          const res = await fetch("/api/leaves", {
            method: "POST",
            headers,
            body: JSON.stringify(req),
          });
          if (!res.ok) throw new Error("Failed to apply for leave");
          const data = await res.json();
          if (data.leave) {
            set((state) => ({
              leaves: sortByAppliedAtRecentFirst([data.leave, ...state.leaves]),
            }));
            await useLeaveStore.getState().initialize();
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      },

      approveLeave: async (id) => {
        try {
          const headers = getHeaders();
          const res = await fetch("/api/leaves/status", {
            method: "POST",
            headers,
            body: JSON.stringify({ id, status: "Approved" }),
          });
          if (!res.ok) throw new Error("Failed to approve leave");
          
          set((state) => ({
            leaves: state.leaves.map((leave) =>
              leave.id === id ? { ...leave, status: "Approved" as LeaveStatus } : leave
            ),
          }));
          await useLeaveStore.getState().initialize();
        } catch (error) {
          console.error(error);
        }
      },

      rejectLeave: async (id) => {
        try {
          const headers = getHeaders();
          const res = await fetch("/api/leaves/status", {
            method: "POST",
            headers,
            body: JSON.stringify({ id, status: "Rejected" }),
          });
          if (!res.ok) throw new Error("Failed to reject leave");
          
          set((state) => ({
            leaves: state.leaves.map((l) =>
              l.id === id ? { ...l, status: "Rejected" as LeaveStatus } : l
            ),
          }));
          await useLeaveStore.getState().initialize();
        } catch (error) {
          console.error(error);
        }
      },

      punchIn: async (selfie?: string, lat?: number | null, lng?: number | null) => {
        try {
          const headers = getHeaders();
          const res = await fetch("/api/attendance/punch", {
            method: "POST",
            headers,
            body: JSON.stringify({ action: "punch-in", selfie, lat, lng }),
          });
          if (!res.ok) throw new Error("Failed to punch in");
          const data = await res.json();
          
          set({
            currentPunchIn: data.currentPunchIn,
            currentPunchInPhoto: data.currentPunchInPhoto || null,
            currentPunchInLat: data.currentPunchInLat ?? null,
            currentPunchInLng: data.currentPunchInLng ?? null,
          });
          if (data.punchRecord) {
            set((state) => {
              const today = new Date().toISOString().split("T")[0];
              const hadTodayBefore = state.punchHistory.some(
                (p) => p.date === today && p.id !== data.punchRecord.id
              );
              return {
                punchHistory: sortPunchRecordsRecentFirst([
                  data.punchRecord,
                  ...state.punchHistory.filter((p) => p.id !== data.punchRecord.id),
                ]),
                todayPresentCount: hadTodayBefore
                  ? state.todayPresentCount
                  : state.todayPresentCount + 1,
              };
            });
          }
          set((state) => ({
            currentUser: { ...state.currentUser, status: "Active" },
            employees: state.employees.map((e) =>
              e.id === state.currentUser.id ? { ...e, status: "Active" } : e
            ),
          }));
        } catch (error) {
          console.error(error);
        }
      },

      punchOut: async (selfie?: string, lat?: number | null, lng?: number | null) => {
        try {
          const headers = getHeaders();
          const res = await fetch("/api/attendance/punch", {
            method: "POST",
            headers,
            body: JSON.stringify({ action: "punch-out", selfie, lat, lng }),
          });
          if (!res.ok) throw new Error("Failed to punch out");
          const data = await res.json();
          
          set((state) => ({
            currentPunchIn: null,
            currentPunchInPhoto: null,
            currentPunchInLat: null,
            currentPunchInLng: null,
            punchHistory: data.punchRecord
              ? sortPunchRecordsRecentFirst(
                  state.punchHistory.map((p) =>
                    p.id === data.punchRecord.id ? data.punchRecord : p
                  )
                )
              : state.punchHistory,
          }));
        } catch (error) {
          console.error(error);
        }
      },

      switchUser: (id) => {
        set((state) => {
          const user = state.employees.find((e) => e.id === id) || state.currentUser;
          return { currentUser: user };
        });
        useLeaveStore.getState().initialize();
      },

      updateLeave: async (id, req) => {
        try {
          const headers = getHeaders();
          const res = await fetch("/api/leaves", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ id, ...req }),
          });
          if (!res.ok) throw new Error("Failed to update leave request");
          const data = await res.json();
          if (data.leave) {
            set((state) => ({
              leaves: state.leaves.map((l) => (l.id === id ? data.leave : l)),
            }));
            await useLeaveStore.getState().initialize();
          }
        } catch (error) {
          console.error(error);
        }
      },

      deleteLeave: async (id) => {
        try {
          const headers = getHeaders();
          const res = await fetch(`/api/leaves?id=${id}`, {
            method: "DELETE",
            headers,
          });
          if (!res.ok) throw new Error("Failed to delete leave request");
          set((state) => ({
            leaves: state.leaves.filter((l) => l.id !== id),
          }));
          await useLeaveStore.getState().initialize();
        } catch (error) {
          console.error(error);
        }
      },
    }),
    {
      name: "ansh-leave-database",
      version: 1,
      storage: createJSONStorage(() => queuedLocalStorage),
    }
  )
);
