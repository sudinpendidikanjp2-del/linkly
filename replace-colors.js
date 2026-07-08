const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/constants.ts',
  'src/components/Sidebar.tsx',
  'src/components/MobileNav.tsx',
  'src/components/CreateLinkModal.tsx',
  'src/components/FolderGroupModal.tsx',
  'src/components/QrCustomizerModal.tsx',
  'src/pages/CollectionsPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/LinkDetailPage.tsx',
  'src/pages/LinkTreePage.tsx',
  'src/pages/LinksListPage.tsx',
  'src/pages/PublicLinkTree.tsx',
  'src/pages/AuthPage.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    console.log(`Processing file: ${file}`);
    const content = fs.readFileSync(file, 'utf8');
    const updated = content.replace(/orange-(\d+)/g, 'brand-$1');
    fs.writeFileSync(file, updated, 'utf8');
  } else {
    console.log(`File not found: ${file}`);
  }
}
console.log("Replacement completed successfully.");
