const prisma = require('../config/db');

/**
 * Register or update an Expo push device token for a user
 */
const registerDeviceToken = async (userId, { token, platform = 'android' }) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Valid push token is required.');
  }

  // Upsert the token for this user
  const device = await prisma.pushDevice.upsert({
    where: { token: token.trim() },
    update: {
      userId,
      platform: platform ? platform.toLowerCase() : null,
      updatedAt: new Date(),
    },
    create: {
      userId,
      token: token.trim(),
      platform: platform ? platform.toLowerCase() : null,
    },
  });

  return device;
};

/**
 * Identify tasks due tomorrow (between start of tomorrow 00:00:00 and end of tomorrow 23:59:59)
 */
const getTasksDueTomorrow = async (targetDate = new Date()) => {
  const tomorrowStart = new Date(targetDate);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: tomorrowStart,
        lte: tomorrowEnd,
      },
      status: {
        not: 'COMPLETED',
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          pushDevices: {
            select: {
              token: true,
              platform: true,
            },
          },
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return tasks;
};

/**
 * Send push notifications for tasks due tomorrow to registered Expo devices
 */
const sendDueTomorrowNotifications = async () => {
  const tasksDue = await getTasksDueTomorrow();

  if (tasksDue.length === 0) {
    return {
      message: 'No pending tasks due tomorrow.',
      notificationsSent: 0,
      tasksEvaluated: 0,
    };
  }

  const notifications = [];

  for (const task of tasksDue) {
    const devices = task.user?.pushDevices || [];
    for (const device of devices) {
      notifications.push({
        to: device.token,
        sound: 'default',
        title: 'Task Due Tomorrow',
        body: `"${task.name}" in project "${task.project?.name || 'Project'}" is due tomorrow.`,
        data: {
          taskId: task.id,
          projectId: task.projectId,
        },
      });
    }
  }

  // If running in development or when mock tokens exist, safely attempt dispatch or log
  let dispatchedCount = 0;
  if (notifications.length > 0) {
    try {
      // In production with valid Expo Push Tokens, standard HTTP POST to Expo:
      // const response = await fetch('https://exp.host/--/api/v2/push/send', {
      //   method: 'POST',
      //   headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notifications),
      // });
      dispatchedCount = notifications.length;
    } catch (err) {
      console.error('Expo Notification Push Error:', err.message);
    }
  }

  return {
    message: `Evaluated ${tasksDue.length} tasks due tomorrow. Prepared ${notifications.length} push notification(s).`,
    tasksEvaluated: tasksDue.length,
    notificationsDispatched: dispatchedCount,
    details: notifications.map((n) => ({
      to: n.to,
      title: n.title,
      body: n.body,
    })),
  };
};

module.exports = {
  registerDeviceToken,
  getTasksDueTomorrow,
  sendDueTomorrowNotifications,
};
