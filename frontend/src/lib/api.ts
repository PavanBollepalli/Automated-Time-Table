import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Inject auth token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401/403
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───
export const loginUser = async (email: string, password: string) => {
  const { data } = await apiClient.post("/login", { email, password });
  return data;
};

export const signupUser = async (email: string, password: string, full_name: string, role: string) => {
  const { data } = await apiClient.post("/users/signup", { email, password, full_name, role });
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await apiClient.get("/users/me");
  return data;
};

// ─── Programs ───
export const getPrograms = async () => {
  const { data } = await apiClient.get("/programs/");
  return data;
};

export const createProgram = async (program: { name: string; code: string; type: string; duration_years: number }) => {
  const { data } = await apiClient.post("/programs/", program);
  return data;
};

export const createBatch = async (programId: string, batch: { name: string; start_year: number; end_year: number }) => {
  const { data } = await apiClient.post(`/programs/${programId}/batches`, batch);
  return data;
};

export const getSemesters = async () => {
  const { data } = await apiClient.get("/programs/semesters");
  return data;
};

export const createSemester = async (semester: { name: string; number: number }) => {
  const { data } = await apiClient.post("/programs/semesters", semester);
  return data;
};

export const deleteProgram = async (id: string) => {
  const { data } = await apiClient.delete(`/programs/${id}`);
  return data;
};

export const deleteBatch = async (programId: string, batchId: string) => {
  const { data } = await apiClient.delete(`/programs/${programId}/batches/${batchId}`);
  return data;
};

export const deleteSemester = async (id: string) => {
  const { data } = await apiClient.delete(`/programs/semesters/${id}`);
  return data;
};

// ─── Sections ───
export const getSections = async (programId: string, batchId: string) => {
  const { data } = await apiClient.get(`/programs/${programId}/batches/${batchId}/sections`);
  return data;
};

export const createSection = async (programId: string, batchId: string, section: { name: string; student_count: number }) => {
  const { data } = await apiClient.post(`/programs/${programId}/batches/${batchId}/sections`, section);
  return data;
};

export const deleteSection = async (programId: string, batchId: string, sectionId: string) => {
  const { data } = await apiClient.delete(`/programs/${programId}/batches/${batchId}/sections/${sectionId}`);
  return data;
};

// ─── Courses ───
export const getCourses = async () => {
  const { data } = await apiClient.get("/courses/");
  return data;
};

export const createCourse = async (course: {
  code: string; name: string; credits: number; type: string;
  components: { lecture: number; tutorial: number; practical: number };
  program_id?: string; semester_id?: string; is_elective?: boolean;
}) => {
  const { data } = await apiClient.post("/courses/", course);
  return data;
};

export const deleteCourse = async (id: string) => {
  const { data } = await apiClient.delete(`/courses/${id}`);
  return data;
};

// ─── Faculty ───
export const getFaculty = async () => {
  const { data } = await apiClient.get("/faculty/");
  return data;
};

export const createFaculty = async (faculty: {
  name: string; email: string; department: string; designation: string;
  max_load_hours?: number; can_teach_course_ids?: string[];
  busy_slots?: { day: string; periods: number[] }[];
}) => {
  const { data } = await apiClient.post("/faculty/", faculty);
  return data;
};

export const deleteFaculty = async (id: string) => {
  const { data } = await apiClient.delete(`/faculty/${id}`);
  return data;
};

export const getMyTimetable = async () => {
  const { data } = await apiClient.get("/faculty/me/timetable");
  return data;
};

// ─── Infrastructure (Rooms) ───
export const getRooms = async () => {
  const { data } = await apiClient.get("/infrastructure/");
  return data;
};

export const createRoom = async (room: { name: string; capacity: number; type?: string; features?: string[] }) => {
  const { data } = await apiClient.post("/infrastructure/", room);
  return data;
};

export const deleteRoom = async (id: string) => {
  const { data } = await apiClient.delete(`/infrastructure/${id}`);
  return data;
};

// ─── Timetables ───
export const getTimetables = async () => {
  const { data } = await apiClient.get("/timetables/");
  return data;
};

export const getTimetable = async (id: string) => {
  const { data } = await apiClient.get(`/timetables/${id}`);
  return data;
};

export const generateTimetable = async (programId: string, batchId: string, semesterId: string, sectionIds?: string[]) => {
  const { data } = await apiClient.post("/timetables/generate", {
    program_id: programId,
    batch_id: batchId,
    semester_id: semesterId,
    section_ids: sectionIds || undefined,
  });
  return data;
};

export const updateTimetableEntry = async (
  timetableId: string,
  payload: { entry_id: string; day: string; period: number; room_id: string }
) => {
  const { data } = await apiClient.patch(`/timetables/${timetableId}`, {
    action: "move_entry",
    payload,
  });
  return data;
};

export const deleteTimetable = async (id: string) => {
  const { data } = await apiClient.delete(`/timetables/${id}`);
  return data;
};

// ─── AI ───
export const aiChat = async (message: string, timetableId?: string) => {
  const { data } = await apiClient.post("/ai/chat", {
    message,
    timetable_id: timetableId || undefined,
  });
  return data;
};

export const aiAnalyze = async (timetableId: string) => {
  const { data } = await apiClient.post("/ai/analyze", { timetable_id: timetableId });
  return data;
};

export const aiInsights = async () => {
  const { data } = await apiClient.get("/ai/insights");
  return data;
};

// ─── User Management ───
export const bulkUploadUsers = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/user-management/create-users", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getAllUsers = async () => {
  const { data } = await apiClient.get("/user-management/users");
  return data;
};

export const deleteUser = async (userId: string) => {
  const { data } = await apiClient.delete(`/user-management/users/${userId}`);
  return data;
};

// ─── Schedule Config ───
export interface BreakSlot {
  after_period: number;
  duration_minutes: number;
  name: string;
}

export interface ScheduleConfig {
  id: string;
  semester_id?: string | null;
  semester_name?: string | null;
  name: string;
  start_time: string;
  period_duration_minutes: number;
  periods_per_day: number;
  breaks: BreakSlot[];
  working_days: string[];
}

export const getScheduleConfigs = async (): Promise<ScheduleConfig[]> => {
  const { data } = await apiClient.get("/timetables/schedule-configs/");
  return data;
};

export const createScheduleConfig = async (config: {
  semester_id?: string;
  name: string;
  start_time: string;
  period_duration_minutes: number;
  periods_per_day: number;
  breaks: BreakSlot[];
  working_days: string[];
}): Promise<ScheduleConfig> => {
  const { data } = await apiClient.post("/timetables/schedule-configs/", config);
  return data;
};

export const updateScheduleConfig = async (
  configId: string,
  config: {
    semester_id?: string;
    name: string;
    start_time: string;
    period_duration_minutes: number;
    periods_per_day: number;
    breaks: BreakSlot[];
    working_days: string[];
  }
): Promise<ScheduleConfig> => {
  const { data } = await apiClient.put(`/timetables/schedule-configs/${configId}`, config);
  return data;
};

export const deleteScheduleConfig = async (configId: string) => {
  const { data } = await apiClient.delete(`/timetables/schedule-configs/${configId}`);
  return data;
};

export const getScheduleConfigBySemester = async (semesterId: string): Promise<ScheduleConfig> => {
  const { data } = await apiClient.get(`/timetables/schedule-configs/by-semester/${semesterId}`);
  return data;
};

export default apiClient;
