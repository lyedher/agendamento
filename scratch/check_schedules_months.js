const fs = require('fs');
const path = require('path');

const URL = 'https://gqdrlkwyxkqklmsjyhfq.supabase.co';
const KEY = 'sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K';

const headers = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json'
};

async function checkSchedules() {
  console.log("Checking schedule dates...");

  // 1. Check local schedules.json
  const localFile = path.join(__dirname, '..', 'lib', 'db', 'schedules.json');
  if (fs.existsSync(localFile)) {
    const schedules = JSON.parse(fs.readFileSync(localFile, 'utf8'));
    console.log(`Local schedules count: ${schedules.length}`);
    const localMonths = {};
    schedules.forEach(s => {
      if (s.startTime) {
        const month = s.startTime.substring(0, 7); // e.g. "2026-05"
        localMonths[month] = (localMonths[month] || 0) + 1;
      }
    });
    console.log("Local monthly counts:", localMonths);
  }

  // 2. Check remote Supabase schedules
  try {
    const res = await fetch(`${URL}/rest/v1/schedules`, { headers });
    if (res.ok) {
      const data = await res.json();
      console.log(`Remote schedules count: ${data.length}`);
      const remoteMonths = {};
      data.forEach(s => {
        if (s.start_time) {
          const month = s.start_time.substring(0, 7); // e.g. "2026-05"
          remoteMonths[month] = (remoteMonths[month] || 0) + 1;
        }
      });
      console.log("Remote monthly counts:", remoteMonths);
    }
  } catch (e) {
    console.error("Failed to check remote schedules:", e.message);
  }
}

checkSchedules();
