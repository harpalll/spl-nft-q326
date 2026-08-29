import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {
  createSignerFromKeypair,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import {
  create,
  mplCore,
  transfer,
  update,
} from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
const asset = publicKey("23irPPvaMduCPQFTNmnWeJ3bWwLfbSF8M5BcgCYUbC5i");
const metadataUri =
  "https://gateway.irys.xyz/uNhxiydV1kJxf1z7SZEenEP5RaAuJ6DXxurCN8oWouc";

umi.use(signerIdentity(signer));

umi.use(mplCore());

(async () => {
  try {
    // Transfer an existing NFT asset to a new owner
    const result = await update(umi, {
      asset: {
        owner: signer.publicKey,
        publicKey: asset,
      },
      name: "100xControversy",
      uri: metadataUri,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(result.signature)[0];
    console.log("Asset updated:", signature);
  } catch (e) {
    console.log(`errior ${e}`);
  }
})();
