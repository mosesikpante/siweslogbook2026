// ─── MOCK DATA (used when Supabase is not configured) ───────
import { SUPABASE_URL } from "../pages/config.jsx";

export const isMockMode = !SUPABASE_URL || String(SUPABASE_URL).includes("YOUR_PROJECT");

export const MOCK_STATE = {
  currentUser: null,
  users: [
    { id: "s1", full_name: "Chidi Okonkwo", email: "student@demo.com", role: "student", matric_no: "ENG/2021/001", company_name: "Dangote Industries", department: "Computer Engineering", siwes_start_date: "2024-06-01", siwes_end_date: "2024-11-30", supervisor_id: "sup1", lecturer_id: "lec1" },
    { id: "sup1", full_name: "Mr. Emeka Nwosu", email: "supervisor@demo.com", role: "supervisor", company_name: "Dangote Industries" },
    { id: "lec1", full_name: "Dr. Amina Bello", email: "lecturer@demo.com", role: "lecturer", department: "Computer Engineering" },
  ],
  logEntries: [
    { id: "e1", student_id: "s1", entry_date: "2024-06-03", activities: "Attended orientation and IT infrastructure overview. Learned about the company network topology and security protocols.", skills_learned: "Network security, VPN configuration", challenges: "Understanding legacy system documentation", attendance_status: "present", status: "approved", supervisor_comment: "Good observation skills demonstrated." },
    { id: "e2", student_id: "s1", entry_date: "2024-06-04", activities: "Set up development environment. Installed required software tools and configured local server for web development tasks.", skills_learned: "Docker, Linux CLI, Git", challenges: "Dependency conflicts in the build pipeline", attendance_status: "present", status: "approved", supervisor_comment: null },
    { id: "e3", student_id: "s1", entry_date: "2024-06-05", activities: "Worked on the internal HR portal. Fixed a critical bug in the leave management module related to date calculation across time zones.", skills_learned: "JavaScript Date API, timezone handling, debugging", challenges: "Reproduced an intermittent timezone bug", attendance_status: "present", status: "submitted", supervisor_comment: null },
    { id: "e4", student_id: "s1", entry_date: "2024-06-06", activities: "Attended a code review session with senior engineers. Reviewed pull requests for the inventory tracking system.", skills_learned: "Code review best practices, REST API design", challenges: "Understanding the existing codebase structure", attendance_status: "present", status: "draft", supervisor_comment: null },
    { id: "e5", student_id: "s1", entry_date: "2024-06-07", activities: "Worked on API integration for third-party payment gateway. Tested endpoints with Postman and documented results.", skills_learned: "REST APIs, Postman, API documentation", challenges: "Handling error responses from the payment API", attendance_status: "present", status: "draft", supervisor_comment: null },
  ],
  weeklyReports: [
    { id: "wr1", student_id: "s1", week_number: 1, week_start: "2024-06-03", week_end: "2024-06-07", ai_summary: "During the first week of the SIWES placement, Chidi Okonkwo demonstrated commendable adaptability and technical aptitude at Dangote Industries. The student successfully completed the onboarding process, gaining comprehensive insights into the company's IT infrastructure and network architecture.\n\nThroughout the week, Chidi engaged in hands-on technical work that included configuring development environments and resolving a critical timezone-related defect in the HR management portal. The student applied knowledge of Docker containerization, Linux command-line interfaces, and JavaScript date handling to deliver practical solutions.\n\nNotable achievements include the identification and resolution of an intermittent bug affecting leave management calculations, demonstrating strong debugging methodologies. Participation in formal code review sessions further exposed the student to industry-standard collaborative development practices.\n\nThe week's activities provided substantial learning outcomes spanning network security, modern DevOps tooling, API integration, and professional software engineering workflows, establishing a solid foundation for the remainder of the placement.", status: "approved", supervisor_comment: "Excellent progress in week 1. Shows great initiative.", supervisor_signed_at: "2024-06-10T09:00:00Z" },
  ],
};
