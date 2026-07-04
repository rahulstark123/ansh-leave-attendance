import fs from "fs";
import path from "path";

export interface CustomLeaveType {
  id: string;
  name: string;
  days: number;
  color: string;
  allowRollover: boolean;
  description?: string;
  applicableGender?: string; // "All" | "Male" | "Female"
  accrualPolicy?: string; // "Monthly" | "Yearly" | "One-time"
  requiresProof?: boolean;
  branchId?: string; // "All" or specific branch ID/Name
}

export interface PolicyDocument {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
  s3Key?: string;
}

export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  type: string;
  branchId?: string; // "All" or specific branch ID
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  pincode?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  allowWFH?: boolean;
}

export interface CompanyProfile {
  name: string;
  address: string;
  employeeCount: string;
  industry?: string;
  foundYear?: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
}

export interface SystemSettings {
  leaveSettings: {
    annualLimit: number;
    sickLimit: number;
    casualLimit: number;
    customLeaveTypes?: CustomLeaveType[];
    policyDocuments?: PolicyDocument[];
    companyHolidays?: CompanyHoliday[];
  };
  attendanceSettings: {
    shiftStartTime: string; // "09:00 AM"
    gracePeriod: number; // minutes
    workingHours: number; // hours
    requireFaceMatch?: boolean;
  };
  billingSettings: {
    planName: string;
    maxUsers: number;
    price: number;
    currency: string;
  };
  branches?: Branch[];
  companyProfile?: CompanyProfile;
}

const SETTINGS_FILE = path.join(process.cwd(), "src/config/system-settings.json");

const defaultSettings: SystemSettings = {
  leaveSettings: {
    annualLimit: 15,
    sickLimit: 8,
    casualLimit: 6,
    customLeaveTypes: [],
    // Policy documents are stored per-workspace in the PolicyDocument DB table, not here.
    policyDocuments: [],
    companyHolidays: [
      { id: "hol-ny", name: "New Year's Day", date: "2026-01-01", type: "Gazetted", branchId: "All" },
      { id: "hol-rd", name: "Republic Day", date: "2026-01-26", type: "Gazetted", branchId: "All" },
      { id: "hol-holi", name: "Holi Festival", date: "2026-03-08", type: "Gazetted", branchId: "All" },
      { id: "hol-id", name: "Independence Day", date: "2026-08-15", type: "Gazetted", branchId: "All" },
      { id: "hol-gd", name: "Gandhi Jayanti", date: "2026-10-02", type: "Gazetted", branchId: "All" },
      { id: "hol-diwali", name: "Diwali Festival", date: "2026-11-08", type: "Gazetted", branchId: "All" },
      { id: "hol-christmas", name: "Christmas Day", date: "2026-12-25", type: "Gazetted", branchId: "All" }
    ]
  },
  attendanceSettings: {
    shiftStartTime: "09:00 AM",
    gracePeriod: 15,
    workingHours: 9,
    requireFaceMatch: false,
  },
  billingSettings: {
    planName: "ANSH HR Premium - Startup Edition",
    maxUsers: 3,
    price: 0,
    currency: "INR",
  },
  branches: [
    { id: "branch-hq", name: "Main HQ", address: "123 Corporate Tower, New Delhi, India", allowWFH: true },
    { id: "branch-bengaluru", name: "Bengaluru Tech Park", address: "45 Technology Blvd, Outer Ring Road, Bengaluru, India", allowWFH: true }
  ],
  companyProfile: {
    name: "ANSH Solutions",
    address: "123 Business Park, Mumbai, India",
    employeeCount: "11-50",
    industry: "",
    foundYear: "",
    registrationNumber: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: ""
  }
};

export function getSystemSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        ...defaultSettings,
        ...parsed,
        leaveSettings: {
          ...defaultSettings.leaveSettings,
          ...parsed.leaveSettings
        },
        attendanceSettings: {
          ...defaultSettings.attendanceSettings,
          ...parsed.attendanceSettings
        },
        billingSettings: {
          ...defaultSettings.billingSettings,
          ...parsed.billingSettings
        },
        branches: parsed.branches !== undefined ? parsed.branches : defaultSettings.branches,
        companyProfile: parsed.companyProfile !== undefined ? { ...defaultSettings.companyProfile, ...parsed.companyProfile } : defaultSettings.companyProfile
      };
    }
  } catch (error) {
    console.error("Error reading system settings:", error);
  }
  return defaultSettings;
}

export function saveSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
  try {
    const current = getSystemSettings();
    const updated = {
      ...current,
      ...settings,
      leaveSettings: { ...current.leaveSettings, ...settings.leaveSettings },
      attendanceSettings: { ...current.attendanceSettings, ...settings.attendanceSettings },
      billingSettings: { ...current.billingSettings, ...settings.billingSettings },
      branches: settings.branches !== undefined ? settings.branches : current.branches,
      companyProfile: settings.companyProfile !== undefined ? { ...current.companyProfile, ...settings.companyProfile } : current.companyProfile
    };
    
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (error) {
    console.error("Error saving system settings:", error);
    return getSystemSettings();
  }
}
