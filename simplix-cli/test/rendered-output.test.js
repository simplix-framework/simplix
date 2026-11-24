import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import ejs from 'ejs';
import { tidyRenderedOutput } from '../src/lib/rendered-output.js';

describe('tidyRenderedOutput', () => {
  it('empties a line an indented scriptlet leaves holding only its indentation', () => {
    const template =
      'class A {\n        <% fields.forEach(f => { %>\n        private String <%= f %>;\n        <% }); %>\n}\n';
    const rendered = ejs.render(template, { fields: ['a', 'b'] });
    assert.match(rendered, /^ +$/m);
    assert.doesNotMatch(tidyRenderedOutput(rendered), /[ \t]+$/m);
  });

  it('collapses a run of blank lines to one and keeps code untouched', () => {
    const tidy = tidyRenderedOutput('a;  \n\n  \n\t\nb;\n    c;\n');
    assert.strictEqual(tidy, 'a;\n\nb;\n    c;\n');
  });

  it('leaves output that is already tidy as it is', () => {
    const clean = 'class A {\n\n    int x;\n}\n';
    assert.strictEqual(tidyRenderedOutput(clean), clean);
  });
});
