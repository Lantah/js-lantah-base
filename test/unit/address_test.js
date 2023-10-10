describe('Address', function () {
  const ACCOUNT = 'GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB';
  const CONTRACT = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';
  const MUXED_ADDRESS =
    'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAAAAAAAAAAAAJLK';

  describe('.constructor', function () {
    it('fails to create Address object from an invalid address', function () {
      expect(() => new LantahBase.Address('GBBB')).to.throw(
        /Unsupported address type/
      );
    });

    it('creates an Address object for accounts', function () {
      let account = new LantahBase.Address(ACCOUNT);
      expect(account.toString()).to.equal(ACCOUNT);
    });

    it('creates an Address object for contracts', function () {
      let account = new LantahBase.Address(CONTRACT);
      expect(account.toString()).to.equal(CONTRACT);
    });

    it('wont create Address objects from muxed account strings', function () {
      expect(() => {
        new LantahBase.Account(MUXED_ADDRESS, '123');
      }).to.throw(/MuxedAccount/);
    });
  });

  describe('static constructors', function () {
    it('.fromString', function () {
      let account = LantahBase.Address.fromString(ACCOUNT);
      expect(account.toString()).to.equal(ACCOUNT);
    });

    it('.account', function () {
      let account = LantahBase.Address.account(Buffer.alloc(32));
      expect(account.toString()).to.equal(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
      );
    });

    it('.contract', function () {
      let account = LantahBase.Address.contract(Buffer.alloc(32));
      expect(account.toString()).to.equal(
        'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4'
      );
    });

    describe('.fromScAddress', function () {
      it('creates an Address object for accounts', function () {
        let scAddress = LantahBase.xdr.ScAddress.scAddressTypeAccount(
          LantahBase.xdr.PublicKey.publicKeyTypeEd25519(
            LantahBase.StrKey.decodeEd25519PublicKey(ACCOUNT)
          )
        );
        let account = LantahBase.Address.fromScAddress(scAddress);
        expect(account.toString()).to.equal(ACCOUNT);
      });

      it('creates an Address object for contracts', function () {
        let scAddress = LantahBase.xdr.ScAddress.scAddressTypeContract(
          LantahBase.StrKey.decodeContract(CONTRACT)
        );
        let contract = LantahBase.Address.fromScAddress(scAddress);
        expect(contract.toString()).to.equal(CONTRACT);
      });
    });

    describe('.fromScVal', function () {
      it('creates an Address object for accounts', function () {
        let scVal = LantahBase.xdr.ScVal.scvAddress(
          LantahBase.xdr.ScAddress.scAddressTypeAccount(
            LantahBase.xdr.PublicKey.publicKeyTypeEd25519(
              LantahBase.StrKey.decodeEd25519PublicKey(ACCOUNT)
            )
          )
        );
        let account = LantahBase.Address.fromScVal(scVal);
        expect(account.toString()).to.equal(ACCOUNT);
      });

      it('creates an Address object for contracts', function () {
        let scVal = LantahBase.xdr.ScVal.scvAddress(
          LantahBase.xdr.ScAddress.scAddressTypeContract(
            LantahBase.StrKey.decodeContract(CONTRACT)
          )
        );
        let contract = LantahBase.Address.fromScVal(scVal);
        expect(contract.toString()).to.equal(CONTRACT);
      });
    });
  });

  describe('.toScAddress', function () {
    it('converts accounts to an ScAddress', function () {
      const a = new LantahBase.Address(ACCOUNT);
      const s = a.toScAddress();
      expect(s).to.be.instanceof(LantahBase.xdr.ScAddress);
      expect(s.switch()).to.equal(
        LantahBase.xdr.ScAddressType.scAddressTypeAccount()
      );
    });

    it('converts contracts to an ScAddress', function () {
      const a = new LantahBase.Address(CONTRACT);
      const s = a.toScAddress();
      expect(s).to.be.instanceof(LantahBase.xdr.ScAddress);
      expect(s.switch()).to.equal(
        LantahBase.xdr.ScAddressType.scAddressTypeContract()
      );
    });
  });

  describe('.toScVal', function () {
    it('converts to an ScAddress', function () {
      const a = new LantahBase.Address(ACCOUNT);
      const s = a.toScVal();
      expect(s).to.be.instanceof(LantahBase.xdr.ScVal);
      expect(s.address()).to.deep.equal(a.toScAddress());
    });
  });

  describe('.toBuffer', function () {
    it('returns the raw public key bytes for accounts', function () {
      const a = new LantahBase.Address(ACCOUNT);
      const b = a.toBuffer();
      expect(b).to.deep.equal(
        LantahBase.StrKey.decodeEd25519PublicKey(ACCOUNT)
      );
    });

    it('returns the raw public key bytes for contracts', function () {
      const a = new LantahBase.Address(CONTRACT);
      const b = a.toBuffer();
      expect(b).to.deep.equal(LantahBase.StrKey.decodeContract(CONTRACT));
    });
  });
});
