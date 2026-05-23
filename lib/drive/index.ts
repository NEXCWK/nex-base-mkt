// Google Drive API integration
// Required env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_ROOT_FOLDER_ID
import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Missing Google service account credentials. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local"
    );
  }
  const jwt = new google.auth.JWT();
  jwt.email = email;
  jwt.key = key;
  jwt.scopes = ["https://www.googleapis.com/auth/drive"];
  return jwt;
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

// Folder structure: root > Base da Área > Sistema > [section]
const FOLDER_STRUCTURE: Record<string, string> = {};

async function findOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: "files(id, name)",
  });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return created.data.id!;
}

export async function ensureFolderPath(section: string): Promise<string> {
  const cacheKey = section;
  if (FOLDER_STRUCTURE[cacheKey]) return FOLDER_STRUCTURE[cacheKey];

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID in .env.local");
  }

  const drive = getDriveClient();
  const baseId = await findOrCreateFolder(drive, "Base da Área", rootId);
  const sistemaId = await findOrCreateFolder(drive, "Sistema", baseId);
  const sectionId = await findOrCreateFolder(drive, section, sistemaId);

  FOLDER_STRUCTURE[cacheKey] = sectionId;
  return sectionId;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  section: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  const drive = getDriveClient();
  const folderId = await ensureFolderPath(section);

  const stream = Readable.from(fileBuffer);
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: { mimeType, body: stream },
    fields: "id,webViewLink,webContentLink",
  });

  // Make file accessible
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    id: res.data.id!,
    webViewLink: res.data.webViewLink!,
    webContentLink: res.data.webContentLink!,
  };
}

export async function listDriveFiles(section: string) {
  const drive = getDriveClient();
  const folderId = await ensureFolderPath(section);
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,webViewLink,webContentLink,createdTime,size)",
    orderBy: "createdTime desc",
  });
  return res.data.files || [];
}

export async function deleteFromDrive(fileId: string) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}
