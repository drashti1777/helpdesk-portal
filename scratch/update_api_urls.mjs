import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Users.jsx',
  'src/pages/Projects.jsx',
  'src/pages/Profile.jsx',
  'src/pages/NewTicket.jsx',
  'src/pages/Feedbacks.jsx',
  'src/pages/AdminControl.jsx',
  'src/components/Notifications/NotificationPanel.jsx'
];

const API_CONFIG_IMPORT = "import API_BASE_URL from '../config';\n";
const COMPONENT_API_CONFIG_IMPORT = "import API_BASE_URL from '../../config';\n";

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if not present
  if (!content.includes('import API_BASE_URL')) {
    const importToUse = file.includes('components') ? COMPONENT_API_CONFIG_IMPORT : API_CONFIG_IMPORT;
    content = importToUse + content;
  }

  // Replace URLs
  content = content.replace(/http:\/\/localhost:5000/g, '${API_BASE_URL}');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
