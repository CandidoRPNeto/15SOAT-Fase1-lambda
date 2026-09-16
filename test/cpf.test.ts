import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, onlyDigits } from '../src/cpf.js';

// 111.444.777-35 é um CPF de exemplo amplamente usado em tutoriais/testes
// br — conferido manualmente pelo algoritmo de dígito verificador (não é
// documento de pessoa real, é só matematicamente válido):
//   9 primeiros dígitos * pesos 10..2, soma=162, 162%11=8 -> dígito 11-8=3
//   10 primeiros * pesos 11..2, soma=204, 204%11=6 -> dígito 11-6=5
// -> 111.444.777-35

test('accepts a valid CPF with punctuation', () => {
  assert.equal(isValidCpf('111.444.777-35'), true);
});

test('accepts the same valid CPF as digits only', () => {
  assert.equal(isValidCpf('11144477735'), true);
});

test('rejects a CPF with a wrong check digit', () => {
  assert.equal(isValidCpf('111.444.777-34'), false);
});

test('rejects a CPF with all repeated digits (mathematically passes checksum, but never real)', () => {
  assert.equal(isValidCpf('111.111.111-11'), false);
  assert.equal(isValidCpf('000.000.000-00'), false);
});

test('rejects a CPF with the wrong length', () => {
  assert.equal(isValidCpf('123456'), false);
  assert.equal(isValidCpf('111.444.777-355'), false);
});

test('rejects non-numeric garbage', () => {
  assert.equal(isValidCpf('abc.def.ghi-jk'), false);
});

test('onlyDigits strips punctuation', () => {
  assert.equal(onlyDigits('111.444.777-35'), '11144477735');
});
