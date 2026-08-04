import { Magic } from "magic-sdk";
import { AlgorandExtension } from "@magic-ext/algorand";
import { OAuthExtension } from "@magic-ext/oauth2";

export const MAGIC_API_KEY = import.meta.env.VITE_MAGIC_API_KEY as string | undefined;
export const isMagicEnabled = Boolean(MAGIC_API_KEY);
export const OAUTH_REDIRECT = `${window.location.origin}/callback`;

/** Set before OAuth redirect; WalletBar reads this to auto sign-in after callback. */
export const AUTO_SIGN_IN_KEY = "tendril.autoSignIn";

export const MAGIC_ICON = `data:image/svg+xml;base64,${btoa(`
<svg viewBox="0 0 47 47" xmlns="http://www.w3.org/2000/svg">
  <path fill="#6851FF" d="M 23.960861 1.80769 C 25.835077 4.103153 27.902216 6.23489 30.137539 8.178169 C 28.647968 13.009323 27.846092 18.142094 27.846092 23.462154 C 27.846092 28.782307 28.648062 33.915169 30.13763 38.746368 C 27.902216 40.689724 25.835077 42.821476 23.960861 45.116985 C 22.086554 42.821476 20.019415 40.689632 17.783998 38.746368 C 19.273476 33.915169 20.075445 28.7824 20.075445 23.462337 C 20.075445 18.142277 19.273476 13.009506 17.783998 8.178318 C 20.019415 6.235001 22.086554 4.10321 23.960861 1.80769 Z M 13.511427 35.406403 C 11.145139 33.747814 8.633816 32.282063 6.000269 31.031937 C 6.730776 28.637476 7.123754 26.095783 7.123754 23.462429 C 7.123754 20.828892 6.730762 18.287201 6.000235 15.892738 C 8.633816 14.642616 11.145175 13.176861 13.511501 11.518276 C 14.416311 15.352554 14.895074 19.351414 14.895074 23.462154 C 14.895074 27.572985 14.416283 31.571938 13.511427 35.406403 Z M 33.027046 23.462337 C 33.027046 27.572985 33.505753 31.571846 34.410553 35.406124 C 36.776859 33.747631 39.288094 32.281876 41.921539 31.031845 C 41.191017 28.637384 40.798061 26.095692 40.798061 23.462246 C 40.798061 20.8288 41.191017 18.287201 41.921539 15.89283 C 39.288094 14.642708 36.776768 13.177048 34.410553 11.518555 C 33.505753 15.352831 33.027046 19.351692 33.027046 23.462337 Z" />
</svg>
`)}`;

type MagicClient = InstanceType<typeof Magic> & {
  algorand: AlgorandExtension;
  oauth2: OAuthExtension;
};

let magicInstance: MagicClient | null = null;

/** One Magic instance for the whole app — recreated only on full reload. */
export function getMagic(): MagicClient {
  if (!MAGIC_API_KEY) throw new Error("Magic is not configured");
  if (!magicInstance) {
    magicInstance = new Magic(MAGIC_API_KEY, {
      extensions: {
        algorand: new AlgorandExtension({ rpcUrl: "" }),
        oauth2: new OAuthExtension(),
      },
    }) as MagicClient;
  }
  return magicInstance;
}

export function markAutoSignIn() {
  try {
    sessionStorage.setItem(AUTO_SIGN_IN_KEY, "1");
  } catch {
    /* private mode — user can sign in manually */
  }
}

export function consumeAutoSignIn(): boolean {
  try {
    if (sessionStorage.getItem(AUTO_SIGN_IN_KEY) !== "1") return false;
    sessionStorage.removeItem(AUTO_SIGN_IN_KEY);
    return true;
  } catch {
    return false;
  }
}
