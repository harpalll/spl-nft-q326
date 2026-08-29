import { fetchAsset } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

export const getAccountUmi = async (asset: string) => {
  try {
    const assetAccount = await fetchAsset(umi, asset);

    console.log(assetAccount);
  } catch (err) {
    console.log("Asset does not exist:", err);
  }
};
