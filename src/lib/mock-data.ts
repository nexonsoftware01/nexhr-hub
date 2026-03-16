import {
  ApiResponse, User, PunchResponse, MonthlyAttendance,
  TeamMemberSummary, WfhResponse, LeaveResponse
} from './api';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function delay(ms = 600): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function mockOk<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { success: true, message, data, timestamp: new Date().toISOString() };
}

// Fake JWT builder (base64 JSON, not cryptographically valid)
function fakeJwt(payload: Record<string, any>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `${header}.${body}.mock_signature`;
}

// --- Mock users store ---
let mockUsers: User[] = [
  { id: 1, name: 'Rajesh Sharma', email: 'director@nexon.com', role: 'DIRECTOR', managerId: null, monthlySalary: null },
  { id: 2, name: 'Priya Patel', email: 'priya.hr@nexon.com', role: 'HR', managerId: 1, monthlySalary: 60000 },
  { id: 3, name: 'Amit Kumar', email: 'amit.kumar@nexon.com', role: 'EMPLOYEE', managerId: 1, monthlySalary: 45000 },
  { id: 4, name: 'Sneha Reddy', email: 'sneha.reddy@nexon.com', role: 'EMPLOYEE', managerId: 1, monthlySalary: 50000 },
  { id: 5, name: 'Vikram Singh', email: 'vikram.singh@nexon.com', role: 'EMPLOYEE', managerId: 3, monthlySalary: null },
  { id: 6, name: 'Ananya Gupta', email: 'ananya.gupta@nexon.com', role: 'EMPLOYEE', managerId: 3, monthlySalary: 42000 },
];

let nextUserId = 7;
let wfhCount = 0;
let leaveCount = 0;
let punchedIn = false;

function getUserByEmail(email: string): User {
  const found = mockUsers.find(u => u.email === email);
  if (found) return found;
  // default to first employee
  return mockUsers[0];
}

// --- Generate attendance days ---
function determineStatus(totalWorkedMinutes: number): 'PRESENT' | 'HALF_DAY' | 'ABSENT' {
  if (totalWorkedMinutes >= 540) return 'PRESENT';   // 9 hours
  if (totalWorkedMinutes >= 300) return 'HALF_DAY';   // 5 hours
  return 'ABSENT';
}

function generateDays(year: number, month: number, count: number) {
  const days = [];
  for (let d = 1; d <= count && d <= 28; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
    const hrs = 4 + Math.random() * 7; // range 4-11 hrs to generate all statuses
    const mins = Math.round(hrs * 60);
    days.push({
      date,
      punchInTime: `${date}T09:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}:00`,
      punchOutTime: `${date}T${String(17 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      totalWorkedMinutes: mins,
      status: determineStatus(mins),
    });
    if (days.length >= count) break;
  }
  return days;
}

// --- Mock API implementations ---

export const mockAuthApi = {
  sendOtp: async (_email: string) => {
    await delay(800);
    return mockOk(null, 'OTP sent successfully');
  },
  verifyOtp: async (email: string, otp: string) => {
    await delay(1000);
    if (otp !== '123456' && otp !== '000000') {
      throw new Error('Invalid OTP. Use 123456 for demo.');
    }
    const user = getUserByEmail(email);
    const payload = { sub: user.email, userId: user.id, name: user.name, role: user.role };
    return mockOk({
      accessToken: fakeJwt(payload),
      refreshToken: fakeJwt({ ...payload, type: 'refresh' }),
      tokenType: 'Bearer' as const,
    }, 'Login successful');
  },
};

export const mockUsersApi = {
  create: async (data: { name: string; email: string; role: string; monthlySalary?: number }) => {
    await delay(700);
    const newUser: User = {
      id: nextUserId++,
      name: data.name,
      email: data.email,
      role: data.role as User['role'],
      managerId: null,
      monthlySalary: data.monthlySalary ?? null,
    };
    mockUsers.push(newUser);
    return mockOk(newUser.id, 'User created successfully');
  },
  list: async () => {
    await delay(500);
    return mockOk([...mockUsers], 'Users fetched');
  },
  assignManager: async (userId: number, managerId: number) => {
    await delay(500);
    const user = mockUsers.find(u => u.id === userId);
    if (user) user.managerId = managerId;
    return mockOk(null, 'Reporting manager updated');
  },
  assignSalary: async (userId: number, monthlySalary: number) => {
    await delay(500);
    const user = mockUsers.find(u => u.id === userId);
    if (user) user.monthlySalary = monthlySalary;
    return mockOk(null, 'Salary updated successfully');
  },
  deactivate: async (userId: number) => {
    await delay(600);
    mockUsers = mockUsers.filter(u => u.id !== userId);
    return mockOk(null, 'User deactivated successfully');
  },
};

export const mockAttendanceApi = {
  punchIn: async (_data: { lat: number; lng: number; accuracy: number; capturedAt?: string }) => {
    await delay(1200);
    const accepted = Math.random() > 0.2;
    punchedIn = accepted;
    const resp: PunchResponse = accepted
      ? { status: 'ACCEPTED', message: 'Punched in successfully', distanceMeters: Math.round(Math.random() * 80), radiusMeters: 200 }
      : { status: 'REJECTED', message: `Not in allowed office location (distance: ${Math.round(300 + Math.random() * 500)}m)`, distanceMeters: Math.round(300 + Math.random() * 500), radiusMeters: 200 };
    return mockOk(resp, 'Punch processed');
  },
  punchOut: async (_data: { lat: number; lng: number; accuracy: number; capturedAt?: string }) => {
    await delay(1000);
    punchedIn = false;
    const resp: PunchResponse = { status: 'ACCEPTED', message: 'Punched out successfully', distanceMeters: Math.round(Math.random() * 60), radiusMeters: 200 };
    return mockOk(resp, 'Punch processed');
  },
  myMonthly: async (year?: number, month?: number) => {
    await delay(700);
    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);
    const days = generateDays(y, m, 18);
    const totalMinutes = days.reduce((s, d) => s + d.totalWorkedMinutes, 0);
    const data: MonthlyAttendance = {
      year: y, month: m,
      presentDays: days.filter(d => d.status === 'PRESENT').length,
      halfDays: days.filter(d => d.status === 'HALF_DAY').length,
      absentDays: days.filter(d => d.status === 'ABSENT').length,
      totalWorkedMinutes: totalMinutes,
      days,
    };
    return mockOk(data, 'Monthly attendance fetched');
  },
  teamMonthly: async (year?: number, month?: number) => {
    await delay(800);
    const team: TeamMemberSummary[] = mockUsers.filter(u => u.role === 'EMPLOYEE').map(u => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      presentDays: 12 + Math.floor(Math.random() * 8),
      halfDays: 1 + Math.floor(Math.random() * 4),
      absentDays: Math.floor(Math.random() * 3),
      totalWorkedMinutes: 3000 + Math.floor(Math.random() * 2000),
    }));
    return mockOk(team, 'Team monthly attendance fetched');
  },
  teamMemberMonthly: async (employeeId: number, year?: number, month?: number) => {
    await delay(700);
    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);
    const days = generateDays(y, m, 14 + Math.floor(Math.random() * 6));
    const totalMinutes = days.reduce((s, d) => s + d.totalWorkedMinutes, 0);
    const data: MonthlyAttendance = {
      year: y, month: m,
      presentDays: days.filter(d => d.status === 'PRESENT').length,
      halfDays: days.filter(d => d.status === 'HALF_DAY').length,
      absentDays: days.filter(d => d.status === 'ABSENT').length,
      totalWorkedMinutes: totalMinutes,
      days,
    };
    return mockOk(data, 'Monthly attendance fetched');
  },
};

export const mockWfhApi = {
  apply: async (data: { date: string; reason: string }) => {
    await delay(800);
    wfhCount++;
    const isFirst = wfhCount === 1;
    const resp: WfhResponse = {
      id: wfhCount,
      date: data.date,
      status: isFirst ? 'APPROVED' : 'APPLIED',
      reason: data.reason,
      approvalRequired: !isFirst,
    };
    return mockOk(resp, 'WFH request submitted successfully');
  },
};

export const mockLeaveApi = {
  apply: async (data: { date: string; reason: string }) => {
    await delay(800);
    leaveCount++;
    const isFirst = leaveCount === 1;
    const resp: LeaveResponse = {
      id: leaveCount,
      date: data.date,
      status: 'APPROVED',
      reason: data.reason,
      salaryDeductionApplicable: !isFirst,
    };
    return mockOk(resp, 'Leave applied successfully');
  },
};
