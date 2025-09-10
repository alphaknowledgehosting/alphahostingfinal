import React from 'react';
import { useProgress } from '../../hooks/useProgress';

const Sidebar = ({ content, selectedSheet, selectedSection, onSheetSelect, onSectionSelect }) => {
  const { stats } = useProgress();

  const getSheetProgress = (sheetId, sheet) => {
    const totalProblems = sheet.sections.reduce((total, section) => {
      return total + section.subsections.reduce((sectionTotal, subsection) => {
        return sectionTotal + subsection.problems.length;
      }, 0);
    }, 0);

    const completedProblems = stats.sheetStats?.[sheetId] || 0;
    return { completed: completedProblems, total: totalProblems };
  };

  return (
    <></>
  );
};

export default Sidebar;
