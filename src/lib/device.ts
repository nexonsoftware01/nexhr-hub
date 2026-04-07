const DEVICE_ID_KEY = 'nexhr_device_id';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;

  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = 'Unknown OS';
  if (ua.includes('iPhone') || ua.includes('iPad')) os = ua.includes('iPad') ? 'iPad' : 'iPhone';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

// ===== WebAuthn / Passkey helpers =====

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isPasskeySupported(): boolean {
  return !!(window.PublicKeyCredential && navigator.credentials?.create && navigator.credentials?.get);
}

export interface PasskeyRegistrationOptions {
  challenge: string;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  timeout: number;
}

export interface PasskeyRegistrationResult {
  credentialId: string;
  publicKey: string;
  clientDataJSON: string;
}

export async function createPasskeyCredential(options: PasskeyRegistrationOptions): Promise<PasskeyRegistrationResult> {
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToBuffer(options.challenge),
    rp: {
      id: options.rpId,
      name: options.rpName,
    },
    user: {
      id: base64UrlToBuffer(options.userId),
      name: options.userName,
      displayName: options.userDisplayName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },  // ES256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      residentKey: 'preferred',
    },
    timeout: options.timeout,
    attestation: 'none',
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyOptions,
  }) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAttestationResponse;

  // getPublicKey() returns SPKI-encoded public key bytes
  const publicKeyBytes = response.getPublicKey();
  if (!publicKeyBytes) {
    throw new Error('Browser did not return public key. Please update your browser.');
  }

  return {
    credentialId: bufferToBase64Url(credential.rawId),
    publicKey: bufferToBase64Url(publicKeyBytes),
    clientDataJSON: bufferToBase64Url(response.clientDataJSON),
  };
}

export interface PasskeyChallengeOptions {
  challenge: string;
  credentialId: string;
  rpId: string;
  timeout: number;
}

export interface PasskeyAssertionResult {
  credentialId: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
}

export async function getPasskeyAssertion(options: PasskeyChallengeOptions): Promise<PasskeyAssertionResult> {
  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge: base64UrlToBuffer(options.challenge),
    rpId: options.rpId,
    allowCredentials: [
      {
        type: 'public-key',
        id: base64UrlToBuffer(options.credentialId),
      },
    ],
    userVerification: 'discouraged',
    timeout: options.timeout,
  };

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyOptions,
  }) as PublicKeyCredential;

  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    credentialId: bufferToBase64Url(assertion.rawId),
    authenticatorData: bufferToBase64Url(response.authenticatorData),
    clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    signature: bufferToBase64Url(response.signature),
  };
}
