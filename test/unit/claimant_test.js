const { expect } = require('chai');

describe('Claimant', function () {
  describe('constructor', function () {
    it('throws an error when destination is invalid', function () {
      expect(() => new LantahBase.Claimant('GCEZWKCA5', null)).to.throw(
        /Destination is invalid/
      );
    });
    it('defaults to unconditional if predicate is undefined', function () {
      const claimant = new LantahBase.Claimant(
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
      );
      expect(claimant.predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateUnconditional()
      );
    });
    it('throws an error if predicate is not an xdr.ClaimPredicate', function () {
      expect(
        () =>
          new LantahBase.Claimant(
            'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
            3
          )
      ).to.throw(/Predicate should be an xdr.ClaimPredicate/);
    });
  });
  describe('predicateUnconditional()', function () {
    it('returns an `unconditional` claim predicate', function () {
      const predicate = LantahBase.Claimant.predicateUnconditional();
      expect(predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateUnconditional()
      );
    });
  });
  describe('predicateBeforeAbsoluteTime()', function () {
    it('returns a `beforeAbsoluteTime` claim predicate', function () {
      const time = '4102444800000';
      const predicate = LantahBase.Claimant.predicateBeforeAbsoluteTime(time);
      expect(predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateBeforeAbsoluteTime()
      );
      const value = predicate.absBefore();
      expect(value.toString()).to.equal(time);
    });
  });
  describe('predicateBeforeRelativeTime()', function () {
    it('returns a `beforeRelativeTime` claim predicate', function () {
      const time = '86400';
      const predicate = LantahBase.Claimant.predicateBeforeRelativeTime(time);
      expect(predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateBeforeRelativeTime()
      );
      const value = predicate.relBefore();
      expect(value.toString()).to.equal(time);
    });
  });
  describe('predicateNot()', function () {
    it('returns a `not` claim predicate', function () {
      const time = '86400';
      const beforeRel = LantahBase.Claimant.predicateBeforeRelativeTime(time);
      const predicate = LantahBase.Claimant.predicateNot(beforeRel);
      expect(predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateNot()
      );
      const value = predicate.notPredicate().value();
      expect(value).to.not.be.null;
      expect(value.toString()).to.equal(time);
    });
  });
  describe('predicateOr()', function () {
    it('returns an `or` claim predicate', function () {
      const left = LantahBase.Claimant.predicateBeforeRelativeTime('800');
      const right = LantahBase.Claimant.predicateBeforeRelativeTime('1200');
      const predicate = LantahBase.Claimant.predicateOr(left, right);
      expect(predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateOr()
      );
      const predicates = predicate.orPredicates();
      expect(predicates[0].value().toString()).to.equal('800');
      expect(predicates[1].value().toString()).to.equal('1200');
    });
  });
  describe('predicateAnd()', function () {
    it('returns an `and` predicate claim predicate', function () {
      const left = LantahBase.Claimant.predicateBeforeRelativeTime('800');
      const right = LantahBase.Claimant.predicateBeforeRelativeTime('1200');
      const predicate = LantahBase.Claimant.predicateAnd(left, right);
      expect(predicate.switch()).to.equal(
        LantahBase.xdr.ClaimPredicateType.claimPredicateAnd()
      );
      const predicates = predicate.andPredicates();
      expect(predicates[0].value().toString()).to.equal('800');
      expect(predicates[1].value().toString()).to.equal('1200');
    });
  });
  describe('destination()', function () {
    it('returns the destination accountID', function () {
      const destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      const claimant = new LantahBase.Claimant(destination);
      expect(claimant.destination).to.equal(destination);
    });
    it('does not allow changes in accountID', function () {
      const destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      const claimant = new LantahBase.Claimant(destination);
      expect(() => (claimant.destination = '32323')).to.throw(
        /Claimant is immutable/
      );
    });
  });
  describe('predicate()', function () {
    it('returns the predicate', function () {
      const claimant = new LantahBase.Claimant(
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
      );
      expect(claimant.predicate.switch()).to.equal(
        LantahBase.Claimant.predicateUnconditional().switch()
      );
    });
    it('does not allow changes in predicate', function () {
      const destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      const claimant = new LantahBase.Claimant(destination);
      expect(() => (claimant.predicate = null)).to.throw(
        /Claimant is immutable/
      );
    });
  });
  describe('toXDRObject()', function () {
    it('returns a xdr.Claimant', function () {
      const destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      const claimant = new LantahBase.Claimant(destination);
      const xdrClaimant = claimant.toXDRObject();
      expect(xdrClaimant).to.be.an.instanceof(LantahBase.xdr.Claimant);
      expect(xdrClaimant.switch()).to.equal(
        LantahBase.xdr.ClaimantType.claimantTypeV0()
      );
      const value = xdrClaimant.value();
      expect(
        LantahBase.StrKey.encodeEd25519PublicKey(value.destination().ed25519())
      ).to.equal(destination);
      expect(value.predicate().switch()).to.equal(
        LantahBase.Claimant.predicateUnconditional().switch()
      );

      expect(() => xdrClaimant.toXDR()).to.not.throw();
    });
  });
  describe('fromXDR()', function () {
    it('returns a Claimant', function () {
      const destination =
        'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ';
      const claimant = new LantahBase.Claimant(destination);
      const hex = claimant.toXDRObject().toXDR('hex');
      const xdrClaimant = LantahBase.xdr.Claimant.fromXDR(hex, 'hex');
      const fromXDR = LantahBase.Claimant.fromXDR(xdrClaimant);
      expect(fromXDR.destination).to.equal(destination);
      expect(fromXDR.predicate.switch()).to.equal(
        LantahBase.Claimant.predicateUnconditional().switch()
      );
    });
  });
});
