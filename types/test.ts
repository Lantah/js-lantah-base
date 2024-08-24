import * as LantahSDK from 'lantag-base';

const masterKey = LantahSDK.Keypair.master(LantahSDK.Networks.TESTNET); // $ExpectType Keypair
const sourceKey = LantahSDK.Keypair.random(); // $ExpectType Keypair
const destKey = LantahSDK.Keypair.random();
const usd = new LantahSDK.Asset('USD', 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'); // $ExpectType Asset
const account = new LantahSDK.Account(sourceKey.publicKey(), '1'); // $ExpectType Account
const muxedAccount = new LantahSDK.MuxedAccount(account, '123'); // $ExpectType MuxedAccount
const muxedConforms = muxedAccount as LantahSDK.Account; // $ExpectType Account

const transaction = new LantahSDK.TransactionBuilder(account, {
  fee: "100",
  networkPassphrase: LantahSDK.Networks.TESTNET
})
  .addOperation(
    LantahSDK.Operation.beginSponsoringFutureReserves({
      sponsoredId: account.accountId(),
      source: masterKey.publicKey(),
    })
  ).addOperation(
    LantahSDK.Operation.accountMerge({ destination: destKey.publicKey() }),
  ).addOperation(
    LantahSDK.Operation.payment({
      source: account.accountId(),
      destination: muxedAccount.accountId(),
      amount: "100",
      asset: usd,
    })
  ).addOperation(
    LantahSDK.Operation.createClaimableBalance({
      amount: "10",
      asset: LantahSDK.Asset.native(),
      claimants: [
        new LantahSDK.Claimant(account.accountId())
      ]
    }),
  ).addOperation(
    LantahSDK.Operation.claimClaimableBalance({
      balanceId: "00000000da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be",
    }),
  ).addOperation(
    LantahSDK.Operation.endSponsoringFutureReserves({
    })
  ).addOperation(
    LantahSDK.Operation.endSponsoringFutureReserves({})
  ).addOperation(
    LantahSDK.Operation.revokeAccountSponsorship({
      account: account.accountId(),
    })
  ).addOperation(
      LantahSDK.Operation.revokeTrustlineSponsorship({
        account: account.accountId(),
        asset: usd,
      })
  ).addOperation(
    LantahSDK.Operation.revokeOfferSponsorship({
      seller: account.accountId(),
      offerId: '12345'
    })
  ).addOperation(
    LantahSDK.Operation.revokeDataSponsorship({
      account: account.accountId(),
      name: 'foo'
    })
  ).addOperation(
    LantahSDK.Operation.revokeClaimableBalanceSponsorship({
      balanceId: "00000000da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be",
    })
  ).addOperation(
    LantahSDK.Operation.revokeLiquidityPoolSponsorship({
      liquidityPoolId: "dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7",
    })
  ).addOperation(
    LantahSDK.Operation.revokeSignerSponsorship({
      account: account.accountId(),
      signer: {
        ed25519PublicKey: sourceKey.publicKey()
      }
    })
  ).addOperation(
    LantahSDK.Operation.revokeSignerSponsorship({
      account: account.accountId(),
      signer: {
        sha256Hash: "da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be"
      }
    })
  ).addOperation(
    LantahSDK.Operation.revokeSignerSponsorship({
      account: account.accountId(),
      signer: {
        preAuthTx: "da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be"
      }
    })
  ).addOperation(
    LantahSDK.Operation.clawback({
      from: account.accountId(),
      amount: "1000",
      asset: usd,
    })
  ).addOperation(
    LantahSDK.Operation.clawbackClaimableBalance({
      balanceId: "00000000da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be",
    })
  ).addOperation(
    LantahSDK.Operation.setTrustLineFlags({
      trustor: account.accountId(),
      asset: usd,
      flags: {
        authorized: true,
        authorizedToMaintainLiabilities: true,
        clawbackEnabled: true,
      },
    })
  ).addOperation(
    LantahSDK.Operation.setTrustLineFlags({
      trustor: account.accountId(),
      asset: usd,
      flags: {
        authorized: true,
      },
    })
  ).addOperation(
    LantahSDK.Operation.liquidityPoolDeposit({
      liquidityPoolId: "dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7",
      maxAmountA: "10000",
      maxAmountB: "20000",
      minPrice: "0.45",
      maxPrice: "0.55",
    })
  ).addOperation(
    LantahSDK.Operation.liquidityPoolWithdraw({
      liquidityPoolId: "dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7",
      amount: "100",
      minAmountA: "10000",
      minAmountB: "20000",
    })
  ).addOperation(
    LantahSDK.Operation.setOptions({
      setFlags:   (LantahSDK.AuthImmutableFlag | LantahSDK.AuthRequiredFlag) as LantahSDK.AuthFlag,
      clearFlags: (LantahSDK.AuthRevocableFlag | LantahSDK.AuthClawbackEnabledFlag) as LantahSDK.AuthFlag,
    })
  ).addMemo(new LantahSDK.Memo(LantahSDK.MemoText, 'memo'))
  .setTimeout(5)
  .setTimebounds(Date.now(), Date.now() + 5000)
  .setLedgerbounds(5, 10)
  .setMinAccountSequence("5")
  .setMinAccountSequenceAge(5)
  .setMinAccountSequenceLedgerGap(5)
  .setExtraSigners([sourceKey.publicKey()])
  .build(); // $ExpectType () => Transaction<Memo<MemoType>, Operation[]>

const transactionFromXDR = new LantahSDK.Transaction(transaction.toEnvelope(), LantahSDK.Networks.TESTNET); // $ExpectType Transaction<Memo<MemoType>, Operation[]>

transactionFromXDR.networkPassphrase; // $ExpectType string
transactionFromXDR.networkPassphrase = "SDF";

LantahSDK.TransactionBuilder.fromXDR(transaction.toXDR(), LantahSDK.Networks.TESTNET); // $ExpectType FeeBumpTransaction | Transaction<Memo<MemoType>, Operation[]>
LantahSDK.TransactionBuilder.fromXDR(transaction.toEnvelope(), LantahSDK.Networks.TESTNET); // $ExpectType FeeBumpTransaction | Transaction<Memo<MemoType>, Operation[]>

const sig = LantahSDK.xdr.DecoratedSignature.fromXDR(Buffer.of(1, 2)); // $ExpectType DecoratedSignature
sig.hint(); // $ExpectType Buffer
sig.signature(); // $ExpectType Buffer

LantahSDK.Memo.none(); // $ExpectType Memo<"none">
LantahSDK.Memo.text('asdf'); // $ExpectType Memo<"text">
LantahSDK.Memo.id('asdf'); // $ExpectType Memo<"id">
LantahSDK.Memo.return('asdf'); // $ExpectType Memo<"return">
LantahSDK.Memo.hash('asdf'); // $ExpectType Memo<"hash">
LantahSDK.Memo.none().value; // $ExpectType null
LantahSDK.Memo.id('asdf').value; // $ExpectType string
LantahSDK.Memo.text('asdf').value; // $ExpectType string | Buffer
LantahSDK.Memo.return('asdf').value; // $ExpectType Buffer
LantahSDK.Memo.hash('asdf').value; // $ExpectType Buffer

const feeBumptransaction = LantahSDK.TransactionBuilder.buildFeeBumpTransaction(masterKey, "120", transaction, LantahSDK.Networks.TESTNET); // $ExpectType FeeBumpTransaction

feeBumptransaction.feeSource; // $ExpectType string
feeBumptransaction.innerTransaction; // $ExpectType Transaction<Memo<MemoType>, Operation[]>
feeBumptransaction.fee; // $ExpectType string
feeBumptransaction.toXDR(); // $ExpectType string
feeBumptransaction.toEnvelope(); // $ExpectType TransactionEnvelope
feeBumptransaction.hash(); // $ExpectType Buffer

LantahSDK.TransactionBuilder.fromXDR(feeBumptransaction.toXDR(), LantahSDK.Networks.TESTNET); // $ExpectType FeeBumpTransaction | Transaction<Memo<MemoType>, Operation[]>
LantahSDK.TransactionBuilder.fromXDR(feeBumptransaction.toEnvelope(), LantahSDK.Networks.TESTNET); // $ExpectType FeeBumpTransaction | Transaction<Memo<MemoType>, Operation[]>

// P.S. You shouldn't be using the Memo constructor
//
// Unfortunately, it appears that type aliases aren't unwrapped by the linter,
// causing the following lines to fail unnecessarily:
//
// new LantahSDK.Memo(LantahSDK.MemoHash, 'asdf').value; // $ExpectType MemoValue
// new LantahSDK.Memo(LantahSDK.MemoHash, 'asdf').type; // $ExpectType MemoType
//
// This is because the linter just does a raw string comparison on type names:
// https://github.com/Microsoft/dtslint/issues/57#issuecomment-451666294

const noSignerXDR = LantahSDK.Operation.setOptions({ lowThreshold: 1 });
LantahSDK.Operation.fromXDRObject(noSignerXDR).signer; // $ExpectType never

const newSignerXDR1 = LantahSDK.Operation.setOptions({
  signer: { ed25519PublicKey: sourceKey.publicKey(), weight: '1' }
});
LantahSDK.Operation.fromXDRObject(newSignerXDR1).signer; // $ExpectType Ed25519PublicKey

const newSignerXDR2 = LantahSDK.Operation.setOptions({
  signer: { sha256Hash: Buffer.from(''), weight: '1' }
});
LantahSDK.Operation.fromXDRObject(newSignerXDR2).signer; // $ExpectType Sha256Hash

const newSignerXDR3 = LantahSDK.Operation.setOptions({
  signer: { preAuthTx: '', weight: 1 }
});
LantahSDK.Operation.fromXDRObject(newSignerXDR3).signer; // $ExpectType PreAuthTx

LantahSDK.TimeoutInfinite; // $ExpectType 0

const envelope = feeBumptransaction.toEnvelope(); // $ExpectType TransactionEnvelope
envelope.v0(); // $ExpectType TransactionV0Envelope
envelope.v1(); // $ExpectType TransactionV1Envelope
envelope.feeBump(); // $ExpectType FeeBumpTransactionEnvelope

const meta = LantahSDK.xdr.TransactionMeta.fromXDR(
  // tslint:disable:max-line-length
  'AAAAAQAAAAIAAAADAcEsRAAAAAAAAAAArZu2SrdQ9krkyj7RBqTx1txDNZBfcS+wGjuEUizV9hkAAAAAAKXgdAGig34AADuDAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAABAcEsRAAAAAAAAAAArZu2SrdQ9krkyj7RBqTx1txDNZBfcS+wGjuEUizV9hkAAAAAAKXgdAGig34AADuEAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAABAAAAAA==',
  'base64'
);
meta; // $ExpectType TransactionMeta
meta.v1().txChanges(); // $ExpectType LedgerEntryChange[]
const op = LantahSDK.xdr.AllowTrustOp.fromXDR(
  'AAAAAMNQvnFVCnBnEVzd8ZaKUvsI/mECPGV8cnBszuftCmWYAAAAAUNPUAAAAAAC',
  'base64'
);
op; // $ExpectType AllowTrustOp
op.authorize(); // $ExpectType number
op.trustor().ed25519(); // $ExpectType Buffer
op.trustor(); // $ExpectedType AccountId
const e = LantahSDK.xdr.LedgerEntry.fromXDR(
  "AAAAAAAAAAC2LgFRDBZ3J52nLm30kq2iMgrO7dYzYAN3hvjtf1IHWg==",
  'base64'
);
e; // $ExpectType LedgerEntry
const a = LantahSDK.xdr.AccountEntry.fromXDR(
  // tslint:disable:max-line-length
  'AAAAALYuAVEMFncnnacubfSSraIyCs7t1jNgA3eG+O1/UgdaAAAAAAAAA+gAAAAAGc1zDAAAAAIAAAABAAAAAEB9GCtIe8SCLk7LV3MzmlKN3U4M2JdktE7ofCKtTNaaAAAABAAAAAtzdGVsbGFyLm9yZwABAQEBAAAAAQAAAACEKm+WHjUQThNzoKx6WbU8no3NxzUrGtoSLmtxaBAM2AAAAAEAAAABAAAAAAAAAAoAAAAAAAAAFAAAAAA=',
  'base64'
);
a; // $ExpectType AccountEntry
a.homeDomain(); // $ExpectType string | Buffer
const t = LantahSDK.xdr.TransactionV0.fromXDR(
    // tslint:disable:max-line-length
    '1bzMAeuKubyXUug/Xnyj1KYkv+cSUtCSvAczI2b459kAAABkAS/5cwAAABMAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAsBL/lzAAAAFAAAAAA=',
    'base64'
);
t; // $ExpectType TransactionV0
t.timeBounds(); // $ExpectType TimeBounds | null

LantahSDK.xdr.Uint64.fromString("12"); // $ExpectType UnsignedHyper
LantahSDK.xdr.Int32.toXDR(-1); // $ExpectType Buffer
LantahSDK.xdr.Uint32.toXDR(1); // $ExpectType Buffer
LantahSDK.xdr.String32.toXDR("hellow world"); // $ExpectedType Buffer
LantahSDK.xdr.Hash.toXDR(Buffer.alloc(32)); // $ExpectedType Buffer
LantahSDK.xdr.Signature.toXDR(Buffer.alloc(9, 'a')); // $ExpectedType Buffer

const change = LantahSDK.xdr.LedgerEntryChange.fromXDR(
  // tslint:disable:max-line-length
  'AAAAAwHBW0UAAAAAAAAAADwkQ23EX6ohsRsGoCynHl5R8D7RXcgVD4Y92uUigLooAAAAAIitVMABlM5gABTlLwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA',
  'base64'
);
change; // $ExpectType LedgerEntryChange
const raw = LantahSDK.xdr.LedgerEntryChanges.toXDR([change]); // $ExpectType Buffer
LantahSDK.xdr.LedgerEntryChanges.fromXDR(raw); // $ExpectType LedgerEntryChange[]

LantahSDK.xdr.Asset.assetTypeNative(); // $ExpectType Asset
LantahSDK.xdr.InnerTransactionResultResult.txInternalError(); // $ExpectType InnerTransactionResultResult
LantahSDK.xdr.TransactionV0Ext[0](); // $ExpectedType TransactionV0Ext

LantahSDK.Claimant.predicateUnconditional(); // $ExpectType ClaimPredicate
const claimant = new LantahSDK.Claimant(sourceKey.publicKey()); // $ExpectType Claimant
claimant.toXDRObject(); // $ExpectType Claimant
claimant.destination; // $ExpectType string
claimant.predicate; // $ExpectType ClaimPredicate

const claw = LantahSDK.xdr.ClawbackOp.fromXDR(
  // tslint:disable:max-line-length
  'AAAAAAAAABMAAAABVVNEAAAAAADNTrgPO19O0EsnYjSc333yWGLKEVxLyu1kfKjCKOz9ewAAAADFTYDKyTn2O0DVUEycHKfvsnFWj91TVl0ut1kwg5nLigAAAAJUC+QA',
  'base64'
);
claw; // $ExpectType ClawbackOp

const clawCb = LantahSDK.xdr.ClawbackClaimableBalanceOp.fromXDR(
  // tslint:disable:max-line-length
  'AAAAAAAAABUAAAAAxU2Aysk59jtA1VBMnByn77JxVo/dU1ZdLrdZMIOZy4oAAAABVVNEAAAAAADNTrgPO19O0EsnYjSc333yWGLKEVxLyu1kfKjCKOz9ewAAAAAAAAAH',
  'base64'
);
clawCb; // $ExpectType ClawbackClaimableBalanceOp

const trust = LantahSDK.xdr.SetTrustLineFlagsOp.fromXDR(
  // tslint:disable:max-line-length
  'AAAAAAAAABUAAAAAF1frB6QZRDTYW4dheEA3ZZLCjSWs9eQgzsyvqdUy2rgAAAABVVNEAAAAAADNTrgPO19O0EsnYjSc333yWGLKEVxLyu1kfKjCKOz9ewAAAAAAAAAB',
  'base64'
);
trust; // $ExpectType SetTrustLineFlagsOp

const lpDeposit = LantahSDK.xdr.LiquidityPoolDepositOp.fromXDR(
  // tslint:disable:max-line-length
  '3XsauDHCczEN2+xvl4cKqDwvvXjOIq3tN+y/TzOA+scAAAAABfXhAAAAAAAL68IAAAAACQAAABQAAAALAAAAFA==',
  'base64'
);
lpDeposit; // $ExpectType LiquidityPoolDepositOp

const lpWithdraw = LantahSDK.xdr.LiquidityPoolWithdrawOp.fromXDR(
  // tslint:disable:max-line-length
  '3XsauDHCczEN2+xvl4cKqDwvvXjOIq3tN+y/TzOA+scAAAAAAvrwgAAAAAAF9eEAAAAAAAvrwgA=',
  'base64'
);
lpWithdraw; // $ExpectType LiquidityPoolWithdrawOp

const pubkey = masterKey.rawPublicKey(); // $ExpectType Buffer
const seckey = masterKey.rawSecretKey(); // $ExpectType Buffer
const muxed = LantahSDK.encodeMuxedAccount(masterKey.publicKey(), '1'); // $ExpectType MuxedAccount
const muxkey = muxed.toXDR("raw"); // $ExpectType Buffer

let result = LantahSDK.StrKey.encodeEd25519PublicKey(pubkey);  // $ExpectType string
LantahSDK.StrKey.decodeEd25519PublicKey(result);               // $ExpectType Buffer
LantahSDK.StrKey.isValidEd25519PublicKey(result);              // $ExpectType boolean

result = LantahSDK.StrKey.encodeEd25519SecretSeed(seckey); // $ExpectType string
LantahSDK.StrKey.decodeEd25519SecretSeed(result);          // $ExpectType Buffer
LantahSDK.StrKey.isValidEd25519SecretSeed(result);         // $ExpectType boolean

result = LantahSDK.StrKey.encodeMed25519PublicKey(muxkey);   // $ExpectType string
LantahSDK.StrKey.decodeMed25519PublicKey(result);            // $ExpectType Buffer
LantahSDK.StrKey.isValidMed25519PublicKey(result);           // $ExpectType boolean

result = LantahSDK.StrKey.encodeSignedPayload(pubkey);   // $ExpectType string
LantahSDK.StrKey.decodeSignedPayload(result);            // $ExpectType Buffer
LantahSDK.StrKey.isValidSignedPayload(result);           // $ExpectType boolean

const muxedAddr = LantahSDK.encodeMuxedAccountToAddress(muxed, true);  // $ExpectType string
LantahSDK.decodeAddressToMuxedAccount(muxedAddr, true);                // $ExpectType MuxedAccount

const sk = LantahSDK.xdr.SignerKey.signerKeyTypeEd25519SignedPayload(
  new LantahSDK.xdr.SignerKeyEd25519SignedPayload({
    ed25519: sourceKey.rawPublicKey(),
    payload: Buffer.alloc(1)
  })
);
LantahSDK.SignerKey.encodeSignerKey(sk);                   // $ExpectType string
LantahSDK.SignerKey.decodeAddress(sourceKey.publicKey());  // $ExpectType SignerKey

new LantahSDK.ScInt(1234);           // $ExpectType ScInt
new LantahSDK.ScInt('1234');         // $ExpectType ScInt
new LantahSDK.ScInt(BigInt(1234));   // $ExpectType ScInt
(['i64', 'u64', 'i128', 'u128', 'i256', 'u256'] as LantahSDK.ScIntType[]).forEach((type) => {
  new LantahSDK.ScInt(1234, { type }); // $ExpectType ScInt
});
