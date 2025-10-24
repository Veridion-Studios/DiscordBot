import Airtable from 'airtable';
import 'dotenv/config';

// Airtable configuration via environment variables
// Required: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
  console.warn('Airtable not fully configured. Set AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME in your environment.');
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Use field IDs to avoid breaking when field names change
const FIELDS = {
  USER: 'fldaFhtDh5f0wgNMF',            // User
  USER_ID: 'fldyIHHFAZTayP9UB',        // User ID (discord id)
  AVATAR: 'fldSIlsSIT4TjCRFZ',         // Avatar
  CLOCKED_IN: 'fldsi50nWNKmnzO8G',     // Clocked In (checkbox)
  CLOCK_IN: 'fldfhLcwHSbro1HMq',       // Clock In (string / timestamp)
  CLOCK_OUT: 'fldCZY0aZjAcuHC8j',      // Clock Out (string / timestamp)
};

// Helper: converts an Airtable record to the local member shape
function recordToMember(record) {
  const fields = record.fields || {};
  const parseTimestamp = (v) => {
    if (v == null || v === '') return null;
    // If stored as string timestamp, try to parse as int; otherwise return as-is
    const n = Number(v);
    return Number.isFinite(n) ? Math.floor(n) : v;
  };

  return {
    discordId: fields[FIELDS.USER_ID] ?? null,
    name: fields[FIELDS.USER] ?? null,
    avatarURL: fields[FIELDS.AVATAR] ?? null,
    clockedIn: !!fields[FIELDS.CLOCKED_IN],
    clockIn: parseTimestamp(fields[FIELDS.CLOCK_IN]),
    clockOut: parseTimestamp(fields[FIELDS.CLOCK_OUT]),
    _recordId: record.id,
  };
}

async function getMemberById(discordId) {
  if (!AIRTABLE_API_KEY) return null;
  const table = base(AIRTABLE_TABLE_NAME);
  // Filter using the field id
  const filter = `{${FIELDS.USER_ID}} = "${discordId}"`;
  const records = await table.select({ filterByFormula: filter, maxRecords: 1 }).firstPage();
  if (!records || records.length === 0) return null;
  return recordToMember(records[0]);
}

async function upsertMember(discordId, data) {
  // data: { name, avatarURL, clockedIn, clockIn, clockOut }
  if (!AIRTABLE_API_KEY) throw new Error('Airtable API key not set');
  const table = base(AIRTABLE_TABLE_NAME);

  const existing = await getMemberById(discordId);

  const fields = {
    [FIELDS.USER_ID]: discordId,
    [FIELDS.USER]: data.name ?? null,
    [FIELDS.AVATAR]: data.avatarURL ?? null,
    [FIELDS.CLOCKED_IN]: !!data.clockedIn,
    [FIELDS.CLOCK_IN]: data.clockIn ?? null,
    [FIELDS.CLOCK_OUT]: data.clockOut ?? null,
  };

  if (existing && existing._recordId) {
    const updated = await table.update(existing._recordId, fields);
    return recordToMember(updated);
  }

  const created = await table.create(fields);
  return recordToMember(created);
}

async function listMembers() {
  if (!AIRTABLE_API_KEY) return [];
  const table = base(AIRTABLE_TABLE_NAME);
  const all = [];

  await table.select({}).eachPage((records, fetchNextPage) => {
    for (const r of records) all.push(recordToMember(r));
    fetchNextPage();
  });

  return all;
}

export { getMemberById, upsertMember, listMembers };
