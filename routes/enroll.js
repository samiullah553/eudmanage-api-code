const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
let EnrollmentRequest;
let User;
try {
  EnrollmentRequest = require('../models/EnrollmentRequest');
  User = require('../models/User');
} catch (e) {
  // models may not be available at module load time in some test setups
  EnrollmentRequest = null;
  User = null;
}

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'enrollments');
const DATA_FILE = path.join(__dirname, '..', 'data', 'enrollments.json');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

const upload = multer({ storage });

// Public enrollment POST endpoint. Accepts files (photo + documents).
router.post('/', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  try {
    const body = req.body || {};
    const files = req.files || {};

    const photoRel = (files.photo && files.photo[0] && path.relative(path.join(__dirname, '..'), files.photo[0].path)) || null;
    const docsRel = (files.documents || []).map((f) => path.relative(path.join(__dirname, '..'), f.path));

    const submission = {
      id: Date.now().toString(),
      studentName: body.studentName || '',
      dob: body.dob || '',
      gender: body.gender || '',
      guardian: body.guardian || '',
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      prevLevel: body.prevLevel || '',
      classType: body.classType || '',
      photo: photoRel,
      documents: docsRel,
      createdAt: new Date().toISOString(),
    };

    // Try to persist to MongoDB if model is available
    let created = null;
    try {
      if (EnrollmentRequest) {
        const doc = {
          studentName: submission.studentName,
          dob: submission.dob,
          gender: submission.gender,
          guardian: submission.guardian,
          phone: submission.phone,
          email: submission.email ? String(submission.email).toLowerCase().trim() : undefined,
          address: submission.address,
          prevLevel: submission.prevLevel,
          classType: submission.classType,
          photoPath: photoRel,
          documentPaths: docsRel,
          metadata: { source: 'public-form' }
        };

        // If email matches an existing user, link it
        if (User && doc.email) {
          const found = await User.findOne({ email: doc.email }).select('_id').lean().exec();
          if (found) doc.linkedUser = found._id;
        }

        created = await EnrollmentRequest.create(doc);
      }
    } catch (e) {
      console.error('Mongo persist failed', e);
      created = null;
    }

    // Always append to JSON fallback for easy access
    try {
      let arr = [];
      if (fs.existsSync(DATA_FILE)) {
        try { arr = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]'); } catch (e) { arr = []; }
      }
      arr.push(submission);
      fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed writing fallback JSON', e);
    }

    res.json({ success: true, message: 'Enrollment received', submission, created });
  } catch (err) {
    console.error('Enroll error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
