// migrate_attendance_dates.js
// Usage: node migrate_attendance_dates.js [--apply] [--limit=N]
// By default runs a dry-run reporting how many documents would change.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Attendance = require('../models/Attendance');

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;

  await connectDB();

  // Find attendance documents where `date` is stored as a string (BSON type 2)
  const q = { 'date': { $type: 2 } };
  let cursor = Attendance.find(q).cursor();
  let total = 0, toConvert = 0, converted = 0, failed = 0;
  const failures = [];

  if (limit > 0) {
    cursor = Attendance.find(q).limit(limit).cursor();
  }

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    total++;
    const raw = doc.date;
    let parsed = null;
    if (typeof raw === 'string') {
      // Year-only string like '1992'
      if (/^\d{4}$/.test(raw)) {
        parsed = new Date(parseInt(raw,10), 0, 1);
      } else {
        const d = new Date(raw);
        if (!isNaN(d)) {
          d.setHours(0,0,0,0);
          parsed = d;
        }
      }
    }

    if (parsed) {
      toConvert++;
      if (apply) {
        try {
          await Attendance.updateOne({ _id: doc._id }, { $set: { date: parsed } });
          converted++;
        } catch (err) {
          failed++;
          failures.push({ id: doc._id.toString(), raw });
        }
      }
    } else {
      failed++;
      failures.push({ id: doc._id.toString(), raw });
    }
  }

  console.log('Migration report:');
  console.log('  Total documents scanned:', total);
  console.log('  Candidates to convert:', toConvert);
  if (apply) console.log('  Successfully converted:', converted);
  console.log('  Failed / unparseable:', failed);
  if (failures.length) console.log('  Sample failures:', failures.slice(0,10));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
