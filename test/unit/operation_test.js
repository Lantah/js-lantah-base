import BigNumber from 'bignumber.js';

const { encodeMuxedAccountToAddress, encodeMuxedAccount } = LantahBase;

describe('Operation', function () {
  describe('.createAccount()', function () {
    it('creates a createAccountOp', function () {
      var destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      var startingBalance = '1000.000000';
      let op = LantahBase.Operation.createAccount({
        destination,
        startingBalance
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('createAccount');
      expect(obj.destination).to.be.equal(destination);
      expect(operation.body().value().startingBalance().toString()).to.be.equal(
        '1000000000'
      );
      expect(obj.startingBalance).to.be.equal(startingBalance);
    });
    it('fails to create createAccount operation with an invalid destination address', function () {
      let opts = {
        destination: 'GCEZW',
        startingBalance: '20',
        source: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
      };
      expect(() => LantahBase.Operation.createAccount(opts)).to.throw(
        /destination is invalid/
      );
    });

    it('creates a createAccount operation with startingBalance equal to 0', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        startingBalance: '0',
        source: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
      };
      expect(() => LantahBase.Operation.createAccount(opts)).not.to.throw();
    });

    it('fails to create createAccount operation with an invalid startingBalance', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        startingBalance: 20,
        source: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
      };
      expect(() => LantahBase.Operation.createAccount(opts)).to.throw(
        /startingBalance argument must be of type String, represent a positive number and have at most 7 digits after the decimal/
      );
    });

    it('fails to create createAccount operation with an invalid source address', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        startingBalance: '20',
        source: 'GCEZ'
      };
      expect(() => LantahBase.Operation.createAccount(opts)).to.throw(
        /Source address is invalid/
      );
    });
  });

  describe('.payment()', function () {
    it('creates a paymentOp', function () {
      var destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      var amount = '1000.000000';
      var asset = new LantahBase.Asset(
        'USDUSD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      let op = LantahBase.Operation.payment({ destination, asset, amount });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('payment');
      expect(obj.destination).to.be.equal(destination);
    });

    // Destination:
    //  MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAAAAGZFQ
    //  Address: GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ
    //  ID:      1
    //
    // Source:
    //  MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAAAALIWQ
    //  Address: GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ
    //  ID:      2
    const destination =
      'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAAAAGZFQ';
    const amount = '1000.000000';
    const asset = LantahBase.Asset.native();
    const source =
      'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJUAAAAAAAAAAAALIWQ';
    const base = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';

    function paymentPacksCorrectly(opts) {
      const packed = LantahBase.Operation.payment(opts);

      // Ensure we can convert to and from the raw XDR:
      expect(() => {
        LantahBase.xdr.Operation.fromXDR(packed.toXDR('raw'), 'raw');
        LantahBase.xdr.Operation.fromXDR(packed.toXDR('hex'), 'hex');
      }).to.not.throw();

      const unpacked = LantahBase.Operation.fromXDRObject(packed, true);

      // Ensure the properties match the inputs:
      expect(unpacked.type).to.equal('payment');
      expect(unpacked.source).to.equal(opts.source);
      expect(unpacked.destination).to.equal(opts.destination);
      expect(unpacked.asset).to.eql(opts.asset);
    }

    let opts = { destination, asset, amount, source };

    it('supports muxed accounts', function () {
      opts.source = opts.destination = base;
      paymentPacksCorrectly(opts);
    });

    it('supports mixing muxed and unmuxed properties', function () {
      opts.source = base;
      opts.destination = destination;
      paymentPacksCorrectly(opts);

      opts.source = source;
      opts.destination = base;
      paymentPacksCorrectly(opts);
    });

    it('fails to create payment operation with an invalid destination address', function () {
      let opts = {
        destination: 'GCEZW',
        asset: LantahBase.Asset.native(),
        amount: '20'
      };
      expect(() => LantahBase.Operation.payment(opts)).to.throw(
        /destination is invalid/
      );
    });

    it('fails to create payment operation with an invalid amount', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        asset: LantahBase.Asset.native(),
        amount: 20
      };
      expect(() => LantahBase.Operation.payment(opts)).to.throw(
        /amount argument must be of type String/
      );
    });
  });

  describe('.pathPaymentStrictReceive()', function () {
    it('creates a pathPaymentStrictReceiveOp', function () {
      var sendAsset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      var sendMax = '3.007000';
      var destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      var destAsset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      var destAmount = '3.141500';
      var path = [
        new LantahBase.Asset(
          'USD',
          'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
        ),
        new LantahBase.Asset(
          'EUR',
          'GDTNXRLOJD2YEBPKK7KCMR7J33AAG5VZXHAJTHIG736D6LVEFLLLKPDL'
        )
      ];
      let op = LantahBase.Operation.pathPaymentStrictReceive({
        sendAsset,
        sendMax,
        destination,
        destAsset,
        destAmount,
        path
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('pathPaymentStrictReceive');
      expect(obj.sendAsset.equals(sendAsset)).to.be.true;
      expect(operation.body().value().sendMax().toString()).to.be.equal(
        '3007000'
      );
      expect(obj.sendMax).to.be.equal(sendMax);
      expect(obj.destination).to.be.equal(destination);
      expect(obj.destAsset.equals(destAsset)).to.be.true;
      expect(operation.body().value().destAmount().toString()).to.be.equal(
        '3141500'
      );
      expect(obj.destAmount).to.be.equal(destAmount);
      expect(obj.path[0].getCode()).to.be.equal('USD');
      expect(obj.path[0].getIssuer()).to.be.equal(
        'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
      );
      expect(obj.path[1].getCode()).to.be.equal('EUR');
      expect(obj.path[1].getIssuer()).to.be.equal(
        'GDTNXRLOJD2YEBPKK7KCMR7J33AAG5VZXHAJTHIG736D6LVEFLLLKPDL'
      );
    });

    const base = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';
    const source = encodeMuxedAccountToAddress(encodeMuxedAccount(base, '1'));
    const destination = encodeMuxedAccountToAddress(
      encodeMuxedAccount(base, '2')
    );
    const sendAsset = new LantahBase.Asset(
      'USD',
      'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
    );
    const destAsset = sendAsset;

    const sendMax = '3.007000';
    const destAmount = '3.141500';
    const path = [
      new LantahBase.Asset(
        'USD',
        'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
      ),
      new LantahBase.Asset(
        'EUR',
        'GDTNXRLOJD2YEBPKK7KCMR7J33AAG5VZXHAJTHIG736D6LVEFLLLKPDL'
      )
    ];
    let opts = {
      sendAsset,
      sendMax,
      destination,
      destAsset,
      destAmount,
      path,
      source
    };

    it('supports muxed accounts', function () {
      const packed = LantahBase.Operation.pathPaymentStrictReceive(opts);

      // Ensure we can convert to and from the raw XDR:
      expect(() => {
        LantahBase.xdr.Operation.fromXDR(packed.toXDR('raw'), 'raw');
        LantahBase.xdr.Operation.fromXDR(packed.toXDR('hex'), 'hex');
      }).to.not.throw();

      const unpacked = LantahBase.Operation.fromXDRObject(packed);
      expect(unpacked.type).to.equal('pathPaymentStrictReceive');
      expect(unpacked.source).to.equal(opts.source);
      expect(unpacked.destination).to.equal(opts.destination);
    });

    it('fails to create path payment operation with an invalid destination address', function () {
      opts.destination = 'GCEZW';
      expect(() =>
        LantahBase.Operation.pathPaymentStrictReceive(opts)
      ).to.throw(/destination is invalid/);
    });

    it('fails to create path payment operation with an invalid sendMax', function () {
      opts.sendMax = 20;
      expect(() =>
        LantahBase.Operation.pathPaymentStrictReceive(opts)
      ).to.throw(/sendMax argument must be of type String/);
    });

    it('fails to create path payment operation with an invalid destAmount', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        sendMax: '20',
        destAmount: 50,
        sendAsset: LantahBase.Asset.native(),
        destAsset: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() =>
        LantahBase.Operation.pathPaymentStrictReceive(opts)
      ).to.throw(/destAmount argument must be of type String/);
    });
  });

  describe('.pathPaymentStrictSend()', function () {
    it('creates a pathPaymentStrictSendOp', function () {
      var sendAsset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      var sendAmount = '3.007000';
      var destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      var destAsset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      var destMin = '3.141500';
      var path = [
        new LantahBase.Asset(
          'USD',
          'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
        ),
        new LantahBase.Asset(
          'EUR',
          'GDTNXRLOJD2YEBPKK7KCMR7J33AAG5VZXHAJTHIG736D6LVEFLLLKPDL'
        )
      ];
      let op = LantahBase.Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount,
        destination,
        destAsset,
        destMin,
        path
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('pathPaymentStrictSend');
      expect(obj.sendAsset.equals(sendAsset)).to.be.true;
      expect(operation.body().value().sendAmount().toString()).to.be.equal(
        '3007000'
      );
      expect(obj.sendAmount).to.be.equal(sendAmount);
      expect(obj.destination).to.be.equal(destination);
      expect(obj.destAsset.equals(destAsset)).to.be.true;
      expect(operation.body().value().destMin().toString()).to.be.equal(
        '3141500'
      );
      expect(obj.destMin).to.be.equal(destMin);
      expect(obj.path[0].getCode()).to.be.equal('USD');
      expect(obj.path[0].getIssuer()).to.be.equal(
        'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
      );
      expect(obj.path[1].getCode()).to.be.equal('EUR');
      expect(obj.path[1].getIssuer()).to.be.equal(
        'GDTNXRLOJD2YEBPKK7KCMR7J33AAG5VZXHAJTHIG736D6LVEFLLLKPDL'
      );
    });

    const base = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';
    const source = encodeMuxedAccountToAddress(encodeMuxedAccount(base, '1'));
    const destination = encodeMuxedAccountToAddress(
      encodeMuxedAccount(base, '2')
    );

    let opts = { source, destination };
    opts.sendAsset = opts.destAsset = new LantahBase.Asset(
      'USD',
      'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
    );
    opts.destMin = '3.141500';
    opts.sendAmount = '3.007000';
    opts.path = [
      new LantahBase.Asset(
        'USD',
        'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
      )
    ];

    it('supports muxed accounts', function () {
      const packed = LantahBase.Operation.pathPaymentStrictSend(opts);

      // Ensure we can convert to and from the raw XDR:
      expect(() => {
        LantahBase.xdr.Operation.fromXDR(packed.toXDR('raw'), 'raw');
        LantahBase.xdr.Operation.fromXDR(packed.toXDR('hex'), 'hex');
      }).to.not.throw();

      const unpacked = LantahBase.Operation.fromXDRObject(packed);
      expect(unpacked.type).to.equal('pathPaymentStrictSend');
      expect(unpacked.source).to.equal(opts.source);
      expect(unpacked.destination).to.equal(opts.destination);
    });

    it('fails to create path payment operation with an invalid destination address', function () {
      let opts = {
        destination: 'GCEZW',
        sendAmount: '20',
        destMin: '50',
        sendAsset: LantahBase.Asset.native(),
        destAsset: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.pathPaymentStrictSend(opts)).to.throw(
        /destination is invalid/
      );
    });

    it('fails to create path payment operation with an invalid sendAmount', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        sendAmount: 20,
        destMin: '50',
        sendAsset: LantahBase.Asset.native(),
        destAsset: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.pathPaymentStrictSend(opts)).to.throw(
        /sendAmount argument must be of type String/
      );
    });

    it('fails to create path payment operation with an invalid destMin', function () {
      let opts = {
        destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
        sendAmount: '20',
        destMin: 50,
        sendAsset: LantahBase.Asset.native(),
        destAsset: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.pathPaymentStrictSend(opts)).to.throw(
        /destMin argument must be of type String/
      );
    });
  });

  describe('.changeTrust()', function () {
    it('creates a changeTrustOp with Asset', function () {
      let asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      let op = LantahBase.Operation.changeTrust({ asset });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('changeTrust');
      expect(obj.line).to.be.deep.equal(asset);
      expect(operation.body().value().limit().toString()).to.be.equal(
        '9223372036854775807'
      ); // MAX_INT64
      expect(obj.limit).to.be.equal('9223372036854.775807');
    });

    it('creates a changeTrustOp with Asset and limit', function () {
      let asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      let op = LantahBase.Operation.changeTrust({
        asset,
        limit: '50.000000'
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('changeTrust');
      expect(obj.line).to.be.deep.equal(asset);
      expect(operation.body().value().limit().toString()).to.be.equal(
        '50000000'
      );
      expect(obj.limit).to.be.equal('50.000000');
    });

    it('creates a changeTrustOp to a liquidity pool', function () {
      const assetA = new LantahBase.Asset(
        'ARST',
        'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
      );
      const assetB = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const fee = LantahBase.LiquidityPoolFeeV18;
      const asset = new LantahBase.LiquidityPoolAsset(assetA, assetB, fee);
      const op = LantahBase.Operation.changeTrust({ asset });
      expect(op).to.be.instanceof(LantahBase.xdr.Operation);

      const opXdr = op.toXDR('hex');
      const opXdrObj = LantahBase.xdr.Operation.fromXDR(opXdr, 'hex');
      const operation = LantahBase.Operation.fromXDRObject(opXdrObj);

      expect(operation.type).to.be.equal('changeTrust');
      expect(operation.line).to.be.deep.equal(asset);
      expect(opXdrObj.body().value().limit().toString()).to.be.equal(
        '9223372036854775807'
      ); // MAX_INT64
      expect(operation.limit).to.be.equal('9223372036854.775807');
    });

    it('deletes an Asset trustline', function () {
      let asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      let op = LantahBase.Operation.changeTrust({
        asset: asset,
        limit: '0.000000'
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('changeTrust');
      expect(obj.line).to.be.deep.equal(asset);
      expect(obj.limit).to.be.equal('0.000000');
    });

    it('deletes a LiquidityPoolAsset trustline', function () {
      const assetA = new LantahBase.Asset(
        'ARST',
        'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB'
      );
      const assetB = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const fee = LantahBase.LiquidityPoolFeeV18;
      const asset = new LantahBase.LiquidityPoolAsset(assetA, assetB, fee);
      let op = LantahBase.Operation.changeTrust({
        asset,
        limit: '0.000000'
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('changeTrust');
      expect(obj.line).to.be.deep.equal(asset);
      expect(obj.limit).to.be.equal('0.000000');
    });

    it('throws TypeError for incorrect limit argument', function () {
      let asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      let changeTrust = () =>
        LantahBase.Operation.changeTrust({ asset: asset, limit: 0 });
      expect(changeTrust).to.throw(TypeError);
    });
  });

  describe('.allowTrust()', function () {
    it('creates an allowTrustOp', function () {
      let trustor = 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      let assetCode = 'USD';
      let authorize = true;
      let op = LantahBase.Operation.allowTrust({
        trustor: trustor,
        assetCode: assetCode,
        authorize: authorize
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('allowTrust');
      expect(obj.trustor).to.be.equal(trustor);
      expect(obj.assetCode).to.be.equal(assetCode);
      expect(obj.authorize).to.be.equal(1);
    });

    it('fails to create allowTrust operation with an invalid trustor address', function () {
      let opts = {
        trustor: 'GCEZW'
      };
      expect(() => LantahBase.Operation.allowTrust(opts)).to.throw(
        /trustor is invalid/
      );
    });
  });

  describe('.setOptions()', function () {
    it('auth flags are set correctly', function () {
      expect(LantahBase.AuthRequiredFlag).to.be.equal(1);
      expect(LantahBase.AuthRevocableFlag).to.be.equal(2);
      expect(LantahBase.AuthImmutableFlag).to.be.equal(4);
      expect(LantahBase.AuthClawbackEnabledFlag).to.be.equal(8);
    });

    it('creates a setOptionsOp', function () {
      var opts = {};
      opts.inflationDest =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      opts.clearFlags =
        LantahBase.AuthRevocableFlag | LantahBase.AuthImmutableFlag;
      opts.setFlags =
        LantahBase.AuthRequiredFlag | LantahBase.AuthClawbackEnabledFlag;
      opts.masterWeight = 0;
      opts.lowThreshold = 1;
      opts.medThreshold = 2;
      opts.highThreshold = 3;

      opts.signer = {
        ed25519PublicKey:
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7',
        weight: 1
      };
      opts.homeDomain = 'www.example.com';
      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expect(obj.type).to.be.equal('setOptions');
      expect(obj.inflationDest).to.be.equal(opts.inflationDest);
      expect(obj.clearFlags).to.be.equal(6);
      expect(obj.setFlags).to.be.equal(9);
      expect(obj.masterWeight).to.be.equal(opts.masterWeight);
      expect(obj.lowThreshold).to.be.equal(opts.lowThreshold);
      expect(obj.medThreshold).to.be.equal(opts.medThreshold);
      expect(obj.highThreshold).to.be.equal(opts.highThreshold);

      expect(obj.signer.ed25519PublicKey).to.be.equal(
        opts.signer.ed25519PublicKey
      );
      expect(obj.signer.weight).to.be.equal(opts.signer.weight);
      expect(obj.homeDomain.toString()).to.be.equal(opts.homeDomain);
    });

    it('creates a setOptionsOp with preAuthTx signer', function () {
      var opts = {};

      var hash = LantahBase.hash('Tx hash');

      opts.signer = {
        preAuthTx: hash,
        weight: 10
      };

      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expectBuffersToBeEqual(obj.signer.preAuthTx, hash);
      expect(obj.signer.weight).to.be.equal(opts.signer.weight);
    });

    it('creates a setOptionsOp with preAuthTx signer from a hex string', function () {
      var opts = {};

      var hash = LantahBase.hash('Tx hash').toString('hex');
      expect(typeof hash === 'string').to.be.true;

      opts.signer = {
        preAuthTx: hash,
        weight: 10
      };

      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expectBuffersToBeEqual(obj.signer.preAuthTx, hash);
      expect(obj.signer.weight).to.be.equal(opts.signer.weight);
    });

    it('creates a setOptionsOp with hash signer', function () {
      var opts = {};

      var hash = LantahBase.hash('Hash Preimage');

      opts.signer = {
        sha256Hash: hash,
        weight: 10
      };

      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expectBuffersToBeEqual(obj.signer.sha256Hash, hash);
      expect(obj.signer.weight).to.be.equal(opts.signer.weight);
    });

    it('creates a setOptionsOp with hash signer from a hex string', function () {
      var opts = {};

      var hash = LantahBase.hash('Hash Preimage').toString('hex');
      expect(typeof hash === 'string').to.be.true;

      opts.signer = {
        sha256Hash: hash,
        weight: 10
      };

      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expectBuffersToBeEqual(obj.signer.sha256Hash, hash);
      expect(obj.signer.weight).to.be.equal(opts.signer.weight);
    });

    it('creates a setOptionsOp with signed payload signer', function () {
      var opts = {};

      var pubkey = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      var signedPayload = new LantahBase.xdr.SignerKeyEd25519SignedPayload({
        ed25519: LantahBase.StrKey.decodeEd25519PublicKey(pubkey),
        payload: Buffer.from('test')
      });
      var xdrSignerKey =
        LantahBase.xdr.SignerKey.signerKeyTypeEd25519SignedPayload(
          signedPayload
        );
      var payloadKey = LantahBase.SignerKey.encodeSignerKey(xdrSignerKey);

      //var rawSignedPayload = Buffer.concat([LantahBase.StrKey.decodeEd25519PublicKey(pubkey), Buffer.from('test')]);
      //var payloadKey = LantahBase.StrKey.encodeSignedPayload(rawSignedPayload);

      opts.signer = {
        ed25519SignedPayload: payloadKey,
        weight: 10
      };

      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expect(obj.signer.ed25519SignedPayload).to.be.equal(payloadKey);
      expect(obj.signer.weight).to.be.equal(opts.signer.weight);
    });

    it('empty homeDomain is decoded correctly', function () {
      const keypair = LantahBase.Keypair.random();
      const account = new LantahBase.Account(keypair.publicKey(), '0');

      // First operation do nothing.
      const tx1 = new LantahBase.TransactionBuilder(account, {
        fee: 100,
        networkPassphrase: 'Some Network'
      })
        .addOperation(LantahBase.Operation.setOptions({}))
        .setTimeout(LantahBase.TimeoutInfinite)
        .build();

      // Second operation unset homeDomain
      const tx2 = new LantahBase.TransactionBuilder(account, {
        fee: 100,
        networkPassphrase: 'Some Network'
      })
        .addOperation(LantahBase.Operation.setOptions({ homeDomain: '' }))
        .setTimeout(LantahBase.TimeoutInfinite)
        .build();

      expect(tx1.operations[0].homeDomain).to.be.undefined;
      expect(tx2.operations[0].homeDomain).to.be.equal('');
    });

    it('string setFlags', function () {
      let opts = {
        setFlags: '4'
      };
      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expect(obj.type).to.be.equal('setOptions');
      expect(obj.setFlags).to.be.equal(4);
    });

    it('fails to create setOptions operation with an invalid setFlags', function () {
      let opts = {
        setFlags: {}
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw();
    });

    it('string clearFlags', function () {
      let opts = {
        clearFlags: '4'
      };
      let op = LantahBase.Operation.setOptions(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);

      expect(obj.type).to.be.equal('setOptions');
      expect(obj.clearFlags).to.be.equal(4);
    });

    it('fails to create setOptions operation with an invalid clearFlags', function () {
      let opts = {
        clearFlags: {}
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw();
    });

    it('fails to create setOptions operation with an invalid inflationDest address', function () {
      let opts = {
        inflationDest: 'GCEZW'
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /inflationDest is invalid/
      );
    });

    it('fails to create setOptions operation with an invalid signer address', function () {
      let opts = {
        signer: {
          ed25519PublicKey: 'GDGU5OAPHNPU5UCL',
          weight: 1
        }
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /signer.ed25519PublicKey is invalid/
      );
    });

    it('fails to create setOptions operation with multiple signer values', function () {
      let opts = {
        signer: {
          ed25519PublicKey:
            'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7',
          sha256Hash: Buffer.alloc(32),
          weight: 1
        }
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /Signer object must contain exactly one/
      );
    });

    it('fails to create setOptions operation with an invalid masterWeight', function () {
      let opts = {
        masterWeight: 400
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /masterWeight value must be between 0 and 255/
      );
    });

    it('fails to create setOptions operation with an invalid lowThreshold', function () {
      let opts = {
        lowThreshold: 400
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /lowThreshold value must be between 0 and 255/
      );
    });

    it('fails to create setOptions operation with an invalid medThreshold', function () {
      let opts = {
        medThreshold: 400
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /medThreshold value must be between 0 and 255/
      );
    });

    it('fails to create setOptions operation with an invalid highThreshold', function () {
      let opts = {
        highThreshold: 400
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /highThreshold value must be between 0 and 255/
      );
    });

    it('fails to create setOptions operation with an invalid homeDomain', function () {
      let opts = {
        homeDomain: 67238
      };
      expect(() => LantahBase.Operation.setOptions(opts)).to.throw(
        /homeDomain argument must be of type String/
      );
    });
  });

  describe('.manageSellOffer', function () {
    it('creates a manageSellOfferOp (string price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '3.123456';
      opts.price = '8.141592';
      opts.offerId = '1';
      let op = LantahBase.Operation.manageSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageSellOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().amount().toString()).to.be.equal(
        '3123456'
      );
      expect(obj.amount).to.be.equal(opts.amount);
      expect(obj.price).to.be.equal(opts.price);
      expect(obj.offerId).to.be.equal(opts.offerId);
    });

    it('creates a manageSellOfferOp (price fraction)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '3.123456';
      opts.price = {
        n: 11,
        d: 10
      };
      opts.offerId = '1';
      let op = LantahBase.Operation.manageSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.price).to.be.equal(
        new BigNumber(opts.price.n).div(opts.price.d).toString()
      );
    });

    it('creates an invalid manageSellOfferOp (price fraction)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '3.123456';
      opts.price = {
        n: 11,
        d: -1
      };
      opts.offerId = '1';
      expect(() => LantahBase.Operation.manageSellOffer(opts)).to.throw(
        /price must be positive/
      );
    });

    it('creates a manageSellOfferOp (number price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '3.123456';
      opts.price = 3.07;
      opts.offerId = '1';
      let op = LantahBase.Operation.manageSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageSellOffer');
      expect(obj.price).to.be.equal(opts.price.toString());
    });

    it('creates a manageSellOfferOp (BigNumber price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '3.123456';
      opts.price = new BigNumber(5).dividedBy(4);
      opts.offerId = '1';
      let op = LantahBase.Operation.manageSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageSellOffer');
      expect(obj.price).to.be.equal('1.25');
    });

    it('creates a manageSellOfferOp with no offerId', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '1000.000000';
      opts.price = '3.141592';
      let op = LantahBase.Operation.manageSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageSellOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().amount().toString()).to.be.equal(
        '1000000000'
      );
      expect(obj.amount).to.be.equal(opts.amount);
      expect(obj.price).to.be.equal(opts.price);
      expect(obj.offerId).to.be.equal('0'); // 0=create a new offer, otherwise edit an existing offer
    });

    it('cancels offer', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '0.000000';
      opts.price = '3.141592';
      opts.offerId = '1';
      let op = LantahBase.Operation.manageSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageSellOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().amount().toString()).to.be.equal('0');
      expect(obj.amount).to.be.equal(opts.amount);
      expect(obj.price).to.be.equal(opts.price);
      expect(obj.offerId).to.be.equal('1'); // 0=create a new offer, otherwise edit an existing offer
    });

    it('fails to create manageSellOffer operation with an invalid amount', function () {
      let opts = {
        amount: 20,
        price: '10',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageSellOffer(opts)).to.throw(
        /amount argument must be of type String/
      );
    });

    it('fails to create manageSellOffer operation with missing price', function () {
      let opts = {
        amount: '20',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageSellOffer(opts)).to.throw(
        /price argument is required/
      );
    });

    it('fails to create manageSellOffer operation with negative price', function () {
      let opts = {
        amount: '20',
        price: '-1',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageSellOffer(opts)).to.throw(
        /price must be positive/
      );
    });

    it('fails to create manageSellOffer operation with invalid price', function () {
      let opts = {
        amount: '20',
        price: 'test',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageSellOffer(opts)).to.throw(
        /not a number/i
      );
    });
  });

  describe('.manageBuyOffer', function () {
    it('creates a manageBuyOfferOp (string price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '3.123456';
      opts.price = '8.141592';
      opts.offerId = '1';
      let op = LantahBase.Operation.manageBuyOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageBuyOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().buyAmount().toString()).to.be.equal(
        '3123456'
      );
      expect(obj.buyAmount).to.be.equal(opts.buyAmount);
      expect(obj.price).to.be.equal(opts.price);
      expect(obj.offerId).to.be.equal(opts.offerId);
    });

    it('creates a manageBuyOfferOp (price fraction)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '3.123456';
      opts.price = {
        n: 11,
        d: 10
      };
      opts.offerId = '1';
      let op = LantahBase.Operation.manageBuyOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.price).to.be.equal(
        new BigNumber(opts.price.n).div(opts.price.d).toString()
      );
    });

    it('creates an invalid manageBuyOfferOp (price fraction)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '3.123456';
      opts.price = {
        n: 11,
        d: -1
      };
      opts.offerId = '1';
      expect(() => LantahBase.Operation.manageBuyOffer(opts)).to.throw(
        /price must be positive/
      );
    });

    it('creates a manageBuyOfferOp (number price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '3.123456';
      opts.price = 3.07;
      opts.offerId = '1';
      let op = LantahBase.Operation.manageBuyOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageBuyOffer');
      expect(obj.price).to.be.equal(opts.price.toString());
    });

    it('creates a manageBuyOfferOp (BigNumber price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '3.123456';
      opts.price = new BigNumber(5).dividedBy(4);
      opts.offerId = '1';
      let op = LantahBase.Operation.manageBuyOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageBuyOffer');
      expect(obj.price).to.be.equal('1.25');
    });

    it('creates a manageBuyOfferOp with no offerId', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '1000.000000';
      opts.price = '3.141592';
      let op = LantahBase.Operation.manageBuyOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageBuyOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().buyAmount().toString()).to.be.equal(
        '1000000000'
      );
      expect(obj.buyAmount).to.be.equal(opts.buyAmount);
      expect(obj.price).to.be.equal(opts.price);
      expect(obj.offerId).to.be.equal('0'); // 0=create a new offer, otherwise edit an existing offer
    });

    it('cancels offer', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buyAmount = '0.000000';
      opts.price = '3.141592';
      opts.offerId = '1';
      let op = LantahBase.Operation.manageBuyOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageBuyOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().buyAmount().toString()).to.be.equal('0');
      expect(obj.buyAmount).to.be.equal(opts.buyAmount);
      expect(obj.price).to.be.equal(opts.price);
      expect(obj.offerId).to.be.equal('1'); // 0=create a new offer, otherwise edit an existing offer
    });

    it('fails to create manageBuyOffer operation with an invalid amount', function () {
      let opts = {
        buyAmount: 20,
        price: '10',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageBuyOffer(opts)).to.throw(
        /buyAmount argument must be of type String/
      );
    });

    it('fails to create manageBuyOffer operation with missing price', function () {
      let opts = {
        buyAmount: '20',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageBuyOffer(opts)).to.throw(
        /price argument is required/
      );
    });

    it('fails to create manageBuyOffer operation with negative price', function () {
      let opts = {
        buyAmount: '20',
        price: '-1',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageBuyOffer(opts)).to.throw(
        /price must be positive/
      );
    });

    it('fails to create manageBuyOffer operation with invalid price', function () {
      let opts = {
        buyAmount: '20',
        price: 'test',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.manageBuyOffer(opts)).to.throw(
        /not a number/i
      );
    });
  });

  describe('.createPassiveSellOffer', function () {
    it('creates a createPassiveSellOfferOp (string price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '11.278270';
      opts.price = '3.07';
      let op = LantahBase.Operation.createPassiveSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('createPassiveSellOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().amount().toString()).to.be.equal(
        '11278270'
      );
      expect(obj.amount).to.be.equal(opts.amount);
      expect(obj.price).to.be.equal(opts.price);
    });

    it('creates a createPassiveSellOfferOp (number price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '11.278270';
      opts.price = 3.07;
      let op = LantahBase.Operation.createPassiveSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('createPassiveSellOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().amount().toString()).to.be.equal(
        '11278270'
      );
      expect(obj.amount).to.be.equal(opts.amount);
      expect(obj.price).to.be.equal(opts.price.toString());
    });

    it('creates a createPassiveSellOfferOp (BigNumber price)', function () {
      var opts = {};
      opts.selling = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.buying = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      opts.amount = '11.278270';
      opts.price = new BigNumber(5).dividedBy(4);
      let op = LantahBase.Operation.createPassiveSellOffer(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('createPassiveSellOffer');
      expect(obj.selling.equals(opts.selling)).to.be.true;
      expect(obj.buying.equals(opts.buying)).to.be.true;
      expect(operation.body().value().amount().toString()).to.be.equal(
        '11278270'
      );
      expect(obj.amount).to.be.equal(opts.amount);
      expect(obj.price).to.be.equal('1.25');
    });

    it('fails to create createPassiveSellOffer operation with an invalid amount', function () {
      let opts = {
        amount: 20,
        price: '10',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.createPassiveSellOffer(opts)).to.throw(
        /amount argument must be of type String/
      );
    });

    it('fails to create createPassiveSellOffer operation with missing price', function () {
      let opts = {
        amount: '20',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.createPassiveSellOffer(opts)).to.throw(
        /price argument is required/
      );
    });

    it('fails to create createPassiveSellOffer operation with negative price', function () {
      let opts = {
        amount: '20',
        price: '-2',
        selling: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        ),
        buying: new LantahBase.Asset(
          'USD',
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        )
      };
      expect(() => LantahBase.Operation.createPassiveSellOffer(opts)).to.throw(
        /price must be positive/
      );
    });
  });

  describe('.accountMerge', function () {
    const base = 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';

    const checkMergeOp = function (opts) {
      const xdr = LantahBase.Operation.accountMerge(opts).toXDR('hex');
      const op = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      const obj = LantahBase.Operation.fromXDRObject(op);

      expect(obj.type).to.be.equal('accountMerge');
      expect(obj.destination).to.be.equal(opts.destination);
      return obj;
    };

    it('creates an accountMergeOp', function () {
      let opts = { destination: base };
      checkMergeOp(opts);
    });

    it('supports muxed accounts', function () {
      const dest = encodeMuxedAccountToAddress(encodeMuxedAccount(base, '1'));
      const source = encodeMuxedAccountToAddress(encodeMuxedAccount(base, '2'));

      let opts = { destination: dest, source: source };
      let obj = checkMergeOp(opts);
      expect(obj.source).to.equal(source);

      opts.destination = opts.source = base;
      obj = checkMergeOp(opts);
      expect(obj.source).to.equal(base);
    });

    it('fails to create accountMergeOp with invalid destination', function () {
      let opts = { destination: 'GCEZW' };
      expect(() => LantahBase.Operation.accountMerge(opts)).to.throw(
        /destination is invalid/
      );
    });
  });

  describe('.inflation', function () {
    it('creates a inflationOp', function () {
      let op = LantahBase.Operation.inflation();
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('inflation');
    });
  });

  describe('.manageData', function () {
    it('creates a manageDataOp with string value', function () {
      var opts = {
        name: 'name',
        value: 'value'
      };
      let op = LantahBase.Operation.manageData(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageData');
      expect(obj.name).to.be.equal(opts.name);
      expect(obj.value.toString('ascii')).to.be.equal(opts.value);
    });

    it('creates a manageDataOp with Buffer value', function () {
      var opts = {
        name: 'name',
        value: Buffer.from('value')
      };
      let op = LantahBase.Operation.manageData(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageData');
      expect(obj.name).to.be.equal(opts.name);
      expect(obj.value.toString('hex')).to.be.equal(opts.value.toString('hex'));
    });

    it('creates a manageDataOp with null dataValue', function () {
      var opts = {
        name: 'name',
        value: null
      };
      let op = LantahBase.Operation.manageData(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('manageData');
      expect(obj.name).to.be.equal(opts.name);
      expect(obj.value).to.be.undefined;
    });

    describe('fails to create manageData operation', function () {
      it('name is not a string', function () {
        expect(() =>
          LantahBase.Operation.manageData({ name: 123 })
        ).to.throw();
      });

      it('name is too long', function () {
        expect(() =>
          LantahBase.Operation.manageData({ name: 'a'.repeat(65) })
        ).to.throw();
      });

      it('value is too long', function () {
        expect(() =>
          LantahBase.Operation.manageData({
            name: 'a',
            value: Buffer.alloc(65)
          })
        ).to.throw();
      });
    });
  });

  describe('.bumpSequence', function () {
    it('creates a bumpSequence', function () {
      var opts = {
        bumpTo: '77833036561510299'
      };
      let op = LantahBase.Operation.bumpSequence(opts);
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('bumpSequence');
      expect(obj.bumpTo).to.be.equal(opts.bumpTo);
    });

    it('fails when `bumpTo` is not string', function () {
      expect(() =>
        LantahBase.Operation.bumpSequence({ bumpTo: 1000 })
      ).to.throw();
    });
  });

  describe('._checkUnsignedIntValue()', function () {
    it('returns true for valid values', function () {
      let values = [
        { value: 0, expected: 0 },
        { value: 10, expected: 10 },
        { value: '0', expected: 0 },
        { value: '10', expected: 10 },
        { value: undefined, expected: undefined }
      ];

      for (var i in values) {
        let { value, expected } = values[i];
        expect(
          LantahBase.Operation._checkUnsignedIntValue(value, value)
        ).to.be.equal(expected);
      }
    });

    it('throws error for invalid values', function () {
      let values = [
        {},
        [],
        '', // empty string
        'test', // string not representing a number
        '0.5',
        '-10',
        '-10.5',
        'Infinity',
        Infinity,
        'Nan',
        NaN
      ];

      for (var i in values) {
        let value = values[i];
        expect(() =>
          LantahBase.Operation._checkUnsignedIntValue(value, value)
        ).to.throw();
      }
    });

    it('return correct values when isValidFunction is set', function () {
      expect(
        LantahBase.Operation._checkUnsignedIntValue(
          'test',
          undefined,
          (value) => value < 10
        )
      ).to.equal(undefined);

      expect(
        LantahBase.Operation._checkUnsignedIntValue(
          'test',
          8,
          (value) => value < 10
        )
      ).to.equal(8);
      expect(
        LantahBase.Operation._checkUnsignedIntValue(
          'test',
          '8',
          (value) => value < 10
        )
      ).to.equal(8);

      expect(() => {
        LantahBase.Operation._checkUnsignedIntValue(
          'test',
          12,
          (value) => value < 10
        );
      }).to.throw();
      expect(() => {
        LantahBase.Operation._checkUnsignedIntValue(
          'test',
          '12',
          (value) => value < 10
        );
      }).to.throw();
    });
  });

  describe('createClaimableBalance()', function () {
    it('creates a CreateClaimableBalanceOp', function () {
      const asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const amount = '100.000000';
      const claimants = [
        new LantahBase.Claimant(
          'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
        )
      ];

      const op = LantahBase.Operation.createClaimableBalance({
        asset,
        amount,
        claimants
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('createClaimableBalance');
      expect(obj.asset.toString()).to.equal(asset.toString());
      expect(obj.amount).to.be.equal(amount);
      expect(obj.claimants).to.have.lengthOf(1);
      expect(obj.claimants[0].toXDRObject().toXDR('hex')).to.equal(
        claimants[0].toXDRObject().toXDR('hex')
      );
    });
    it('throws an error when asset is not present', function () {
      const amount = '100.000000';
      const claimants = [
        new LantahBase.Claimant(
          'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
        )
      ];

      const attrs = {
        amount,
        claimants
      };

      expect(() =>
        LantahBase.Operation.createClaimableBalance(attrs)
      ).to.throw(
        /must provide an asset for create claimable balance operation/
      );
    });
    it('throws an error when amount is not present', function () {
      const asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const claimants = [
        new LantahBase.Claimant(
          'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
        )
      ];

      const attrs = {
        asset,
        claimants
      };

      expect(() =>
        LantahBase.Operation.createClaimableBalance(attrs)
      ).to.throw(
        /amount argument must be of type String, represent a positive number and have at most 7 digits after the decimal/
      );
    });
    it('throws an error when claimants is empty or not present', function () {
      const asset = new LantahBase.Asset(
        'USD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const amount = '100.0000';

      const attrs = {
        asset,
        amount
      };

      expect(() =>
        LantahBase.Operation.createClaimableBalance(attrs)
      ).to.throw(/must provide at least one claimant/);

      attrs.claimants = [];
      expect(() =>
        LantahBase.Operation.createClaimableBalance(attrs)
      ).to.throw(/must provide at least one claimant/);
    });
  });

  describe('claimClaimableBalance()', function () {
    it('creates a claimClaimableBalanceOp', function () {
      const balanceId =
        '00000000da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be';

      const op = LantahBase.Operation.claimClaimableBalance({ balanceId });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('claimClaimableBalance');
      expect(obj.balanceId).to.equal(balanceId);
    });
    it('throws an error when balanceId is not present', function () {
      expect(() => LantahBase.Operation.claimClaimableBalance({})).to.throw(
        /must provide a valid claimable balance id/
      );
    });
    it('throws an error for invalid balanceIds', function () {
      expect(() =>
        LantahBase.Operation.claimClaimableBalance({
          balanceId: 'badc0ffee'
        })
      ).to.throw(/must provide a valid claimable balance id/);
    });
  });

  describe('clawbackClaimableBalance()', function () {
    it('creates a clawbackClaimableBalanceOp', function () {
      const balanceId =
        '00000000da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be';

      const op = LantahBase.Operation.clawbackClaimableBalance({
        balanceId: balanceId
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('clawbackClaimableBalance');
      expect(obj.balanceId).to.equal(balanceId);
    });
    it('throws an error when balanceId is not present', function () {
      expect(() => LantahBase.Operation.clawbackClaimableBalance({})).to.throw(
        /must provide a valid claimable balance id/
      );
    });
    it('throws an error for invalid balanceIds', function () {
      expect(() =>
        LantahBase.Operation.clawbackClaimableBalance({
          balanceId: 'badc0ffee'
        })
      ).to.throw(/must provide a valid claimable balance id/);
    });
  });

  describe('beginSponsoringFutureReserves()', function () {
    it('creates a beginSponsoringFutureReservesOp', function () {
      const sponsoredId =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';

      const op = LantahBase.Operation.beginSponsoringFutureReserves({
        sponsoredId
      });
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal(
        'beginSponsoringFutureReserves'
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('beginSponsoringFutureReserves');
      expect(obj.sponsoredId).to.equal(sponsoredId);
    });
    it('throws an error when sponsoredId is invalid', function () {
      expect(() =>
        LantahBase.Operation.beginSponsoringFutureReserves({})
      ).to.throw(/sponsoredId is invalid/);
      expect(() =>
        LantahBase.Operation.beginSponsoringFutureReserves({
          sponsoredId: 'GBAD'
        })
      ).to.throw(/sponsoredId is invalid/);
    });
  });

  describe('endSponsoringFutureReserves()', function () {
    it('creates a endSponsoringFutureReservesOp', function () {
      const op = LantahBase.Operation.endSponsoringFutureReserves();
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal(
        'endSponsoringFutureReserves'
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('endSponsoringFutureReserves');
    });
  });

  describe('revokeAccountSponsorship()', function () {
    it('creates a revokeAccountSponsorshipOp', function () {
      const account =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      const op = LantahBase.Operation.revokeAccountSponsorship({
        account
      });
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeAccountSponsorship');
      expect(obj.account).to.be.equal(account);
    });
    it('throws an error when account is invalid', function () {
      expect(() => LantahBase.Operation.revokeAccountSponsorship({})).to.throw(
        /account is invalid/
      );
      expect(() =>
        LantahBase.Operation.revokeAccountSponsorship({
          account: 'GBAD'
        })
      ).to.throw(/account is invalid/);
    });
  });

  describe('invokeHostFunction()', function () {
    it('creates operation', function () {
      const contractId =
        'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';
      const c = new LantahBase.Contract(contractId);
      const op = LantahBase.Operation.invokeHostFunction({
        func: LantahBase.xdr.HostFunction.hostFunctionTypeInvokeContract(
          new LantahBase.xdr.InvokeContractArgs({
            contractAddress: c.address().toScAddress(),
            functionName: 'hello',
            args: [LantahBase.nativeToScVal('world')]
          })
        ),
        auth: []
      });
      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');

      expect(operation.body().switch().name).to.equal('invokeHostFunction');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('invokeHostFunction');
      expect(obj.func.switch().name).to.equal('hostFunctionTypeInvokeContract');
      expect(obj.auth).to.deep.equal([]);
    });

    it('throws when no func passed', function () {
      expect(() =>
        LantahBase.Operation.invokeHostFunction({
          auth: []
        })
      ).to.throw(/\('func'\) required/);
    });
  });

  describe('bumpFootprintExpiration()', function () {
    it('creates operation', function () {
      const op = LantahBase.Operation.bumpFootprintExpiration({
        ledgersToExpire: 1234
      });
      const xdr = op.toXDR('hex');
      const operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');

      expect(operation.body().switch().name).to.equal(
        'bumpFootprintExpiration'
      );
      const obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('bumpFootprintExpiration');
      expect(obj.ledgersToExpire).to.equal(1234);

      expect(() => {
        LantahBase.Operation.bumpFootprintExpiration({
          ledgersToExpire: 0
        });
      }).to.throw(/ledger quantity/i);
    });
  });

  describe('restoreFootprint()', function () {
    it('creates operation', function () {
      const op = LantahBase.Operation.restoreFootprint();
      const xdr = op.toXDR('hex');
      const operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');

      expect(operation.body().switch().name).to.equal('restoreFootprint');
      const obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('restoreFootprint');
    });
  });

  describe('revokeTrustlineSponsorship()', function () {
    it('creates a revokeTrustlineSponsorship', function () {
      const account =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      var asset = new LantahBase.Asset(
        'USDUSD',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const op = LantahBase.Operation.revokeTrustlineSponsorship({
        account,
        asset
      });
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeTrustlineSponsorship');
    });
    it('creates a revokeTrustlineSponsorship for a liquidity pool', function () {
      const account =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      const asset = new LantahBase.LiquidityPoolId(
        'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7'
      );
      const op = LantahBase.Operation.revokeTrustlineSponsorship({
        account,
        asset
      });
      const xdr = op.toXDR('hex');

      const operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      const obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeTrustlineSponsorship');
    });
    it('throws an error when account is invalid', function () {
      expect(() =>
        LantahBase.Operation.revokeTrustlineSponsorship({})
      ).to.throw(/account is invalid/);
      expect(() =>
        LantahBase.Operation.revokeTrustlineSponsorship({
          account: 'GBAD'
        })
      ).to.throw(/account is invalid/);
    });
    it('throws an error when asset is invalid', function () {
      expect(() =>
        LantahBase.Operation.revokeTrustlineSponsorship({
          account: 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        })
      ).to.throw(/asset must be an Asset or LiquidityPoolId/);
    });
  });

  describe('revokeOfferSponsorship()', function () {
    it('creates a revokeOfferSponsorship', function () {
      const seller = 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      var offerId = '1234';
      const op = LantahBase.Operation.revokeOfferSponsorship({
        seller,
        offerId
      });
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeOfferSponsorship');
      expect(obj.seller).to.be.equal(seller);
      expect(obj.offerId).to.be.equal(offerId);
    });
    it('throws an error when seller is invalid', function () {
      expect(() => LantahBase.Operation.revokeOfferSponsorship({})).to.throw(
        /seller is invalid/
      );
      expect(() =>
        LantahBase.Operation.revokeOfferSponsorship({
          seller: 'GBAD'
        })
      ).to.throw(/seller is invalid/);
    });
    it('throws an error when asset offerId is not included', function () {
      expect(() =>
        LantahBase.Operation.revokeOfferSponsorship({
          seller: 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        })
      ).to.throw(/offerId is invalid/);
    });
  });

  describe('revokeDataSponsorship()', function () {
    it('creates a revokeDataSponsorship', function () {
      const account =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      var name = 'foo';
      const op = LantahBase.Operation.revokeDataSponsorship({
        account,
        name
      });
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeDataSponsorship');
      expect(obj.account).to.be.equal(account);
      expect(obj.name).to.be.equal(name);
    });
    it('throws an error when account is invalid', function () {
      expect(() => LantahBase.Operation.revokeDataSponsorship({})).to.throw(
        /account is invalid/
      );
      expect(() =>
        LantahBase.Operation.revokeDataSponsorship({
          account: 'GBAD'
        })
      ).to.throw(/account is invalid/);
    });
    it('throws an error when data name is not included', function () {
      expect(() =>
        LantahBase.Operation.revokeDataSponsorship({
          account: 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        })
      ).to.throw(/name must be a string, up to 64 characters/);
    });
  });

  describe('revokeClaimableBalanceSponsorship()', function () {
    it('creates a revokeClaimableBalanceSponsorship', function () {
      const balanceId =
        '00000000da0d57da7d4850e7fc10d2a9d0ebc731f7afb40574c03395b17d49149b91f5be';
      const op = LantahBase.Operation.revokeClaimableBalanceSponsorship({
        balanceId
      });
      var xdr = op.toXDR('hex');

      var operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeClaimableBalanceSponsorship');
      expect(obj.balanceId).to.be.equal(balanceId);
    });
    it('throws an error when balanceId is invalid', function () {
      expect(() =>
        LantahBase.Operation.revokeClaimableBalanceSponsorship({})
      ).to.throw(/balanceId is invalid/);
    });
  });

  describe('revokeLiquidityPoolSponsorship()', function () {
    it('creates a revokeLiquidityPoolSponsorship', function () {
      const liquidityPoolId =
        'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7';
      const op = LantahBase.Operation.revokeLiquidityPoolSponsorship({
        liquidityPoolId
      });
      const xdr = op.toXDR('hex');

      const operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');

      const obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeLiquidityPoolSponsorship');
      expect(obj.liquidityPoolId).to.be.equal(liquidityPoolId);
    });

    it('throws an error when liquidityPoolId is invalid', function () {
      expect(() =>
        LantahBase.Operation.revokeLiquidityPoolSponsorship({})
      ).to.throw(/liquidityPoolId is invalid/);
    });
  });

  describe('revokeSignerSponsorship()', function () {
    it('creates a revokeSignerSponsorship', function () {
      const account =
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      let signer = {
        ed25519PublicKey:
          'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      };
      let op = LantahBase.Operation.revokeSignerSponsorship({
        account,
        signer
      });
      let xdr = op.toXDR('hex');

      let operation = LantahBase.xdr.Operation.fromXDR(xdr, 'hex');
      expect(operation.body().switch().name).to.equal('revokeSponsorship');
      let obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeSignerSponsorship');
      expect(obj.account).to.be.equal(account);
      expect(obj.signer.ed25519PublicKey).to.be.equal(signer.ed25519PublicKey);

      // preAuthTx signer
      signer = {
        preAuthTx: LantahBase.hash('Tx hash').toString('hex')
      };
      op = LantahBase.Operation.revokeSignerSponsorship({
        account,
        signer
      });
      operation = LantahBase.xdr.Operation.fromXDR(op.toXDR('hex'), 'hex');
      obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeSignerSponsorship');
      expect(obj.account).to.be.equal(account);
      expect(obj.signer.preAuthTx).to.be.equal(signer.preAuthTx);

      // sha256Hash signer
      signer = {
        sha256Hash: LantahBase.hash('Hash Preimage').toString('hex')
      };
      op = LantahBase.Operation.revokeSignerSponsorship({
        account,
        signer
      });
      operation = LantahBase.xdr.Operation.fromXDR(op.toXDR('hex'), 'hex');
      obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('revokeSignerSponsorship');
      expect(obj.account).to.be.equal(account);
      expect(obj.signer.sha256Hash).to.be.equal(signer.sha256Hash);
    });
    it('throws an error when account is invalid', function () {
      const signer = {
        ed25519PublicKey:
          'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
      };
      expect(() =>
        LantahBase.Operation.revokeSignerSponsorship({
          signer
        })
      ).to.throw(/account is invalid/);
    });
  });

  describe('clawback()', function () {
    it('requires asset, amount, account', function () {
      let asset = new LantahBase.Asset(
        'GCOIN',
        'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
      );
      const amount = '100.000000';

      expect(() => {
        LantahBase.Operation.clawback({
          from: 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7'
        });
      }).to.throw();
      expect(() => {
        LantahBase.Operation.clawback({ amount });
      }).to.throw();
      expect(() => {
        LantahBase.Operation.clawback({ asset });
      }).to.throw();
      expect(() => {
        LantahBase.Operation.clawback({});
      }).to.throw();
    });
    it('returns a clawback()', function () {
      let account = 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      let asset = new LantahBase.Asset('GCOIN', account);
      const amount = '100.000000';
      const op = LantahBase.Operation.clawback({
        from: account,
        amount: amount,
        asset: asset
      });

      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('clawback');
      expect(obj.asset.equals(asset)).to.be.true;
      expect(obj.from).to.be.equal(account);
    });
  });

  describe('setTrustLineFlags()', function () {
    it('creates a SetTrustLineFlagsOp', function () {
      let account = 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      let asset = new LantahBase.Asset('GCOIN', account);

      const op = LantahBase.Operation.setTrustLineFlags({
        trustor: account,
        asset: asset,
        flags: {
          authorized: false,
          authorizedToMaintainLiabilities: true,
          clawbackEnabled: false
        }
      });
      const opBody = op.body().setTrustLineFlagsOp();
      expect(opBody.clearFlags()).to.be.equal(1 | 4);
      expect(opBody.setFlags()).to.be.equal(2);

      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('setTrustLineFlags');
      expect(obj.asset.equals(asset)).to.be.true;
      expect(obj.trustor).to.be.equal(account);
      expect(obj.flags.authorized).to.be.false;
      expect(obj.flags.authorizedToMaintainLiabilities).to.be.true;
      expect(obj.flags.clawbackEnabled).to.be.false;
    });
    it('leaves unmodified flags as undefined', function () {
      let account = 'GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7';
      let asset = new LantahBase.Asset('GCOIN', account);

      expect(() =>
        LantahBase.Operation.setTrustLineFlags({
          trustor: account,
          asset: asset
        })
      ).to.throw();
      expect(() =>
        LantahBase.Operation.setTrustLineFlags({
          trustor: account,
          asset: asset,
          flags: []
        })
      ).to.throw();

      const op = LantahBase.Operation.setTrustLineFlags({
        trustor: account,
        asset: asset,
        flags: {
          authorized: true
        }
      });
      const opBody = op.body().setTrustLineFlagsOp();
      expect(opBody.setFlags()).to.be.equal(1);

      var xdr = op.toXDR('hex');
      var operation = LantahBase.xdr.Operation.fromXDR(
        Buffer.from(xdr, 'hex')
      );
      var obj = LantahBase.Operation.fromXDRObject(operation);
      expect(obj.type).to.be.equal('setTrustLineFlags');
      expect(obj.asset.equals(asset)).to.be.true;
      expect(obj.trustor).to.be.equal(account);
      expect(obj.flags.authorized).to.be.true;
      expect(obj.flags.authorizedToMaintainLiabilities).to.be.undefined;
      expect(obj.flags.clawbackEnabled).to.be.undefined;
    });
    it('fails with invalid flags', function () {
      expect(() => {
        LantahBase.Operation.setTrustLineFlags({
          trustor: account,
          asset: asset,
          flags: {
            authorized: false,
            invalidFlag: true
          }
        });
      }).to.throw();
    });
    it('should require parameters', function () {
      expect(() => {
        LantahBase.Operation.setTrustLineFlags({});
      }).to.throw();
    });
  });

  describe('liquidityPoolDeposit()', function () {
    it('throws an error if a required parameter is missing', function () {
      expect(() => LantahBase.Operation.liquidityPoolDeposit()).to.throw(
        /liquidityPoolId argument is required/
      );

      let opts = {};
      expect(() => LantahBase.Operation.liquidityPoolDeposit(opts)).to.throw(
        /liquidityPoolId argument is required/
      );

      opts.liquidityPoolId =
        'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7';
      expect(() => LantahBase.Operation.liquidityPoolDeposit(opts)).to.throw(
        /maxAmountA argument must be of type String, represent a positive number and have at most 7 digits after the decimal/
      );

      opts.maxAmountA = '10';
      expect(() => LantahBase.Operation.liquidityPoolDeposit(opts)).to.throw(
        /maxAmountB argument must be of type String, represent a positive number and have at most 7 digits after the decimal/
      );

      opts.maxAmountB = '20';
      expect(() => LantahBase.Operation.liquidityPoolDeposit(opts)).to.throw(
        /minPrice argument is required/
      );

      opts.minPrice = '0.45';
      expect(() => LantahBase.Operation.liquidityPoolDeposit(opts)).to.throw(
        /maxPrice argument is required/
      );

      opts.maxPrice = '0.55';
      expect(() =>
        LantahBase.Operation.liquidityPoolDeposit(opts)
      ).to.not.throw();
    });

    it('throws an error if prices are negative', function () {
      const opts = {
        liquidityPoolId:
          'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7',
        maxAmountA: '10.000000',
        maxAmountB: '20.000000',
        minPrice: '-0.45',
        maxPrice: '0.55'
      };
      expect(() => LantahBase.Operation.liquidityPoolDeposit(opts)).to.throw(
        /price must be positive/
      );
    });

    it('creates a liquidityPoolDeposit (string prices)', function () {
      const opts = {
        liquidityPoolId:
          'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7',
        maxAmountA: '10.000000',
        maxAmountB: '20.000000',
        minPrice: '0.45',
        maxPrice: '0.55'
      };
      const op = LantahBase.Operation.liquidityPoolDeposit(opts);
      const xdr = op.toXDR('hex');

      const xdrObj = LantahBase.xdr.Operation.fromXDR(Buffer.from(xdr, 'hex'));
      expect(xdrObj.body().switch().name).to.equal('liquidityPoolDeposit');
      expect(xdrObj.body().value().maxAmountA().toString()).to.equal(
        '10000000'
      );
      expect(xdrObj.body().value().maxAmountB().toString()).to.equal(
        '20000000'
      );

      const operation = LantahBase.Operation.fromXDRObject(xdrObj);
      expect(operation.type).to.be.equal('liquidityPoolDeposit');
      expect(operation.liquidityPoolId).to.be.equals(opts.liquidityPoolId);
      expect(operation.maxAmountA).to.be.equals(opts.maxAmountA);
      expect(operation.maxAmountB).to.be.equals(opts.maxAmountB);
      expect(operation.minPrice).to.be.equals(opts.minPrice);
      expect(operation.maxPrice).to.be.equals(opts.maxPrice);
    });

    it('creates a liquidityPoolDeposit (fraction prices)', function () {
      const opts = {
        liquidityPoolId:
          'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7',
        maxAmountA: '10.000000',
        maxAmountB: '20.000000',
        minPrice: {
          n: 9,
          d: 20
        },
        maxPrice: {
          n: 11,
          d: 20
        }
      };
      const op = LantahBase.Operation.liquidityPoolDeposit(opts);
      const xdr = op.toXDR('hex');

      const xdrObj = LantahBase.xdr.Operation.fromXDR(Buffer.from(xdr, 'hex'));
      expect(xdrObj.body().switch().name).to.equal('liquidityPoolDeposit');
      expect(xdrObj.body().value().maxAmountA().toString()).to.equal(
        '10000000'
      );
      expect(xdrObj.body().value().maxAmountB().toString()).to.equal(
        '20000000'
      );

      const operation = LantahBase.Operation.fromXDRObject(xdrObj);
      expect(operation.type).to.be.equal('liquidityPoolDeposit');
      expect(operation.liquidityPoolId).to.be.equals(opts.liquidityPoolId);
      expect(operation.maxAmountA).to.be.equals(opts.maxAmountA);
      expect(operation.maxAmountB).to.be.equals(opts.maxAmountB);
      expect(operation.minPrice).to.be.equals(
        new BigNumber(opts.minPrice.n).div(opts.minPrice.d).toString()
      );
      expect(operation.maxPrice).to.be.equals(
        new BigNumber(opts.maxPrice.n).div(opts.maxPrice.d).toString()
      );
    });

    it('creates a liquidityPoolDeposit (number prices)', function () {
      const opts = {
        liquidityPoolId:
          'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7',
        maxAmountA: '10.000000',
        maxAmountB: '20.000000',
        minPrice: 0.45,
        maxPrice: 0.55
      };
      const op = LantahBase.Operation.liquidityPoolDeposit(opts);
      const xdr = op.toXDR('hex');

      const xdrObj = LantahBase.xdr.Operation.fromXDR(Buffer.from(xdr, 'hex'));
      expect(xdrObj.body().switch().name).to.equal('liquidityPoolDeposit');
      expect(xdrObj.body().value().maxAmountA().toString()).to.equal(
        '10000000'
      );
      expect(xdrObj.body().value().maxAmountB().toString()).to.equal(
        '20000000'
      );

      const operation = LantahBase.Operation.fromXDRObject(xdrObj);
      expect(operation.type).to.be.equal('liquidityPoolDeposit');
      expect(operation.liquidityPoolId).to.be.equals(opts.liquidityPoolId);
      expect(operation.maxAmountA).to.be.equals(opts.maxAmountA);
      expect(operation.maxAmountB).to.be.equals(opts.maxAmountB);
      expect(operation.minPrice).to.be.equals(opts.minPrice.toString());
      expect(operation.maxPrice).to.be.equals(opts.maxPrice.toString());
    });

    it('creates a liquidityPoolDeposit (BigNumber prices)', function () {
      const opts = {
        liquidityPoolId:
          'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7',
        maxAmountA: '10.000000',
        maxAmountB: '20.000000',
        minPrice: new BigNumber(9).dividedBy(20),
        maxPrice: new BigNumber(11).dividedBy(20)
      };
      const op = LantahBase.Operation.liquidityPoolDeposit(opts);
      const xdr = op.toXDR('hex');

      const xdrObj = LantahBase.xdr.Operation.fromXDR(Buffer.from(xdr, 'hex'));
      expect(xdrObj.body().switch().name).to.equal('liquidityPoolDeposit');
      expect(xdrObj.body().value().maxAmountA().toString()).to.equal(
        '10000000'
      );
      expect(xdrObj.body().value().maxAmountB().toString()).to.equal(
        '20000000'
      );

      const operation = LantahBase.Operation.fromXDRObject(xdrObj);
      expect(operation.type).to.be.equal('liquidityPoolDeposit');
      expect(operation.liquidityPoolId).to.be.equals(opts.liquidityPoolId);
      expect(operation.maxAmountA).to.be.equals(opts.maxAmountA);
      expect(operation.maxAmountB).to.be.equals(opts.maxAmountB);
      expect(operation.minPrice).to.be.equals(opts.minPrice.toString());
      expect(operation.maxPrice).to.be.equals(opts.maxPrice.toString());
    });
  });

  describe('liquidityPoolWithdraw()', function () {
    it('throws an error if a required parameter is missing', function () {
      expect(() => LantahBase.Operation.liquidityPoolWithdraw()).to.throw(
        /liquidityPoolId argument is required/
      );

      let opts = {};
      expect(() => LantahBase.Operation.liquidityPoolWithdraw(opts)).to.throw(
        /liquidityPoolId argument is required/
      );

      opts.liquidityPoolId =
        'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7';
      expect(() => LantahBase.Operation.liquidityPoolWithdraw(opts)).to.throw(
        /amount argument must be of type String, represent a positive number and have at most 6 digits after the decimal/
      );

      opts.amount = '10';
      expect(() => LantahBase.Operation.liquidityPoolWithdraw(opts)).to.throw(
        /minAmountA argument must be of type String, represent a positive number and have at most 6 digits after the decimal/
      );

      opts.minAmountA = '10000';
      expect(() => LantahBase.Operation.liquidityPoolWithdraw(opts)).to.throw(
        /minAmountB argument must be of type String, represent a positive number and have at most 6 digits after the decimal/
      );

      opts.minAmountB = '20000';
      expect(() =>
        LantahBase.Operation.liquidityPoolWithdraw(opts)
      ).to.not.throw();
    });

    it('creates a liquidityPoolWithdraw', function () {
      const opts = {
        liquidityPoolId:
          'dd7b1ab831c273310ddbec6f97870aa83c2fbd78ce22aded37ecbf4f3380fac7',
        amount: '5.000000',
        minAmountA: '10.000000',
        minAmountB: '20.000000'
      };
      const op = LantahBase.Operation.liquidityPoolWithdraw(opts);
      const xdr = op.toXDR('hex');

      const xdrObj = LantahBase.xdr.Operation.fromXDR(Buffer.from(xdr, 'hex'));
      expect(xdrObj.body().switch().name).to.equal('liquidityPoolWithdraw');
      expect(xdrObj.body().value().amount().toString()).to.equal('5000000');
      expect(xdrObj.body().value().minAmountA().toString()).to.equal(
        '10000000'
      );
      expect(xdrObj.body().value().minAmountB().toString()).to.equal(
        '20000000'
      );

      const operation = LantahBase.Operation.fromXDRObject(xdrObj);
      expect(operation.type).to.be.equal('liquidityPoolWithdraw');
      expect(operation.liquidityPoolId).to.be.equals(opts.liquidityPoolId);
      expect(operation.amount).to.be.equals(opts.amount);
      expect(operation.minAmountA).to.be.equals(opts.minAmountA);
      expect(operation.minAmountB).to.be.equals(opts.minAmountB);
    });
  });

  describe('.isValidAmount()', function () {
    it('returns true for valid amounts', function () {
      let amounts = [
        '10',
        '0.10',
        '0.12345678',
        '9223372036854.775807' // MAX
      ];

      for (var i in amounts) {
        expect(LantahBase.Operation.isValidAmount(amounts[i])).to.be.true;
      }
    });

    it('returns false for invalid amounts', function () {
      let amounts = [
        100, // integer
        100.5, // float
        '', // empty string
        'test', // string not representing a number
        '0',
        '-10',
        '-10.5',
        '0.12345678',
        '9223372036854.775808', // Overflow
        'Infinity',
        Infinity,
        'Nan',
        NaN
      ];

      for (var i in amounts) {
        expect(LantahBase.Operation.isValidAmount(amounts[i])).to.be.false;
      }
    });

    it('allows 0 only if allowZero argument is set to true', function () {
      expect(LantahBase.Operation.isValidAmount('0')).to.be.false;
      expect(LantahBase.Operation.isValidAmount('0', true)).to.be.true;
    });
  });

  describe('._fromXDRAmount()', function () {
    it('correctly parses the amount', function () {
      expect(LantahBase.Operation._fromXDRAmount(1)).to.be.equal('0.000001');
      expect(LantahBase.Operation._fromXDRAmount(1000000)).to.be.equal(
        '1.000000'
      );
      expect(LantahBase.Operation._fromXDRAmount(1000000000)).to.be.equal(
        '1000.000000'
      );
      expect(
        LantahBase.Operation._fromXDRAmount(100000000000000000)
      ).to.be.equal('100000000000.000000');
    });
  });
});

function expectBuffersToBeEqual(left, right) {
  let leftHex = left.toString('hex');
  let rightHex = right.toString('hex');
  expect(leftHex).to.eql(rightHex);
}
