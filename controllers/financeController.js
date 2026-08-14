const FeeItem = require('../models/FeeItem');
const FeeSchedule = require('../models/FeeSchedule');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Payroll = require('../models/Payroll');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const schoolFilter = (req, filter = {}) => ({ ...filter, schoolId: req.user.schoolId });

const addMonthsToDate = (date, months) => {
  const next = new Date(date || new Date());
  next.setMonth(next.getMonth() + months);
  return next;
};

const getNextScheduleDueDate = (schedule) => {
  if (!schedule || !schedule.frequency || !schedule.dueDate) return null;
  switch (schedule.frequency) {
    case 'Monthly': return addMonthsToDate(schedule.dueDate, 1);
    case 'Quarterly': return addMonthsToDate(schedule.dueDate, 3);
    case 'Half-Yearly': return addMonthsToDate(schedule.dueDate, 6);
    case 'Yearly': return addMonthsToDate(schedule.dueDate, 12);
    default: return null;
  }
};

const createInvoiceForSchedule = async (schedule, studentId, dueDate, createdBy) => {
  const invoiceDueDate = dueDate || schedule.dueDate || new Date();
  const invoiceStudentId = studentId || schedule.studentId;
  if (!invoiceStudentId) return null;
  const existing = await Invoice.findOne({ scheduleId: schedule._id, studentId: invoiceStudentId, dueDate: invoiceDueDate, schoolId: schedule.schoolId });
  if (existing) return existing;
  return Invoice.create({
    schoolId: schedule.schoolId,
    scheduleId: schedule._id,
    studentId: invoiceStudentId,
    items: schedule.items,
    amountDue: schedule.totalAmount,
    dueDate: invoiceDueDate,
    createdBy: createdBy || null,
  });
};

const generateInvoiceForSchedule = async (schedule, userId) => {
  if (!schedule || schedule.status === 'Closed') return [];
  const today = new Date();
  const scheduleDue = schedule.dueDate ? new Date(schedule.dueDate) : today;
  const generated = [];

  if (schedule.classId && !schedule.studentId) {
    const students = await Student.find({ classId: schedule.classId, schoolId: schedule.schoolId, status: 'Active' });
    for (const student of students) {
      const invoice = await createInvoiceForSchedule(schedule, student._id, scheduleDue, userId);
      if (invoice) generated.push(invoice);
    }
  } else if (schedule.studentId) {
    const invoice = await createInvoiceForSchedule(schedule, schedule.studentId, scheduleDue, userId);
    if (invoice) generated.push(invoice);
  }

  if ((schedule.isRecurring || ['Monthly','Quarterly','Half-Yearly','Yearly'].includes(schedule.frequency)) && schedule.status !== 'Closed') {
    const nextDate = getNextScheduleDueDate(schedule);
    if (nextDate) {
      schedule.dueDate = nextDate;
      if (schedule.recurrenceEndDate && new Date(schedule.recurrenceEndDate) < nextDate) {
        schedule.status = 'Closed';
      }
      await schedule.save();
    }
  } else if (!schedule.isRecurring) {
    schedule.status = 'Closed';
    await schedule.save();
  }

  return generated;
};

const { error: respError, success: respSuccess } = require('../utils/response');

// Create a fee schedule for a student or class
exports.createSchedule = async (req, res) => {
  try {
    const { studentId, classId, items, dueDate, frequency, category, isRecurring, recurrenceEndDate } = req.body;
    if (!studentId && !classId) return respError(res, 'studentId or classId is required', 400);

    const scheduleItems = items && items.length ? items : [{ name: category || 'Fee', amount: 0 }];
    const total = scheduleItems.reduce((s, it) => s + (it.amount || 0), 0);
    const schedulePayload = {
      schoolId: req.user.schoolId,
      studentId,
      classId,
      items: scheduleItems,
      totalAmount: total,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      frequency: frequency || 'One-time',
      category: category || 'Tuition',
      isRecurring: !!isRecurring,
      recurrenceEndDate,
      status: 'Active',
      createdBy: req.user && req.user._id,
    };
    const schedule = await FeeSchedule.create(schedulePayload);
    return respSuccess(res, schedule, 201);
  } catch (err) {
    console.error(err);
    return respError(res, err.message || 'Could not create schedule', 500);
  }
};

exports.generateInvoicesFromSchedule = async (req, res) => {
  try {
    const schedule = await FeeSchedule.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!schedule) return respError(res, 'Schedule not found', 404);

    const generated = await generateInvoiceForSchedule(schedule, req.user && req.user._id);
    return respSuccess(res, { generated, schedule });
  } catch (err) {
    console.error(err);
    return respError(res, err.message || 'Could not generate invoices from schedule', 500);
  }
};

exports.generateInvoicesFromSchedules = async (req, res) => {
  try {
    const today = new Date();
    const schedules = await FeeSchedule.find({ schoolId: req.user.schoolId, status: 'Active' });
    const result = [];
    for (const schedule of schedules) {
      const dueDate = schedule.dueDate ? new Date(schedule.dueDate) : null;
      if (dueDate && dueDate <= today) {
        const generated = await generateInvoiceForSchedule(schedule, req.user && req.user._id);
        if (generated.length) {
          result.push({ scheduleId: schedule._id, generated: generated.length });
        }
      }
    }
    return respSuccess(res, { generatedSchedules: result });
  } catch (err) {
    console.error(err);
    return respError(res, err.message || 'Could not generate due invoices from schedules', 500);
  }
};

// List fee schedules
exports.listSchedules = async (req, res) => {
  try {
    const schedules = await FeeSchedule.find(schoolFilter(req)).populate('studentId classId createdBy').sort({ createdAt: -1 });
    return respSuccess(res, schedules);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list schedules', 500);
  }
};

// Get fee schedule by id
exports.getSchedule = async (req, res) => {
  try {
    const schedule = await FeeSchedule.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('studentId classId createdBy');
    if (!schedule) return respError(res, 'Schedule not found', 404);
    return respSuccess(res, schedule);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch schedule', 500);
  }
};

// Create invoice from schedule
exports.createInvoiceFromSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await FeeSchedule.findOne({ _id: scheduleId, schoolId: req.user.schoolId });
    if (!schedule) return respError(res, 'Schedule not found', 404);
    const invoice = await Invoice.create({ schoolId: schedule.schoolId, scheduleId: schedule._id, studentId: schedule.studentId, items: schedule.items, amountDue: schedule.totalAmount, dueDate: schedule.dueDate, createdBy: req.user && req.user._id });
    return respSuccess(res, invoice, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not create invoice', 500);
  }
};

// Create invoice for student or manual items
exports.createInvoice = async (req, res) => {
  try {
    const { studentId, items, amountDue, dueDate } = req.body;
    if (!studentId) return respError(res, 'studentId is required', 400);
    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return respError(res, 'Student not found', 404);

    let invoiceItems = items;
    let total = amountDue;
    if ((!items || !items.length) && amountDue == null) {
      invoiceItems = [{ name: 'Annual fee', amount: student.fee || 0 }];
      total = student.fee || 0;
    }
    if (!invoiceItems || !invoiceItems.length) {
      invoiceItems = [{ name: 'Annual fee', amount: total || 0 }];
    }
    if (total == null) {
      total = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    const invoice = await Invoice.create({
      schoolId: req.user.schoolId,
      studentId,
      items: invoiceItems,
      amountDue: total,
      dueDate,
      createdBy: req.user && req.user._id,
    });
    return respSuccess(res, invoice, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not create invoice', 500);
  }
};

// Get invoice by id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('studentId scheduleId');
    if (!invoice) return respError(res, 'Invoice not found', 404);
    return respSuccess(res, invoice);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch invoice', 500);
  }
};

// List invoices with optional filters
exports.listInvoices = async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const q = schoolFilter(req, {});
    if (studentId) q.studentId = studentId;
    if (status) q.status = status;
    const invoices = await Invoice.find(q).limit(200).sort({ createdAt: -1 });
    return respSuccess(res, invoices);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list invoices', 500);
  }
};

// Update invoice status and optionally amountPaid
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, amountPaid } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!invoice) return respError(res, 'Invoice not found', 404);

    if (typeof amountPaid !== 'undefined' && amountPaid !== null) {
      invoice.amountPaid = amountPaid;
      // infer status from amounts
      if ((invoice.amountPaid || 0) >= (invoice.amountDue || 0)) invoice.status = 'Paid';
      else if ((invoice.amountPaid || 0) > 0) invoice.status = 'Partial';
      else invoice.status = invoice.status || 'Pending';
    }

    if (status) {
      // accept explicit status values
      const allowed = ['Pending', 'Partial', 'Paid', 'Overdue', 'Cancelled'];
      if (!allowed.includes(status)) return respError(res, 'Invalid status', 400);
      invoice.status = status;
      if (status === 'Paid' && (invoice.amountPaid || 0) < (invoice.amountDue || 0)) {
        invoice.amountPaid = invoice.amountDue || invoice.amountPaid;
      }
      if (status === 'Cancelled') invoice.amountPaid = 0;
    }

    await invoice.save();
    return respSuccess(res, invoice);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not update invoice status', 500);
  }
};

exports.listPayments = async (req, res) => {
  try {
    const { studentId } = req.query;
    const q = schoolFilter(req, {});
    if (studentId) q.studentId = studentId;
    const payments = await Payment.find(q).sort({ createdAt: -1 });
    return respSuccess(res, payments);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list payments', 500);
  }
};

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { title, description, category, amount, date, paidTo } = req.body;
    if (!title || amount == null) return respError(res, 'Title and amount are required', 400);
    const expense = await Expense.create({ schoolId: req.user.schoolId, title, description, category, amount, date, paidTo, createdBy: req.user && req.user._id });
    return respSuccess(res, expense, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not create expense', 500);
  }
};

// List expenses
exports.listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find(schoolFilter(req)).sort({ date: -1, createdAt: -1 });
    return respSuccess(res, expenses);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list expenses', 500);
  }
};

// Get expense by id
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!expense) return respError(res, 'Expense not found', 404);
    return respSuccess(res, expense);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch expense', 500);
  }
};

// Create payroll entry
exports.createPayroll = async (req, res) => {
  try {
    const { teacherId, periodStart, periodEnd, amount, method, reference, notes, status, payDate } = req.body;
    if (!teacherId || !periodStart || !periodEnd || amount == null) return respError(res, 'Teacher, period, and amount are required', 400);
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId: req.user.schoolId });
    if (!teacher) return respError(res, 'Teacher not found', 404);
    const payroll = await Payroll.create({ schoolId: req.user.schoolId, teacherId, periodStart, periodEnd, amount, method, reference, notes, status: status || 'Pending', payDate: status === 'Paid' ? payDate || new Date() : null, createdBy: req.user && req.user._id });
    return respSuccess(res, payroll, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not create payroll entry', 500);
  }
};

// List payroll entries
exports.listPayrolls = async (req, res) => {
  try {
    const q = schoolFilter(req, {});
    if (req.query.teacherId) q.teacherId = req.query.teacherId;
    const payrolls = await Payroll.find(q).populate('teacherId createdBy').sort({ periodEnd: -1, createdAt: -1 });
    return respSuccess(res, payrolls);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list payroll entries', 500);
  }
};

// Get payroll entry by id
exports.getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('teacherId createdBy');
    if (!payroll) return respError(res, 'Payroll entry not found', 404);
    return respSuccess(res, payroll);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch payroll entry', 500);
  }
};

// Mark payroll entry as paid
exports.payPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!payroll) return respError(res, 'Payroll entry not found', 404);
    const { method, reference, payDate } = req.body;
    payroll.status = 'Paid';
    payroll.method = method || payroll.method;
    payroll.reference = reference || payroll.reference;
    payroll.payDate = payDate ? new Date(payDate) : new Date();
    await payroll.save();
    return respSuccess(res, payroll);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not mark payroll as paid', 500);
  }
};

// Record a payment (offline or gateway-confirmed)
exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, gatewayRef, status } = req.body;
    const invoice = await Invoice.findOne({ _id: invoiceId, schoolId: req.user.schoolId });
    if (!invoice) return respError(res, 'Invoice not found', 404);
    const payment = await Payment.create({ schoolId: req.user.schoolId, invoiceId, studentId: invoice.studentId, amount, method, gatewayRef, status: status || 'Completed', recordedBy: req.user && req.user._id });
    invoice.amountPaid = (invoice.amountPaid || 0) + amount;
    if (invoice.amountPaid >= invoice.amountDue) invoice.status = 'Paid';
    else invoice.status = 'Partial';
    await invoice.save();

    if (invoice.studentId) {
      const student = await Student.findOne({ _id: invoice.studentId, schoolId: req.user.schoolId });
      if (student) {
        student.paid = (student.paid || 0) + amount;
        await student.save();
      }
    }

    return respSuccess(res, { payment, invoice }, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not record payment', 500);
  }
};

// Payment gateway webhook placeholder
exports.gatewayWebhook = async (req, res) => {
  console.log('Received payment webhook', req.body);
  return respSuccess(res, { message: 'ok' });
};

// Get today's collection
exports.getTodaysCollection = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const payments = await Payment.find({
      ...schoolFilter(req),
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return respSuccess(res, { total, count: payments.length });
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch today\'s collection', 500);
  }
};

// Get monthly collection
exports.getMonthlyCollection = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const payments = await Payment.find({
      ...schoolFilter(req),
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return respSuccess(res, { total, count: payments.length });
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch monthly collection', 500);
  }
};

// Get pending payroll total (salary due)
exports.getPendingPayrollTotal = async (req, res) => {
  try {
    const payrolls = await Payroll.find({
      ...schoolFilter(req),
      status: 'Pending'
    });
    const total = payrolls.reduce((sum, p) => sum + (p.amount || 0), 0);
    return respSuccess(res, { total, count: payrolls.length });
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not fetch pending payroll', 500);
  }
};

// Get profit (Collected - Expenses - Payroll)
exports.getProfit = async (req, res) => {
  try {
    const { collect, exp, pay } = req.query;
    let profit = 0;
    if (collect != null && exp != null && pay != null) {
      profit = collect - exp - pay;
    } else {
      const expenses = await Expense.find(schoolFilter(req));
      const payrolls = await Payroll.find(schoolFilter(req));
      const expTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const payTotal = payrolls.reduce((sum, p) => sum + (p.amount || 0), 0);
      const payments = await Payment.find(schoolFilter(req));
      const colTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      profit = colTotal - expTotal - payTotal;
    }
    return respSuccess(res, { profit });
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not calculate profit', 500);
  }
};

// Create refund
exports.createRefund = async (req, res) => {
  try {
    const { studentId, paymentId, amount, reason, method } = req.body;
    if (!amount || amount <= 0) return respError(res, 'Amount is required', 400);
    const Refund = require('../models/Refund');
    const refund = await Refund.create({
      schoolId: req.user.schoolId,
      studentId,
      paymentId,
      amount,
      reason,
      method: method || 'BankTransfer',
      createdBy: req.user && req.user._id
    });
    return respSuccess(res, refund, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not create refund', 500);
  }
};

// List refunds
exports.listRefunds = async (req, res) => {
  try {
    const Refund = require('../models/Refund');
    const refunds = await Refund.find(schoolFilter(req)).populate('studentId paymentId').sort({ createdAt: -1 });
    return respSuccess(res, refunds);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list refunds', 500);
  }
};

// Create scholarship
exports.createScholarship = async (req, res) => {
  try {
    const { studentId, amount, type, description, startDate, endDate } = req.body;
    if (!amount || amount <= 0) return respError(res, 'Amount is required', 400);
    const Scholarship = require('../models/Scholarship');
    const scholarship = await Scholarship.create({
      schoolId: req.user.schoolId,
      studentId,
      amount,
      type,
      description,
      startDate: startDate || new Date(),
      endDate,
      createdBy: req.user && req.user._id
    });
    return respSuccess(res, scholarship, 201);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not create scholarship', 500);
  }
};

// List scholarships
exports.listScholarships = async (req, res) => {
  try {
    const Scholarship = require('../models/Scholarship');
    const q = schoolFilter(req, {});
    if(req.query.studentId) q.studentId = req.query.studentId;
    const scholarships = await Scholarship.find(q).populate('studentId').sort({ createdAt: -1 });
    return respSuccess(res, scholarships);
  } catch (err) {
    console.error(err);
    return respError(res, 'Could not list scholarships', 500);
  }
};
