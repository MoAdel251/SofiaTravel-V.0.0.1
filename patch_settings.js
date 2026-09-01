import fs from 'fs';
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

// Add useEffect import
content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';");

// Sync internal state when external settings change
const syncBlock = `  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {`;

content = content.replace("  const handleSubmit = (e: React.FormEvent) => {", syncBlock);

fs.writeFileSync('src/components/SettingsView.tsx', content);
