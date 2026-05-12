const fs = require('fs');
const files = ['Testimonials.tsx', 'ProductsDynamic.tsx', 'Pricing.tsx', 'InteractiveTabs.tsx', 'HeroDynamic.tsx', 'FAQ.tsx'];
files.forEach(f => {
    let p = 'e:/البوت/modern-soft.botمستقر/modern-soft.bot/components/' + f;
    if(fs.existsSync(p)) {
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/import\s*\{\s*db\s*\}\s*from\s*['"]\.\.\/services\/db['"];/g, 'import { firestoreDb } from "../services/db";');
        c = c.replace(/doc\(db,/g, 'doc(firestoreDb,');
        c = c.replace(/collection\(db,/g, 'collection(firestoreDb,');
        
        // Ensure firestoreDb is not null before using it
        c = c.replace(/const docRef = doc\(firestoreDb,/g, 'if(!firestoreDb) return; const docRef = doc(firestoreDb,');
        c = c.replace(/const q = query\(collection\(firestoreDb,/g, 'if(!firestoreDb) return; const q = query(collection(firestoreDb,');

        fs.writeFileSync(p, c);
        console.log('Fixed:', f);
    }
});
