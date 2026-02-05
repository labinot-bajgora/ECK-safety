
import { AccessCode, LearnerData, TestResult, SeatAuditEntry, SeatMode, Course } from '../types';
import { INITIAL_COURSES } from '../constants';

const CODES_KEY = 'shub_codes_v1';
const RESULTS_KEY = 'shub_results_v1';
const COURSES_KEY = 'shub_courses_v1';

const generateFakeData = () => {
  const companyNames = [
    { name: 'Pristina Logistics Sh.p.k', mode: 'LIMITED', limit: 5, code: 'PRISTINA' },
    { name: 'ECK Training Partners', mode: 'UNLIMITED', limit: 0, code: 'START2025' },
    { name: 'Gjakova Manufacturing', mode: 'UNLIMITED', limit: 0, code: 'GJAKOVA' },
    { name: 'Peja Brewery', mode: 'LIMITED', limit: 3, code: 'PEJA' }
  ];

  const firstNames = ['Arben', 'Elira', 'Besnik', 'Dafina', 'Faton', 'Gresa', 'Ilir', 'Kujtim', 'Luljeta', 'Mimoza'];
  const lastNames = ['Gashi', 'Berisha', 'Krasniqi', 'Shala', 'Hoxha', 'Bytyqi', 'Hasani', 'Morina'];

  const codes: AccessCode[] = companyNames.map((c, i) => ({
    id: `comp-${i}`,
    code: c.code,
    companyName: c.name,
    courseId: INITIAL_COURSES[0].id,
    seatMode: c.mode as SeatMode,
    seatAllowance: c.limit,
    seatsUsed: 0,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    auditLog: [{
      id: Math.random().toString(36).substr(2, 5),
      type: 'INITIAL',
      mode: c.mode as SeatMode,
      amount: c.limit,
      timestamp: new Date().toISOString()
    }]
  }));

  const results: TestResult[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const company = codes[Math.floor(Math.random() * codes.length)];
    const passed = Math.random() > 0.15;
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    const res: TestResult = {
      id: `res-${i}`,
      completionId: `SH-${1000 + i}`,
      courseName: INITIAL_COURSES[0].title,
      learner: {
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        companyName: company.companyName,
        jobPosition: 'Employee',
        accessCode: company.code
      },
      score: passed ? Math.floor(80 + Math.random() * 21) : Math.floor(50 + Math.random() * 20),
      passed,
      attempts: 1,
      completedAt: date.toISOString(),
      seatConsumed: passed && company.seatMode === 'LIMITED',
      seatModeAtCompletion: company.seatMode
    };

    if (res.seatConsumed) {
      company.seatsUsed++;
    }
    results.push(res);
  }

  return { codes, results };
};

export const apiService = {
  // Courses Management
  getCourses: (): Course[] => {
    const stored = localStorage.getItem(COURSES_KEY);
    if (!stored) {
      localStorage.setItem(COURSES_KEY, JSON.stringify(INITIAL_COURSES));
      return INITIAL_COURSES;
    }
    return JSON.parse(stored);
  },

  getCourse: (id: string): Course | undefined => {
    return apiService.getCourses().find(c => c.id === id);
  },

  saveCourse: (course: Course): void => {
    const courses = apiService.getCourses();
    const index = courses.findIndex(c => c.id === course.id);
    if (index > -1) {
      courses[index] = course;
    } else {
      courses.push(course);
    }
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  },

  // Codes Management
  getCodes: (): AccessCode[] => {
    const stored = localStorage.getItem(CODES_KEY);
    const courses = apiService.getCourses();
    const defaultCourseId = courses[0]?.id || 'default';

    if (!stored) {
      const { codes } = generateFakeData();
      localStorage.setItem(CODES_KEY, JSON.stringify(codes));
      return codes;
    }
    const codes: AccessCode[] = JSON.parse(stored);
    return codes.map(c => ({
      ...c,
      courseId: c.courseId || defaultCourseId,
      seatMode: c.seatMode || 'LIMITED',
      seatAllowance: c.seatAllowance !== undefined ? c.seatAllowance : (c as any).seatLimit || 5,
      auditLog: c.auditLog || []
    }));
  },

  validateCode: (code: string): { valid: boolean; message?: string; codeInfo?: AccessCode; course?: Course } => {
    const codes = apiService.getCodes();
    const found = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
    
    if (!found) return { valid: false, message: "Access code not recognized." };
    if (new Date(found.expiresAt) < new Date()) return { valid: false, message: "Access code has expired." };
    
    if (found.seatMode === 'LIMITED' && found.seatsUsed >= found.seatAllowance) {
      return { valid: false, message: "No seats remaining for this code." };
    }

    const course = apiService.getCourse(found.courseId);
    if (!course || !course.isActive) {
      return { valid: false, message: "Associated training is currently unavailable." };
    }
    
    return { valid: true, codeInfo: found, course };
  },

  createCode: (data: Partial<AccessCode>): AccessCode => {
    const codes = apiService.getCodes();
    const mode = data.seatMode || 'UNLIMITED';
    const allowance = data.seatAllowance || 5;
    const courses = apiService.getCourses();
    
    const newCode: AccessCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: (data.code || 'CODE' + Math.floor(Math.random() * 1000)).toUpperCase(),
      companyName: data.companyName || 'New Client',
      courseId: data.courseId || courses[0].id,
      seatMode: mode,
      seatAllowance: allowance,
      seatsUsed: 0,
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      auditLog: [{
        id: Math.random().toString(36).substr(2, 5),
        type: 'INITIAL',
        mode: mode,
        amount: mode === 'LIMITED' ? allowance : undefined,
        timestamp: new Date().toISOString()
      }]
    };
    localStorage.setItem(CODES_KEY, JSON.stringify([...codes, newCode]));
    return newCode;
  },

  updateSettings: (id: string, updates: Partial<AccessCode>): void => {
    const codes = apiService.getCodes();
    const updated = codes.map(c => {
      if (c.id === id) {
        let logEntry: SeatAuditEntry | null = null;
        if (updates.seatMode && updates.seatMode !== c.seatMode) {
          logEntry = {
            id: Math.random().toString(36).substr(2, 5),
            type: 'MODE_CHANGE',
            mode: updates.seatMode,
            amount: updates.seatAllowance || c.seatAllowance,
            timestamp: new Date().toISOString()
          };
        } 
        else if (updates.seatAllowance !== undefined && updates.seatAllowance !== c.seatAllowance) {
          logEntry = {
            id: Math.random().toString(36).substr(2, 5),
            type: 'TOPUP',
            amount: updates.seatAllowance - c.seatAllowance,
            totalLimit: updates.seatAllowance,
            timestamp: new Date().toISOString()
          };
        }

        return { 
          ...c, 
          ...updates, 
          auditLog: logEntry ? [logEntry, ...(c.auditLog || [])].slice(0, 50) : (c.auditLog || []) 
        };
      }
      return c;
    });
    localStorage.setItem(CODES_KEY, JSON.stringify(updated));
  },

  deleteCompany: (id: string): void => {
    const codes = apiService.getCodes();
    const company = codes.find(c => c.id === id);
    if (!company) return;
    const updatedCodes = codes.filter(c => c.id !== id);
    localStorage.setItem(CODES_KEY, JSON.stringify(updatedCodes));
    const results = apiService.getResults();
    const filteredResults = results.filter(r => r.learner.accessCode.toUpperCase() !== company.code.toUpperCase());
    localStorage.setItem(RESULTS_KEY, JSON.stringify(filteredResults));
  },

  getResults: (): TestResult[] => {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (!stored) {
      const { results } = generateFakeData();
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
      return results;
    }
    return JSON.parse(stored);
  },

  saveResult: (learner: LearnerData, score: number, attempts: number, courseId: string): string => {
    const results = apiService.getResults();
    const passed = score >= 80;
    const completionId = 'SH-' + Math.floor(1000 + Math.random() * 9000);
    const codes = apiService.getCodes();
    const codeInfo = codes.find(c => c.code.toUpperCase() === learner.accessCode.toUpperCase());
    const course = apiService.getCourse(courseId);
    
    const sessionKey = `seat_deducted_${learner.accessCode}_${learner.firstName}_${learner.lastName}`;
    const alreadyDeducted = localStorage.getItem(sessionKey);

    let seatConsumed = false;
    if (passed && codeInfo?.seatMode === 'LIMITED' && !alreadyDeducted) {
      const updatedCodes = codes.map(c => 
        c.code.toUpperCase() === learner.accessCode.toUpperCase() 
          ? { ...c, seatsUsed: c.seatsUsed + 1 } 
          : c
      );
      localStorage.setItem(CODES_KEY, JSON.stringify(updatedCodes));
      localStorage.setItem(sessionKey, 'true');
      seatConsumed = true;
    } else if (passed && alreadyDeducted) {
       seatConsumed = true;
    }

    const newResult: TestResult = {
      id: Math.random().toString(36).substr(2, 9),
      completionId,
      learner,
      courseName: course?.title || 'Unknown Training',
      score,
      passed,
      attempts,
      completedAt: new Date().toISOString(),
      seatConsumed,
      seatModeAtCompletion: codeInfo?.seatMode || 'UNLIMITED'
    };
    
    localStorage.setItem(RESULTS_KEY, JSON.stringify([...results, newResult]));
    return completionId;
  }
};
