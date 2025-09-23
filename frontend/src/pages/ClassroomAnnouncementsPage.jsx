import React from 'react';
import ClassroomAnnouncements from '../components/ClassroomAnnouncements';

// Page for classroom announcements (role and classroomId should come from auth/context)
export default function ClassroomAnnouncementsPage() {
  const role = localStorage.getItem('role') || (JSON.parse(localStorage.getItem('user')||'{}').role || 'parent');
  const classroomId = localStorage.getItem('classroomId') || '';
  return <ClassroomAnnouncements classroomId={classroomId} role={role} />;
}
