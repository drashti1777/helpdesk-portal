const fs = require('fs');
let code = fs.readFileSync('src/pages/Projects.jsx', 'utf8');

// 1. Remove viewMode state
code = code.replace(/const \[viewMode, setViewMode\] = useState\('grid'\);\s*\/\/\s*'grid' or 'table'\s*/g, '');

// 2. Remove Toggle UI
const toggleStart = code.indexOf('<div style={{ display: \'flex\', alignItems: \'center\', gap: \'0.5rem\', background: \'var(--glass)\'');
const toggleEnd = code.indexOf('<div style={{ position: \'relative\', width: \'350px\' }}>');
if (toggleStart !== -1 && toggleEnd !== -1) {
  code = code.substring(0, toggleStart) + code.substring(toggleEnd);
  code = code.replace(/justifyContent: 'space-between'/, "justifyContent: 'flex-end'");
}

// 3. Remove Grid View & Extract Table View
const gridStart = code.indexOf(") : viewMode === 'grid' ? (");
const tableStart = code.indexOf('/* Table View */');
const gridEnd = code.lastIndexOf(') : (', tableStart);

if (gridStart !== -1 && gridEnd !== -1 && tableStart !== -1) {
  const beforeGrid = code.substring(0, gridStart) + ') : (\n        ';
  const tablePart = code.substring(tableStart);
  code = beforeGrid + tablePart;
}

// 4. Update Table View to include Team Members
const theadStr = "<th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</th>";
code = code.replace(theadStr, theadStr + "\n                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Members</th>");

const tbodyStr = ") : '-'}\n                    </td>";
const newTbodyStr = ") : '-'}\n                    </td>\n                    <td style={{ padding: '1.5rem' }}>\n                      {p.teamMembers && p.teamMembers.length > 0 ? (\n                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>\n                          {p.teamMembers.map(m => (\n                            <div key={m._id} style={{ fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>\n                              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{m.name}</span>\n                              <span style={{ color: 'var(--text-muted)' }}>{m.email}</span>\n                              <span style={{ color: 'var(--text-muted)' }}>{m.mobile || 'N/A'}</span>\n                            </div>\n                          ))}\n                        </div>\n                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No members</span>}\n                    </td>";
code = code.replace(tbodyStr, newTbodyStr);

fs.writeFileSync('src/pages/Projects.jsx', code);
console.log('Done');
