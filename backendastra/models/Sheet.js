const { DataAPIClient } = require('@datastax/astra-db-ts');

class Sheet {
  constructor() {
    this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
    this.collection = this.db.collection('sheets');
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async createSheet(sheetData) {
    try {
      const sheet = {
        id: sheetData.id || this.generateId(),
        name: sheetData.name,
        description: sheetData.description || '',
        sections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: sheetData.createdBy
      };

      const result = await this.collection.insertOne(sheet);
      return { success: true, sheet: { ...sheet, _id: result.insertedId } };
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw new Error('Failed to create sheet');
    }
  }

  // ✅ UPDATED: Sort sheets by creation time (oldest first)
  async getAllSheets() {
    try {
      const cursor = this.collection.find({});
      let sheets = await cursor.toArray();
      
      // Sort by createdAt in ascending order (oldest first)
      sheets.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });
      
      return sheets;
    } catch (error) {
      console.error('Error fetching sheets:', error);
      throw new Error('Failed to fetch sheets');
    }
  }

 // ✅ FIXED: Unlink problem from subsection and clean up progress
async unlinkProblem(sheetId, sectionId, subsectionId, problemId) {
  try {
    const sheet = await this.getSheetById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }
    
    const section = sheet.sections?.find(s => s.id === sectionId);
    if (!section) {
      throw new Error('Section not found');
    }
    
    const subsection = section.subsections?.find(ss => ss.id === subsectionId);
    if (!subsection) {
      throw new Error('Subsection not found');
    }
    
    // Remove problem ID from subsection
    subsection.problemIds = subsection.problemIds?.filter(id => id !== problemId) || [];
    
    await this.updateSheet(sheetId, sheet);
    
    // ✅ NEW: Clean up progress contexts for this location
    const Progress = require('./Progress');
    const progressModel = new Progress();
    await progressModel.cleanupProgressForUnlinkedProblem(problemId, {
      sheetId,
      sectionId,
      subsectionId
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error unlinking problem:', error);
    throw error;
  }
}

  async getSheetById(sheetId) {
    try {
      const sheet = await this.collection.findOne({ id: sheetId });
      return sheet;
    } catch (error) {
      console.error('Error fetching sheet:', error);
      throw new Error('Failed to fetch sheet');
    }
  }

  async updateSheet(sheetId, updateData) {
    try {
      // Remove _id if present in updateData to avoid MongoDB/Astra update error
      const { _id, ...dataToUpdate } = updateData;

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            ...dataToUpdate,
            updatedAt: new Date().toISOString()
          }
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating sheet:', error);
      throw new Error('Failed to update sheet');
    }
  }

  async deleteSheet(sheetId) {
    try {
      const result = await this.collection.deleteOne({ id: sheetId });
      return result;
    } catch (error) {
      console.error('Error deleting sheet:', error);
      throw new Error('Failed to delete sheet');
    }
  }

  async addSection(sheetId, sectionData) {
    try {
      const section = {
        id: sectionData.id || this.generateId(),
        name: sectionData.name,
        description: sectionData.description || '',
        subsections: []
      };

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $push: { sections: section },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
      
      return { success: true, section };
    } catch (error) {
      console.error('Error adding section:', error);
      throw new Error('Failed to add section');
    }
  }

  async updateSection(sheetId, sectionId, updateData) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          return { ...section, ...updateData };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating section:', error);
      throw new Error('Failed to update section');
    }
  }

  async deleteSection(sheetId, sectionId) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const sectionExists = currentSheet.sections && currentSheet.sections.some(section => section.id === sectionId);
      if (!sectionExists) {
        throw new Error('Section not found in the sheet');
      }

      const updatedSections = currentSheet.sections.filter(section => section.id !== sectionId);

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString()
          }
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error('Failed to delete section - no documents were modified');
      }

      return { 
        success: true, 
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        deletedSectionId: sectionId
      };
    } catch (error) {
      console.error('Error in deleteSection:', error.message);
      throw new Error(`Failed to delete section: ${error.message}`);
    }
  }

  async addSubsection(sheetId, sectionId, subsectionData) {
    try {
      const subsection = {
        id: subsectionData.id || this.generateId(),
        name: subsectionData.name,
        description: subsectionData.description || '',
        problems: []
      };

      const currentSheet = await this.collection.findOne({ id: sheetId });

      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      if (!currentSheet.sections || currentSheet.sections.length === 0) {
        throw new Error('No sections found in sheet');
      }

      const targetSection = currentSheet.sections.find(s => s.id === sectionId);

      if (!targetSection) {
        throw new Error(`Section with ID ${sectionId} not found`);
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            subsections: [...(section.subsections || []), subsection]
          };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('Failed to update sheet with new subsection');
      }
      
      return { success: true, subsection };
    } catch (error) {
      console.error('Error adding subsection:', error);
      throw new Error(`Failed to add subsection: ${error.message}`);
    }
  }

  async updateSubsection(sheetId, sectionId, subsectionId, updateData) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              return { ...subsection, ...updateData };
            }
            return subsection;
          });
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating subsection:', error);
      throw new Error('Failed to update subsection');
    }
  }

  // Add this method to your Sheet model
async cleanOrphanedProblems(sheetId) {
  const sheet = await this.getSheetById(sheetId);
  const problemModel = new Problem();
  await problemModel.getAllProblemsCache();
  
  // Filter out sections/subsections/problems that don't exist
  sheet.sections = sheet.sections.map(section => ({
    ...section,
    subsections: section.subsections.map(subsection => ({
      ...subsection,
      problems: subsection.problems.filter(pId => 
        problemModel.cache.has(pId)
      )
    }))
  }));
  
  // Update sheet
  await this.updateSheet(sheetId, sheet);
  console.log(`✅ Cleaned orphaned problems from sheet ${sheetId}`);
}

  async deleteSubsection(sheetId, sectionId, subsectionId) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.filter(
            subsection => subsection.id !== subsectionId
          );
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting subsection:', error);
      throw new Error('Failed to delete subsection');
    }
  }

  async addProblemToSubsection(sheetId, sectionId, subsectionId, problemId) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) throw new Error('Sheet not found');

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              return {
                ...subsection,
                problemIds: [...(subsection.problemIds || []), problemId]
              };
            }
            return subsection;
          });
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        {
          $set: {
            sections: updatedSections,
            updatedAt: new Date().toISOString()
          }
        }
      );

      // ✅ NEW: Sync progress for all users who completed this problem
      const Progress = require('./Progress');
      const progressModel = new Progress();
      await progressModel.syncProblemProgress(problemId, {
        sheetId,
        sectionId,
        subsectionId
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding problem to subsection:', error);
      throw new Error('Failed to add problem reference');
    }
  }

  async removeProblemFromSubsection(sheetId, sectionId, subsectionId, problemId) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) throw new Error('Sheet not found');

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              return {
                ...subsection,
                problemIds: (subsection.problemIds || []).filter(id => id !== problemId)
              };
            }
            return subsection;
          });
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      await this.collection.updateOne(
        { id: sheetId },
        { $set: { sections: updatedSections, updatedAt: new Date().toISOString() } }
      );

      return { success: true };
    } catch (error) {
      console.error('Error removing problem reference:', error);
      throw new Error('Failed to remove problem reference');
    }
  }

  async addProblem(sheetId, sectionId, subsectionId, problemData) {
    try {
      const problem = {
        id: problemData.id || this.generateId(),
        title: problemData.title,
        practiceLink: problemData.practiceLink || '',
        platform: problemData.platform || '',
        youtubeLink: problemData.youtubeLink || '',
        editorialLink: problemData.editorialLink || '',
        notesLink: problemData.notesLink || '',
        difficulty: problemData.difficulty || 'Easy',
        createdAt: new Date().toISOString(),
        createdBy: problemData.createdBy
      };

      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              return {
                ...subsection,
                problems: [...(subsection.problems || []), problem]
              };
            }
            return subsection;
          });
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('Failed to add problem - sheet/section/subsection may not exist');
      }
      
      return { success: true, problem };
    } catch (error) {
      console.error('Error adding problem:', error);
      throw new Error('Failed to add problem');
    }
  }

  async updateProblem(sheetId, sectionId, subsectionId, problemId, updateData) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              const updatedProblems = subsection.problems.map(problem => {
                if (problem.id === problemId) {
                  return { ...problem, ...updateData, updatedAt: new Date().toISOString() };
                }
                return problem;
              });
              return { ...subsection, problems: updatedProblems };
            }
            return subsection;
          });
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error updating problem:', error);
      throw new Error('Failed to update problem');
    }
  }

  async deleteProblem(sheetId, sectionId, subsectionId, problemId) {
    try {
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      const updatedSections = currentSheet.sections.map(section => {
        if (section.id === sectionId) {
          const updatedSubsections = section.subsections.map(subsection => {
            if (subsection.id === subsectionId) {
              const updatedProblems = subsection.problems.filter(problem => problem.id !== problemId);
              return { ...subsection, problems: updatedProblems };
            }
            return subsection;
          });
          return { ...section, subsections: updatedSubsections };
        }
        return section;
      });

      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date().toISOString() 
          }
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting problem:', error);
      throw new Error('Failed to delete problem');
    }
  }
}

module.exports = Sheet;
