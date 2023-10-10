import * as LantahBase from '../src';

var keypair = LantahBase.Keypair.random();
var data = 'data to sign';
var signature = LantahBase.sign(data, keypair.rawSecretKey());

console.log('Signature: ' + signature.toString('hex'));

if (LantahBase.verify(data, signature, keypair.rawPublicKey())) {
  console.log('OK!');
} else {
  console.log('Bad signature!');
}
