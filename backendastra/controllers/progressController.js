const Progress = require('../models/Progress');

exports.getUserProgress = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const progress = await Progress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleProblem = async (req, res) => {
  try {
    const { problemId, sheetId, sectionId, subsectionId, difficulty } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!problemId || !sheetId || !sectionId || !subsectionId || !difficulty) {
      return res.status(400).json({ message: 'Missing required fields including difficulty' });
    }

    let progress = await Progress.findOne({ userId, problemId });

    if (progress) {
      progress.isCompleted = !progress.isCompleted;
      progress.completedAt = progress.isCompleted ? new Date() : null;
      progress.updatedAt = new Date();
      progress.difficulty = difficulty;
    } else {
      progress = new Progress({
        userId,
        problemId,
        sheetId,
        sectionId,
        subsectionId,
        difficulty,
        isCompleted: true,
        completedAt: new Date()
      });
    }

    await progress.save();
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error toggling problem:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleRevision = async (req, res) => {
  try {
    const { problemId, sheetId, sectionId, subsectionId, difficulty } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!problemId || !sheetId || !sectionId || !subsectionId || !difficulty) {
      return res.status(400).json({ message: 'Missing required fields including difficulty' });
    }

    let progress = await Progress.findOne({ userId, problemId });

    if (progress) {
      progress.markedForRevision = !progress.markedForRevision;
      progress.revisionMarkedAt = progress.markedForRevision ? new Date() : null;
      progress.updatedAt = new Date();
      progress.difficulty = difficulty;
    } else {
      progress = new Progress({
        userId,
        problemId,
        sheetId,
        sectionId,
        subsectionId,
        difficulty,
        isCompleted: false,
        markedForRevision: true,
        revisionMarkedAt: new Date()
      });
    }

    await progress.save();
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error toggling revision:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProgressStats = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const progress = await Progress.find({ userId: req.params.userId });
    const completedProgress = progress.filter(p => p.isCompleted);
    const revisionProgress = progress.filter(p => p.markedForRevision);
    
    const stats = {
      totalCompleted: completedProgress.length,
      totalMarkedForRevision: revisionProgress.length,
      sheetStats: {},
      sectionStats: {},
      subsectionStats: {},
      difficultyStats: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      },
      sheetDifficultyStats: {},
      revisionStats: {
        bySheet: {},
        byDifficulty: {
          Easy: 0,
          Medium: 0,
          Hard: 0
        }
      },
      recentActivity: [],
      recentRevisions: []
    };

    // Calculate stats for completed problems
    completedProgress.forEach(p => {
      stats.sheetStats[p.sheetId] = (stats.sheetStats[p.sheetId] || 0) + 1;
      stats.sectionStats[p.sectionId] = (stats.sectionStats[p.sectionId] || 0) + 1;
      stats.subsectionStats[p.subsectionId] = (stats.subsectionStats[p.subsectionId] || 0) + 1;
      
      if (p.difficulty && stats.difficultyStats.hasOwnProperty(p.difficulty)) {
        stats.difficultyStats[p.difficulty]++;
      }
      
      if (!stats.sheetDifficultyStats[p.sheetId]) {
        stats.sheetDifficultyStats[p.sheetId] = { Easy: 0, Medium: 0, Hard: 0 };
      }
      if (p.difficulty && stats.sheetDifficultyStats[p.sheetId].hasOwnProperty(p.difficulty)) {
        stats.sheetDifficultyStats[p.sheetId][p.difficulty]++;
      }
    });

    // Calculate stats for revision problems
    revisionProgress.forEach(p => {
      stats.revisionStats.bySheet[p.sheetId] = (stats.revisionStats.bySheet[p.sheetId] || 0) + 1;
      
      if (p.difficulty && stats.revisionStats.byDifficulty.hasOwnProperty(p.difficulty)) {
        stats.revisionStats.byDifficulty[p.difficulty]++;
      }
    });

    // Get recent activity (last 10 completed problems)
    const recentCompleted = await Progress.find(
      { userId: req.params.userId, isCompleted: true },
      { sort: { completedAt: -1 }, limit: 10 }
    );

    stats.recentActivity = recentCompleted.map(p => ({
      problemId: p.problemId,
      sheetId: p.sheetId,
      sectionId: p.sectionId,
      subsectionId: p.subsectionId,
      difficulty: p.difficulty,
      completedAt: p.completedAt
    }));

    // Get recent revisions (last 10 problems marked for revision)
    const recentRevisions = await Progress.find(
      { userId: req.params.userId, markedForRevision: true },
      { sort: { revisionMarkedAt: -1 }, limit: 10 }
    );

    stats.recentRevisions = recentRevisions.map(p => ({
      problemId: p.problemId,
      sheetId: p.sheetId,
      sectionId: p.sectionId,
      subsectionId: p.subsectionId,
      difficulty: p.difficulty,
      revisionMarkedAt: p.revisionMarkedAt,
      isCompleted: p.isCompleted
    }));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRevisionProblems = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const revisionProblems = await Progress.find(
      { userId: req.params.userId, markedForRevision: true },
      { sort: { revisionMarkedAt: -1 } }
    );

    res.json({
      success: true,
      revisionProblems: revisionProblems.map(p => ({
        problemId: p.problemId,
        sheetId: p.sheetId,
        sectionId: p.sectionId,
        subsectionId: p.subsectionId,
        difficulty: p.difficulty,
        isCompleted: p.isCompleted,
        revisionMarkedAt: p.revisionMarkedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching revision problems:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.bulkUpdateProgress = async (req, res) => {
  try {
    const { problems } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(problems)) {
      return res.status(400).json({ message: 'Problems must be an array' });
    }

    const bulkOps = problems.map(problem => ({
      updateOne: {
        filter: { userId, problemId: problem.problemId },
        update: {
          $set: {
            sheetId: problem.sheetId,
            sectionId: problem.sectionId,
            subsectionId: problem.subsectionId,
            difficulty: problem.difficulty,
            isCompleted: problem.isCompleted,
            completedAt: problem.isCompleted ? new Date() : null,
            markedForRevision: problem.markedForRevision || false,
            revisionMarkedAt: problem.markedForRevision ? (problem.revisionMarkedAt || new Date()) : null,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await Progress.bulkWrite(bulkOps);
    res.json({ 
      success: true,
      message: 'Bulk update completed',
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
