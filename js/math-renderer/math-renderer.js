/* Tiny offline math renderer.
 * Renders a LaTeX-ish subset to HTML. No dependencies, no network — a
 * drop-in for projects that can't pull KaTeX/MathJax from a CDN (offline
 * apps, strict CSPs, size-sensitive bundles).
 * Supported: \macros, _sub, ^sup, {groups}, \frac, \text, \overline, \hat.
 * ES5 only, so it also runs on old WebKit targets.
 */
(function (root) {
  'use strict';

  var UPRIGHT = 'u';   // rendered in the upright (roman) face: operators, names
  var SYMBOL  = 's';   // standalone symbol, no italics

  var MACROS = {
    // greek
    alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', varepsilon:'ε',
    zeta:'ζ', eta:'η', theta:'θ', kappa:'κ', lambda:'λ', mu:'μ', nu:'ν',
    xi:'ξ', pi:'π', rho:'ρ', sigma:'σ', tau:'τ', phi:'φ', varphi:'φ',
    chi:'χ', psi:'ψ', omega:'ω',
    Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Xi:'Ξ', Pi:'Π',
    Sigma:'Σ', Phi:'Φ', Psi:'Ψ', Omega:'Ω',
    // relations
    le:'≤', leq:'≤', ge:'≥', geq:'≥', ne:'≠', neq:'≠', approx:'≈',
    equiv:'≡', sim:'∼', simeq:'≃', cong:'≅', ll:'≪', gg:'≫', propto:'∝',
    // arrows
    to:'→', gets:'←', leftarrow:'←', rightarrow:'→', longrightarrow:'⟶',
    Rightarrow:'⇒', Leftarrow:'⇐', implies:'⟹', iff:'⟺', mapsto:'↦',
    // operators
    cdot:'·', cdots:'⋯', ldots:'…', dots:'…', times:'×', div:'÷',
    oplus:'⊕', otimes:'⊗', pm:'±', mp:'∓', circ:'∘', star:'⋆',
    ell:'ℓ', sum:'∑', prod:'∏', bigcup:'⋃', bigcap:'⋂', sqrt:'√', partial:'∂',
    // sets & logic
    'in':'∈', notin:'∉', subset:'⊂', subseteq:'⊆', supseteq:'⊇',
    cup:'∪', cap:'∩', setminus:'∖', emptyset:'∅', varnothing:'∅',
    forall:'∀', exists:'∃', nexists:'∄', neg:'¬', lnot:'¬',
    land:'∧', wedge:'∧', lor:'∨', vee:'∨', perp:'⊥', top:'⊤', infty:'∞',
    // delimiters
    langle:'⟨', rangle:'⟩', lceil:'⌈', rceil:'⌉', lfloor:'⌊', rfloor:'⌋',
    mid:'|', vert:'|', '|':'‖', backslash:'\\', '{':'{', '}':'}', '$':'$',
    // misc
    square:'□', Box:'□', lozenge:'◇', Diamond:'◇', checkmark:'✓', dagger:'†',
    // blackboard / calligraphic
    Z:'ℤ', N:'ℕ', R:'ℝ', Q:'ℚ', F:'𝔽', G:'𝔾', E:'𝔼',
    A:'𝒜', B:'ℬ', C:'𝒞', D:'𝒟', calF:'ℱ', calK:'𝒦', calM:'ℳ',
    calC:'𝒞', calO:'𝒪', calS:'𝒮', calX:'𝒳', calY:'𝒴', calR:'ℛ', calQ:'𝒬'
  };

  // Multi-character names typeset upright, the way \mathrm{} would.
  var WORDS = {
    Pr:'Pr', Adv:'Adv', negl:'negl', poly:'poly', Exp:'Exp', Game:'Game',
    Hyb:'Hyb', Real:'Real', Ideal:'Ideal', Sim:'Sim', Func:'Func', Perm:'Perm',
    Gen:'Gen', Enc:'Enc', Dec:'Dec', Mac:'Mac', Vrfy:'Vrfy', Sign:'Sign',
    Ver:'Ver', Hash:'Hash', KDF:'KDF', PRG:'PRG', PRF:'PRF', PRP:'PRP',
    OWF:'OWF', DDH:'DDH', CDH:'CDH', DLog:'DLog', LWE:'LWE',
    bmod:'mod', 'mod':'mod', gcd:'gcd', lcm:'lcm', log:'log', exp:'exp',
    max:'max', min:'min', bad:'bad', st:'s.t.', wlog:'w.l.o.g.',
    Output:'Output', Return:'Return', If:'if', Then:'then', Else:'else'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function Parser(src) { this.s = src; this.i = 0; }

  Parser.prototype.peek = function () { return this.s[this.i]; };
  Parser.prototype.next = function () { return this.s[this.i++]; };
  Parser.prototype.eof = function () { return this.i >= this.s.length; };

  // Reads the argument of a script/command: a {group} or a single token.
  Parser.prototype.arg = function () {
    while (this.peek() === ' ') this.i++;
    if (this.peek() === '{') {
      this.i++;
      var depth = 1, start = this.i;
      while (!this.eof() && depth > 0) {
        var c = this.next();
        if (c === '\\') { this.i++; continue; }
        if (c === '{') depth++;
        else if (c === '}') depth--;
      }
      return this.s.slice(start, this.i - 1);
    }
    if (this.peek() === '\\') {
      var st = this.i;
      this.i++;
      while (!this.eof() && /[A-Za-z]/.test(this.peek())) this.i++;
      return this.s.slice(st, this.i);
    }
    return this.eof() ? '' : this.next();
  };

  Parser.prototype.run = function () {
    var out = '';
    while (!this.eof()) {
      var c = this.next();

      if (c === '\\') {
        var name = '';
        if (/[A-Za-z]/.test(this.peek() || '')) {
          while (!this.eof() && /[A-Za-z]/.test(this.peek())) name += this.next();
        } else {
          name = this.next() || '';
        }
        out += this.command(name);
        continue;
      }

      if (c === '^' || c === '_') {
        var tag = c === '^' ? 'sup' : 'sub';
        out += '<' + tag + '>' + render(this.arg()) + '</' + tag + '>';
        continue;
      }

      if (c === '{' || c === '}') continue;          // grouping only
      if (c === ' ') { out += ' '; continue; }
      if (/[A-Za-z]/.test(c)) { out += '<i>' + c + '</i>'; continue; }
      out += esc(c);
    }
    return out;
  };

  Parser.prototype.command = function (name) {
    switch (name) {
      case 'text':
      case 'mathrm':
      case 'mbox':
        return '<span class="mu">' + esc(this.arg()) + '</span>';
      case 'frac': {
        var n = render(this.arg()), d = render(this.arg());
        return '<span class="mfrac"><span class="mnum">' + n +
               '</span><span class="mden">' + d + '</span></span>';
      }
      case 'overline':
        return '<span class="mover">' + render(this.arg()) + '</span>';
      case 'sqrt':
        return '<span class="msym">√</span><span class="mover">' + render(this.arg()) + '</span>';
      case 'pmod':                                   // "(mod n)", with the space before it
        return '<span class="mquad"></span><span class="msym">(</span><span class="mu">mod</span> ' +
               render(this.arg()) + '<span class="msym">)</span>';
      case 'mathit':
      case 'mathbf':
        return render(this.arg());       // letters are italic by default; mathbf is close enough
      case 'hat':
        return render(this.arg()) + '̂';
      case 'tfrac': {
        var tn = render(this.arg()), td = render(this.arg());
        return '<span class="mfrac"><span class="mnum">' + tn +
               '</span><span class="mden">' + td + '</span></span>';
      }
      case 'binom': {
        var bn = render(this.arg()), bk = render(this.arg());
        return '<span class="msym">(</span><span class="mbinom"><span>' + bn +
               '</span><span>' + bk + '</span></span><span class="msym">)</span>';
      }
      case 'mathcal':
        return '<span class="msym">' + script(this.arg()) + '</span>';
      case 'mathsf':
        return '<span class="mu">' + esc(this.arg()) + '</span>';
      case 'left':
      case 'right':
        return '';                                   // sizing hints: no-ops here
      case 'rand':                                   // uniform sampling: <-$
        return '<span class="mu">←<sub>$</sub></span>';
      case 'bits':                                   // {0,1}
        return '<span class="mu">{0,1}</span>';
      case 'qed':
        return '<span class="mu">∎</span>';
      case ',': return '<span class="mthin"></span>';
      case ';': return ' ';
      case 'quad': return '<span class="mquad"></span>';
      case 'qquad': return '<span class="mquad"></span><span class="mquad"></span>';
      case '\\': return '<br>';
      default:
        if (WORDS[name]) return '<span class="mu">' + esc(WORDS[name]) + '</span>';
        if (MACROS[name]) return '<span class="msym">' + esc(MACROS[name]) + '</span>';
        return '<span class="mu">' + esc(name) + '</span>';
    }
  };

  // \mathcal{X} -> the script letter, with the reserved-codepoint substitutions.
  var SCRIPT = {A:'𝒜',B:'ℬ',C:'𝒞',D:'𝒟',E:'ℰ',F:'ℱ',G:'𝒢',H:'ℋ',I:'ℐ',J:'𝒥',
                K:'𝒦',L:'ℒ',M:'ℳ',N:'𝒩',O:'𝒪',P:'𝒫',Q:'𝒬',R:'ℛ',S:'𝒮',T:'𝒯',
                U:'𝒰',V:'𝒱',W:'𝒲',X:'𝒳',Y:'𝒴',Z:'𝒵'};
  function script(s) {
    return String(s).split('').map(function (c) { return SCRIPT[c] || c; }).join('');
  }

  function render(src) { return new Parser(String(src)).run(); }

  var MathRenderer = {
    /** Render a math expression to HTML. */
    render: render,
    /** Render text with $inline$ / $$display$$ segments and light markup. */
    text: function (str) {
      var s = String(str == null ? '' : str);
      var out = '', i = 0;
      // Bold is tracked across math segments, so **like $this$** works.
      var st = { bold: false };
      while (i < s.length) {
        var d = s.indexOf('$', i);
        if (d < 0) { out += inline(s.slice(i), st); break; }
        out += inline(s.slice(i, d), st);
        var display = s[d + 1] === '$';
        var open = display ? d + 2 : d + 1;
        var close = s.indexOf(display ? '$$' : '$', open);
        if (close < 0) { out += inline(s.slice(d), st); break; }
        var body = render(s.slice(open, close));
        out += display ? '<span class="mathblock">' + body + '</span>'
                       : '<span class="math">' + body + '</span>';
        i = close + (display ? 2 : 1);
      }
      if (st.bold) out += '</strong>';          // never emit an unclosed tag
      return out;
    }
  };

  // Light inline markup for prose: **bold**, *italic*, `code`.
  // Only applied outside $math$, so superscript stars like m^* are untouched.
  // `st` carries the bold state between prose segments of one string.
  function inline(str, st) {
    st = st || { bold: false };
    var out = esc(str).replace(/\*\*/g, function () {
      st.bold = !st.bold;
      return st.bold ? '<strong>' : '</strong>';
    });
    return out
      .replace(/(^|[\s(\[])\*([^*\s][^*]*?)\*(?=$|[\s.,;:!?)\]])/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  root.MathRenderer = MathRenderer;
  if (typeof module !== 'undefined' && module.exports) module.exports = MathRenderer;
})(typeof window !== 'undefined' ? window : this);
