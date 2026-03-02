import { Storage, KEYS } from './storage';

const DRIVE_FILE_NAME = 'couple_os_data.json';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export const GoogleDriveService = {
  getTokens: (): GoogleTokens | null => {
    const tokens = localStorage.getItem('google_drive_tokens');
    return tokens ? JSON.parse(tokens) : null;
  },

  setTokens: (tokens: GoogleTokens) => {
    localStorage.setItem('google_drive_tokens', JSON.stringify(tokens));
  },

  clearTokens: () => {
    localStorage.removeItem('google_drive_tokens');
  },

  isAuthenticated: () => {
    const tokens = GoogleDriveService.getTokens();
    if (!tokens) return false;
    // Simple expiry check if available
    if (tokens.expiry_date && Date.now() > tokens.expiry_date) return false;
    return true;
  },

  // Find the file ID for our data file
  findFile: async (accessToken: string): Promise<string | null> => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  },

  // Create the file if it doesn't exist
  createFile: async (accessToken: string, content: any): Promise<string> => {
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      }
    );
    const data = await response.json();
    return data.id;
  },

  // Update the file content
  updateFile: async (accessToken: string, fileId: string, content: any) => {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      }
    );
    return response.json();
  },

  // Download the file content
  downloadFile: async (accessToken: string, fileId: string) => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    return response.json();
  },

  // Main Sync Function
  sync: async () => {
    const tokens = GoogleDriveService.getTokens();
    if (!tokens) return;

    try {
      const fileId = await GoogleDriveService.findFile(tokens.access_token);
      
      const localData = {
        activities: Storage.get(KEYS.activities),
        movies: Storage.get(KEYS.movies),
        food: Storage.get(KEYS.food),
        registry: Storage.get(KEYS.registry),
        loveNotes: Storage.get(KEYS.loveNotes),
        logs: Storage.get(KEYS.logs),
        timestamp: Storage.getLastModified()
      };

      if (!fileId) {
        console.log('Creating new sync file on Google Drive');
        await GoogleDriveService.createFile(tokens.access_token, localData);
      } else {
        const remoteData = await GoogleDriveService.downloadFile(tokens.access_token, fileId);
        console.log('Downloaded remote data', remoteData);

        // Simple merge: if remote is newer, update local. 
        // In a real app, we'd do a deep merge like SyncService.merge
        if (remoteData.timestamp > (localData.timestamp || 0)) {
           // We should use the merge logic from SyncService but it's not exported nicely
           // For now, let's just update local storage if remote is newer
           // A better way is to trigger the merge logic
           return remoteData;
        } else {
          // Local is newer or same, push to remote
          await GoogleDriveService.updateFile(tokens.access_token, fileId, localData);
        }
      }
    } catch (error) {
      console.error('Google Drive Sync Error:', error);
      // If unauthorized, clear tokens
      if ((error as any).status === 401) {
        GoogleDriveService.clearTokens();
      }
    }
  }
};
