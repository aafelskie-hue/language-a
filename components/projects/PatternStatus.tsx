'use client';

import type { ProjectPatternStatus } from '@/lib/types';

interface PatternStatusProps {
  status: ProjectPatternStatus;
  onChange: (status: ProjectPatternStatus) => void;
}

const statuses: { value: ProjectPatternStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate/10 text-slate' },
  { value: 'considering', label: 'Considering', color: 'bg-amber-100 text-amber-700' },
  { value: 'applied', label: 'Applied', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

export function PatternStatus({ status, onChange }: PatternStatusProps) {
  const currentStatus = statuses.find(s => s.value === status) || statuses[0];

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as ProjectPatternStatus)}
      className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${currentStatus.color}`}
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
