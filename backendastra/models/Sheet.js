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

  async getAllSheets() {
    try {
      const cursor = this.collection.find({});
      const sheets = await cursor.toArray();
      return sheets;
    } catch (error) {
      console.error('Error fetching sheets:', error);
      throw new Error('Failed to fetch sheets');
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
      const result = await this.collection.updateOne(
        { id: sheetId },
        { 
          $set: { 
            ...updateData, 
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
      
      // console.log(`Added section ${section.name} to sheet ${sheetId}:`, result);
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
    // console.log('Sheet model: Deleting section', sectionId, 'from sheet', sheetId);
    
    // First verify the sheet exists and get current data
    const currentSheet = await this.collection.findOne({ id: sheetId });
    if (!currentSheet) {
      // console.log('Sheet not found:', sheetId);
      throw new Error('Sheet not found');
    }

    // console.log('Found sheet, sections count:', currentSheet.sections ? currentSheet.sections.length : 0);

    // Check if section exists in the sheet
    const sectionExists = currentSheet.sections && currentSheet.sections.some(section => section.id === sectionId);
    if (!sectionExists) {
      // console.log('Section not found in sheet:', sectionId);
      throw new Error('Section not found in the sheet');
    }

    // console.log('Section exists, proceeding with deletion');

    // Use the array filter approach instead of $pull for DataStax compatibility
    const updatedSections = currentSheet.sections.filter(section => section.id !== sectionId);
    
    // console.log('Filtered sections count:', updatedSections.length);

    const result = await this.collection.updateOne(
      { id: sheetId },
      { 
        $set: { 
          sections: updatedSections,
          updatedAt: new Date().toISOString()
        }
      }
    );

    // console.log('Section deletion result:', result);

    // Check if the update was successful
    if (result.modifiedCount === 0) {
      // console.log('No documents were modified during section deletion');
      throw new Error('Failed to delete section - no documents were modified');
    }

    // console.log('Section deleted successfully');
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

      // console.log(`Attempting to add subsection to sheet ${sheetId}, section ${sectionId}`);

      // First, let's fetch the current sheet to debug
      const currentSheet = await this.collection.findOne({ id: sheetId });
      // console.log('Current sheet found:', !!currentSheet);

      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      if (!currentSheet.sections || currentSheet.sections.length === 0) {
        throw new Error('No sections found in sheet');
      }

      const targetSection = currentSheet.sections.find(s => s.id === sectionId);
      // console.log('Target section found:', !!targetSection);

      if (!targetSection) {
        // console.log('Available section IDs:', currentSheet.sections.map(s => s.id));
        throw new Error(`Section with ID ${sectionId} not found`);
      }

      // Use a different approach - update the entire sections array
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

      // console.log(`Added subsection ${subsection.name} to section ${sectionId}:`, result);
      
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

      // Fetch current sheet
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      // Update the sections array
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
      // Fetch current sheet
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      // Update the sections array
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
      // Fetch current sheet
      const currentSheet = await this.collection.findOne({ id: sheetId });
      if (!currentSheet) {
        throw new Error('Sheet not found');
      }

      // Update the sections array
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
