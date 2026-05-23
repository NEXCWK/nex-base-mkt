// Google Calendar API integration
// Required env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID
import { google, Auth } from "googleapis";

function getCalendarAuth(): Auth.JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Missing Google credentials. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local"
    );
  }
  const jwt = new google.auth.JWT();
  jwt.email = email;
  jwt.key = key;
  jwt.scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
  return jwt;
}

export async function getUpcomingEvents(maxResults = 10) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const calendar = google.calendar({ version: "v3", auth: getCalendarAuth() });

  const res = await calendar.events.list({
    calendarId,
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items || [];
}
