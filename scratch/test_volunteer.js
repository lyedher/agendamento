const URL = 'https://gqdrlkwyxkqklmsjyhfq.supabase.co';
const KEY = 'sb_publishable_LSgNyMz2kFxGXpPUcPqVCw_rFNoG55K';

const headers = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

function mapDbToSchedule(dbRow) {
  if (!dbRow) return dbRow;
  return {
    id: dbRow.id,
    scheduleName: dbRow.schedule_name,
    startTime: dbRow.start_time,
    endTime: dbRow.end_time,
    capacity: dbRow.capacity ?? 1,
    unitId: dbRow.unit_id,
    userIds: dbRow.user_ids || []
  };
}

async function testVolunteer() {
  console.log("Simulating volunteerToSchedule...");
  const scheduleId = 'bws5p'; // Check one of the migrated schedules
  const userId = '8uqxsl';     // A valid migrated user ID

  try {
    // 1. Fetch schedules from Supabase
    console.log("Fetching schedules from Supabase...");
    const res = await fetch(`${URL}/rest/v1/schedules`, { headers });
    console.log("Fetch status:", res.status);
    if (!res.ok) {
      console.error("Failed to fetch schedules:", await res.text());
      return;
    }
    const data = await res.json();
    const schedules = data.map(mapDbToSchedule);
    console.log(`Fetched ${schedules.length} schedules.`);

    // 2. Find the schedule
    const s = schedules.find(x => x.id === scheduleId);
    if (!s) {
      console.error(`ERROR: Schedule "${scheduleId}" not found in the fetched list!`);
      console.log("Sample schedules in Supabase:", JSON.stringify(schedules.slice(0, 3), null, 2));
      return;
    }

    console.log("Found schedule:", JSON.stringify(s, null, 2));
  } catch (e) {
    console.error("Exception during simulation:", e);
  }
}

testVolunteer();
