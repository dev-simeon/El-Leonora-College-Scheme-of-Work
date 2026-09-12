import React from "react";
import { useAuth } from "../../../src/context/AuthContext";
import StudentDashboard from "../../../src/components/dashboard/StudentDashboard";
import TeacherDashboard from "../../../src/components/dashboard/TeacherDashboard";

export default function DashboardScreen() {
  const { user } = useAuth();
  
  // As requested, anything other than "student" shows the Teacher dashboard
  if (user?.role !== 'student') {
    return <TeacherDashboard />;
  }
  
  return <StudentDashboard />;
}
