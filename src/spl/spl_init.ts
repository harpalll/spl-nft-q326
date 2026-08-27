import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithBlockhashLifetime,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";

//import your wallet
import wallet from "../../devnet-wallet.json";
import { readFileSync } from "node:fs";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

(async () => {
  try {
    const bytes = wallet;
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(bytes));

    const mint = await generateKeyPairSigner();
    const space = BigInt(getMintSize()); // 82 bytes

    //get the minimum balance for rent exemption
    const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

    // create empty account and assign ownership to token program
    const createMintAccountIx = getCreateAccountInstruction({
      payer: signer,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    });

    const initializeMintIx = getInitializeMintInstruction({
      mint: mint.address,
      decimals: 6,
      mintAuthority: signer.address,
      freezeAuthority: signer.address,
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const msg = createTransactionMessage({ version: 0 });

    const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

    const msgWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      msgWithPayer,
    );

    const txMessage = appendTransactionMessageInstructions(
      [createMintAccountIx, initializeMintIx],
      msgWithLifetime,
    );

    assertIsTransactionMessageWithBlockhashLifetime(txMessage);

    const signedTransaction =
      await signTransactionMessageWithSigners(txMessage);

    assertIsTransactionWithBlockhashLifetime(signedTransaction);

    const signature = getSignatureFromTransaction(signedTransaction);

    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    await sendAndConfirmTransaction(signedTransaction, {
      commitment: "confirmed",
    });

    console.log("\x1b[31m%s\x1b[0m", `\nMint Address: ${mint.address}\n`);
    console.log("\x1b[32m%s\x1b[0m", `\nTx signature: ${signature}\n`);
    console.log(
      "\x1b[36m%s\x1b[0m",
      `\nExplorer: https://explorer.solana.com/address/${mint.address}?cluster=devnet\n`,
    );
  } catch (error) {
    console.log(error);
  }
})();
