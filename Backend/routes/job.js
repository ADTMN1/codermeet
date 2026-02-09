const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  toggleJobLike,
  getJobApplicants,
  acceptApplicant,
  rejectApplicant,
  getMyJobs,
  getMyApplications
} = require('../controllers/jobController');
const auth = require('../middlewares/auth');

// Public routes
router.get('/', getJobs);
router.get('/my-jobs', auth, getMyJobs);
router.get('/my-applications', auth, getMyApplications);
router.get('/:id', getJobById);

// Protected routes
router.post('/', auth, createJob);
router.put('/:id', auth, updateJob);
router.delete('/:id', auth, deleteJob);
router.post('/:id/apply', auth, applyForJob);
router.post('/:id/like', auth, toggleJobLike);
router.get('/:id/applicants', auth, getJobApplicants);
router.post('/:id/accept-applicant', auth, acceptApplicant);
router.post('/:id/reject-applicant', auth, rejectApplicant);
router.get('/my-jobs', auth, getMyJobs);
router.get('/my-applications', auth, getMyApplications);

// Temporary: Reset likes for debugging
router.post('/reset-likes', auth, async (req, res) => {
  try {
    await Job.updateMany(
      { likes: { $lt: 0 } },
      { $set: { likes: 0 } }
    );
    res.json({ success: true, message: 'Likes reset' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resetting likes' });
  }
});

module.exports = router;
