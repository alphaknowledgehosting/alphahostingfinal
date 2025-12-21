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
    difficultyStats: { Easy: 0, Medium: 0, Hard: 0 },
    sheetDifficultyStats: {},
    revisionStats: {
      bySheet: {},
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
    },
    recentActivity: [],
    recentRevisions: []
  });

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
        difficultyStats: { Easy: 0, Medium: 0, Hard: 0 },
        sheetDifficultyStats: {},
        revisionStats: {
          bySheet: {},
          byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
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

      const progressMap = {};
      const revisionMap = {};
      const sheetStats = {};
      const sectionStats = {};
      const subsectionStats = {};
      const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
      const sheetDifficultyStats = {};
      const revisionStats = {
        bySheet: {},
        byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
      };
      
      // ✅ Track which problems we've already counted globally
      const countedProblems = new Set();
      
      if (Array.isArray(progressData)) {
        progressData.forEach(item => {
          if (item.problemId && item.completed) {
            // ✅ Track global completion (once per problem)
            if (!progressMap[item.problemId]) {
              progressMap[item.problemId] = {
                completed: true,
                completedAt: item.completedAt,
                difficulty: item.difficulty,
                markedForRevision: item.markedForRevision || false,
                revisionMarkedAt: item.revisionMarkedAt
              };
              
              // Only count difficulty globally once per problem
              if (item.difficulty && difficultyStats.hasOwnProperty(item.difficulty) && !countedProblems.has(item.problemId)) {
                difficultyStats[item.difficulty]++;
                countedProblems.add(item.problemId);
              }
            }

            // ✅ Update context-specific stats (can be multiple per problem)
            if (item.sheetId) {
              sheetStats[item.sheetId] = (sheetStats[item.sheetId] || 0) + 1;
              
              // Track difficulty per sheet
              if (!sheetDifficultyStats[item.sheetId]) {
                sheetDifficultyStats[item.sheetId] = { Easy: 0, Medium: 0, Hard: 0 };
              }
              if (item.difficulty && sheetDifficultyStats[item.sheetId].hasOwnProperty(item.difficulty)) {
                sheetDifficultyStats[item.sheetId][item.difficulty]++;
              }
            }
            
            if (item.sectionId) {
              sectionStats[item.sectionId] = (sectionStats[item.sectionId] || 0) + 1;
            }
            if (item.subsectionId) {
              subsectionStats[item.subsectionId] = (subsectionStats[item.subsectionId] || 0) + 1;
            }
          }

          if (item.problemId && item.markedForRevision) {
            if (!revisionMap[item.problemId]) {
              revisionMap[item.problemId] = {
                markedForRevision: true,
                revisionMarkedAt: item.revisionMarkedAt,
                difficulty: item.difficulty,
                completed: item.completed || false,
                completedAt: item.completedAt
              };
            }

            if (item.sheetId) {
              revisionStats.bySheet[item.sheetId] = (revisionStats.bySheet[item.sheetId] || 0) + 1;
            }
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
        sheetDifficultyStats,
        revisionStats,
        recentActivity: progressData.filter(i => i.completed).slice(0, 10),
        recentRevisions: progressData.filter(i => i.markedForRevision).slice(0, 10)
      });

    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // ✅ FIXED: Update progress globally for all instances of the problem
  const toggleProblem = useCallback(async (problemData) => {
    if (!user?._id) return false;

    const { problemId, completed } = problemData;
    const newCompletedState = completed !== undefined ? completed : !progress[problemId]?.completed;
    
    // ✅ Optimistically update UI
    setProgress(prev => {
      const newProgress = { ...prev };
      if (newCompletedState) {
        newProgress[problemId] = {
          completed: true,
          completedAt: new Date().toISOString(),
          difficulty: problemData.difficulty,
          markedForRevision: prev[problemId]?.markedForRevision || false
        };
      } else {
        if (!revisionProgress[problemId]?.markedForRevision) {
          delete newProgress[problemId];
        } else {
          newProgress[problemId] = {
            ...prev[problemId],
            completed: false,
            completedAt: null
          };
        }
      }
      return newProgress;
    });

    try {
      // ✅ Backend will update ALL instances of this problem across all sheets
      await progressAPI.toggleProblem({
        userId: user._id,
        ...problemData,
        completed: newCompletedState
      });
      
      // ✅ Reload to get accurate stats for all sheets
      await loadProgress();
      return true;
    } catch (error) {
      console.error('Error toggling problem:', error);
      // Revert on error
      await loadProgress();
      return false;
    }
  }, [user?._id, loadProgress, progress, revisionProgress]);

  // ✅ FIXED: Update revision globally for all instances of the problem
  const toggleRevision = useCallback(async (problemData) => {
    if (!user?._id) return false;

    const { problemId, markedForRevision } = problemData;
    const newRevisionState = markedForRevision !== undefined ? markedForRevision : !revisionProgress[problemId]?.markedForRevision;
    
    // ✅ Optimistically update UI
    setRevisionProgress(prev => {
      const newRevisionProgress = { ...prev };
      if (newRevisionState) {
        newRevisionProgress[problemId] = {
          markedForRevision: true,
          revisionMarkedAt: new Date().toISOString(),
          difficulty: problemData.difficulty,
          completed: prev[problemId]?.completed || progress[problemId]?.completed || false
        };
      } else {
        if (!progress[problemId]?.completed) {
          delete newRevisionProgress[problemId];
        } else {
          newRevisionProgress[problemId] = {
            ...prev[problemId],
            markedForRevision: false,
            revisionMarkedAt: null
          };
        }
      }
      return newRevisionProgress;
    });

    try {
      // ✅ Backend will update ALL instances of this problem across all sheets
      await progressAPI.toggleRevision({
        userId: user._id,
        ...problemData,
        markedForRevision: newRevisionState
      });
      
      // ✅ Reload to get accurate stats for all sheets
      await loadProgress();
      return true;
    } catch (error) {
      console.error('Error toggling revision:', error);
      // Revert on error
      await loadProgress();
      return false;
    }
  }, [user?._id, loadProgress, progress, revisionProgress]);

  const isProblemCompleted = useCallback((problemId) => {
    return progress[problemId]?.completed || false;
  }, [progress]);

  const isProblemMarkedForRevision = useCallback((problemId) => {
    return revisionProgress[problemId]?.markedForRevision || false;
  }, [revisionProgress]);

  const getSheetStats = useCallback((sheetId) => {
    return {
      completed: stats.sheetStats[sheetId] || 0,
      markedForRevision: stats.revisionStats.bySheet[sheetId] || 0
    };
  }, [stats.sheetStats, stats.revisionStats.bySheet]);

  const getSheetDifficultyProgress = useCallback((sheetId, difficulty) => {
    return stats.sheetDifficultyStats[sheetId]?.[difficulty] || 0;
  }, [stats.sheetDifficultyStats]);

  const getSheetRevisionDifficultyProgress = useCallback((sheetId, difficulty) => {
    return stats.revisionStats.byDifficulty[difficulty] || 0;
  }, [stats.revisionStats.byDifficulty]);

  const getRevisionProblems = useCallback(async () => {
    if (!user?._id) return [];
    
    try {
      const response = await progressAPI.getRevisionProblems(user._id);
      return response?.data?.revisionProblems || [];
    } catch (error) {
      return [];
    }
  }, [user?._id]);

  const refreshStats = useCallback(() => {
    loadProgress();
  }, [loadProgress]);

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
    getSheetRevisionDifficultyProgress,
    getRevisionProblems,
    refreshStats
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
