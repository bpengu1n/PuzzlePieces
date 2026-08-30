'use strict';
const test = require('node:test');
const assert = require('assert');
const MathRenderer = require('./math-renderer.js');

test('render: greek letters and relations', () => {
  assert.strictEqual(MathRenderer.render('\\alpha \\le \\beta'), '<span class="msym">α</span> <span class="msym">≤</span> <span class="msym">β</span>');
});

test('render: subscript and superscript', () => {
  assert.strictEqual(MathRenderer.render('x_i'), '<i>x</i><sub><i>i</i></sub>');
  assert.strictEqual(MathRenderer.render('x^{n+1}'), '<i>x</i><sup><i>n</i>+1</sup>');
});

test('render: \\frac produces numerator/denominator spans', () => {
  assert.strictEqual(
    MathRenderer.render('\\frac{n}{d}'),
    '<span class="mfrac"><span class="mnum"><i>n</i></span><span class="mden"><i>d</i></span></span>'
  );
});

test('render: named functions render upright', () => {
  assert.strictEqual(MathRenderer.render('\\Adv'), '<span class="mu">Adv</span>');
  assert.strictEqual(MathRenderer.render('\\Pr'), '<span class="mu">Pr</span>');
});

test('render: unknown command falls through to its bare name', () => {
  assert.strictEqual(MathRenderer.render('\\notacommand'), '<span class="mu">notacommand</span>');
});

test('render: \\{ and \\} produce literal braces, bare {} only group', () => {
  assert.strictEqual(MathRenderer.render('\\{x\\}'), '<span class="msym">{</span><i>x</i><span class="msym">}</span>');
  assert.strictEqual(MathRenderer.render('{x}'), '<i>x</i>');
});

test('render: \\mathcal produces script letters', () => {
  assert.strictEqual(MathRenderer.render('\\mathcal{A}'), '<span class="msym">𝒜</span>');
});

test('render: escapes HTML-significant characters', () => {
  assert.strictEqual(MathRenderer.render('<'), '&lt;');
  assert.strictEqual(MathRenderer.render('&'), '&amp;');
});

test('text: renders inline and display math delimiters', () => {
  assert.strictEqual(MathRenderer.text('a $x^2$ b'), 'a <span class="math"><i>x</i><sup>2</sup></span> b');
  assert.strictEqual(MathRenderer.text('$$\\sum_i x_i$$'),
    '<span class="mathblock"><span class="msym">∑</span><sub><i>i</i></sub> <i>x</i><sub><i>i</i></sub></span>');
});

test('text: bold survives across a math segment', () => {
  assert.strictEqual(MathRenderer.text('**like $x$ this**'), '<strong>like <span class="math"><i>x</i></span> this</strong>');
});

test('text: italic and code markup', () => {
  assert.strictEqual(MathRenderer.text('*hi* and `code`'), '<em>hi</em> and <code>code</code>');
});

test('text: superscript stars are not mistaken for italic markers', () => {
  assert.strictEqual(MathRenderer.text('$m^*$'), '<span class="math"><i>m</i><sup>*</sup></span>');
});

test('text: an unclosed $ does not throw and is left as prose', () => {
  assert.strictEqual(MathRenderer.text('broken $x'), 'broken $x');
});

test('text: null/undefined input renders as empty string', () => {
  assert.strictEqual(MathRenderer.text(null), '');
  assert.strictEqual(MathRenderer.text(undefined), '');
});
