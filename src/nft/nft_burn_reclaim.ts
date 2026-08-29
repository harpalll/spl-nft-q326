import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {
  createSignerFromKeypair,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { burn, create, mplCore, transfer } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
const asset = publicKey("AVcYihnGgA7S6BPf5uQyq27rmhh4BgMNyNFuRRMsQegp");

umi.use(signerIdentity(signer));

umi.use(mplCore());

(async () => {
  try {
    // Transfer an existing NFT asset to a new owner
    const result = await burn(umi, {
      asset: {
        owner: signer.publicKey,
        publicKey: asset,
      },
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(result.signature)[0];
    console.log("Asset burned and rent reclaimed successfully:", signature);
  } catch (e) {
    console.log(`errior ${e}`);
  }
})();
