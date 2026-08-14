const ROLE_ROUTE_ACCESS = {
  admin: ['*'],
  teacher: [
    '/api/students',
    '/api/students/:id',
    '/api/students/:id/attendance-summary',
    '/api/students/:id/grades',
    '/api/classes',
    '/api/classes/:id',
    '/api/subjects',
    '/api/subjects/:id',
    '/api/timetables',
    '/api/timetables/:id',
    '/api/attendance',
    '/api/attendance/templates',
    '/api/attendance/classes/report',
    '/api/grades',
    '/api/tasks',
    '/api/tasks/:id',
    '/api/tasks/:id/attachments'
  ],
  parent: [
    '/api/students',
    '/api/students/:id',
    '/api/students/:id/attendance-summary',
    '/api/students/:id/grades',
    '/api/tasks',
    '/api/tasks/:id',
    '/api/parents/me/children'
  ],
  student: [
    '/api/students/:id',
    '/api/students/:id/attendance-summary',
    '/api/students/:id/grades',
    '/api/tasks',
    '/api/tasks/:id'
  ]
};

const roleRouteAccess = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  const role = String(req.user.role || '').toLowerCase();
  const allowedRoutes = ROLE_ROUTE_ACCESS[role] || [];
  const path = req.baseUrl + req.path;

  const isAllowed = allowedRoutes.includes('*') || allowedRoutes.some((route) => {
    if (!route.includes(':')) return path === route;
    const regex = new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`);
    return regex.test(path);
  });

  if (isAllowed) return next();

  return res.status(403).json({ error: 'Forbidden for this role' });
};

module.exports = { ROLE_ROUTE_ACCESS, roleRouteAccess };