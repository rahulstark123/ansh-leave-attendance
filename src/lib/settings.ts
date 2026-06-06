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
    customLeaveTypes: [
      {
        id: "clt-maternity",
        name: "Maternity Leave",
        days: 90,
        color: "purple",
        allowRollover: false,
        description: "Paid time off for expecting mothers before and after childbirth.",
        applicableGender: "Female",
        accrualPolicy: "One-time",
        requiresProof: true
      },
      {
        id: "clt-paternity",
        name: "Paternity Leave",
        days: 15,
        color: "indigo",
        allowRollover: false,
        description: "Paid time off for new fathers following childbirth or adoption.",
        applicableGender: "Male",
        accrualPolicy: "One-time",
        requiresProof: true
      },
      {
        id: "clt-marriage",
        name: "Marriage Leave",
        days: 5,
        color: "pink",
        allowRollover: false,
        description: "Paid days off granted to employees celebrating their own marriage.",
        applicableGender: "All",
        accrualPolicy: "One-time",
        requiresProof: true
      },
      {
        id: "clt-bereavement",
        name: "Bereavement Leave",
        days: 7,
        color: "slate",
        allowRollover: false,
        description: "Compassionate paid leave granted upon the loss of an immediate family member.",
        applicableGender: "All",
        accrualPolicy: "One-time",
        requiresProof: false
      }
    ],
    policyDocuments: [
      { id: "doc-handbook", name: "ANSH_Apps_Leave_Policy_Handbook_2026.pdf", uploadedAt: "2026-05-15", size: "2.4 MB" },
      { id: "doc-remote", name: "Hybrid_and_Remote_Work_Guidelines.pdf", uploadedAt: "2026-05-20", size: "1.1 MB" }
    ],
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
    maxUsers: 50,
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
    industry: "Software & Technology",
    foundYear: "2021",
    registrationNumber: "CIN-U72900MH2021PTC361284",
    contactEmail: "contact@ansh.com",
    contactPhone: "+91 22 4567 8901",
    websiteUrl: "https://ansh.com"
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
