const { DataAPIClient } = require('@datastax/astra-db-ts');

let db;

const connectToAstra = async () => {
  try {
    console.log('🔗 Connecting to Astra DB...');
    console.log('🔄 Initializing Astra DB connection...');
    
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    db = client.db(process.env.ASTRA_DB_API_ENDPOINT);
    
    console.log('✅ Connected to Astra DB');
    
    // Create collections if they don't exist
    await createCollectionsIfNeeded();
    
    console.log('✅ All collections verified and ready');
    return db;
  } catch (error) {
    console.error('❌ Astra DB connection error:', error);
    throw error;
  }
};

const createCollectionsIfNeeded = async () => {
  try {
    console.log('🔍 Checking existing collections...');
    
    // List existing collections
    const collections = await db.listCollections({ nameOnly: true });
    const collectionNames = collections.map(c => c.name);
    
    console.log('📋 Existing collections:', collectionNames);
    
    // UPDATED: Include all required collections based on your models
    const requiredCollections = [
      'users',           // For user authentication and management
      'progress',        // For tracking user progress on problems
      'announcements',   // For admin announcements
      'sheets'           // For problem sheets (ADDED THIS)
    ];
    
    // Create each collection if it doesn't exist
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        console.log(`🔧 Creating collection: ${collectionName}`);
        try {
          await db.createCollection(collectionName);
          console.log(`✅ Successfully created collection: ${collectionName}`);
        } catch (createError) {
          console.error(`❌ Error creating collection ${collectionName}:`, createError);
          // Continue with other collections even if one fails
          console.log(`⚠️  Collection ${collectionName} may already exist or have permission issues`);
        }
      } else {
        console.log(`✅ Collection '${collectionName}' already exists`);
      }
    }
    
    // Verify final collections
    const finalCollections = await db.listCollections({ nameOnly: true });
    const finalCollectionNames = finalCollections.map(c => c.name);
    console.log('📊 Final collection list:', finalCollectionNames);
    
  } catch (error) {
    console.error('❌ Error in createCollectionsIfNeeded:', error);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectToAstra first.');
  }
  return db;
};

module.exports = { connectToAstra, getDB };
