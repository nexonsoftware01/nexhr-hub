import { getDeviceId, getDeviceName } from './device';
import { ApiError } from './api-error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Lazy-load mock modules to avoid circular dependency (mock-data imports types from this file)
const getMocks = () => import('./mock-data');

let accessToken: string | null = localStorage.getItem('nexhr_access_token');
let refreshToken: string | null = localStorage.getItem('nexhr_refresh_token');

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('nexhr_access_token', access);
  localStorage.setItem('nexhr_refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('nexhr_access_token');
  localStorage.removeItem('nexhr_refresh_token');
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR' | 'EMPLOYEE';
  managerId: number | null;
  monthlySalary: number | null;
}

// Normalize backend values to nullable number
function toNullableNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const nested =
      value.amount ??
      value.value ??
      value.monthlySalary ??
      value.monthly_salary ??
      value.salary ??
      null;

    if (nested !== null && nested !== undefined) return toNullableNumber(nested);
  }

  return null;
}

function pickSalaryRaw(raw: any): any {
  const direct =
    raw.monthlySalary ??
    raw.monthly_salary ??
    raw.monthlysalary ??
    raw.salary ??
    raw.salary_amount ??
    raw.monthlySalaryAmount ??
    raw.monthly_salary_amount ??
    raw.compensation?.monthlySalary ??
    raw.compensation?.monthly_salary ??
    raw.compensation?.amount ??
    raw.salaryDetails?.monthlySalary ??
    raw.salary_details?.monthly_salary ??
    raw.payroll?.monthlySalary ??
    raw.payroll?.monthly_salary ??
    raw.pay?.monthlySalary ??
    raw.pay?.monthly_salary ??
    raw.employee?.monthlySalary ??
    raw.employee?.monthly_salary ??
    raw.salary?.amount ??
    raw.salary?.value ??
    null;

  if (direct !== null && direct !== undefined) return direct;

  const salaryKeyEntry = Object.entries(raw).find(([key, val]) =>
    /monthly.*salary|salary.*monthly|salary/i.test(key) && toNullableNumber(val) !== null
  );

  return salaryKeyEntry?.[1] ?? null;
}

// Map backend response shapes to frontend User
function mapUser(raw: any): User {
  const managerRaw =
    raw.managerId ??
    raw.manager_id ??
    raw.reportingManagerId ??
    raw.reporting_manager_id ??
    raw.manager?.id ??
    raw.reportingManager?.id ??
    null;

  return {
    id: toNullableNumber(raw.id) ?? 0,
    name: raw.name ?? '',
    email: raw.email ?? '',
    role: raw.role,
    managerId: toNullableNumber(managerRaw),
    monthlySalary: toNullableNumber(pickSalaryRaw(raw)),
  };
}

export interface PunchResponse {
  status: 'ACCEPTED' | 'REJECTED';
  message: string;
  distanceMeters: number | null;
  radiusMeters: number | null;
}

export interface MonthlyAttendance {
  year: number;
  month: number;
  presentDays: number;
  completedDays: number;
  totalWorkedMinutes: number;
  avgHoursPerCompletedDay: number;
  avgHoursPerCalendarDay: number;
  days: Array<{
    date: string;
    punchInTime: string;
    punchOutTime: string | null;
    totalWorkedMinutes: number;
  }>;
}

export interface TeamMemberSummary {
  userId: number;
  name: string;
  email: string;
  presentDays: number;
  completedDays: number;
  totalWorkedMinutes: number;
  avgHoursPerCompletedDay: number;
}

export interface WfhResponse {
  id: number;
  date: string;
  status: 'APPLIED' | 'APPROVED' | 'REJECTED';
  reason: string;
  approvalRequired: boolean;
}

export interface LeaveResponse {
  id: number;
  date: string;
  status: 'APPLIED' | 'APPROVED' | 'REJECTED';
  reason: string;
  salaryDeductionApplicable: boolean;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(endpoint, options, false);
    }
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Request failed');
  }
  return json;
}

// --- Exported API objects: mock or real based on USE_MOCK flag ---

export const authApi = USE_MOCK ? {
  sendOtp: async (email: string) => (await getMocks()).mockAuthApi.sendOtp(email),
  verifyOtp: async (email: string, otp: string) => (await getMocks()).mockAuthApi.verifyOtp(email, otp),
} : {
  sendOtp: (email: string) =>
    apiRequest('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }, false),
  verifyOtp: (email: string, otp: string) =>
    apiRequest<{ accessToken: string; refreshToken: string; tokenType: string }>(
      '/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, deviceId: getDeviceId(), deviceName: getDeviceName() }),
      }, false
    ),
};

export const usersApi = USE_MOCK ? {
  create: async (data: { name: string; email: string; role: string; monthlySalary?: number }) => (await getMocks()).mockUsersApi.create(data),
  list: async () => (await getMocks()).mockUsersApi.list(),
  assignManager: async (userId: number, managerId: number) => (await getMocks()).mockUsersApi.assignManager(userId, managerId),
  assignSalary: async (userId: number, monthlySalary: number) => (await getMocks()).mockUsersApi.assignSalary(userId, monthlySalary),
  deactivate: async (userId: number) => (await getMocks()).mockUsersApi.deactivate(userId),
} : {
  create: (data: { name: string; email: string; role: string; monthlySalary?: number }) =>
    apiRequest<number>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  list: async () => {
    const res = await apiRequest<any>('/api/users');
    const payload = res.data;
    const rawUsers = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.users)
        ? payload.users
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.content)
            ? payload.content
            : Array.isArray(payload?.records)
              ? payload.records
              : Array.isArray(payload?.data)
                ? payload.data
                : [];
    return { ...res, data: rawUsers.map(mapUser) };
  },
  assignManager: (userId: number, managerId: number) =>
    apiRequest(`/api/users/${userId}/manager`, { method: 'PATCH', body: JSON.stringify({ managerId }) }),
  assignSalary: (userId: number, monthlySalary: number) =>
    apiRequest(`/api/users/${userId}/salary`, { method: 'PATCH', body: JSON.stringify({ monthlySalary }) }),
  deactivate: (userId: number) =>
    apiRequest(`/api/users/${userId}`, { method: 'DELETE' }),
};

export const attendanceApi = USE_MOCK ? {
  punchIn: async (data: { lat: number; lng: number; accuracy: number; capturedAt?: string }) => (await getMocks()).mockAttendanceApi.punchIn(data),
  punchOut: async (data: { lat: number; lng: number; accuracy: number; capturedAt?: string }) => (await getMocks()).mockAttendanceApi.punchOut(data),
  myMonthly: async (year?: number, month?: number) => (await getMocks()).mockAttendanceApi.myMonthly(year, month),
  teamMonthly: async (year?: number, month?: number) => (await getMocks()).mockAttendanceApi.teamMonthly(year, month),
  teamMemberMonthly: async (employeeId: number, year?: number, month?: number) => (await getMocks()).mockAttendanceApi.teamMemberMonthly(employeeId, year, month),
} : {
  punchIn: (data: { lat: number; lng: number; accuracy: number; capturedAt?: string }) =>
    apiRequest<PunchResponse>('/api/attendance/punch-in', {
      method: 'POST',
      headers: { 'X-Device-Id': getDeviceId() },
      body: JSON.stringify(data),
    }),
  punchOut: (data: { lat: number; lng: number; accuracy: number; capturedAt?: string }) =>
    apiRequest<PunchResponse>('/api/attendance/punch-out', {
      method: 'POST',
      headers: { 'X-Device-Id': getDeviceId() },
      body: JSON.stringify(data),
    }),
  myMonthly: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return apiRequest<MonthlyAttendance>(`/api/attendance/me/monthly?${params}`);
  },
  teamMonthly: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return apiRequest<TeamMemberSummary[]>(`/api/attendance/team/monthly?${params}`);
  },
  teamMemberMonthly: (employeeId: number, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    return apiRequest<MonthlyAttendance>(`/api/attendance/team/${employeeId}/monthly?${params}`);
  },
};

export const wfhApi = USE_MOCK ? {
  apply: async (data: { date: string; reason: string }) => (await getMocks()).mockWfhApi.apply(data),
} : {
  apply: (data: { date: string; reason: string }) =>
    apiRequest<WfhResponse>('/api/wfh/apply', { method: 'POST', body: JSON.stringify(data) }),
};

export const leaveApi = USE_MOCK ? {
  apply: async (data: { date: string; reason: string }) => (await getMocks()).mockLeaveApi.apply(data),
} : {
  apply: (data: { date: string; reason: string }) =>
    apiRequest<LeaveResponse>('/api/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
};

export const payrollApi = USE_MOCK ? {
  download: async (year: number, month: number) => {
    const { delay: mockDelay } = await getMocks();
    await mockDelay(1500);
    const blob = new Blob(['Mock payroll data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexhr-payroll-${year}-${String(month).padStart(2, '0')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
} : {
  download: async (year: number, month: number) => {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/payroll/generate?year=${year}&month=${month}`, { headers });
    if (!res.ok) throw new Error('Failed to download payroll');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexhr-payroll-${year}-${String(month).padStart(2, '0')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
