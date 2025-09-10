exports.getContent = (req, res) => {
  res.json({ 
    message: 'Content is served from frontend JSON file',
    endpoint: 'This endpoint can be used for dynamic content management in future versions'
  });
};

exports.validateContent = (req, res) => {
  // This can be used to validate JSON structure
  const { content } = req.body;
  
  try {
    // Basic validation logic
    if (!content || !content.sheets || !Array.isArray(content.sheets)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid content structure' 
      });
    }

    // Validate each sheet structure
    for (let sheet of content.sheets) {
      if (!sheet.id || !sheet.name || !sheet.sections) {
        return res.status(400).json({ 
          valid: false, 
          error: 'Invalid sheet structure' 
        });
      }
    }

    res.json({ valid: true, message: 'Content structure is valid' });
  } catch (error) {
    res.status(400).json({ 
      valid: false, 
      error: 'Invalid JSON format' 
    });
  }
};
