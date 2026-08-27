import {
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import wallet from "../../devnet-wallet.json";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstructionAsync,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { token_decimals } from "./spl_mint";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

//paste your mint address got from spl_init.ts
const mint = address("6uiN3LVqC8tjHiKS3FvwCqTCFW3q4dFeZWCKyNarZJAT");

//paste the address of the recipient
const to = address("5vxQg3YE9fxRdbfBC3PhxATZApiLJpFP8G4GjGdb2n6J");

(async () => {
  try {
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    const [fromAta] = await findAssociatedTokenPda({
      mint,
      owner: signer.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    console.log("\x1b[32m%s\x1b[0m", `\nYour fromAta is : ${fromAta}\n`);

    const [toAta] = await findAssociatedTokenPda({
      mint,
      owner: to,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    console.log("\x1b[32m%s\x1b[0m", `\nYour toAta is : ${toAta}\n`);

    const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
      payer: signer,
      mint,
      owner: to,
      ata: toAta,
    });

    const transferTx = getTransferCheckedInstruction({
      amount: token_decimals * 200n,
      mint,
      decimals: 6,
      authority: signer,
      source: fromAta,
      destination: toAta,
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const msg = createTransactionMessage({ version: 0 });

    const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

    const msgWithLiftime = setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      msgWithPayer,
    );

    const txMessage = appendTransactionMessageInstructions(
      [createAtaIx, transferTx],
      msgWithLiftime,
    );

    const signedTx = await signTransactionMessageWithSigners(txMessage);

    assertIsTransactionWithBlockhashLifetime(signedTx);

    const signature = getSignatureFromTransaction(signedTx);

    await sendAndConfirm(signedTx, { commitment: "confirmed" });

    console.log("\x1b[36m%s\x1b[0m", `\ntransfer txid: ${signature}\n`);
  } catch (error) {
    console.log(error);
  }
})();
