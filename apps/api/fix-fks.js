const fs = require('fs');
const path = require('path');

const dir = './src/drizzle/schema/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  
  // Replace text("some_id") or text("someId") with uuid(...)
  c = c.replace(/text\("([a-zA-Z0-9_]*id[a-zA-Z0-9_]*)"\)/ig, 'uuid("$1")');
  c = c.replace(/text\('([a-zA-Z0-9_]*id[a-zA-Z0-9_]*)'\)/ig, 'uuid("$1")');

  fs.writeFileSync(p, c);
  console.log('Fixed', f);
});
