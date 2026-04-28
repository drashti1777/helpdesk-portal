import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Users.jsx',
  'src/pages/Projects.jsx',
  'src/pages/Profile.jsx',
  'src/pages/NewTicket.jsx',
  'src/pages/Feedbacks.jsx',
  'src/pages/AdminControl.jsx',
  'src/pages/Tickets.jsx',
  'src/pages/TicketDetail.jsx',
  'src/pages/Login.jsx',
  'src/pages/Dashboard.jsx',
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

  // First, normalize any existing partial replacements (like '${API_BASE_URL}' in single quotes)
  content = content.replace(/'\$\{API_BASE_URL\}([^']*)'/g, '`${API_BASE_URL}$1`');
  content = content.replace(/"\$\{API_BASE_URL\}([^"]*)"/g, '`${API_BASE_URL}$1`');

  // Then replace remaining localhost URLs
  content = content.replace(/`http:\/\/localhost:5000/g, '`${API_BASE_URL}');
  content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${API_BASE_URL}$1`');
  content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${API_BASE_URL}$1`');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
