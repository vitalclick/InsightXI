// Ambient typings for the externally-loaded auth/payment SDKs (Google Identity
// Services, Sign in with Apple JS, PayPal JS SDK). Loaded via <script> only
// when the corresponding public client id is configured.

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
  }): void;
  prompt(): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

interface AppleSignInResponse {
  authorization: { id_token: string; code: string };
  user?: { name?: { firstName?: string; lastName?: string }; email?: string };
}

interface AppleIDAuth {
  init(config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    usePopup: boolean;
    state?: string;
  }): void;
  signIn(): Promise<AppleSignInResponse>;
}

interface PayPalButtonsConfig {
  style?: Record<string, unknown>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

interface PayPalButtonsInstance {
  render(container: string | HTMLElement): Promise<void>;
}

interface Window {
  google?: { accounts: { id: GoogleAccountsId } };
  AppleID?: { auth: AppleIDAuth };
  paypal?: { Buttons(config: PayPalButtonsConfig): PayPalButtonsInstance };
}
