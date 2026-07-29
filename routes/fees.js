const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const finance = require('../controllers/financeController');

// Create a fee schedule
router.post('/schedules', validate([
	body('studentId').optional().isMongoId(),
	body('classId').optional().isMongoId(),
	body('studentId').if(body('classId').not().exists()).notEmpty().withMessage('studentId or classId is required'),
	body('items').isArray({ min: 1 }).withMessage('at least one fee item is required'),
	body('items.*.name').trim().notEmpty().withMessage('item name required'),
	body('items.*.amount').isFloat({ min: 0 }).withMessage('item amount required'),
	body('dueDate').optional().isISO8601(),
	body('frequency').optional().isIn(['One-time','One-Time','Monthly','Quarterly','Half-Yearly','Yearly','Installments']),
	body('category').optional().isIn(['Admission','Tuition','Exam','Annual','Computer','Hostel','Transport','Library','Sports','Custom']),
	body('isRecurring').optional().isBoolean(),
	body('recurrenceEndDate').optional().isISO8601()
]), finance.createSchedule);

router.get('/schedules', validate([ query('classId').optional().isMongoId(), query('studentId').optional().isMongoId() ]), finance.listSchedules);
router.get('/schedules/:id', validate([ param('id').isMongoId() ]), finance.getSchedule);
router.post('/schedules/:id/generate', validate([ param('id').isMongoId() ]), finance.generateInvoicesFromSchedule);
router.post('/schedules/generate', finance.generateInvoicesFromSchedules);

// Create invoice
router.post('/invoices', validate([
	body('studentId').isMongoId().withMessage('studentId required'),
	body('amountDue').optional().isFloat({ min: 0 }).withMessage('amountDue must be a non-negative number')
]), finance.createInvoice);
router.post('/schedules/:scheduleId/invoice', validate([ param('scheduleId').isMongoId() ]), finance.createInvoiceFromSchedule);

// Invoices
router.get('/invoices', validate([ query('studentId').optional().isMongoId() ]), finance.listInvoices);
router.get('/invoices/:id', validate([ param('id').isMongoId() ]), finance.getInvoice);

// Update invoice status or amountPaid
router.patch('/invoices/:id/status', validate([
	param('id').isMongoId(),
	body('status').optional().isIn(['Pending','Partial','Paid','Overdue','Cancelled']),
	body('amountPaid').optional().isFloat({ min: 0 })
]), finance.updateInvoiceStatus);

// Expenses
router.post('/expenses', validate([
	body('title').trim().notEmpty().withMessage('title required'),
	body('amount').isFloat({ min: 0 }).withMessage('amount required')
]), finance.createExpense);
router.get('/expenses', finance.listExpenses);
router.get('/expenses/:id', validate([ param('id').isMongoId() ]), finance.getExpense);

// Payroll
router.post('/payrolls', validate([
	body('teacherId').isMongoId().withMessage('teacherId required'),
	body('periodStart').isISO8601(),
	body('periodEnd').isISO8601(),
	body('amount').isFloat({ min: 0 })
]), finance.createPayroll);
router.get('/payrolls', finance.listPayrolls);
router.get('/payrolls/:id', validate([ param('id').isMongoId() ]), finance.getPayroll);
router.post('/payrolls/:id/pay', validate([ param('id').isMongoId() ]), finance.payPayroll);

// Record payment (offline or manual)
router.post('/payments', validate([
	body('invoiceId').optional().isMongoId(),
	body('studentId').optional().isMongoId(),
	body('amount').isFloat({ min: 0 }).withMessage('amount required')
]), finance.recordPayment);
router.get('/payments', finance.listPayments);

// Payment gateway webhook (no validation to allow external provider)
router.post('/payments/webhook', finance.gatewayWebhook);

// Finance summary endpoints
router.get('/daily-collection', finance.getTodaysCollection);
router.get('/monthly-collection', finance.getMonthlyCollection);
router.get('/payroll-due', finance.getPendingPayrollTotal);
router.get('/profit', finance.getProfit);

// Refunds
router.post('/refunds', validate([
  body('amount').isFloat({ min: 0 }).withMessage('amount required'),
  body('studentId').optional().isMongoId()
]), finance.createRefund);
router.get('/refunds', finance.listRefunds);

// Scholarships
router.post('/scholarships', validate([
  body('amount').isFloat({ min: 0 }).withMessage('amount required'),
  body('studentId').isMongoId()
]), finance.createScholarship);
router.get('/scholarships', finance.listScholarships);

module.exports = router;
