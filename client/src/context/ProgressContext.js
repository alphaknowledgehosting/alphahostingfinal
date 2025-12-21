import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { progressAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState({});
  const [revisionProgress, setRevisionProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalMarkedForRevision: 0,
    sheetStats: {},
    sectionStats: {},
    subsectionStats: {},
    difficultyStats: {},
    revisionStats: {
      bySheet: {},
      byDifficulty: {}
    },
    recentActivity: [],
    recentRevisions: []
  });

  // Load user progress from backend
  const loadProgress = useCallback(async () => {
    if (!user?._id) {
      setProgress({});
      setRevisionProgress({});
      setStats({
        totalCompleted: 0,
        totalMarkedForRevision: 0,
        sheetStats: {},
        sectionStats: {},
        subsectionStats: {},
        difficultyStats: {},
        revisionStats: {
          bySheet: {},
          byDifficulty: {}
        },
        recentActivity: [],
        recentRevisions: []
      });
      return;
    }

    try {
      setLoading(true);
      const response = await progressAPI.getUserProgress(user._id);
      
      let progressData = [];
      if (response?.data?.progress) {
        progressData = response.data.progress;
      } else if (response?.data && Array.isArray(response.data)) {
        progressData = response.data;
      } else if (Array.isArray(response)) {
        progressData = response;
      }

      // Convert array to object for easier lookup
      const progressMap = {};
      const revisionMap = {};
      const sheetStats = {};
      const sectionStats = {};
      const subsectionStats = {};
      const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
      const revisionStats = {
        bySheet: {},
        byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
      };
      
      if (Array.isArray(progressData)) {
        progressData.forEach(item => {
          // Track completed problems
          if (item.problemId && item.completed) {
            progressMap[item.problemId] = {
              completed: true,
              completedAt: item.completedAt,
              sheetId: item.sheetId,
              sectionId: item.sectionId,
              subsectionId: item.subsectionId,
              difficulty: item.difficulty,
              markedForRevision: item.markedForRevision || false,
              revisionMarkedAt: item.revisionMarkedAt
            };

            // Update sheet stats
            if (item.sheetId) {
              sheetStats[item.sheetId] = (sheetStats[item.sheetId] || 0) + 1;
            }

            // Update section stats
            if (item.sectionId) {
              sectionStats[item.sectionId] = (sectionStats[item.sectionId] || 0) + 1;
            }

            // Update subsection stats
            if (item.subsectionId) {
              subsectionStats[item.subsectionId] = (subsectionStats[item.subsectionId] || 0) + 1;
            }

            // Update difficulty stats
            if (item.difficulty && difficultyStats.hasOwnProperty(item.difficulty)) {
              difficultyStats[item.difficulty]++;
            }
          }

          // Track revision problems
          if (item.problemId && item.markedForRevision) {
            revisionMap[item.problemId] = {
              markedForRevision: true,
              revisionMarkedAt: item.revisionMarkedAt,
              sheetId: item.sheetId,
              sectionId: item.sectionId,
              subsectionId: item.subsectionId,
              difficulty: item.difficulty,
              completed: item.completed || false,
              completedAt: item.completedAt
            };

            // Update revision stats by sheet
            if (item.sheetId) {
              revisionStats.bySheet[item.sheetId] = (revisionStats.bySheet[item.sheetId] || 0) + 1;
            }

            // Update revision stats by difficulty
            if (item.difficulty && revisionStats.byDifficulty.hasOwnProperty(item.difficulty)) {
              revisionStats.byDifficulty[item.difficulty]++;
            }
          }
        });
      }

      setProgress(progressMap);
      setRevisionProgress(revisionMap);
      setStats({
        totalCompleted: Object.keys(progressMap).length,
        totalMarkedForRevision: Object.keys(revisionMap).length,
        sheetStats,
        sectionStats,
        subsectionStats,
        difficultyStats,
        revisionStats,
        recentActivity: progressData
          .filter(item => item.completed)
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, 10),
        recentRevisions: progressData
          .filter(item => item.markedForRevision)
          .sort((a, b) => new Date(b.revisionMarkedAt) - new Date(a.revisionMarkedAt))
          .slice(0, 10)
      });

    } catch (error) {
      console.error('Error fetching progress:', error);
      setProgress({});
      setRevisionProgress({});
      setStats({
        totalCompleted: 0,
        totalMarkedForRevision: 0,
        sheetStats: {},
        sectionStats: {},
        subsectionStats: {},
        difficultyStats: { Easy: 0, Medium: 0, Hard: 0 },
        revisionStats: {
          bySheet: {},
          byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
        },
        recentActivity: [],
        recentRevisions: []
      });
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Toggle problem completion
  const toggleProblem = useCallback(async (problemData) => {
    if (!user?._id) return false;

    const { problemId, completed } = problemData;
    const isCurrentlyCompleted = isProblemCompleted(problemId);
    const newCompletedState = completed !== undefined ? completed : !isCurrentlyCompleted;
    
    // Optimistically update UI
    setProgress(prev => {
      const newProgress = { ...prev };
      if (newCompletedState) {
        newProgress[problemId] = {
          completed: true,
          completedAt: new Date().toISOString(),
          ...problemData,
          markedForRevision: prev[problemId]?.markedForRevision || false,
          revisionMarkedAt: prev[problemId]?.revisionMarkedAt
        };
      } else {
        // Keep revision status when unmarking completion
        if (prev[problemId]?.markedForRevision) {
          newProgress[problemId] = {
            ...prev[problemId],
            completed: false,
            completedAt: null
          };
        } else {
          delete newProgress[problemId];
        }
      }
      return newProgress;
    });

    // Update stats optimistically
    setStats(prev => {
      const newStats = { ...prev };
      const change = newCompletedState ? 1 : -1;
      
      newStats.totalCompleted = Math.max(0, prev.totalCompleted + change);
      
      if (problemData.sheetId) {
        newStats.sheetStats = {
          ...prev.sheetStats,
          [problemData.sheetId]: Math.max(0, (prev.sheetStats[problemData.sheetId] || 0) + change)
        };
      }
      
      if (problemData.sectionId) {
        newStats.sectionStats = {
          ...prev.sectionStats,
          [problemData.sectionId]: Math.max(0, (prev.sectionStats[problemData.sectionId] || 0) + change)
        };
      }
      
      if (problemData.subsectionId) {
        newStats.subsectionStats = {
          ...prev.subsectionStats,
          [problemData.subsectionId]: Math.max(0, (prev.subsectionStats[problemData.subsectionId] || 0) + change)
        };
      }
      
      if (problemData.difficulty && newStats.difficultyStats.hasOwnProperty(problemData.difficulty)) {
        newStats.difficultyStats = {
          ...prev.difficultyStats,
          [problemData.difficulty]: Math.max(0, prev.difficultyStats[problemData.difficulty] + change)
        };
      }
      
      return newStats;
    });

    try {
      const response = await progressAPI.toggleProblem({
        userId: user._id,
        ...problemData,
        completed: newCompletedState
      });

      if (response?.data?.success) {
        return true;
      } else {
        // Revert optimistic update on failure
        loadProgress();
        return false;
      }
    } catch (error) {
      console.error('Error toggling problem:', error);
      // Revert optimistic update on error
      loadProgress();
      return false;
    }
  }, [user?._id, loadProgress]);

  // Toggle problem revision status
  const toggleRevision = useCallback(async (problemData) => {
    if (!user?._id) return false;

    const { problemId, markedForRevision } = problemData;
    const isCurrentlyMarkedForRevision = isProblemMarkedForRevision(problemId);
    const newRevisionState = markedForRevision !== undefined ? markedForRevision : !isCurrentlyMarkedForRevision;
    
    // Optimistically update UI
    setRevisionProgress(prev => {
      const newRevisionProgress = { ...prev };
      if (newRevisionState) {
        newRevisionProgress[problemId] = {
          markedForRevision: true,
          revisionMarkedAt: new Date().toISOString(),
          ...problemData,
          completed: progress[problemId]?.completed || false,
          completedAt: progress[problemId]?.completedAt
        };
      } else {
        // Keep completion status when unmarking revision
        if (progress[problemId]?.completed) {
          newRevisionProgress[problemId] = {
            ...prev[problemId],
            markedForRevision: false,
            revisionMarkedAt: null
          };
        } else {
          delete newRevisionProgress[problemId];
        }
      }
      return newRevisionProgress;
    });

    // Update stats optimistically
    setStats(prev => {
      const newStats = { ...prev };
      const change = newRevisionState ? 1 : -1;
      
      newStats.totalMarkedForRevision = Math.max(0, prev.totalMarkedForRevision + change);
      
      if (problemData.sheetId) {
        newStats.revisionStats = {
          ...prev.revisionStats,
          bySheet: {
            ...prev.revisionStats.bySheet,
            [problemData.sheetId]: Math.max(0, (prev.revisionStats.bySheet[problemData.sheetId] || 0) + change)
          }
        };
      }
      
      if (problemData.difficulty && newStats.revisionStats.byDifficulty.hasOwnProperty(problemData.difficulty)) {
        newStats.revisionStats = {
          ...prev.revisionStats,
          byDifficulty: {
            ...prev.revisionStats.byDifficulty,
            [problemData.difficulty]: Math.max(0, prev.revisionStats.byDifficulty[problemData.difficulty] + change)
          }
        };
      }
      
      return newStats;
    });

    try {
      const response = await progressAPI.toggleRevision({
        userId: user._id,
        ...problemData,
        markedForRevision: newRevisionState
      });

      if (response?.data?.success) {
        return true;
      } else {
        // Revert optimistic update on failure
        loadProgress();
        return false;
      }
    } catch (error) {
      console.error('Error toggling revision:', error);
      // Revert optimistic update on error
      loadProgress();
      return false;
    }
  }, [user?._id, loadProgress, progress]);

  // Check if problem is completed
  const isProblemCompleted = useCallback((problemId) => {
    return progress[problemId]?.completed || false;
  }, [progress]);

  // Check if problem is marked for revision
  const isProblemMarkedForRevision = useCallback((problemId) => {
    return revisionProgress[problemId]?.markedForRevision || false;
  }, [revisionProgress]);

  // Get sheet stats - FIXED: Return simple numeric values
  const getSheetStats = useCallback((sheetId) => {
    return {
      completed: stats.sheetStats[sheetId] || 0,
      markedForRevision: stats.revisionStats.bySheet[sheetId] || 0
    };
  }, [stats.sheetStats, stats.revisionStats.bySheet]);

  // Get sheet difficulty progress - FIXED: Return only completed count for backward compatibility
  const getSheetDifficultyProgress = useCallback((sheetId, difficulty) => {
    // Return only the completed count to maintain backward compatibility
    // If you need revision count, use getSheetRevisionDifficultyProgress
    return stats.difficultyStats[difficulty] || 0;
  }, [stats.difficultyStats]);

  // NEW: Separate function for revision difficulty progress
  const getSheetRevisionDifficultyProgress = useCallback((sheetId, difficulty) => {
    return stats.revisionStats.byDifficulty[difficulty] || 0;
  }, [stats.revisionStats.byDifficulty]);

  // Get revision problems
  const getRevisionProblems = useCallback(async () => {
    if (!user?._id) return [];
    
    try {
      const response = await progressAPI.getRevisionProblems(user._id);
      return response?.data?.revisionProblems || [];
    } catch (error) {
      console.error('Error fetching revision problems:', error);
      return [];
    }
  }, [user?._id]);

  // Refresh stats function
  const refreshStats = useCallback(() => {
    loadProgress();
  }, [loadProgress]);

  // Load progress when user changes
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const value = {
    progress,
    revisionProgress,
    stats,
    loading,
    loadProgress,
    toggleProblem,
    toggleRevision,
    isProblemCompleted,
    isProblemMarkedForRevision,
    getSheetStats,
    getSheetDifficultyProgress,
    getSheetRevisionDifficultyProgress, // NEW: Separate function for revision stats
    getRevisionProblems,
    refreshStats
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
