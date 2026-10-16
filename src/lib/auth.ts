import config from '../../firebase-applet-config.json';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/youtube.readonly';

let tokenClient: any = null;
let cachedAccessToken: string | null = null;

export function initGoogleAuth(onSuccess: (token: string) => void, onError: (error: any) => void) {
  const clientId = config.oAuthClientId;
  
  if (!clientId) {
    console.error('oAuthClientId is not defined in firebase config');
    onError(new Error('Google Client ID is missing.'));
    return;
  }

  // @ts-ignore
  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    // @ts-ignore
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          cachedAccessToken = tokenResponse.access_token;
          onSuccess(tokenResponse.access_token);
        } else {
          onError(new Error('Failed to get access token'));
        }
      },
      error_callback: (error: any) => {
        onError(new Error(error.type || 'OAuth popup closed or failed'));
      }
    });
  } else {
    onError(new Error('Google Identity Services script not loaded.'));
  }
}

export function requestAccessToken() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    throw new Error('Token client not initialized');
  }
}

export function getAccessToken() {
  return cachedAccessToken;
}


