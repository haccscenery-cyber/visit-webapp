export default {
  async scheduled(_controller, env) {
    const response = await fetch(env.REMINDER_ENDPOINT, { method: 'POST', headers: { 'x-cron-secret': env.CRON_SECRET } });
    if (!response.ok) throw new Error(`Reminder endpoint returned ${response.status}`);
  }
};
