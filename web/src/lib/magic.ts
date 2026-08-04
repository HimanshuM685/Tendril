import type { AlgorandExtension } from "@magic-ext/algorand";
import type { OAuthExtension } from "@magic-ext/oauth2";
import type { Magic } from "magic-sdk";
import { MAGIC_API_KEY } from "./magicConfig";

export { consumeAutoSignIn, isMagicEnabled, markAutoSignIn, MAGIC_ICON, OAUTH_REDIRECT } from "./magicConfig";

type MagicClient = InstanceType<typeof Magic> & {
  algorand: AlgorandExtension;
  oauth2: OAuthExtension;
};

let magicInstance: MagicClient | null = null;
let magicPromise: Promise<MagicClient> | null = null;

/** One Magic instance for the whole app — recreated only on full reload. */
export function getMagic(): Promise<MagicClient> {
  if (!MAGIC_API_KEY) throw new Error("Magic is not configured");
  if (magicInstance) return Promise.resolve(magicInstance);
  if (!magicPromise) {
    magicPromise = (async () => {
      const [{ Magic: MagicCtor }, { AlgorandExtension: AlgorandExt }, { OAuthExtension: OAuthExt }] =
        await Promise.all([
          import("magic-sdk"),
          import("@magic-ext/algorand"),
          import("@magic-ext/oauth2"),
        ]);
      magicInstance = new MagicCtor(MAGIC_API_KEY, {
        extensions: {
          algorand: new AlgorandExt({ rpcUrl: "" }),
          oauth2: new OAuthExt(),
        },
      }) as MagicClient;
      return magicInstance;
    })();
  }
  return magicPromise;
}
