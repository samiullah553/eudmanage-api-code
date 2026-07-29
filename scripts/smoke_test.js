(async () => {
  // Simple smoke test using global fetch (Node 18+).
  const tests = [
    { method: 'POST', path: '/api/fees/schedules', body: {} },
    { method: 'POST', path: '/api/fees/invoices', body: { amountDue: -10 } },
    { method: 'POST', path: '/api/fees/expenses', body: { title: '', amount: 'x' } },
    { method: 'POST', path: '/api/tasks', body: {} },
    { method: 'GET', path: '/api/questions/chapters', qs: '' },
    { method: 'POST', path: '/api/questions', body: { classId: 'bad', subjectId: 'bad', chapter: '', type: '', question: '', answer: '' } },
    { method: 'POST', path: '/api/grades/student/invalid-id', body: { subject: '', marks: 'a', total: null } },
    { method: 'POST', path: '/api/timetables', body: { classId: 'bad', dayOfWeek: 10, slot: '' } }
  ];

  const base = (process.env.API_BASE || 'http://localhost:5001');
  const token = process.env.SMOKE_TOKEN;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  for (const t of tests) {
    const url = t.path.includes('?') ? `${base}${t.path}` : `${base}${t.path}` + (t.qs ? `?${t.qs}` : '');
    const opts = { method: t.method, headers: { 'Content-Type': 'application/json', ...authHeader } };
    if (t.body) opts.body = JSON.stringify(t.body);
    try {
      const res = await fetch(url, opts);
      let text;
      try { text = await res.text(); } catch (e) { text = '<no body>'; }
      console.log(`TEST ${t.method} ${t.path} => ${res.status}\n${text}\n---`);
    } catch (err) {
      console.log(`TEST ${t.method} ${t.path} => ERROR ${err.message}`);
    }
  }
})();
