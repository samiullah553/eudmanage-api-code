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

// Create a fee schedule for a student or class
exports.createSchedule = async (req, res) => {
  try {
    const { studentId, classId, items, dueDate, frequency, category, isRecurring, recurrenceEndDate } = req.body;
    if (!studentId && !classId) return res.status(400).json({ error: 'studentId or classId is required' });

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
    return res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create schedule' });
  }
};

exports.generateInvoicesFromSchedule = async (req, res) => {
  try {
    const schedule = await FeeSchedule.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    const generated = await generateInvoiceForSchedule(schedule, req.user && req.user._id);
    return res.json({ generated, schedule });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not generate invoices from schedule' });
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
    return res.json({ generatedSchedules: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not generate due invoices from schedules' });
  }
};

// List fee schedules
exports.listSchedules = async (req, res) => {
  try {
    const schedules = await FeeSchedule.find(schoolFilter(req)).populate('studentId classId createdBy').sort({ createdAt: -1 });
    return res.json(schedules);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list schedules' });
  }
};

// Get fee schedule by id
exports.getSchedule = async (req, res) => {
  try {
    const schedule = await FeeSchedule.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('studentId classId createdBy');
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    return res.json(schedule);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch schedule' });
  }
};

// Create invoice from schedule
exports.createInvoiceFromSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await FeeSchedule.findOne({ _id: scheduleId, schoolId: req.user.schoolId });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    const invoice = await Invoice.create({ schoolId: schedule.schoolId, scheduleId: schedule._id, studentId: schedule.studentId, items: schedule.items, amountDue: schedule.totalAmount, dueDate: schedule.dueDate, createdBy: req.user && req.user._id });
    return res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create invoice' });
  }
};

// Create invoice for student or manual items
exports.createInvoice = async (req, res) => {
  try {
    const { studentId, items, amountDue, dueDate } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });
    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

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
    return res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create invoice' });
  }
};

// Get invoice by id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('studentId scheduleId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch invoice' });
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
    return res.json(invoices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list invoices' });
  }
};

// Update invoice status and optionally amountPaid
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, amountPaid } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

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
      if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      invoice.status = status;
      if (status === 'Paid' && (invoice.amountPaid || 0) < (invoice.amountDue || 0)) {
        invoice.amountPaid = invoice.amountDue || invoice.amountPaid;
      }
      if (status === 'Cancelled') invoice.amountPaid = 0;
    }

    await invoice.save();
    return res.json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update invoice status' });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const { studentId } = req.query;
    const q = schoolFilter(req, {});
    if (studentId) q.studentId = studentId;
    const payments = await Payment.find(q).sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list payments' });
  }
};

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { title, description, category, amount, date, paidTo } = req.body;
    if (!title || amount == null) return res.status(400).json({ error: 'Title and amount are required' });
    const expense = await Expense.create({ schoolId: req.user.schoolId, title, description, category, amount, date, paidTo, createdBy: req.user && req.user._id });
    return res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create expense' });
  }
};

// List expenses
exports.listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find(schoolFilter(req)).sort({ date: -1, createdAt: -1 });
    return res.json(expenses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list expenses' });
  }
};

// Get expense by id
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    return res.json(expense);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch expense' });
  }
};

// Create payroll entry
exports.createPayroll = async (req, res) => {
  try {
    const { teacherId, periodStart, periodEnd, amount, method, reference, notes, status, payDate } = req.body;
    if (!teacherId || !periodStart || !periodEnd || amount == null) return res.status(400).json({ error: 'Teacher, period, and amount are required' });
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId: req.user.schoolId });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    const payroll = await Payroll.create({ schoolId: req.user.schoolId, teacherId, periodStart, periodEnd, amount, method, reference, notes, status: status || 'Pending', payDate: status === 'Paid' ? payDate || new Date() : null, createdBy: req.user && req.user._id });
    return res.status(201).json(payroll);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create payroll entry' });
  }
};

// List payroll entries
exports.listPayrolls = async (req, res) => {
  try {
    const q = schoolFilter(req, {});
    if (req.query.teacherId) q.teacherId = req.query.teacherId;
    const payrolls = await Payroll.find(q).populate('teacherId createdBy').sort({ periodEnd: -1, createdAt: -1 });
    return res.json(payrolls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list payroll entries' });
  }
};

// Get payroll entry by id
exports.getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({ _id: req.params.id, schoolId: req.user.schoolId }).populate('teacherId createdBy');
    if (!payroll) return res.status(404).json({ error: 'Payroll entry not found' });
    return res.json(payroll);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch payroll entry' });
  }
};

// Mark payroll entry as paid
exports.payPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!payroll) return res.status(404).json({ error: 'Payroll entry not found' });
    const { method, reference, payDate } = req.body;
    payroll.status = 'Paid';
    payroll.method = method || payroll.method;
    payroll.reference = reference || payroll.reference;
    payroll.payDate = payDate ? new Date(payDate) : new Date();
    await payroll.save();
    return res.json(payroll);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not mark payroll as paid' });
  }
};

// Record a payment (offline or gateway-confirmed)
exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, gatewayRef, status } = req.body;
    const invoice = await Invoice.findOne({ _id: invoiceId, schoolId: req.user.schoolId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
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

    return res.status(201).json({ payment, invoice });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not record payment' });
  }
};

// Payment gateway webhook placeholder
exports.gatewayWebhook = async (req, res) => {
  console.log('Received payment webhook', req.body);
  res.status(200).send('ok');
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
    res.json({ total, count: payments.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch today\'s collection' });
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
    res.json({ total, count: payments.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch monthly collection' });
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
    res.json({ total, count: payrolls.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch pending payroll' });
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
    res.json({ profit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not calculate profit' });
  }
};

// Create refund
exports.createRefund = async (req, res) => {
  try {
    const { studentId, paymentId, amount, reason, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount is required' });
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
    return res.status(201).json(refund);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create refund' });
  }
};

// List refunds
exports.listRefunds = async (req, res) => {
  try {
    const Refund = require('../models/Refund');
    const refunds = await Refund.find(schoolFilter(req)).populate('studentId paymentId').sort({ createdAt: -1 });
    res.json(refunds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not list refunds' });
  }
};

// Create scholarship
exports.createScholarship = async (req, res) => {
  try {
    const { studentId, amount, type, description, startDate, endDate } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount is required' });
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
    return res.status(201).json(scholarship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create scholarship' });
  }
};

// List scholarships
exports.listScholarships = async (req, res) => {
  try {
    const Scholarship = require('../models/Scholarship');
    const q = schoolFilter(req, {});
    if(req.query.studentId) q.studentId = req.query.studentId;
    const scholarships = await Scholarship.find(q).populate('studentId').sort({ createdAt: -1 });
    res.json(scholarships);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not list scholarships' });
  }
};
