export type Role = 'student' | 'teacher' | 'manager';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  subjects?: string[];
  createdAt: string;
}

export type RequestStatus = 'pending_teacher' | 'pending_manager' | 'approved' | 'rejected';
export type RoomId = 'room1' | 'room2' | '';

export interface TutoringRequest {
  id?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  status: RequestStatus;
  roomId: RoomId;
  createdAt: string;
  updatedAt: string;
}
