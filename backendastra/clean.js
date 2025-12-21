// scripts/removeOrphan.js
const { DataAPIClient } = require('@datastax/astra-db-ts');
require('dotenv').config();

async function removeOrphan() {
  try {
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    const db = client.db(process.env.ASTRA_DB_API_ENDPOINT);
    const sheetsCollection = db.collection('sheets');
    
    const orphanedId = 'sbw8vxjnwmjeghl5k';
    
    //console.log(`🧹 Removing orphaned problem: ${orphanedId}\n`);
    
    const allSheets = await sheetsCollection.find({}).toArray();
    //console.log(`📊 Checking ${allSheets.length} sheets...\n`);
    
    let cleaned = 0;
    
    for (const sheet of allSheets) {
      let modified = false;
      
      if (!sheet.sections) continue;
      
      sheet.sections = sheet.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => {
          // Check both 'problems' and 'problemIds' arrays
          const beforeProblems = subsection.problems?.length || 0;
          const beforeProblemIds = subsection.problemIds?.length || 0;
          
          // Filter from 'problems' array
          if (subsection.problems) {
            subsection.problems = subsection.problems.filter(p => p !== orphanedId);
          }
          
          // Filter from 'problemIds' array
          if (subsection.problemIds) {
            subsection.problemIds = subsection.problemIds.filter(p => p !== orphanedId);
          }
          
          const afterProblems = subsection.problems?.length || 0;
          const afterProblemIds = subsection.problemIds?.length || 0;
          
          if (beforeProblems > afterProblems || beforeProblemIds > afterProblemIds) {
            modified = true;
            //console.log(`  ✓ Found in: ${sheet.title} > ${section.name} > ${subsection.name}`);
            //console.log(`    - problems: ${beforeProblems} → ${afterProblems}`);
            //console.log(`    - problemIds: ${beforeProblemIds} → ${afterProblemIds}`);
          }
          
          return subsection;
        })
      }));
      
      if (modified) {
        await sheetsCollection.updateOne(
          { _id: sheet._id },
          { 
            $set: { 
              sections: sheet.sections,
              updatedAt: new Date().toISOString()
            } 
          }
        );
        cleaned++;
      }
    }
    
    //console.log(`\n✅ Done! Cleaned ${cleaned} sheets`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeOrphan().then(() => process.exit(0));
