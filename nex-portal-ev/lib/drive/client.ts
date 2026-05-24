import { google } from 'googleapis'

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({ version: 'v3', auth })
}

export async function createFolder(name: string, parentId: string): Promise<string> {
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })
  return res.data.id!
}

export async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDriveClient()

  const existing = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
  })

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!
  }

  return createFolder(name, parentId)
}

export async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient()
  const { Readable } = await import('stream')
  const stream = Readable.from(buffer)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id,webViewLink',
  })

  return {
    id: res.data.id!,
    webViewLink: res.data.webViewLink!,
  }
}

export async function setupClientFolders(clienteNome: string): Promise<{
  rootId: string
  documentosEnviadosId: string
  documentosNexId: string
}> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!

  const clientesFolder = await getOrCreateFolder('Clientes', rootFolderId)
  const clienteFolder = await getOrCreateFolder(clienteNome, clientesFolder)
  const documentosEnviadosId = await getOrCreateFolder('Documentos Enviados', clienteFolder)
  const documentosNexId = await getOrCreateFolder('Documentos Nex', clienteFolder)

  return {
    rootId: clienteFolder,
    documentosEnviadosId,
    documentosNexId,
  }
}

export async function getOrCreateImagemFolder(categoria: string): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!
  const imagensFolder = await getOrCreateFolder('Imagens', rootFolderId)
  return getOrCreateFolder(categoria, imagensFolder)
}
