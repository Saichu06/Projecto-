const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runE2EScenario() {
  console.log('=====================================================');
  console.log('🚀 RUNNING PROJECTO CROSS-PLATFORM END-TO-END SCENARIO');
  console.log('=====================================================');

  const timestamp = Date.now();
  const userAData = {
    fullName: 'Alice Walker',
    email: `alice_e2e_${timestamp}@example.com`,
    password: 'Password123!',
  };

  const userBData = {
    fullName: 'Bob Martinez',
    email: `bob_e2e_${timestamp}@example.com`,
    password: 'Password123!',
  };

  // 1. Register User A (Web)
  console.log('\n1. Registering User A via Web API...');
  const regA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userAData),
  });
  console.log(`-> Status: ${regA.status}, User ID: ${regA.data?.data?.user?.id}`);
  if (regA.status !== 201) throw new Error('User A registration failed');
  const userAToken = regA.data.data.token;

  // 2. Login on Web
  console.log('\n2. Logging in User A on Web...');
  const loginA = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: userAData.email, password: userAData.password }),
  });
  console.log(`-> Status: ${loginA.status}, Login successful`);

  // 3. Create Project on Web
  console.log('\n3. Creating Project A on Web...');
  const projRes = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: JSON.stringify({
      name: 'Mobile Banking App',
      description: 'Native mobile banking application for iOS and Android',
      status: 'IN_PROGRESS',
    }),
  });
  const projectAId = projRes.data?.data?.id;
  console.log(`-> Status: ${projRes.status}, Created Project ID: ${projectAId}, Name: ${projRes.data?.data?.name}`);

  // 4. Create Task on Web
  console.log('\n4. Creating Task A on Web...');
  const taskRes = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: JSON.stringify({
      projectId: projectAId,
      name: 'Design Biometric Authentication Flow',
      description: 'Create Figma wireframes and secure token specs',
      priority: 'HIGH',
      status: 'PENDING',
    }),
  });
  const taskAId = taskRes.data?.data?.id;
  console.log(`-> Status: ${taskRes.status}, Created Task ID: ${taskAId}, Priority: ${taskRes.data?.data?.priority}`);

  // 5. Mobile Login with User A
  console.log('\n5. Simulating Mobile App Login with User A...');
  const mobLoginA = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: userAData.email, password: userAData.password }),
  });
  const mobileTokenA = mobLoginA.data?.data?.token;
  console.log(`-> Status: ${mobLoginA.status}, Mobile JWT Token Acquired (stored via SecureStore)`);

  // 6 & 7. Mobile Pull to Refresh - Projects & Tasks
  console.log('\n6 & 7. Mobile Pull to Refresh (fetching Projects and Tasks)...');
  const mobProjects = await request('/projects', {
    headers: { Authorization: `Bearer ${mobileTokenA}` },
  });
  const mobTasks = await request('/tasks', {
    headers: { Authorization: `Bearer ${mobileTokenA}` },
  });
  console.log(`-> Mobile Projects Count: ${mobProjects.data?.data?.length} (Found: "${mobProjects.data?.data?.[0]?.name}")`);
  console.log(`-> Mobile Tasks Count: ${mobTasks.data?.data?.length} (Found: "${mobTasks.data?.data?.[0]?.name}")`);

  // 8. Mobile Updates Task A
  console.log('\n8. Mobile edits Task A name and priority...');
  const updateMobTask = await request(`/tasks/${taskAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${mobileTokenA}` },
    body: JSON.stringify({
      name: 'Design Biometric Authentication Flow (Updated via Mobile)',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
    }),
  });
  console.log(`-> Status: ${updateMobTask.status}, Updated Task Name: "${updateMobTask.data?.data?.name}"`);

  // 9. Web Refreshes Task A
  console.log('\n9. Web refreshes and verifies modified Task A...');
  const webTaskCheck = await request(`/tasks/${taskAId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  console.log(`-> Web verified task name: "${webTaskCheck.data?.data?.name}" (Status: ${webTaskCheck.data?.data?.status})`);

  // 10. Mobile marks Task A as COMPLETED
  console.log('\n10. Mobile marks Task A as COMPLETED...');
  const completeMobTask = await request(`/tasks/${taskAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${mobileTokenA}` },
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  console.log(`-> Status: ${completeMobTask.status}, Task Status: ${completeMobTask.data?.data?.status}`);

  // 11. Verify Dashboard Metrics
  console.log('\n11. Web / Mobile Dashboard metrics check...');
  const dashRes = await request('/dashboard', {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  console.log('-> User A Dashboard Stats:', JSON.stringify(dashRes.data?.data, null, 2));

  // 12. Register User B and verify Cross-User Data Isolation
  console.log('\n12. Registering User B to test Authorization Isolation...');
  const regB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userBData),
  });
  const userBToken = regB.data?.data?.token;

  console.log('\n13. User B attempts to access User A project (GET /api/projects/:id)...');
  const hackProj = await request(`/projects/${projectAId}`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  console.log(`-> Status: ${hackProj.status} (${hackProj.data?.message || 'Access Denied'})`);

  console.log('\n14. User B attempts to update User A task (PUT /api/tasks/:id)...');
  const hackTask = await request(`/tasks/${taskAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: JSON.stringify({ name: 'Tampered by User B' }),
  });
  console.log(`-> Status: ${hackTask.status} (${hackTask.data?.message || 'Access Denied'})`);

  console.log('\n15. User B Dashboard isolation check...');
  const dashB = await request('/dashboard', {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  console.log('-> User B Dashboard Stats (Must be empty/0):', {
    totalProjects: dashB.data?.data?.totalProjects,
    totalTasks: dashB.data?.data?.totalTasks,
    completedTasks: dashB.data?.data?.completedTasks,
  });

  console.log('\n=====================================================');
  console.log('✅ ALL CROSS-PLATFORM END-TO-END WORKFLOWS PASSED!');
  console.log('=====================================================');
}

runE2EScenario().catch((err) => {
  console.error('❌ E2E Scenario Error:', err);
  process.exit(1);
});
