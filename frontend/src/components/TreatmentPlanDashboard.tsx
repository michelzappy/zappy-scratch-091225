'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  progress: number; // 0-100
  nextDose?: string;
}

interface Milestone {
  id: string;
  type: 'checkin' | 'refill' | 'appointment' | 'goal';
  title: string;
  date: string;
  completed: boolean;
  description?: string;
}

interface TreatmentGoal {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number; // 0-100
  unit: string;
}

export default function TreatmentPlanDashboard() {
  // Mock data - in production, this would come from API
  const [medications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Semaglutide',
      dosage: '0.5mg',
      frequency: 'Weekly injection',
      startDate: '2024-01-15',
      progress: 60,
      nextDose: 'Tomorrow, 9:00 AM'
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: '2024-01-15',
      progress: 85,
      nextDose: 'Today, 6:00 PM'
    }
  ]);

  const [milestones] = useState<Milestone[]>([
    {
      id: '1',
      type: 'checkin',
      title: 'Monthly Health Check-in',
      date: '2024-02-15',
